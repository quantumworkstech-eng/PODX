import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { checkStudioLimit, getPartnerSubscription } from '@/lib/subscription-gates';

async function getPartnerId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [subscription, studioAllowance, { data: paymentHistory }] = await Promise.all([
    getPartnerSubscription(partnerId),
    // Whether another studio can be listed right now. The first one is free, so
    // the wizard can't infer this from subscription status alone.
    checkStudioLimit(partnerId),
    supabaseAdmin
      .from('subscription_payments')
      .select('id, amount, billing_cycle, status, period_start, period_end, created_at, razorpay_order_id, plan:subscription_plans(name, tier)')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    subscription: subscription ?? null,
    studioAllowance,
    paymentHistory: paymentHistory ?? [],
  });
}
