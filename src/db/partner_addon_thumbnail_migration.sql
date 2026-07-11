-- Migration: Add thumbnail/type/category/quantity to partner_addon_items
-- Run this in Supabase SQL editor

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('equipment', 'service')) DEFAULT 'service';

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS addon_type TEXT;

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS quantity INTEGER
  NOT NULL DEFAULT 1 CHECK (quantity >= 1);

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

