-- Add guest_phone column to booking_guests table
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS guest_phone TEXT;
