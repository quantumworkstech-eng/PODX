-- ============================================================
-- PodX Partner Subscription Model Migration
-- Adds subscription plans, partner subscriptions, and payment tracking
-- ============================================================

-- ============================================================
-- 1. SUBSCRIPTION PLANS (Tier Configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'annual')),
    price NUMERIC(10, 2) NOT NULL,              -- in INR (not paise)
    max_studios INTEGER,                         -- NULL = unlimited
    commission_pct NUMERIC(5, 2) NOT NULL,       -- platform commission %
    whitelabel_enabled BOOLEAN DEFAULT FALSE,
    analytics_level TEXT DEFAULT 'basic'
        CHECK (analytics_level IN ('basic', 'full')),
    api_access BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '{}',                 -- extensibility
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tier, billing_cycle)
);

-- ============================================================
-- 2. PARTNER SUBSCRIPTIONS (Active Subscription per Partner)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'grace_period', 'expired', 'cancelled')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_end TIMESTAMP WITH TIME ZONE,   -- current_period_end + 7 days
    billing_cycle TEXT NOT NULL
        CHECK (billing_cycle IN ('monthly', 'annual')),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_partner_id
    ON partner_subscriptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_status
    ON partner_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_period_end
    ON partner_subscriptions(current_period_end);

-- ============================================================
-- 3. SUBSCRIPTION PAYMENTS (Per-Payment History)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES partner_subscriptions(id),
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    billing_cycle TEXT NOT NULL
        CHECK (billing_cycle IN ('monthly', 'annual')),
    plan_id UUID REFERENCES subscription_plans(id),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_partner_id
    ON subscription_payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_order_id
    ON subscription_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status
    ON subscription_payments(status);

-- ============================================================
-- 4. SEED SUBSCRIPTION PLANS (6 variants: 3 tiers × 2 cycles)
-- Annual = monthly × 10 (≈17% discount)
-- ============================================================

INSERT INTO subscription_plans
    (name, tier, billing_cycle, price, max_studios, commission_pct,
     whitelabel_enabled, analytics_level, api_access)
VALUES
    ('Basic Monthly',       'basic',      'monthly', 1999,   2,    10.00, FALSE, 'basic', FALSE),
    ('Basic Annual',        'basic',      'annual',  19990,  2,    10.00, FALSE, 'basic', FALSE),
    ('Pro Monthly',         'pro',        'monthly', 4999,   10,   8.00,  TRUE,  'full',  FALSE),
    ('Pro Annual',          'pro',        'annual',  49990,  10,   8.00,  TRUE,  'full',  FALSE),
    ('Enterprise Monthly',  'enterprise', 'monthly', 12999,  NULL, 5.00,  TRUE,  'full',  TRUE),
    ('Enterprise Annual',   'enterprise', 'annual',  129990, NULL, 5.00,  TRUE,  'full',  TRUE)
ON CONFLICT (tier, billing_cycle) DO NOTHING;

-- ============================================================
-- 5. ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE subscription_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments     ENABLE ROW LEVEL SECURITY;

-- Plans: publicly readable (active only)
CREATE POLICY sub_plans_public_read ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- Subscriptions: partner sees only their own row
CREATE POLICY partner_sub_select ON partner_subscriptions
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_sub_insert ON partner_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_sub_update ON partner_subscriptions
    FOR UPDATE USING (auth.uid() = partner_id);

-- Subscription payments: partner sees only their own
CREATE POLICY partner_sub_payments_select ON subscription_payments
    FOR SELECT USING (auth.uid() = partner_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_subscriptions_updated_at
    BEFORE UPDATE ON partner_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. AUTO-HIDE STUDIOS ON SUBSCRIPTION EXPIRY
-- When a subscription transitions to 'expired', mark all
-- studios owned by that partner as inactive (hidden from marketplace)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes TO 'expired'
    IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
        UPDATE studios
        SET is_active = FALSE
        WHERE owner_id = NEW.partner_id
          AND is_active = TRUE;
    END IF;

    -- When status changes FROM 'expired' back to 'active' (re-subscription)
    -- Do NOT auto-reactivate studios — admin must review & re-approve
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_expiry
    AFTER UPDATE OF status ON partner_subscriptions
    FOR EACH ROW
    WHEN (NEW.status = 'expired' AND OLD.status != 'expired')
    EXECUTE FUNCTION handle_subscription_expiry();
