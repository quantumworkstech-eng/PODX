-- Migration: Add video_url to platform and partner add-ons
-- Run this in the Supabase SQL editor.
--
-- A pasted video URL (YouTube, Vimeo, Google Drive or a direct .mp4/.webm file)
-- plays automatically when a customer hovers the add-on card in the booking flow.
-- The thumbnail image stays the resting state and the fallback.

ALTER TABLE platform_addons
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS video_url TEXT;
