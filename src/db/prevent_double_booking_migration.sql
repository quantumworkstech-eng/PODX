-- Migration: Prevent double-booking via a PostgreSQL exclusion constraint
-- Requires the btree_gist extension (available by default in Supabase/PostgreSQL 9.6+)
-- Run this once in the Supabase SQL Editor

-- Enable the btree_gist extension needed for the exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint so two non-cancelled bookings for the same studio
-- cannot have overlapping time ranges.
-- If a booking has status = 'cancelled' it is excluded from the constraint.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    studio_id   WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status <> 'cancelled');
