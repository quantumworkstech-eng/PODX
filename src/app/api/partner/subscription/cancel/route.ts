import { NextResponse } from 'next/server';
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

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: sub, error } = await supabaseAdmin
    .from('partner_subscriptions')
    .update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString() })
    .eq('partner_id', partnerId)
    .in('status', ['active', 'grace_period'])
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Your subscription will remain active until ${new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} and will not renew.`,
    endsAt: sub.current_period_end,
  });
}
