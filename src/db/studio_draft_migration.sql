-- Migration: Add 'draft' to review_status CHECK so studios can be saved as drafts
-- Run this in Supabase SQL editor

-- Drop the existing CHECK constraint (Postgres generates the name from the column)
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_review_status_check;

-- Re-add with 'draft' included
ALTER TABLE studios
ADD CONSTRAINT studios_review_status_check
CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected'));

-- Existing rows are fine (they're all 'pending_review' or 'approved')
