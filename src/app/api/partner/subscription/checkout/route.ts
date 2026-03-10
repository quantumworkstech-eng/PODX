import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

  const { plan_id } = await req.json();
  if (!plan_id) {
    return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch plan details
  const { data: plan, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .eq('is_active', true)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  // Create Razorpay order
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 });
  }

  const auth64 = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const receipt = `sub_${partnerId.slice(0, 8)}_${Date.now()}`;

  const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth64}` },
    body: JSON.stringify({
      amount: plan.price * 100, // paise
      currency: 'INR',
      receipt,
      payment_capture: 1,
      notes: { plan_id, partner_id: partnerId, plan_name: plan.name },
    }),
  });

  if (!rpRes.ok) {
    const err = await rpRes.text();
    console.error('Razorpay order error:', err);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }

  const order = await rpRes.json();

  // Record pending subscription payment
  await supabaseAdmin.from('subscription_payments').insert({
    partner_id: partnerId,
    razorpay_order_id: order.id,
    amount: plan.price,
    currency: 'INR',
    status: 'pending',
    billing_cycle: plan.billing_cycle,
    plan_id,
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    plan: { name: plan.name, tier: plan.tier, billing_cycle: plan.billing_cycle, price: plan.price },
  });
}
