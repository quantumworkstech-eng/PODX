-- Migration: Expand `studios.review_status` allowed values
-- Run this in Supabase SQL editor
--
-- Needed for admin actions like "pause" and "suspend" and for filtering by status.
-- `paused` / `suspended` keep the studio hidden from booking (is_active=false).
--
-- This migration is safe to run multiple times.

-- Drop existing CHECK constraint (name used in prior migrations)
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_review_status_check;

-- Re-add with additional statuses
ALTER TABLE studios
ADD CONSTRAINT studios_review_status_check
CHECK (
  review_status IN (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'paused',
    'suspended',
    'deleted'
  )
);

