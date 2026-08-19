import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getPartnerSubscription } from '@/lib/subscription-gates';
import crypto from 'crypto';
import { createAuditLog, requestContextFrom } from '@/lib/audit';

async function getPartnerId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 });
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Idempotency: check if already processed
  const { data: existingPayment } = await supabaseAdmin
    .from('subscription_payments')
    .select('id, status, subscription_id')
    .eq('razorpay_order_id', razorpay_order_id)
    .maybeSingle();

  if (existingPayment?.status === 'paid') {
    const sub = await getPartnerSubscription(partnerId);
    return NextResponse.json({ subscription: sub, alreadyProcessed: true });
  }

  // Verify this order belongs to the authenticated partner
  if (!existingPayment || existingPayment === null) {
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
  }

  // Fetch payment details to get plan
  const { data: paymentRow } = await supabaseAdmin
    .from('subscription_payments')
    .select('plan_id, billing_cycle, amount')
    .eq('razorpay_order_id', razorpay_order_id)
    .eq('partner_id', partnerId)
    .maybeSingle();

  if (!paymentRow) {
    return NextResponse.json({ error: 'Payment not found for this partner' }, { status: 403 });
  }

  // Fetch plan
  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('id', paymentRow.plan_id)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Calculate new period dates
  const now = new Date();
  const periodStart = now;
  const periodEnd = new Date(now);
  if (paymentRow.billing_cycle === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  const gracePeriodEnd = new Date(periodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  // Upsert partner_subscriptions (handles both new sub and renewal)
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('partner_subscriptions')
    .upsert(
      {
        partner_id: partnerId,
        plan_id: paymentRow.plan_id,
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        grace_period_end: gracePeriodEnd.toISOString(),
        billing_cycle: paymentRow.billing_cycle,
        cancel_at_period_end: false,
        cancelled_at: null,
      },
      { onConflict: 'partner_id' }
    )
    .select()
    .single();

  if (subError || !subscription) {
    console.error('Subscription upsert error:', subError);
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
  }

  // Update subscription_payments row
  await supabaseAdmin
    .from('subscription_payments')
    .update({
      razorpay_payment_id,
      status: 'paid',
      subscription_id: subscription.id,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    })
    .eq('razorpay_order_id', razorpay_order_id);

  // If plan grants whitelabel, enable it on partner_branding
  if (plan.whitelabel_enabled) {
    await supabaseAdmin
      .from('partner_branding')
      .upsert(
        { partner_id: partnerId, is_whitelabel_enabled: true },
        { onConflict: 'partner_id' }
      );
  } else {
    // Downgrade: disable whitelabel if new plan doesn't include it
    await supabaseAdmin
      .from('partner_branding')
      .update({ is_whitelabel_enabled: false })
      .eq('partner_id', partnerId);
  }

  // Check for studio count warning on downgrade
  let warning: string | undefined;
  if (plan.max_studios !== null) {
    const { count: studioCount } = await supabaseAdmin
      .from('studios')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', partnerId);

    if ((studioCount ?? 0) > plan.max_studios) {
      const excess = (studioCount ?? 0) - plan.max_studios;
      warning = `You have ${studioCount} studios but your new plan allows ${plan.max_studios}. Please remove ${excess} studio(s) to stay within your plan limit.`;
    }
  }

  const fullSub = await getPartnerSubscription(partnerId);

  await createAuditLog({
    action: 'SUBSCRIPTION_CHANGED',
    module: 'Billing',
    description: `Subscription activated on the ${plan.name ?? plan.id} plan`,
    recordType: 'subscription',
    recordId: String((fullSub as { id?: string } | null)?.id ?? partnerId),
    recordName: plan.name ?? null,
    newValues: { plan: plan.name ?? plan.id, max_studios: plan.max_studios ?? null },
    metadata: warning ? { downgrade_warning: warning } : null,
    request: requestContextFrom(req),
  });

  return NextResponse.json({ subscription: fullSub, warning: warning ?? null });
}
