-- Yanisa Studio: Reschedule cutoff per studio
-- Run this migration in your Supabase SQL editor

-- Add reschedule_cutoff_hours to studios table
-- Default: 48 hours (must reschedule at least 48h before session)
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS reschedule_cutoff_hours INTEGER NOT NULL DEFAULT 48;

-- Ensure cancellation_policies table exists with correct columns
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL,       -- cancel X+ hours before → this refund %
  refund_percentage INTEGER NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_policies_studio ON cancellation_policies(studio_id);

-- Seed default platform policy (applies when studio has no custom rules)
-- These are just reference rows; the app uses them as fallback when studio has none.
-- DO NOT insert here — let the app logic handle defaults.
