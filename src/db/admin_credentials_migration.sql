-- Admin credentials table
-- Manually insert admin emails here; password_hash is null until first login
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- NULL until admin sets password on first login
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: insert an admin email (admin sets their password on first visit)
-- INSERT INTO admin_credentials (email) VALUES ('your-admin@example.com');
