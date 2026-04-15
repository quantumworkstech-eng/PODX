import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
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

// POST /api/admin/subscriptions — assign or replace a partner's subscription
export async function POST(req: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await req.json();
  const { partner_id, plan_id, billing_cycle, period_months } = body as {
    partner_id?: string;
    plan_id?: string;
    billing_cycle?: string;
    period_months?: number;
  };

  if (!partner_id || !plan_id) {
    return NextResponse.json({ error: 'partner_id and plan_id are required' }, { status: 400 });
  }

  // Verify partner exists
  const { data: partner } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', partner_id)
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  // Verify plan exists
  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('id, name')
    .eq('id', plan_id)
    .maybeSingle();
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const now = new Date();
  const months = period_months ?? (billing_cycle === 'annual' ? 12 : 1);
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + months);
  const gracePeriodEnd = new Date(periodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  // Cancel any existing active subscription first
  await supabaseAdmin
    .from('partner_subscriptions')
    .update({ status: 'cancelled', cancelled_at: now.toISOString(), cancel_at_period_end: false })
    .eq('partner_id', partner_id)
    .in('status', ['active', 'grace_period']);

  const { data: subscription, error } = await supabaseAdmin
    .from('partner_subscriptions')
    .insert({
      partner_id,
      plan_id,
      status: 'active',
      billing_cycle: billing_cycle ?? 'monthly',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      grace_period_end: gracePeriodEnd.toISOString(),
      cancel_at_period_end: false,
    })
    .select(`
      id, partner_id, status, billing_cycle,
      current_period_start, current_period_end, grace_period_end,
      cancel_at_period_end,
      plan:subscription_plans (id, name, tier, price),
      partner:users!partner_subscriptions_partner_id_fkey (id, email)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(email, 'assign_subscription', 'partner_subscription', subscription.id, {
    partner_id,
    plan_id,
    plan_name: plan.name,
    billing_cycle,
  });

  return NextResponse.json({ subscription }, { status: 201 });
}
