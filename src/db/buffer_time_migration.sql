-- ============================================================
-- PodX Buffer Time Migration
-- Adds per-studio buffer time (cleanup/prep time after bookings)
-- ============================================================

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (buffer_minutes >= 0);

COMMENT ON COLUMN studios.buffer_minutes IS
  'Minutes of buffer added after each booking for cleanup/prep. '
  'These slots are blocked for new bookings but not shown to clients.';
