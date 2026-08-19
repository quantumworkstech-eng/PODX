#!/usr/bin/env node
/**
 * Move the mailer credentials from .env.local into the database, encrypted,
 * so they can be managed from /admin/email.
 *
 *   npm run mail:seed
 *
 * Safe to re-run: it updates the single settings row in place. Requires the
 * mailer_settings table to exist (npm run db:migrate-mailer-settings, or paste
 * src/db/mailer_settings_migration.sql into the Supabase SQL editor).
 */
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* optional */ }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.MAILER_SECRET_KEY || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}
if (!SECRET) {
  console.error('✗ AUTH_SECRET (or MAILER_SECRET_KEY) must be set — it derives the encryption key');
  process.exit(1);
}

// Must match src/lib/notifications/secret-box.ts exactly.
function encryptSecret(plaintext) {
  const key = crypto.scryptSync(SECRET, 'yanisa-mailer-settings', 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
}

const password = process.env.SMTP_PASSWORD;
if (!password) {
  console.error('✗ SMTP_PASSWORD is not set in .env.local — nothing to seed');
  process.exit(1);
}

const region = process.env.SES_REGION || process.env.AWS_REGION || 'ap-south-1';
const row = {
  singleton: true,
  provider: 'ses_smtp',
  ses_region: region,
  smtp_host: process.env.SMTP_HOST || null,
  smtp_port: Number(process.env.SMTP_PORT || 587),
  smtp_secure: false,
  smtp_user: process.env.SMTP_USER || null,
  smtp_password_encrypted: encryptSecret(password),
  smtp_rate_limit: Number(process.env.SMTP_RATE_LIMIT || 10),
  smtp_max_connections: Number(process.env.SMTP_MAX_CONNECTIONS || 5),
  from_email: process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || null,
  from_name: process.env.EMAIL_FROM_NAME || 'Yanisa Studios',
  support_email: process.env.SUPPORT_EMAIL || null,
  admin_alert_emails: process.env.ADMIN_ALERT_EMAILS || null,
  is_enabled: true,
  updated_at: new Date().toISOString(),
  updated_by_email: 'seed-script',
};

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
};

const res = await fetch(`${SUPABASE_URL}/rest/v1/mailer_settings?on_conflict=singleton`, {
  method: 'POST',
  headers,
  body: JSON.stringify(row),
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`✗ Failed (${res.status}): ${body.message || JSON.stringify(body)}`);
  if (/does not exist|schema cache/i.test(body.message || '')) {
    console.error('\n  The mailer_settings table is missing. Create it first:');
    console.error('    npm run db:migrate-mailer-settings');
    console.error('  or paste src/db/mailer_settings_migration.sql into the Supabase SQL editor.');
  }
  process.exit(1);
}

const mask = (v) => (v && v.length > 8 ? `${v.slice(0, 4)}${'•'.repeat(8)}${v.slice(-4)}` : '••••');
console.log('✓ Mailer settings saved to the database\n');
console.log(`  region    ${row.ses_region}`);
console.log(`  host      ${row.smtp_host || `email-smtp.${region}.amazonaws.com`}:${row.smtp_port}`);
console.log(`  user      ${row.smtp_user}`);
console.log(`  password  ${mask(password)}  (encrypted at rest)`);
console.log(`  from      ${row.from_name} <${row.from_email}>`);
console.log('\n  Manage these at /admin/email');
