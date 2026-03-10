import { supabaseAdmin } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'grace_period' | 'expired' | 'cancelled';
export type AnalyticsLevel = 'basic' | 'full';
export type SubscriptionFeature = 'whitelabel' | 'analytics_full' | 'api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'basic' | 'pro' | 'enterprise';
  billing_cycle: 'monthly' | 'annual';
  price: number;
  max_studios: number | null;
  commission_pct: number;
  whitelabel_enabled: boolean;
  analytics_level: AnalyticsLevel;
  api_access: boolean;
  features: Record<string, unknown>;
}

export interface PartnerSubscription {
  id: string;
  partner_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  grace_period_end: string | null;
  billing_cycle: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  plan: SubscriptionPlan;
}

// ─── Status Sync ─────────────────────────────────────────────────────────────

/**
 * Lazily transitions subscription status based on current date.
 * active → grace_period → expired
 * Called at the start of every gate check.
 */
export async function syncSubscriptionStatus(partnerId: string): Promise<void> {
  if (!supabaseAdmin) return;

  const now = new Date().toISOString();

  // active → grace_period: period has ended but grace period has not
  await supabaseAdmin
    .from('partner_subscriptions')
    .update({ status: 'grace_period' })
    .eq('partner_id', partnerId)
    .eq('status', 'active')
    .lt('current_period_end', now)
    .gt('grace_period_end', now);

  // grace_period → expired: grace period has also ended
  await supabaseAdmin
    .from('partner_subscriptions')
    .update({ status: 'expired' })
    .eq('partner_id', partnerId)
    .in('status', ['active', 'grace_period'])
    .lt('grace_period_end', now);
}

// ─── Core Getter ─────────────────────────────────────────────────────────────

/**
 * Returns the current subscription (with plan details) for a partner.
 * Syncs status from dates before returning.
 */
export async function getPartnerSubscription(
  partnerId: string
): Promise<PartnerSubscription | null> {
  if (!supabaseAdmin) return null;

  await syncSubscriptionStatus(partnerId);

  const { data, error } = await supabaseAdmin
    .from('partner_subscriptions')
    .select(`
      id, partner_id, plan_id, status,
      current_period_start, current_period_end, grace_period_end,
      billing_cycle, cancel_at_period_end, cancelled_at,
      plan:subscription_plans (
        id, name, tier, billing_cycle, price,
        max_studios, commission_pct, whitelabel_enabled,
        analytics_level, api_access, features
      )
    `)
    .eq('partner_id', partnerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PartnerSubscription;
}

// ─── Active Check ─────────────────────────────────────────────────────────────

/**
 * Returns true if the subscription is active or in grace period.
 * Grace period partners retain access but see renewal warnings.
 */
export function isSubscriptionActive(sub: PartnerSubscription | null): boolean {
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'grace_period';
}

// ─── Feature Gates ────────────────────────────────────────────────────────────

/**
 * Checks if a partner can add another studio based on their plan limit.
 */
export async function checkStudioLimit(
  partnerId: string
): Promise<{ allowed: boolean; current: number; max: number | null }> {
  if (!supabaseAdmin) return { allowed: true, current: 0, max: null };

  const sub = await getPartnerSubscription(partnerId);

  if (!isSubscriptionActive(sub)) {
    return { allowed: false, current: 0, max: 0 };
  }

  const max = sub!.plan.max_studios;

  // Unlimited studios (enterprise)
  if (max === null) return { allowed: true, current: 0, max: null };

  const { count } = await supabaseAdmin
    .from('studios')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', partnerId);

  const current = count ?? 0;
  return { allowed: current < max, current, max };
}

/**
 * Checks if a partner has access to a specific premium feature.
 */
export async function checkFeature(
  partnerId: string,
  feature: SubscriptionFeature
): Promise<boolean> {
  if (!supabaseAdmin) return true; // Allow in dev/fallback

  const sub = await getPartnerSubscription(partnerId);

  if (!isSubscriptionActive(sub)) return false;

  const plan = sub!.plan;
  switch (feature) {
    case 'whitelabel':
      return plan.whitelabel_enabled;
    case 'analytics_full':
      return plan.analytics_level === 'full';
    case 'api':
      return plan.api_access;
    default:
      return false;
  }
}

/**
 * Returns the commission rate for a partner based on their subscription.
 * Falls back to 10% (platform default) if no active subscription.
 */
export async function getCommissionRate(partnerId: string): Promise<number> {
  if (!supabaseAdmin) return 10;

  const sub = await getPartnerSubscription(partnerId);

  if (!isSubscriptionActive(sub)) return 10;

  return sub!.plan.commission_pct;
}
