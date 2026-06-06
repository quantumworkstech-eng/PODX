-- Partner lead generation submissions
CREATE TABLE IF NOT EXISTS partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  studio_type TEXT NOT NULL,
  city TEXT NOT NULL,
  operational_age TEXT NOT NULL,
  weekly_slots TEXT NOT NULL,
  monthly_bookings TEXT NOT NULL,
  pricing TEXT NOT NULL,
  equipment TEXT[] NOT NULL DEFAULT '{}',
  biggest_challenge TEXT NOT NULL,
  listed_platform TEXT NOT NULL,
  join_reason TEXT NOT NULL,
  studio_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  website_or_instagram TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'lead_generation_static_page'
);

CREATE INDEX IF NOT EXISTS idx_partner_leads_created_at ON partner_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_leads_city ON partner_leads(city);
CREATE INDEX IF NOT EXISTS idx_partner_leads_biggest_challenge ON partner_leads(biggest_challenge);
