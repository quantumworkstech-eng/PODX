-- ============================================================
-- PodX Landing Page CMS Migration
-- Generic, multi-page section/content CMS used by the admin
-- "Landing Pages" area (client landing page + partner landing page).
-- Run this in your Supabase SQL editor.
-- ============================================================

-- One row per managed landing page (slug = 'home', 'partners', ...)
CREATE TABLE IF NOT EXISTS cms_pages (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT        NOT NULL UNIQUE,
  title                   TEXT        NOT NULL,
  status                  TEXT        NOT NULL DEFAULT 'draft'
                                        CHECK (status IN ('draft', 'published')),
  -- SEO / social metadata
  seo_title               TEXT,
  meta_description        TEXT,
  og_title                TEXT,
  og_description          TEXT,
  og_image_url            TEXT,
  canonical_url           TEXT,
  -- Publishing state
  published_at            TIMESTAMPTZ,
  published_by            TEXT,
  has_unpublished_changes BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Draft sections that make up a page. Publishing snapshots these into cms_page_versions.
CREATE TABLE IF NOT EXISTS cms_sections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID        NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  order_index INTEGER     NOT NULL DEFAULT 0,
  is_visible  BOOLEAN     NOT NULL DEFAULT true,
  content     JSONB       NOT NULL DEFAULT '{}',
  settings    JSONB       NOT NULL DEFAULT '{}',
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_sections_page_order
  ON cms_sections(page_id, order_index)
  WHERE deleted_at IS NULL;

-- Repeatable content inside a section. group_key allows a section to own more than
-- one independently ordered list (e.g. calculator rows + summary rows).
CREATE TABLE IF NOT EXISTS cms_section_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID        NOT NULL REFERENCES cms_sections(id) ON DELETE CASCADE,
  group_key   TEXT        NOT NULL DEFAULT 'items',
  order_index INTEGER     NOT NULL DEFAULT 0,
  is_visible  BOOLEAN     NOT NULL DEFAULT true,
  data        JSONB       NOT NULL DEFAULT '{}',
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_section_items_order
  ON cms_section_items(section_id, group_key, order_index)
  WHERE deleted_at IS NULL;

-- Immutable published snapshots. The public site only ever reads the latest row.
CREATE TABLE IF NOT EXISTS cms_page_versions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID        NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  version      INTEGER     NOT NULL,
  snapshot     JSONB       NOT NULL,
  published_by TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_cms_page_versions_latest
  ON cms_page_versions(page_id, version DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- All writes go through Next.js API routes using the service role key, which
-- bypasses RLS. Anon clients get read-only access to published content only.

ALTER TABLE cms_pages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_page_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_pages' AND policyname = 'Public read published cms pages') THEN
    CREATE POLICY "Public read published cms pages"
      ON cms_pages FOR SELECT USING (status = 'published');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_page_versions' AND policyname = 'Public read cms page versions') THEN
    CREATE POLICY "Public read cms page versions"
      ON cms_page_versions FOR SELECT USING (true);
  END IF;
END $$;

-- ── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cms_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cms_pages_updated_at ON cms_pages;
CREATE TRIGGER trg_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW EXECUTE FUNCTION cms_set_updated_at();

DROP TRIGGER IF EXISTS trg_cms_sections_updated_at ON cms_sections;
CREATE TRIGGER trg_cms_sections_updated_at
  BEFORE UPDATE ON cms_sections
  FOR EACH ROW EXECUTE FUNCTION cms_set_updated_at();

DROP TRIGGER IF EXISTS trg_cms_section_items_updated_at ON cms_section_items;
CREATE TRIGGER trg_cms_section_items_updated_at
  BEFORE UPDATE ON cms_section_items
  FOR EACH ROW EXECUTE FUNCTION cms_set_updated_at();

-- Page rows and their default sections are provisioned automatically the first
-- time an admin opens Landing Pages (see src/lib/cms/seeds).
