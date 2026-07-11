-- ==========================================
-- studio_addons — per-studio add-on configuration
-- Run this in your Supabase SQL editor
-- ==========================================

CREATE TABLE IF NOT EXISTS studio_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  addon_id  UUID NOT NULL REFERENCES platform_addons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(studio_id, addon_id)
);

-- Enable RLS
ALTER TABLE studio_addons ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on studio_addons"
  ON studio_addons FOR ALL USING (true);

-- Public can read studio add-on associations
CREATE POLICY "Public read studio_addons"
  ON studio_addons FOR SELECT USING (true);
