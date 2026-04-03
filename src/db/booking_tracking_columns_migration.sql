-- Migration: Add booking tracking columns required by the booking API
-- These columns are also added by whitelabel_migration.sql, but this file
-- can be run independently if the full whitelabel migration hasn't been applied.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'marketplace',
    ADD COLUMN IF NOT EXISTS whitelabel_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);
