import { supabaseAdmin } from '@/lib/supabase';
import type { Feature, PartnerFeatureMap } from '@/types/database';

/**
 * Returns a map of feature_key → is_enabled for a given partner.
 * Partner-specific overrides take precedence over feature defaults.
 * Falls back to allowing all features if DB is unavailable (dev safety).
 */
export async function getPartnerFeatureMap(
  partnerId: string
): Promise<PartnerFeatureMap> {
  if (!supabaseAdmin) return {};

  const [featuresResult, accessResult] = await Promise.all([
    supabaseAdmin.from('features').select('feature_key, is_default_enabled'),
    supabaseAdmin
      .from('partner_feature_access')
      .select('feature_key, is_enabled')
      .eq('partner_id', partnerId),
  ]);

  const map: PartnerFeatureMap = {};

  for (const f of featuresResult.data ?? []) {
    map[f.feature_key] = f.is_default_enabled;
  }
  for (const pa of accessResult.data ?? []) {
    map[pa.feature_key] = pa.is_enabled;
  }

  return map;
}

/**
 * Returns true if a partner has access to a specific feature.
 * Checks partner-specific override first, then falls back to feature default.
 */
export async function isFeatureEnabled(
  partnerId: string,
  featureKey: string
): Promise<boolean> {
  if (!supabaseAdmin) return true;

  const { data: override } = await supabaseAdmin
    .from('partner_feature_access')
    .select('is_enabled')
    .eq('partner_id', partnerId)
    .eq('feature_key', featureKey)
    .maybeSingle();

  if (override !== null) return override.is_enabled;

  const { data: feature } = await supabaseAdmin
    .from('features')
    .select('is_default_enabled')
    .eq('feature_key', featureKey)
    .maybeSingle();

  return feature?.is_default_enabled ?? true;
}

/**
 * Upserts a partner's access to a single feature.
 */
export async function setPartnerFeature(
  partnerId: string,
  featureKey: string,
  isEnabled: boolean
): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin.from('partner_feature_access').upsert(
    {
      partner_id: partnerId,
      feature_key: featureKey,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id,feature_key' }
  );
}

/**
 * Bulk-upserts multiple feature access entries for a partner.
 */
export async function setPartnerFeatures(
  partnerId: string,
  features: { feature_key: string; is_enabled: boolean }[]
): Promise<void> {
  if (!supabaseAdmin || features.length === 0) return;

  const now = new Date().toISOString();
  await supabaseAdmin.from('partner_feature_access').upsert(
    features.map((f) => ({
      partner_id: partnerId,
      feature_key: f.feature_key,
      is_enabled: f.is_enabled,
      updated_at: now,
    })),
    { onConflict: 'partner_id,feature_key' }
  );
}

/**
 * Resets all partner feature access to the feature catalog defaults
 * by deleting all partner-specific overrides.
 */
export async function resetPartnerFeatures(partnerId: string): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from('partner_feature_access')
    .delete()
    .eq('partner_id', partnerId);
}

/**
 * Returns all features from the catalog with their current state for a partner.
 */
export async function getAllFeaturesWithPartnerAccess(
  partnerId: string
): Promise<(Feature & { is_enabled: boolean })[]> {
  if (!supabaseAdmin) return [];

  const [featuresResult, accessResult] = await Promise.all([
    supabaseAdmin
      .from('features')
      .select('*')
      .order('category')
      .order('feature_name'),
    supabaseAdmin
      .from('partner_feature_access')
      .select('feature_key, is_enabled')
      .eq('partner_id', partnerId),
  ]);

  const overrideMap: Record<string, boolean> = {};
  for (const pa of accessResult.data ?? []) {
    overrideMap[pa.feature_key] = pa.is_enabled;
  }

  return (featuresResult.data ?? []).map((f) => ({
    ...f,
    is_enabled:
      f.feature_key in overrideMap
        ? overrideMap[f.feature_key]
        : f.is_default_enabled,
  }));
}
