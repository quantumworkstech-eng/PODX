import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isoToISTSlot } from '@/lib/bookingDisplay';
import { calendarDateInIST, startEndFromCalendarAndSlot } from '@/lib/bookingTime';

type StudioOwnerRow = { id: string };
type StudioIdRow = { id: string };
type BookingAddonRow = { name?: string | null; price?: number | string | null; quantity?: number | string | null };
type NoteAddon = { name?: unknown; price?: unknown; qty?: unknown; quantity?: unknown };
type BookingPackageNote = { name?: string; price_per_hour?: number | string };
type PartnerBookingRow = {
  id: string;
  studio_id: string;
  booking_number?: string | null;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'rescheduled';
  total_price?: number | string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  studios?: { id?: string; name?: string; city?: string; address?: string } | null;
  users?: { id?: string; email?: string } | null;
  booking_addons?: BookingAddonRow[] | null;
};

async function getUserAndStudios(email: string) {
  const { data: user } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle<StudioOwnerRow>();
  if (!user) return { user: null, studioIds: [] };

  const { data: studios } = await supabaseAdmin!
    .from('studios')
    .select('id')
    .eq('owner_id', user.id)
    .returns<StudioIdRow[]>();

  return { user, studioIds: (studios || []).map((s) => s.id) };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ bookings: [] });

  const { studioIds } = await getUserAndStudios(session.user.email);
  if (studioIds.length === 0) return NextResponse.json({ bookings: [] });

  const { data: rows, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, studio_id, booking_number, start_time, end_time, status, total_price, notes, created_at,
      updated_at, cancelled_at, cancellation_reason,
      studios!studio_id(id, name, city, address),
      users!user_id(id, email),
      booking_addons(id, name, price, quantity)
    `)
    .in('studio_id', studioIds)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching partner bookings:', error);
    return NextResponse.json({ bookings: [] });
  }

  const bookings = ((rows || []) as PartnerBookingRow[]).map((b) => {
    let notes: Record<string, unknown> = {};
    try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}

    const startTime = new Date(b.start_time);
    const endTime = new Date(b.end_time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    // Derive 24-hr "HH:MM" slot labels in IST using the centralized utility
    const timeSlotLabel = isoToISTSlot(b.start_time);
    const endTimeLabel  = isoToISTSlot(b.end_time);

    const pkg =
      typeof notes.package === "object" && notes.package
        ? (notes.package as BookingPackageNote)
        : null;
    const totalPaid = Number(b.total_price) || 0;
    const dbAddOns = (b.booking_addons || []).map((a) => ({
      name: a.name,
      price: Number(a.price) || 0,
      qty: Number(a.quantity) || 1,
    }));
    const noteAddOns = Array.isArray(notes.addOns)
      ? (notes.addOns as NoteAddon[]).map((a) => ({
          name: typeof a.name === "string" ? a.name : "",
          price: Number(a.price) || 0,
          qty: Number(a.qty ?? a.quantity) || 1,
        }))
      : [];
    const addOns = dbAddOns.length > 0 ? dbAddOns : noteAddOns;
    const addOnsTotal = addOns.reduce(
      (s, a) => s + (Number(a.price) || 0) * (Number(a.qty) || 1),
      0
    );
    const packagePrice = pkg ? (Number(pkg.price_per_hour) || 0) * duration : 0;
    const discountAmount = Number(notes.discountAmount ?? notes.discount_amount ?? 0) || 0;
    const couponCode =
      typeof notes.couponCode === "string"
        ? notes.couponCode
        : typeof notes.coupon_code === "string"
          ? notes.coupon_code
          : null;
    const convenienceFee = Number(notes.convenienceFee ?? notes.convenience_fee ?? 0) || 0;
    const subtotal =
      notes.subtotal != null ? Number(notes.subtotal) : packagePrice + addOnsTotal;
    const preTaxAfterDiscount = Math.max(0, subtotal - discountAmount);
    const gst =
      notes.tax != null ? Number(notes.tax) : Math.round(preTaxAfterDiscount * 0.18);

    const customerEmail =
      typeof notes.customerEmail === "string" && notes.customerEmail.trim()
        ? notes.customerEmail.trim()
        : b.users?.email || "";
    const customerName = notes.customerName || customerEmail?.split('@')[0] || 'Customer';

    return {
      id: b.booking_number || b.id,
      dbId: b.id,
      studioId: b.studio_id as string,
      studio: {
        id: (b.studios as { id?: string } | null)?.id || b.studio_id,
        name: b.studios?.name || '',
        city: b.studios?.city || '',
        address: b.studios?.address || '',
      },
      customer: {
        name: customerName,
        email: customerEmail,
        phone: notes.customerPhone || '',
      },
      // Raw UTC ISO strings — use formatBookingDate/Time from bookingDisplay.ts
      start_time: b.start_time as string,
      end_time: b.end_time as string,
      // Legacy aliases
      date: b.start_time,
      endDate: b.end_time,
      timeSlot: timeSlotLabel,
      endTime: endTimeLabel,
      duration,
      participants: notes.participants || null,
      package: pkg ? { name: pkg.name, pricePerHour: pkg.price_per_hour || 0 } : null,
      addOns,
      bookingNote:
        typeof notes.bookingNote === "string"
          ? notes.bookingNote
          : typeof notes.booking_note === "string"
            ? notes.booking_note
            : null,
      pricing: {
        subtotalBeforeDiscount: subtotal,
        discountAmount,
        couponCode,
        preTaxAfterDiscount,
        packagePrice,
        addOnsTotal,
        gst,
        convenienceFee,
        total: totalPaid,
      },
      totalPrice: totalPaid,
      paymentId: notes.paymentId ? String(notes.paymentId) : "",
      cancellationReason:
        typeof b.cancellation_reason === "string"
          ? b.cancellation_reason
          : null,
      cancelledAt: b.cancelled_at as string | null,
      updatedAt: b.updated_at as string,
      status: b.status as 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'rescheduled',
      createdAt: b.created_at,
    };
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const body = await request.json();
  const {
    studioId,
    date,
    timeSlot,
    duration,
    customerName,
    customerEmail,
    customerPhone,
    participants,
    note,
  } = body;

  if (!studioId || !date || !timeSlot || !duration) {
    return NextResponse.json(
      { error: 'studioId, date, timeSlot, and duration are required' },
      { status: 400 }
    );
  }

  const { user, studioIds } = await getUserAndStudios(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!studioIds.includes(studioId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let dateYYYYMMDD: string;
  try {
    dateYYYYMMDD = calendarDateInIST(String(date));
  } catch {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const durationHours = Number(duration);
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 12) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
  }

  const { start, end } = startEndFromCalendarAndSlot(
    dateYYYYMMDD,
    String(timeSlot),
    durationHours
  );
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid slot time' }, { status: 400 });
  }

  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('id')
    .eq('studio_id', studioId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const { data: anyRoom } = room
    ? { data: null }
    : await supabaseAdmin
        .from('rooms')
        .select('id')
        .eq('studio_id', studioId)
        .limit(1)
        .maybeSingle();

  const roomId = room?.id || anyRoom?.id || null;

  const { data: studioMeta } = await supabaseAdmin
    .from('studios')
    .select('buffer_minutes')
    .eq('id', studioId)
    .maybeSingle();

  const bufferMinutes = Number(studioMeta?.buffer_minutes) || 0;
  const conflictCheckStart = new Date(start.getTime() - bufferMinutes * 60 * 1000);

  const { data: conflicts, error: conflictError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('studio_id', studioId)
    .neq('status', 'cancelled')
    .lt('start_time', end.toISOString())
    .gt('end_time', conflictCheckStart.toISOString());

  if (conflictError) {
    console.error('Error checking partner manual booking conflict:', conflictError);
    return NextResponse.json({ error: 'Could not check slot availability' }, { status: 500 });
  }

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'This slot is already booked' }, { status: 409 });
  }

  const cleanName =
    typeof customerName === 'string' && customerName.trim()
      ? customerName.trim()
      : 'Blocked slot';
  const bookingNumber = `POD-${Date.now().toString(36).toUpperCase()}`;
  const notes = JSON.stringify({
    participants: Number(participants) || 1,
    customerName: cleanName,
    customerEmail:
      typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim() : null,
    customerPhone:
      typeof customerPhone === 'string' && customerPhone.trim() ? customerPhone.trim() : null,
    bookingNote: typeof note === 'string' && note.trim() ? note.trim() : null,
    package: {
      name: 'Partner booked slot',
      price_per_hour: 0,
    },
    bookingSource: 'partner_manual',
    manuallyCreatedByPartner: true,
  });

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      user_id: user.id,
      studio_id: studioId,
      room_id: roomId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'confirmed',
      total_price: 0,
      notes,
    })
    .select('id, booking_number')
    .single();

  if (error || !booking) {
    console.error('Error creating partner manual booking:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create booking' },
      { status: 500 }
    );
  }

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { bookingDbId, status } = await request.json();
  if (!bookingDbId || !status) {
    return NextResponse.json({ error: 'bookingDbId and status required' }, { status: 400 });
  }

  const { user, studioIds } = await getUserAndStudios(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Verify the booking belongs to one of the partner's studios
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, studio_id, user_id, booking_number')
    .eq('id', bookingDbId)
    .maybeSingle();

  if (!booking || !studioIds.includes(booking.studio_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabaseAdmin.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingDbId);

  // Notify the client so their dashboard reflects the change
  if (booking.user_id) {
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        type: 'booking_updated',
        title: 'Booking Updated',
        content: `Your booking ${booking.booking_number} has been updated to ${status}.`,
        action_url: '/dashboard',
      });
    } catch { /* ignore notification errors */ }
  }

  return NextResponse.json({ success: true });
}
