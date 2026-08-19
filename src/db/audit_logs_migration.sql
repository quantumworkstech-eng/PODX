-- ============================================================
-- Audit / Activity Log
--
-- Append-only record of every important action taken anywhere in the app, by
-- admins, partners, clients or the system itself. Written through the single
-- helper in src/lib/audit/logger.ts — never inserted ad hoc.
--
-- Run with: npm run db:migrate-audit-logs
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Actor. Denormalised on purpose: the log must stay readable even after the
    -- user row is renamed or deleted, so we snapshot identity at write time.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    user_role TEXT,

    -- What happened. See src/lib/audit/actions.ts for the allowed values.
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT NOT NULL,

    -- What it happened to
    record_type TEXT,
    record_id TEXT,
    record_name TEXT,

    -- Only the fields that actually changed, already stripped of secrets.
    old_values JSONB,
    new_values JSONB,

    -- Request context
    ip_address TEXT,
    browser TEXT,
    device TEXT,

    -- 'SUCCESS' | 'FAILED'
    status TEXT NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- The default listing is ORDER BY created_at DESC, so that index carries the
-- unfiltered page; the rest are composite so a filter + the default sort can be
-- served without a re-sort.
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_role ON audit_logs(user_role, created_at DESC);

-- ── Append-only enforcement ──────────────────────────────────────────────────
-- Even the service role must not be able to rewrite history through the API.
-- A trigger is used rather than RLS alone because the service role bypasses RLS.
CREATE OR REPLACE FUNCTION audit_logs_reject_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_mutation();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_mutation();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- No end-user access at all: reading is done server-side by the admin API after
-- it has verified the admin session. Regular users can neither read nor write.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_no_public_access'
  ) THEN
    CREATE POLICY "audit_logs_no_public_access"
      ON audit_logs FOR SELECT
      USING (false);
  END IF;
END
$$;
