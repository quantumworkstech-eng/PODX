-- Platform Add-ons Fields Migration
-- Run this in your Supabase SQL editor

-- Add addon_type and thumbnail_url columns to platform_addons
ALTER TABLE platform_addons
  ADD COLUMN IF NOT EXISTS addon_type TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
