import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
      id, booking_number, start_time, end_time, status, total_price, notes, created_at,
      studios!studio_id(id, name),
      users!user_id(id, email, profiles(full_name, phone))
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
    const timeSlot = `${startTime.getHours().toString().padStart(2, '0')}:00`;

    const profileArr = b.users?.profiles;
    const profile = Array.isArray(profileArr) ? profileArr[0] : profileArr;
    const customerName = profile?.full_name || b.users?.email?.split('@')[0] || 'Customer';

    return {
      id: b.booking_number || b.id,
      dbId: b.id,
      studio: { name: b.studios?.name || '' },
      customer: {
        name: customerName,
        email: b.users?.email || '',
        phone: profile?.phone || '',
      },
      date: b.start_time,
      timeSlot,
      duration,
      packageName: notes.package?.name,
      totalPrice: Number(b.total_price),
      status: b.status as 'confirmed' | 'pending' | 'cancelled' | 'completed',
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
