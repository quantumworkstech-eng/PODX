-- ============================================================
-- PodX Feature Access Control System Migration
-- Creates features catalog + per-partner feature access tables
-- Run this AFTER base schema.sql
-- ============================================================

-- Master features catalog
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_default_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-partner feature access overrides
CREATE TABLE IF NOT EXISTS partner_feature_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES features(feature_key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_id, feature_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_feature_access_partner ON partner_feature_access(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_feature_access_key ON partner_feature_access(feature_key);

-- Seed default feature catalog
INSERT INTO features (feature_key, feature_name, description, category, is_default_enabled) VALUES
  ('studio_create',       'Create Studio',          'Allow partner to create new studios',                    'studio',       true),
  ('studio_edit',         'Edit Studio',            'Allow partner to edit existing studios',                 'studio',       true),
  ('booking_management',  'Booking Management',     'View and manage all bookings',                           'booking',      true),
  ('client_management',   'Client Management',      'View and manage clients list',                           'booking',      true),
  ('coupon_management',   'Coupon Management',       'Create and manage discount coupons',                     'booking',      true),
  ('policies_management', 'Policies Management',    'Set cancellation and rescheduling policies',             'booking',      true),
  ('analytics_access',    'Analytics',              'Access the analytics dashboard',                         'analytics',    true),
  ('addons_management',   'Add-ons Management',     'Create and manage studio add-ons and equipment',         'studio',       true),
  ('reviews_management',  'Reviews Management',     'View and respond to customer reviews',                   'studio',       true),
  ('landing_builder',     'Landing Page Builder',   'Build and publish a custom partner landing page',        'branding',     true),
  ('white_label',         'White Label Branding',   'Custom branding, colors, and logo on the partner page',  'branding',     false),
  ('custom_domain',       'Custom Domain',          'Use a custom domain for the partner page',               'branding',     false),
  ('calendar_integration','Calendar Integration',   'Sync bookings with Google Calendar',                     'integrations', true),
  ('payout_access',       'Earnings & Payouts',     'View earnings reports and manage payout settings',       'earnings',     true),
  ('billing_access',      'Billing & Plans',        'Access subscription billing and plan management',        'billing',      true)
ON CONFLICT (feature_key) DO NOTHING;
