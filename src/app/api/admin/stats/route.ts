import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalPartners },
    { count: totalStudios },
    { count: totalBookings },
    { data: revenueData },
    { data: todayRevenueData },
    { data: monthRevenueData },
    { count: pendingApprovals },
    { count: pendingRefunds },
    { count: pendingReschedule },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'partner'),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded'),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded').gte('created_at', todayStart.toISOString()),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded').gte('created_at', monthStart.toISOString()),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
    supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('booking_reschedule_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').throwOnError().then(r => ({ count: r.count })).catch(() => ({ count: 0 })),
  ]);

  const totalRevenue = (revenueData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const revenueToday = (todayRevenueData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const revenueThisMonth = (monthRevenueData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalPartners: totalPartners || 0,
    totalStudios: totalStudios || 0,
    totalBookings: totalBookings || 0,
    totalRevenue,
    revenueToday,
    revenueThisMonth,
    pendingApprovals: pendingApprovals || 0,
    pendingRefunds: pendingRefunds || 0,
    pendingReschedule: pendingReschedule || 0,
  });
}
