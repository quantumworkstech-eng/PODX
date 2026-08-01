import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { calendarDateInIST, startEndFromCalendarAndSlot } from '@/lib/bookingTime';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v: string) => UUID_RE.test(v);

// ── PATCH /api/partner/bookings/[id] ─────────────────────────────────────────
// Allows a partner (studio owner) to reschedule one of their bookings.
// Body: { action: "reschedule", newDate: "YYYY-MM-DD", newTimeSlot: "HH:MM" }
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: bookingId } = await params;

    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { action, newDate, newTimeSlot } = body;

    if (action !== 'reschedule') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (!newDate || !newTimeSlot) {
        return NextResponse.json({ error: 'newDate and newTimeSlot are required' }, { status: 400 });
    }

    // Resolve partner's user record and their studio IDs
    const { data: partnerUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .maybeSingle();

    if (!partnerUser) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { data: studios } = await supabaseAdmin
        .from('studios')
        .select('id')
        .eq('owner_id', partnerUser.id);

    const studioIds = (studios || []).map((s: any) => s.id as string);
    if (studioIds.length === 0) {
        return NextResponse.json({ error: 'No studios found for this partner' }, { status: 403 });
    }

    // Fetch the booking — support UUID or booking_number
    const bookingQuery = supabaseAdmin
        .from('bookings')
        .select('id, studio_id, start_time, end_time, status');
    const { data: booking } = await (isUUID(bookingId)
        ? bookingQuery.eq('id', bookingId)
        : bookingQuery.eq('booking_number', bookingId)
    ).maybeSingle();

    if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Ensure the booking belongs to one of this partner's studios
    if (!studioIds.includes(booking.studio_id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot reschedule a cancelled booking' }, { status: 400 });
    }

    let dateYYYYMMDD: string;
    try {
        dateYYYYMMDD = calendarDateInIST(String(newDate));
    } catch {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    const oldDuration =
        (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
        (1000 * 60 * 60);

    const { start: newStart, end: newEnd } = startEndFromCalendarAndSlot(
        dateYYYYMMDD,
        newTimeSlot as string,
        oldDuration
    );

    // Conflict check (buffer-aware) — exclude the booking being rescheduled
    const { data: bufRow } = await supabaseAdmin
        .from('studios').select('buffer_minutes').eq('id', booking.studio_id).maybeSingle();
    const bufferMs = (Number(bufRow?.buffer_minutes) || 0) * 60 * 1000;
    const { data: conflicts } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('studio_id', booking.studio_id)
        .neq('status', 'cancelled')
        .neq('id', booking.id)
        .lt('start_time', new Date(newEnd.getTime() + bufferMs).toISOString())
        .gt('end_time', new Date(newStart.getTime() - bufferMs).toISOString());

    if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
            { error: 'The new time slot is not available — another booking already exists.' },
            { status: 409 }
        );
    }

    // Re-fetch booking_number and user_id for the notification
    const { data: fullBooking } = await supabaseAdmin
        .from('bookings')
        .select('user_id, booking_number')
        .eq('id', booking.id)
        .maybeSingle();

    const { error } = await supabaseAdmin
        .from('bookings')
        .update({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            status: 'rescheduled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

    if (error) {
        console.error('Partner reschedule error:', error);
        return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 });
    }

    if (fullBooking?.user_id) {
        try {
            await supabaseAdmin.from('notifications').insert({
                user_id: fullBooking.user_id,
                type: 'booking_rescheduled',
                title: 'Booking Rescheduled',
                content: `Your booking ${fullBooking.booking_number} has been rescheduled to ${dateYYYYMMDD} at ${newTimeSlot}.`,
                action_url: '/dashboard',
            });
        } catch { /* non-blocking */ }
    }

    return NextResponse.json({ success: true });
}
