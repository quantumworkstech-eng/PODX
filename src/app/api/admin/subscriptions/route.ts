import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const tier = searchParams.get('tier');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('partner_subscriptions')
    .select(`
      id, partner_id, status, billing_cycle,
      current_period_start, current_period_end, grace_period_end,
      cancel_at_period_end, cancelled_at, created_at,
      plan:subscription_plans (id, name, tier, price, commission_pct, max_studios),
      partner:users!partner_subscriptions_partner_id_fkey (id, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (tier) query = query.eq('subscription_plans.tier', tier);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary counts
  const [
    { count: activeCount },
    { count: graceCount },
    { count: expiredCount },
    { count: cancelledCount },
  ] = await Promise.all([
    supabaseAdmin.from('partner_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('partner_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'grace_period'),
    supabaseAdmin.from('partner_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabaseAdmin.from('partner_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ]);

  return NextResponse.json({
    subscriptions: data || [],
    total: count || 0,
    page,
    limit,
    summary: {
      active: activeCount || 0,
      grace_period: graceCount || 0,
      expired: expiredCount || 0,
      cancelled: cancelledCount || 0,
    },
  });
}
