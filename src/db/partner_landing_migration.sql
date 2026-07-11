-- ============================================================
-- PodX Partner Landing Page Builder Migration
-- Creates tables for section-based landing pages per partner
-- Run this in your Supabase SQL editor
-- ============================================================

-- Landing page record (one per partner) — stores status + SEO metadata
CREATE TABLE IF NOT EXISTS partner_landing_pages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'published')),
  meta_title       TEXT,
  meta_description TEXT,
  og_image_url     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- Individual sections that make up the landing page
CREATE TABLE IF NOT EXISTS partner_landing_sections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL
                             CHECK (type IN (
                               'hero', 'studios', 'features', 'reviews',
                               'about', 'cta', 'contact', 'footer', 'custom'
                             )),
  order_index  INTEGER     NOT NULL DEFAULT 0,
  content_json JSONB       NOT NULL DEFAULT '{}',
  is_visible   BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_landing_sections_order
  ON partner_landing_sections(partner_id, order_index);

-- Section impression tracking (conversion analytics)
CREATE TABLE IF NOT EXISTS partner_section_impressions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id   UUID        REFERENCES partner_landing_sections(id) ON DELETE SET NULL,
  section_type TEXT        NOT NULL,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_impressions_partner
  ON partner_section_impressions(partner_id, viewed_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE partner_landing_pages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_landing_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_section_impressions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by Next.js API routes via supabaseAdmin)
CREATE POLICY "Service role full access on partner_landing_pages"
  ON partner_landing_pages FOR ALL USING (true);

CREATE POLICY "Service role full access on partner_landing_sections"
  ON partner_landing_sections FOR ALL USING (true);

CREATE POLICY "Service role full access on partner_section_impressions"
  ON partner_section_impressions FOR ALL USING (true);

-- Public can read published landing pages and their sections
CREATE POLICY "Public read published landing pages"
  ON partner_landing_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read landing sections"
  ON partner_landing_sections FOR SELECT
  USING (is_visible = true);

-- Public can insert impressions (anonymous analytics)
CREATE POLICY "Public insert impressions"
  ON partner_section_impressions FOR INSERT
  WITH CHECK (true);

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_landing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partner_landing_pages_updated_at
  BEFORE UPDATE ON partner_landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER trg_partner_landing_sections_updated_at
  BEFORE UPDATE ON partner_landing_sections
  FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();
