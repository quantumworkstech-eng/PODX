import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { calendarDateInIST, startEndFromCalendarAndSlot } from '@/lib/bookingTime';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v: string) => UUID_RE.test(v);

// GET full booking details for admin
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  // Fetch the booking — support both UUID and booking_number
  const getQuery = supabaseAdmin.from('bookings').select('*');
  const { data: booking, error: bookingErr } = await (isUUID(id)
    ? getQuery.eq('id', id)
    : getQuery.eq('booking_number', id)
  ).maybeSingle();

  if (bookingErr || !booking) {
    console.error('Booking fetch error:', bookingErr, 'id:', id);
    return NextResponse.json(
      { error: 'Booking not found', details: bookingErr?.message },
      { status: 404 }
    );
  }

  // Fetch related data in parallel using the real UUID
  const bookingId = booking.id;

  const [
    { data: userRow },
    { data: studioRow },
    { data: payments },
    { data: addons },
    { data: guests },
    { data: refunds },
  ] = await Promise.all([
    // User info via direct lookup
    supabaseAdmin
      .from('users')
      .select('id, email, phone, profiles(full_name, avatar_url)')
      .eq('id', booking.user_id)
      .maybeSingle(),
    // Studio info
    supabaseAdmin
      .from('studios')
      .select('id, name, city, address, price_per_hour, owner_id')
      .eq('id', booking.studio_id)
      .maybeSingle(),
    supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('booking_addons')
      .select('*, platform_addons(name, price)')
      .eq('booking_id', bookingId),
    supabaseAdmin
      .from('booking_guests')
      .select('*')
      .eq('booking_id', bookingId),
    supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false }),
  ]);

  // Fetch studio owner details if we have owner_id
  let studioOwnerRow: any = null;
  if (studioRow?.owner_id) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('email, profiles(full_name)')
      .eq('id', studioRow.owner_id)
      .maybeSingle();
    studioOwnerRow = data;
  }

  const profileData = (userRow as any)?.profiles;
  const ownerProfileData = (studioOwnerRow as any)?.profiles;

  return NextResponse.json({
    booking: {
      ...booking,
      user_email: userRow?.email || '',
      user_name: profileData?.full_name || '',
      user_phone: (userRow as any)?.phone || '',
      user_avatar: profileData?.avatar_url || '',
      studio_name: studioRow?.name || '',
      studio_city: studioRow?.city || '',
      studio_address: studioRow?.address || '',
      studio_price_per_hour: studioRow?.price_per_hour || 0,
      studio_owner_email: studioOwnerRow?.email || '',
      studio_owner_name: ownerProfileData?.full_name || '',
    },
    payments: payments || [],
    addons: (addons || []).map((a: any) => ({
      ...a,
      addon_name: a.platform_addons?.name || a.name || 'Unknown',
      addon_price: a.platform_addons?.price || a.price || 0,
    })),
    guests: guests || [],
    refunds: refunds || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const { action, status, bookingFields, newDate, newTimeSlot } = body;

  if (action === 'force_cancel') {
    // Resolve real UUID first if a booking_number was passed
    const cancelLookup = supabaseAdmin.from('bookings').select('id, user_id, booking_number');
    const { data: bookingToCancel } = await (isUUID(id)
      ? cancelLookup.eq('id', id)
      : cancelLookup.eq('booking_number', id)
    ).maybeSingle();

    if (!bookingToCancel) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Cancelled by admin', cancelled_at: new Date().toISOString() })
      .eq('id', bookingToCancel.id);

    const booking = bookingToCancel;

    if (booking?.user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        content: `Your booking ${booking.booking_number} has been cancelled by admin.`,
        action_url: '/dashboard',
      });
    }

    await logAdminAction(email, 'booking_force_cancel', 'booking', id);
    return NextResponse.json({ success: true });
  }

  if (action === 'force_refund') {
    // Resolve real UUID first if a booking_number was passed
    const refundLookup = supabaseAdmin.from('bookings').select('id');
    const { data: refundBooking } = await (isUUID(id)
      ? refundLookup.eq('id', id)
      : refundLookup.eq('booking_number', id)
    ).maybeSingle();
    const realId = refundBooking?.id ?? id;

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, amount, provider_payment_id')
      .eq('booking_id', realId)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (!payment) return NextResponse.json({ error: 'No successful payment found' }, { status: 404 });

    await supabaseAdmin.from('refunds').insert({
      payment_id: payment.id,
      booking_id: realId,
      amount: payment.amount,
      reason: 'Admin force refund',
      status: 'pending',
    });

    await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
    await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', realId);

    await logAdminAction(email, 'booking_force_refund', 'booking', id);
    return NextResponse.json({ success: true, message: 'Refund initiated' });
  }

  // ── Admin Reschedule ───────────────────────────────────────────────────────
  if (action === 'reschedule') {
    if (!newDate || !newTimeSlot) {
      return NextResponse.json({ error: 'newDate and newTimeSlot are required' }, { status: 400 });
    }

    // Fetch current booking — support both UUID and booking_number
    const rescheduleQuery = supabaseAdmin
      .from('bookings')
      .select('id, studio_id, start_time, end_time, status, user_id, booking_number');
    const { data: booking } = await (isUUID(id)
      ? rescheduleQuery.eq('id', id)
      : rescheduleQuery.eq('booking_number', id)
    ).maybeSingle();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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

    // Conflict check — exclude the booking being rescheduled
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('studio_id', booking.studio_id)
      .neq('status', 'cancelled')
      .neq('id', booking.id)
      .lt('start_time', newEnd.toISOString())
      .gt('end_time', newStart.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'The new time slot is not available — another booking already exists.' },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateErr) {
      console.error('Admin reschedule error:', updateErr);
      return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 });
    }

    // Notify the user (best-effort, non-blocking)
    if (booking.user_id) {
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: booking.user_id,
          type: 'booking_rescheduled',
          title: 'Booking Rescheduled',
          content: `Your booking ${booking.booking_number} has been rescheduled by admin to ${dateYYYYMMDD} at ${newTimeSlot}.`,
          action_url: '/dashboard',
        });
      } catch { /* ignore notification errors */ }
    }

    await logAdminAction(email, 'booking_reschedule', 'booking', id, { newDate, newTimeSlot });
    return NextResponse.json({ success: true });
  }

  // Direct field updates
  if (bookingFields) {
    const allowed = [
      'status', 'start_time', 'end_time', 'booking_date', 'notes',
      'total_price', 'cancellation_reason',
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in bookingFields) updates[key] = bookingFields[key];
    }

    const { error } = await supabaseAdmin.from('bookings').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });

    await logAdminAction(email, 'booking_edit', 'booking', id, { fields: Object.keys(bookingFields) });
    return NextResponse.json({ success: true });
  }

  if (status) {
    await supabaseAdmin.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await logAdminAction(email, 'booking_status_change', 'booking', id, { status });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
