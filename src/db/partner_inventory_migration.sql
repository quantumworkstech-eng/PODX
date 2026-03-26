-- Partner reusable inventory: equipment (model + qty), services, add-ons
-- Run in Supabase SQL editor after reviewing.

-- ── Equipment catalog (per partner) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory TEXT NOT NULL CHECK (subcategory IN ('camera', 'mic', 'light', 'accessory')),
  model_name TEXT NOT NULL,
  default_quantity INTEGER NOT NULL DEFAULT 1 CHECK (default_quantity >= 1),
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_equipment_items_partner
  ON partner_equipment_items(partner_id);

-- Per-studio quantity override for catalog items
CREATE TABLE IF NOT EXISTS studio_partner_equipment (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  equipment_item_id UUID NOT NULL REFERENCES partner_equipment_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  PRIMARY KEY (studio_id, equipment_item_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_partner_equipment_studio ON studio_partner_equipment(studio_id);

-- ── Services catalog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory TEXT NOT NULL CHECK (subcategory IN ('editing', 'production', 'content_services')),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2),
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_service_items_partner ON partner_service_items(partner_id);

CREATE TABLE IF NOT EXISTS studio_partner_services (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  service_item_id UUID NOT NULL REFERENCES partner_service_items(id) ON DELETE CASCADE,
  PRIMARY KEY (studio_id, service_item_id)
);

-- ── Partner add-ons (studio / service / outsource) ────────────────────────────
CREATE TABLE IF NOT EXISTS partner_addon_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addon_kind TEXT NOT NULL CHECK (addon_kind IN ('studio', 'service', 'outsource')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_addon_items_partner ON partner_addon_items(partner_id);

CREATE TABLE IF NOT EXISTS studio_partner_addon_items (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  partner_addon_id UUID NOT NULL REFERENCES partner_addon_items(id) ON DELETE CASCADE,
  enabled_for_booking BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (studio_id, partner_addon_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_partner_addon_studio ON studio_partner_addon_items(studio_id);

-- RLS (service role used by Next.js APIs — mirror other partner tables)
ALTER TABLE partner_equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_addon_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_addon_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_partner_equipment_items" ON partner_equipment_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_equipment" ON studio_partner_equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_partner_service_items" ON partner_service_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_services" ON studio_partner_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_partner_addon_items" ON partner_addon_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_addon_items" ON studio_partner_addon_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_studio_partner_equipment" ON studio_partner_equipment FOR SELECT USING (true);
CREATE POLICY "public_read_studio_partner_services" ON studio_partner_services FOR SELECT USING (true);
CREATE POLICY "public_read_partner_addon_items" ON partner_addon_items FOR SELECT USING (true);
CREATE POLICY "public_read_studio_partner_addon_items" ON studio_partner_addon_items FOR SELECT USING (true);
