-- ============================================================
-- PodX White-Label SaaS Migration
-- Adds partner branding, payout, client portal, and invoice tables
-- ============================================================

-- ============================================================
-- 1. PARTNER BRANDING (White-Label Configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    brand_name TEXT,
    partner_slug TEXT UNIQUE,               -- used in /p/{slug} paths
    logo_url TEXT,
    favicon_url TEXT,
    tagline TEXT,

    -- Colors
    primary_color TEXT DEFAULT '#D9FC67',
    secondary_color TEXT DEFAULT '#09090b',
    accent_color TEXT DEFAULT '#ffffff',
    background_color TEXT DEFAULT '#09090b',
    text_color TEXT DEFAULT '#ffffff',
    button_text_color TEXT DEFAULT '#000000',

    -- Typography
    font_family TEXT DEFAULT 'Inter',

    -- Booking page content
    booking_page_title TEXT,
    booking_page_description TEXT,

    -- Social links
    website_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    youtube_url TEXT,

    -- Contact details
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,

    -- Email branding
    email_sender_name TEXT,
    email_sender_address TEXT,
    email_footer_text TEXT,

    -- Domain configuration
    subdomain TEXT UNIQUE,                  -- subdomain.podx.com
    custom_domain TEXT UNIQUE,              -- booking.partnerdomain.com
    domain_verified BOOLEAN DEFAULT FALSE,
    domain_verification_token TEXT,
    domain_verified_at TIMESTAMP WITH TIME ZONE,

    -- URL mode: slug | subdomain | custom_domain
    url_mode TEXT DEFAULT 'slug' CHECK (url_mode IN ('slug', 'subdomain', 'custom_domain')),

    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    is_whitelabel_enabled BOOLEAN DEFAULT FALSE,

    -- Admin overrides
    admin_disabled BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_branding_partner_id ON partner_branding(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_branding_slug ON partner_branding(partner_slug);
CREATE INDEX IF NOT EXISTS idx_partner_branding_subdomain ON partner_branding(subdomain);
CREATE INDEX IF NOT EXISTS idx_partner_branding_custom_domain ON partner_branding(custom_domain);

-- ============================================================
-- 2. PARTNER EARNINGS (Per-Booking Commission Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

    booking_amount NUMERIC(10, 2) NOT NULL,
    platform_fee_pct NUMERIC(5, 2) DEFAULT 10.00,   -- % taken by platform
    platform_fee NUMERIC(10, 2) NOT NULL,
    partner_amount NUMERIC(10, 2) NOT NULL,

    -- Payout lifecycle
    payout_status TEXT DEFAULT 'pending'
        CHECK (payout_status IN ('pending', 'processing', 'paid', 'on_hold', 'cancelled')),
    payout_date TIMESTAMP WITH TIME ZONE,
    payout_reference TEXT,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner_id ON partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_booking_id ON partner_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(payout_status);

-- ============================================================
-- 3. PARTNER PAYOUT HISTORY (Batch Payout Records)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_payout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Batch summary
    payout_amount NUMERIC(10, 2) NOT NULL,
    booking_count INTEGER DEFAULT 0,
    period_start DATE,
    period_end DATE,

    -- Bank / UPI details snapshot at time of payout
    bank_account TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    payment_method TEXT DEFAULT 'bank_transfer',   -- bank_transfer | upi | cheque

    -- Status
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    initiated_by TEXT,                    -- admin email who triggered payout
    processed_at TIMESTAMP WITH TIME ZONE,
    reference_number TEXT,
    failure_reason TEXT,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_history_partner_id ON partner_payout_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_status ON partner_payout_history(status);

-- ============================================================
-- 4. PARTNER CLIENTS (Customer–Partner Relationship)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Client profile snapshot (for display without joining)
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_company TEXT,

    -- Relationship data
    first_booking_at TIMESTAMP WITH TIME ZONE,
    last_booking_at TIMESTAMP WITH TIME ZONE,
    total_bookings INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,

    -- Source
    source TEXT DEFAULT 'whitelabel'       -- whitelabel | direct | referral
        CHECK (source IN ('whitelabel', 'direct', 'referral', 'manual')),

    notes TEXT,
    tags TEXT[],                           -- partner-defined tags
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_clients_partner_id ON partner_clients(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_clients_user_id ON partner_clients(user_id);

-- ============================================================
-- 5. PARTNER INVOICES (White-Label Branded Invoices)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES partner_clients(id),

    invoice_number TEXT UNIQUE NOT NULL,   -- WL-2025-00001
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Line items snapshot
    studio_name TEXT,
    session_date DATE,
    duration_hours NUMERIC(4, 2),
    base_amount NUMERIC(10, 2) NOT NULL,
    addon_amount NUMERIC(10, 2) DEFAULT 0,
    package_amount NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,

    -- Branding snapshot at invoice time
    brand_name TEXT,
    brand_logo_url TEXT,
    brand_address TEXT,
    brand_email TEXT,
    brand_phone TEXT,

    -- Client snapshot
    client_name TEXT,
    client_email TEXT,
    client_address TEXT,

    status TEXT DEFAULT 'issued'
        CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_invoices_partner_id ON partner_invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_booking_id ON partner_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_client_id ON partner_invoices(client_id);

-- ============================================================
-- 6. EXTEND BOOKINGS TABLE (White-Label Tracking)
-- ============================================================

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'marketplace'
        CHECK (booking_source IN ('marketplace', 'whitelabel', 'partner_direct', 'api')),
    ADD COLUMN IF NOT EXISTS whitelabel_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);

-- ============================================================
-- 7. PLATFORM COMMISSION CONFIG (extend platform_settings)
-- ============================================================

-- Ensure platform_settings has commission field (already defined in admin_system_migration.sql,
-- but added here for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='platform_settings' AND column_name='whitelabel_enabled'
    ) THEN
        ALTER TABLE platform_settings
            ADD COLUMN whitelabel_enabled BOOLEAN DEFAULT TRUE,
            ADD COLUMN default_commission_pct NUMERIC(5, 2) DEFAULT 10.00,
            ADD COLUMN whitelabel_fee_pct NUMERIC(5, 2) DEFAULT 5.00;
    END IF;
END $$;

-- ============================================================
-- 8. ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE partner_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invoices ENABLE ROW LEVEL SECURITY;

-- partner_branding: partners see their own row; public can read published rows by slug
CREATE POLICY partner_branding_partner_select ON partner_branding
    FOR SELECT USING (
        auth.uid() = partner_id
        OR is_published = TRUE
    );

CREATE POLICY partner_branding_partner_insert ON partner_branding
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_branding_partner_update ON partner_branding
    FOR UPDATE USING (auth.uid() = partner_id);

-- partner_earnings: partner sees their own
CREATE POLICY partner_earnings_partner_select ON partner_earnings
    FOR SELECT USING (auth.uid() = partner_id);

-- partner_payout_history: partner sees their own
CREATE POLICY payout_history_partner_select ON partner_payout_history
    FOR SELECT USING (auth.uid() = partner_id);

-- partner_clients: partner sees their own
CREATE POLICY partner_clients_partner_select ON partner_clients
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_clients_partner_insert ON partner_clients
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_clients_partner_update ON partner_clients
    FOR UPDATE USING (auth.uid() = partner_id);

-- partner_invoices: partner sees their own; client can see invoices for their bookings
CREATE POLICY partner_invoices_partner_select ON partner_invoices
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_invoices_partner_insert ON partner_invoices
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_partner_branding_updated_at
    BEFORE UPDATE ON partner_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_earnings_updated_at
    BEFORE UPDATE ON partner_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_payout_history_updated_at
    BEFORE UPDATE ON partner_payout_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_clients_updated_at
    BEFORE UPDATE ON partner_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_invoices_updated_at
    BEFORE UPDATE ON partner_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
