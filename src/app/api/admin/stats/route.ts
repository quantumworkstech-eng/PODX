import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function requireAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (!user) return false;
  const { data: roleData } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  return (roleData || []).some((r: any) => r.roles?.name === 'admin');
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const [
    { count: totalUsers },
    { count: totalStudios },
    { count: totalBookings },
    { data: revenueData },
    { count: pendingApprovals },
    { count: pendingRefunds },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('amount').eq('status', 'succeeded'),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
    supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalRevenue = (revenueData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalStudios: totalStudios || 0,
    totalBookings: totalBookings || 0,
    totalRevenue,
    pendingApprovals: pendingApprovals || 0,
    pendingRefunds: pendingRefunds || 0,
  });
}
