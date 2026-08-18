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
 * Studios a partner may list before any subscription is required. The first
 * listing is free — partners get onto the marketplace and start earning before
 * they pay — and it is the second studio that triggers the paywall.
 */
export const FREE_STUDIO_ALLOWANCE = 1;

/**
 * review_status values that don't occupy a listing slot. Drafts are private and
 * never reach the marketplace; 'deleted' marks a soft-deleted row. Neither should
 * burn a partner's free studio.
 */
const UNLISTED_REVIEW_STATUSES = new Set(['draft', 'deleted']);

export function isUnlistedReviewStatus(reviewStatus: string | null | undefined): boolean {
  return UNLISTED_REVIEW_STATUSES.has(reviewStatus ?? '');
}

/**
 * How many studios a partner has actually put on the marketplace. Counted in JS
 * rather than with a `not.in` filter so a NULL review_status counts as listed
 * instead of silently vanishing from the total.
 */
export async function countListedStudios(partnerId: string): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { data } = await supabaseAdmin
    .from('studios')
    .select('review_status')
    .eq('owner_id', partnerId);

  return (data ?? []).filter(
    (s) => !isUnlistedReviewStatus((s as { review_status?: string | null }).review_status)
  ).length;
}

export interface StudioLimitCheck {
  allowed: boolean;
  /** Studios already listed (drafts and deleted rows excluded). */
  current: number;
  /** Ceiling that applies right now: the free allowance, or the plan's limit. */
  max: number | null;
  /** Why a blocked partner is blocked — drives the message they are shown. */
  reason: 'free_allowance' | 'plan_limit' | null;
  /** True while the partner is listing on the free allowance rather than a plan. */
  onFreeAllowance: boolean;
}

/**
 * Checks whether a partner may list another studio.
 *
 * Without a subscription they get FREE_STUDIO_ALLOWANCE listings; beyond that a
 * plan is required, and the plan's own max_studios then applies.
 */
export async function checkStudioLimit(partnerId: string): Promise<StudioLimitCheck> {
  if (!supabaseAdmin) {
    return { allowed: true, current: 0, max: null, reason: null, onFreeAllowance: false };
  }

  const [current, sub] = await Promise.all([
    countListedStudios(partnerId),
    getPartnerSubscription(partnerId),
  ]);

  // No active plan — the free allowance is the only thing standing in for one.
  if (!isSubscriptionActive(sub)) {
    const allowed = current < FREE_STUDIO_ALLOWANCE;
    return {
      allowed,
      current,
      max: FREE_STUDIO_ALLOWANCE,
      reason: allowed ? null : 'free_allowance',
      onFreeAllowance: true,
    };
  }

  const max = sub!.plan.max_studios;

  // Unlimited studios (enterprise)
  if (max === null) {
    return { allowed: true, current, max: null, reason: null, onFreeAllowance: false };
  }

  const allowed = current < max;
  return { allowed, current, max, reason: allowed ? null : 'plan_limit', onFreeAllowance: false };
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
