-- ============================================================
-- Mailer settings — editable from /admin/email
--
-- Holds the live SMTP/provider configuration so it can be changed from the
-- admin UI without a redeploy. Environment variables remain the fallback, so
-- an empty table keeps the current .env behaviour exactly.
--
-- The SMTP password is stored AES-256-GCM encrypted (see
-- src/lib/notifications/secret-box.ts) and is never returned to the browser —
-- the API sends a masked hint only.
--
-- Run with: npm run db:migrate-mailer-settings
-- ============================================================

CREATE TABLE IF NOT EXISTS mailer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Exactly one row: the unique constraint below makes a second insert fail.
    singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton),

    -- 'ses_smtp' | 'smtp' | 'resend'
    provider TEXT NOT NULL DEFAULT 'ses_smtp',

    -- SMTP transport
    ses_region TEXT,
    smtp_host TEXT,
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_user TEXT,
    smtp_password_encrypted TEXT,
    smtp_rate_limit INTEGER NOT NULL DEFAULT 10,
    smtp_max_connections INTEGER NOT NULL DEFAULT 5,

    -- Resend transport (alternative provider)
    resend_api_key_encrypted TEXT,

    -- Sender identity
    from_email TEXT,
    from_name TEXT,
    reply_to TEXT,
    support_email TEXT,

    -- Comma-separated override for admin alert mail
    admin_alert_emails TEXT,

    -- Master switch. When false the pipeline still records rows but sends nothing.
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Result of the last "Test connection" run, shown in the admin UI
    last_tested_at TIMESTAMP WITH TIME ZONE,
    last_test_ok BOOLEAN,
    last_test_error TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_email TEXT
);

-- Service role only; these are credentials.
ALTER TABLE mailer_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'mailer_settings' AND policyname = 'service_role_all_mailer_settings'
  ) THEN
    CREATE POLICY "service_role_all_mailer_settings"
      ON mailer_settings FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END
$$;
