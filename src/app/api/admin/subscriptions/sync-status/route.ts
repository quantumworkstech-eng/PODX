import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Bulk-update all lapsed subscription statuses.
 * Can be triggered manually from admin panel or via a Vercel/Supabase cron.
 */
export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const now = new Date().toISOString();

  // active → grace_period
  const { data: toGraceData } = await supabaseAdmin
    .from('partner_subscriptions')
    .update({ status: 'grace_period' })
    .eq('status', 'active')
    .lt('current_period_end', now)
    .gt('grace_period_end', now)
    .select('id');
  const toGrace = toGraceData?.length || 0;

  // active/grace_period → expired
  const { data: toExpiredData } = await supabaseAdmin
    .from('partner_subscriptions')
    .update({ status: 'expired' })
    .in('status', ['active', 'grace_period'])
    .lt('grace_period_end', now)
    .select('id');
  const toExpired = toExpiredData?.length || 0;

  return NextResponse.json({
    success: true,
    transitionedToGrace: toGrace ?? 0,
    transitionedToExpired: toExpired ?? 0,
    syncedAt: now,
  });
}
