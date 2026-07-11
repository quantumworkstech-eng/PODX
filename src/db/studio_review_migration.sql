-- Migration: Add review_status to studios table
-- Run this in Supabase SQL editor

ALTER TABLE studios
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending_review'
CHECK (review_status IN ('pending_review', 'approved', 'rejected'));

-- Update existing active studios to approved
UPDATE studios SET review_status = 'approved' WHERE is_active = TRUE;

-- Also add business_name to profiles if not exists (used by partner profile)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add role column to users table if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
