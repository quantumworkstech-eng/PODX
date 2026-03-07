-- Admin System Migration
-- Run this in your Supabase SQL editor

-- ==========================================
-- 1. PLATFORM ADD-ONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default add-ons
INSERT INTO platform_addons (name, description, price, category, is_active) VALUES
  ('Video Editing', 'Professional video editing for your podcast episode', 2500, 'post-production', true),
  ('Reels Creation', 'Create short-form social media reels from your content', 1500, 'social-media', true),
  ('Thumbnail Design', 'Custom thumbnail design for YouTube/podcast platforms', 800, 'design', true),
  ('Social Clips', 'Extract and edit highlight clips for social media', 1200, 'social-media', true),
  ('Transcription', 'Full episode transcription (per hour of audio)', 600, 'content', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. BOOKING RESCHEDULE REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS booking_reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_by_role TEXT CHECK (requested_by_role IN ('customer', 'partner', 'admin')) DEFAULT 'customer',
  old_date DATE,
  old_start_time TEXT,
  old_end_time TEXT,
  new_date DATE,
  new_start_time TEXT,
  new_end_time TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. ADMIN AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- ==========================================
-- 4. ADMINS TABLE (for admin management)
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  added_by_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. PLATFORM SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_email TEXT
);

-- Seed default settings
INSERT INTO platform_settings (key, value, category) VALUES
  ('platform_commission_percent', '10', 'payments'),
  ('gst_percent', '18', 'payments'),
  ('default_currency', 'INR', 'general'),
  ('default_language', 'en', 'general'),
  ('min_booking_hours', '1', 'bookings'),
  ('max_booking_hours', '8', 'bookings'),
  ('cancellation_full_refund_hours', '48', 'bookings'),
  ('cancellation_partial_refund_hours', '24', 'bookings'),
  ('cancellation_partial_refund_percent', '50', 'bookings'),
  ('maintenance_mode', 'false', 'system'),
  ('partner_min_payout', '1000', 'payments')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 6. RLS POLICIES
-- ==========================================
ALTER TABLE platform_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by admin panel via supabaseAdmin)
CREATE POLICY "Service role full access on platform_addons"
  ON platform_addons FOR ALL USING (true);

CREATE POLICY "Service role full access on booking_reschedule_requests"
  ON booking_reschedule_requests FOR ALL USING (true);

CREATE POLICY "Service role full access on admin_audit_logs"
  ON admin_audit_logs FOR ALL USING (true);

CREATE POLICY "Service role full access on admins"
  ON admins FOR ALL USING (true);

CREATE POLICY "Service role full access on platform_settings"
  ON platform_settings FOR ALL USING (true);

-- Public can read active add-ons
CREATE POLICY "Public read active addons"
  ON platform_addons FOR SELECT USING (is_active = true);
