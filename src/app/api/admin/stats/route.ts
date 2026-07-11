import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ROLE_COLUMN_VALUES_WITH_PARTNER, roleColumnHas } from '@/lib/user-role-column';

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
    { data: partnerRoleUsers },
    { data: studioOwners },
    { count: totalStudios },
    { count: totalBookings },
    { data: revenueData },
    { data: todayRevenueData },
    { data: monthRevenueData },
    { count: pendingApprovals },
    { count: pendingRefunds },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabaseAdmin.from('users').select('id, role').in('role', ROLE_COLUMN_VALUES_WITH_PARTNER),
    supabaseAdmin.from('studios').select('owner_id').not('owner_id', 'is', null),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded'),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded').gte('created_at', todayStart.toISOString()),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded').gte('created_at', monthStart.toISOString()),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
    supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Count unique partners: users with role='partner' + users who own studios
  const partnerIdSet = new Set<string>([
    ...(partnerRoleUsers || [])
      .filter((u: { role?: string }) => roleColumnHas(u.role, 'partner'))
      .map((u: { id: string }) => u.id),
    ...(studioOwners || []).map((s: any) => s.owner_id).filter(Boolean),
  ]);
  const totalPartners = partnerIdSet.size;

  // Fetch separately — table may not exist before migration
  let pendingReschedule = 0;
  try {
    const { count } = await supabaseAdmin.from('booking_reschedule_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    pendingReschedule = count || 0;
  } catch { /* table may not exist yet */ }

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
