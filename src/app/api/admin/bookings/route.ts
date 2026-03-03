import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function requireAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (!user) return false;
  const { data: roleData } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  return (roleData || []).some((r: any) => r.roles?.name === 'admin');
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_number, status, total_price, start_time, end_time, created_at,
      users!bookings_user_id_fkey(email, profiles(full_name)),
      studios(name, city)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('booking_number', `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }

  const bookings = (data || []).map((b: any) => ({
    id: b.id,
    booking_number: b.booking_number,
    status: b.status,
    total_price: b.total_price,
    start_time: b.start_time,
    end_time: b.end_time,
    created_at: b.created_at,
    user_email: b.users?.email || '',
    user_name: b.users?.profiles?.full_name || '',
    studio_name: b.studios?.name || '',
    studio_city: b.studios?.city || '',
  }));

  return NextResponse.json({ bookings, total: count || 0, page, limit });
}
