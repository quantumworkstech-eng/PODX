import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || 'pending';
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('booking_reschedule_requests')
    .select(`
      *,
      bookings(booking_number, studio_id, studios(name, city)),
      users!booking_reschedule_requests_requested_by_fkey(email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) {
    console.error('Reschedule fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reschedule requests' }, { status: 500 });
  }

  const requests = (data || []).map((r: any) => ({
    id: r.id,
    booking_id: r.booking_id,
    booking_number: r.bookings?.booking_number || '—',
    studio_name: r.bookings?.studios?.name || '—',
    studio_city: r.bookings?.studios?.city || '—',
    requested_by_email: r.users?.email || '—',
    requested_by_role: r.requested_by_role,
    old_date: r.old_date,
    old_start_time: r.old_start_time,
    old_end_time: r.old_end_time,
    new_date: r.new_date,
    new_start_time: r.new_start_time,
    new_end_time: r.new_end_time,
    reason: r.reason,
    status: r.status,
    admin_note: r.admin_note,
    created_at: r.created_at,
  }));

  return NextResponse.json({ requests, total: count || 0, page, limit });
}
