import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = params;
  const body = await req.json();
  const { status, plan_id, current_period_end, notes } = body;

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (plan_id) updateData.plan_id = plan_id;
  if (notes !== undefined) updateData.notes = notes;

  if (current_period_end) {
    updateData.current_period_end = current_period_end;
    // Recalculate grace period end
    const gracePeriodEnd = new Date(current_period_end);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
    updateData.grace_period_end = gracePeriodEnd.toISOString();
  }

  // If manually activating, reset cancel flags
  if (status === 'active') {
    updateData.cancel_at_period_end = false;
  }

  const { data: subscription, error } = await supabaseAdmin
    .from('partner_subscriptions')
    .update(updateData)
    .eq('id', id)
    .select(`
      id, partner_id, status, billing_cycle,
      current_period_start, current_period_end, grace_period_end,
      cancel_at_period_end, notes,
      plan:subscription_plans (id, name, tier, price)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(email, 'subscription_update', 'partner_subscription', id, {
    status,
    plan_id,
    current_period_end,
    notes,
  });

  return NextResponse.json({ subscription });
}
