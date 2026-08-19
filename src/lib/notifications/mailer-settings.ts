/**
 * Live mailer configuration: database first, environment as fallback.
 *
 * `mailer_settings` holds at most one row, editable from /admin/email. When a
 * field is blank there the corresponding environment variable is used, so an
 * empty table behaves exactly like the pre-existing .env-only setup and a
 * half-filled row degrades field by field rather than all at once.
 *
 * Reads are cached briefly — a busy queue drain would otherwise hit the
 * database once per email.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { decryptSecret, encryptSecret, maskSecret } from './secret-box';

export type MailerProvider = 'ses_smtp' | 'smtp' | 'resend';

/** What the admin screen edits. Secrets are write-only from the client. */
export type MailerSettingsInput = {
  provider?: MailerProvider;
  ses_region?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | null;
  smtp_user?: string | null;
  /** Plaintext; encrypted before storage. Omit to keep the existing password. */
  smtp_password?: string | null;
  smtp_rate_limit?: number | null;
  smtp_max_connections?: number | null;
  resend_api_key?: string | null;
  from_email?: string | null;
  from_name?: string | null;
  reply_to?: string | null;
  support_email?: string | null;
  admin_alert_emails?: string | null;
  is_enabled?: boolean | null;
};

/** Fully resolved config the mailer actually uses. */
export type ResolvedMailerConfig = {
  provider: MailerProvider;
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    rateLimit: number;
    maxConnections: number;
  } | null;
  resendApiKey: string | null;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  supportEmail: string | null;
  adminAlertEmails: string[];
  /** Where each part came from — surfaced in the admin UI. */
  source: { smtp: 'database' | 'environment' | 'none'; from: 'database' | 'environment' };
};

type SettingsRow = {
  id: string;
  provider: MailerProvider;
  ses_region: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_user: string | null;
  smtp_password_encrypted: string | null;
  smtp_rate_limit: number | null;
  smtp_max_connections: number | null;
  resend_api_key_encrypted: string | null;
  from_email: string | null;
  from_name: string | null;
  reply_to: string | null;
  support_email: string | null;
  admin_alert_emails: string | null;
  is_enabled: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
  updated_at: string | null;
  updated_by_email: string | null;
};

const PLACEHOLDER_RE = /^re_\.{3}$|\.{3}$|^your_|^<.*>$/i;

function env(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw || PLACEHOLDER_RE.test(raw)) return null;
  return raw;
}

const CACHE_TTL_MS = 30_000;
let cache: { row: SettingsRow | null; at: number } | null = null;

/** Drop the cache so the next send picks up a just-saved change immediately. */
export function invalidateMailerSettingsCache(): void {
  cache = null;
}

async function loadRow(force = false): Promise<SettingsRow | null> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.row;
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('mailer_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    // Table missing (migration not run) is expected and non-fatal: env wins.
    if (!/does not exist|schema cache/i.test(error.message)) {
      console.error('[mailer] could not read mailer_settings:', error.message);
    }
    cache = { row: null, at: Date.now() };
    return null;
  }

  cache = { row: (data as SettingsRow) ?? null, at: Date.now() };
  return cache.row;
}

/** The row as stored, for the admin screen. Never includes plaintext secrets. */
export async function getMailerSettingsForAdmin() {
  const row = await loadRow(true);
  const storedPassword = decryptSecret(row?.smtp_password_encrypted);
  const storedResend = decryptSecret(row?.resend_api_key_encrypted);

  return {
    configured: row !== null,
    provider: row?.provider ?? 'ses_smtp',
    ses_region: row?.ses_region ?? env('SES_REGION') ?? env('AWS_REGION') ?? 'ap-south-1',
    smtp_host: row?.smtp_host ?? env('SMTP_HOST') ?? '',
    smtp_port: row?.smtp_port ?? Number(env('SMTP_PORT') || 587),
    smtp_secure: row?.smtp_secure ?? false,
    smtp_user: row?.smtp_user ?? env('SMTP_USER') ?? '',
    smtp_rate_limit: row?.smtp_rate_limit ?? Number(env('SMTP_RATE_LIMIT') || 10),
    smtp_max_connections: row?.smtp_max_connections ?? Number(env('SMTP_MAX_CONNECTIONS') || 5),
    from_email: row?.from_email ?? env('EMAIL_FROM') ?? '',
    from_name: row?.from_name ?? env('EMAIL_FROM_NAME') ?? 'Yanisa Studios',
    reply_to: row?.reply_to ?? '',
    support_email: row?.support_email ?? env('SUPPORT_EMAIL') ?? '',
    admin_alert_emails: row?.admin_alert_emails ?? env('ADMIN_ALERT_EMAILS') ?? '',
    is_enabled: row?.is_enabled ?? true,

    // Secrets: presence + a hint only, never the value.
    smtp_password_set: Boolean(storedPassword || env('SMTP_PASSWORD')),
    smtp_password_hint: maskSecret(storedPassword || env('SMTP_PASSWORD')),
    smtp_password_source: storedPassword ? 'database' : env('SMTP_PASSWORD') ? 'environment' : 'none',
    resend_api_key_set: Boolean(storedResend || env('RESEND_API_KEY')),
    resend_api_key_hint: maskSecret(storedResend || env('RESEND_API_KEY')),

    last_tested_at: row?.last_tested_at ?? null,
    last_test_ok: row?.last_test_ok ?? null,
    last_test_error: row?.last_test_error ?? null,
    updated_at: row?.updated_at ?? null,
    updated_by_email: row?.updated_by_email ?? null,
  };
}

/** Upsert the single settings row. Blank secrets leave the stored value alone. */
export async function saveMailerSettings(
  input: MailerSettingsInput,
  adminEmail: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' };

  const existing = await loadRow(true);

  const update: Record<string, unknown> = {
    singleton: true,
    provider: input.provider ?? existing?.provider ?? 'ses_smtp',
    ses_region: input.ses_region ?? existing?.ses_region ?? null,
    smtp_host: input.smtp_host ?? existing?.smtp_host ?? null,
    smtp_port: input.smtp_port ?? existing?.smtp_port ?? 587,
    smtp_secure: input.smtp_secure ?? existing?.smtp_secure ?? false,
    smtp_user: input.smtp_user ?? existing?.smtp_user ?? null,
    smtp_rate_limit: input.smtp_rate_limit ?? existing?.smtp_rate_limit ?? 10,
    smtp_max_connections: input.smtp_max_connections ?? existing?.smtp_max_connections ?? 5,
    from_email: input.from_email ?? existing?.from_email ?? null,
    from_name: input.from_name ?? existing?.from_name ?? null,
    reply_to: input.reply_to ?? existing?.reply_to ?? null,
    support_email: input.support_email ?? existing?.support_email ?? null,
    admin_alert_emails: input.admin_alert_emails ?? existing?.admin_alert_emails ?? null,
    is_enabled: input.is_enabled ?? existing?.is_enabled ?? true,
    updated_at: new Date().toISOString(),
    updated_by_email: adminEmail,
  };

  // A blank/absent secret means "unchanged" — the UI never sends the current one back.
  try {
    if (input.smtp_password) {
      update.smtp_password_encrypted = encryptSecret(input.smtp_password);
    }
    if (input.resend_api_key) {
      update.resend_api_key_encrypted = encryptSecret(input.resend_api_key);
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Encryption failed' };
  }

  const query = existing
    ? supabaseAdmin.from('mailer_settings').update(update).eq('id', existing.id)
    : supabaseAdmin.from('mailer_settings').insert(update);

  const { error } = await query;
  if (error) {
    return {
      ok: false,
      error: /does not exist|schema cache/i.test(error.message)
        ? 'The mailer_settings table does not exist yet — run npm run db:migrate-mailer-settings'
        : error.message,
    };
  }

  invalidateMailerSettingsCache();
  return { ok: true };
}

export async function recordTestResult(ok: boolean, error: string | null): Promise<void> {
  if (!supabaseAdmin) return;
  const row = await loadRow(true);
  if (!row) return;
  await supabaseAdmin
    .from('mailer_settings')
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_ok: ok,
      last_test_error: error?.slice(0, 1000) ?? null,
    })
    .eq('id', row.id);
  invalidateMailerSettingsCache();
}

/**
 * The configuration the mailer sends with. Each field falls back to its
 * environment variable independently, so a partially filled row still works.
 */
export async function resolveMailerConfig(): Promise<ResolvedMailerConfig> {
  const row = await loadRow();

  const user = row?.smtp_user || env('SMTP_USER');
  const pass = decryptSecret(row?.smtp_password_encrypted) || env('SMTP_PASSWORD');
  const passFromDb = Boolean(decryptSecret(row?.smtp_password_encrypted));

  const region = row?.ses_region || env('SES_REGION') || env('AWS_REGION') || 'ap-south-1';
  const host = row?.smtp_host || env('SMTP_HOST') || `email-smtp.${region}.amazonaws.com`;
  const port = row?.smtp_port ?? Number(env('SMTP_PORT') || 587);

  const smtp =
    user && pass
      ? {
          host,
          port,
          secure: row?.smtp_secure ?? (env('SMTP_SECURE') === 'true' || port === 465),
          user,
          pass,
          rateLimit: row?.smtp_rate_limit ?? Number(env('SMTP_RATE_LIMIT') || 10),
          maxConnections: row?.smtp_max_connections ?? Number(env('SMTP_MAX_CONNECTIONS') || 5),
        }
      : null;

  const fromEmail =
    row?.from_email || env('EMAIL_FROM') || env('SUPPORT_EMAIL') || 'onboarding@resend.dev';

  return {
    provider: row?.provider ?? 'ses_smtp',
    enabled: row?.is_enabled ?? true,
    smtp,
    resendApiKey: decryptSecret(row?.resend_api_key_encrypted) || env('RESEND_API_KEY'),
    fromEmail,
    fromName: row?.from_name || env('EMAIL_FROM_NAME') || 'Yanisa Studios',
    replyTo: row?.reply_to || null,
    supportEmail: row?.support_email || env('SUPPORT_EMAIL') || null,
    adminAlertEmails: (row?.admin_alert_emails || env('ADMIN_ALERT_EMAILS') || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
    source: {
      smtp: smtp ? (row?.smtp_user && passFromDb ? 'database' : 'environment') : 'none',
      from: row?.from_email ? 'database' : 'environment',
    },
  };
}
