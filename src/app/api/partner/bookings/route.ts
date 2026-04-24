import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isoToISTSlot } from '@/lib/bookingDisplay';

async function getUserAndStudios(email: string) {
  const { data: user } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (!user) return { user: null, studioIds: [] };

  const { data: studios } = await supabaseAdmin!
    .from('studios')
    .select('id')
    .eq('owner_id', user.id);

  return { user, studioIds: (studios || []).map((s: any) => s.id) };
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
      studios!studio_id(id, name, city, address),
      users!user_id(id, email)
    `)
    .in('studio_id', studioIds)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching partner bookings:', error);
    return NextResponse.json({ bookings: [] });
  }

  const bookings = (rows || []).map((b: any) => {
    let notes: Record<string, any> = {};
    try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}

    const startTime = new Date(b.start_time);
    const endTime = new Date(b.end_time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    // Derive 24-hr "HH:MM" slot labels in IST using the centralized utility
    const timeSlotLabel = isoToISTSlot(b.start_time);
    const endTimeLabel  = isoToISTSlot(b.end_time);

    const customerName = notes.customerName || b.users?.email?.split('@')[0] || 'Customer';

    const addOns: { name: string; price: number }[] = notes.addOns || [];
    const pkg = notes.package || null;
    const totalPaid = Number(b.total_price) || 0;
    // Reverse-calculate base components from stored total
    const addOnsTotal = addOns.reduce((s: number, a: any) => s + (a.price || 0), 0);
    const packagePrice = pkg ? (pkg.price_per_hour || 0) * duration : 0;
    const subtotal = notes.subtotal || totalPaid / 1.18;
    const gst = notes.tax || subtotal * 0.18;
    const basePrice = Math.max(0, subtotal - packagePrice - addOnsTotal);

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
        email: b.users?.email || '',
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
      pricing: {
        basePrice,
        packagePrice,
        addOnsTotal,
        subtotal,
        gst,
        total: Number(b.total_price),
      },
      totalPrice: Number(b.total_price),
      status: b.status as 'confirmed' | 'pending' | 'cancelled' | 'completed',
      createdAt: b.created_at,
    };
  });

  return NextResponse.json({ bookings });
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
