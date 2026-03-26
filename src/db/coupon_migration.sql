-- ============================================================
-- PodX Coupon / Promo Code Migration
-- ============================================================
-- Apply once to your database (required for partner coupons):
--   • Supabase: SQL Editor → paste this file → Run
--   • Or: DATABASE_URL=... npm run db:migrate-coupons (use direct port 5432 URI for DDL)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,  -- NULL = all partner studios

    code TEXT NOT NULL,
    description TEXT,

    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),

    -- Guard rails
    min_booking_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),   -- cap for percentage discounts (NULL = no cap)

    -- Usage limits
    max_uses INTEGER,                     -- NULL = unlimited
    uses_count INTEGER DEFAULT 0,

    -- Validity window
    valid_from  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,  -- NULL = no expiry

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id, code)
);

CREATE INDEX IF NOT EXISTS idx_partner_coupons_partner_id ON partner_coupons(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_code      ON partner_coupons(code);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_studio_id ON partner_coupons(studio_id);

-- Store coupon info on the booking (in notes JSON is fine; but add explicit columns too)
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS coupon_code      TEXT,
    ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10, 2) DEFAULT 0;

-- Track which coupon was used per booking (for usage counting + audit)
CREATE TABLE IF NOT EXISTS coupon_uses (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id  UUID REFERENCES partner_coupons(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id)   ON DELETE SET NULL,
    discount_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id)
);

-- updated_at trigger (idempotent for re-runs)
DROP TRIGGER IF EXISTS update_partner_coupons_updated_at ON partner_coupons;
CREATE TRIGGER update_partner_coupons_updated_at
    BEFORE UPDATE ON partner_coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
