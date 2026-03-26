import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getHourInIST, getMinuteInIST } from '@/lib/bookingTime';

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
      users!user_id(id, email, profiles(full_name, phone)),
      rooms!room_id(price_per_hour)
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
    const fmt = (d: Date) =>
      `${getHourInIST(d).toString().padStart(2, '0')}:${getMinuteInIST(d).toString().padStart(2, '0')}`;

    const roomArr = b.rooms;
    const room = Array.isArray(roomArr) ? roomArr[0] : roomArr;
    const profileArr = b.users?.profiles;
    const profile = Array.isArray(profileArr) ? profileArr[0] : profileArr;
    const customerName = profile?.full_name || b.users?.email?.split('@')[0] || 'Customer';

    const addOns: { name: string; price: number }[] = notes.addOns || [];
    const pkg = notes.package || null;
    const pricePerHour = room?.price_per_hour || 0;
    const basePrice = pricePerHour * duration;
    const packagePrice = pkg ? (pkg.price_per_hour || 0) * duration : 0;
    const addOnsTotal = addOns.reduce((s: number, a: any) => s + (a.price || 0), 0);
    const subtotal = basePrice + packagePrice + addOnsTotal;
    const gst = subtotal * 0.18;

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
        phone: profile?.phone || '',
      },
      date: b.start_time,
      endDate: b.end_time,
      timeSlot: fmt(startTime),
      endTime: fmt(endTime),
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
    .select('id, studio_id')
    .eq('id', bookingDbId)
    .maybeSingle();

  if (!booking || !studioIds.includes(booking.studio_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabaseAdmin.from('bookings').update({ status }).eq('id', bookingDbId);
  return NextResponse.json({ success: true });
}
