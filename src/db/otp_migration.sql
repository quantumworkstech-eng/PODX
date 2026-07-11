-- Migration: OTP-based email authentication
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verification_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email, used);
CREATE INDEX IF NOT EXISTS idx_email_otps_token ON email_otps(verification_token) WHERE verification_token IS NOT NULL;

-- Clean up expired OTPs automatically (optional, Supabase supports pg_cron)
-- SELECT cron.schedule('delete-expired-otps', '0 * * * *', 'DELETE FROM email_otps WHERE expires_at < NOW()');

-- Allow auth_provider to be 'email' for OTP users
-- (password_hash will be NULL for OTP users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
