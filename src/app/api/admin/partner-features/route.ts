import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import {
  getAllFeaturesWithPartnerAccess,
  setPartnerFeature,
  setPartnerFeatures,
  resetPartnerFeatures,
} from '@/lib/feature-access';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/partner-features?partner_id=<uuid>
export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const partnerId = request.nextUrl.searchParams.get('partner_id');
  if (!partnerId) {
    return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
  }

  const features = await getAllFeaturesWithPartnerAccess(partnerId);
  return NextResponse.json({ features });
}

// PATCH /api/admin/partner-features
// Body options:
//   { partner_id, feature_key, is_enabled }          — single toggle
//   { partner_id, features: [{ feature_key, is_enabled }] } — bulk update
//   { partner_id, reset: true }                        — reset to defaults
export async function PATCH(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { partner_id, feature_key, is_enabled, features, reset } = body as {
    partner_id?: string;
    feature_key?: string;
    is_enabled?: boolean;
    features?: { feature_key: string; is_enabled: boolean }[];
    reset?: boolean;
  };

  if (!partner_id) {
    return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
  }

  // Verify partner exists
  if (supabaseAdmin) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', partner_id)
      .maybeSingle();
    if (!user) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
  }

  if (reset) {
    await resetPartnerFeatures(partner_id);
    await logAdminAction(adminEmail, 'reset_features', 'partner', partner_id);
    return NextResponse.json({ success: true, action: 'reset' });
  }

  if (features && Array.isArray(features)) {
    await setPartnerFeatures(partner_id, features);
    await logAdminAction(adminEmail, 'bulk_update_features', 'partner', partner_id, {
      count: features.length,
    });
    return NextResponse.json({ success: true, action: 'bulk_update', count: features.length });
  }

  if (feature_key !== undefined && is_enabled !== undefined) {
    await setPartnerFeature(partner_id, feature_key, is_enabled);
    await logAdminAction(adminEmail, 'toggle_feature', 'partner', partner_id, {
      feature_key,
      is_enabled,
    });
    return NextResponse.json({ success: true, action: 'toggle', feature_key, is_enabled });
  }

  return NextResponse.json(
    { error: 'Provide feature_key + is_enabled, or features array, or reset: true' },
    { status: 400 }
  );
}
