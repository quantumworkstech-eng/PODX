-- Migration: Create studio_packages table for custom per-studio booking packages
-- Run this once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS studio_packages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  price_per_hour  INTEGER NOT NULL DEFAULT 0,
  features    JSONB       NOT NULL DEFAULT '[]',
  is_popular  BOOLEAN     NOT NULL DEFAULT false,
  display_order INTEGER   NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studio_packages_studio_id_idx ON studio_packages (studio_id, display_order);
