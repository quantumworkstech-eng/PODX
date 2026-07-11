-- Migration: Add admin-created booking tracking
-- Run this in your Supabase SQL editor
--
-- Fixes admin "Add Booking" errors when API writes `created_by_admin`.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

