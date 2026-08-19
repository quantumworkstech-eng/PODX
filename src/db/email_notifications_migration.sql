-- ============================================================
-- Critical Email Notification Matrix — mailer support tables
--
-- Backs src/lib/notifications/*: every transactional email the
-- platform sends is first recorded here, then dispatched. The row
-- doubles as the idempotency guard (so a retried webhook cannot
-- send the same mail twice) and as the retry queue for the
-- /api/cron/email-queue worker.
--
-- Run with: node scripts/run-sql-file.mjs src/db/email_notifications_migration.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event key from src/lib/notifications/event-keys.ts (BOOKING_CONFIRMED, …)
    event_key TEXT NOT NULL,
    -- 'client' | 'partner' | 'admin' — which side of the matrix this row serves
    audience TEXT NOT NULL,
    -- 'P0' | 'P1' | 'P2'
    priority TEXT NOT NULL DEFAULT 'P1',

    recipient_email TEXT NOT NULL,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_name TEXT,

    subject TEXT NOT NULL,
    html TEXT NOT NULL,

    -- Stable per (event, subject entity, recipient). A duplicate insert is
    -- rejected by the unique index below, which is how duplicate mail is
    -- prevented for webhook-driven and retried events.
    idempotency_key TEXT NOT NULL,

    -- 'queued' | 'sent' | 'failed' | 'skipped'
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    provider_message_id TEXT,

    -- Correlation columns so support can trace a mail back to its entity
    booking_id UUID,
    studio_id UUID,
    payment_id UUID,
    partner_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_notifications_idempotency
    ON email_notifications(idempotency_key);

-- Queue worker scans by (status, created_at)
CREATE INDEX IF NOT EXISTS idx_email_notifications_status
    ON email_notifications(status, created_at);

CREATE INDEX IF NOT EXISTS idx_email_notifications_event
    ON email_notifications(event_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_notifications_booking
    ON email_notifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient
    ON email_notifications(recipient_email, created_at DESC);

-- Only the service role writes/reads this table; no end-user access.
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_notifications' AND policyname = 'service_role_all_email_notifications'
  ) THEN
    CREATE POLICY "service_role_all_email_notifications"
      ON email_notifications FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END
$$;
