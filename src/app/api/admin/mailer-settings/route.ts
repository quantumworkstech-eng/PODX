import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import {
  getMailerSettingsForAdmin,
  saveMailerSettings,
  type MailerProvider,
  type MailerSettingsInput,
} from '@/lib/notifications';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Secrets are returned as a masked hint only — never the value itself.
    return NextResponse.json({ settings: await getMailerSettingsForAdmin() });
  } catch (err) {
    console.error('Failed to read mailer settings:', err);
    return NextResponse.json({ error: 'Failed to load mailer settings' }, { status: 500 });
  }
}

const PROVIDERS: MailerProvider[] = ['ses_smtp', 'smtp', 'resend'];

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function cleanEmailList(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const list = value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.includes('@'));
  return list.length ? list.join(',') : '';
}

export async function PATCH(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const provider = PROVIDERS.includes(body.provider) ? (body.provider as MailerProvider) : undefined;

  if (body.from_email && !String(body.from_email).includes('@')) {
    return NextResponse.json({ error: 'From address must be a valid email' }, { status: 400 });
  }

  const input: MailerSettingsInput = {
    provider,
    ses_region: typeof body.ses_region === 'string' ? body.ses_region.trim() : undefined,
    smtp_host: typeof body.smtp_host === 'string' ? body.smtp_host.trim() : undefined,
    smtp_port: body.smtp_port !== undefined ? toInt(body.smtp_port, 587, 1, 65535) : undefined,
    smtp_secure: typeof body.smtp_secure === 'boolean' ? body.smtp_secure : undefined,
    smtp_user: typeof body.smtp_user === 'string' ? body.smtp_user.trim() : undefined,
    smtp_rate_limit:
      body.smtp_rate_limit !== undefined ? toInt(body.smtp_rate_limit, 10, 1, 500) : undefined,
    smtp_max_connections:
      body.smtp_max_connections !== undefined ? toInt(body.smtp_max_connections, 5, 1, 50) : undefined,
    from_email: typeof body.from_email === 'string' ? body.from_email.trim() : undefined,
    from_name: typeof body.from_name === 'string' ? body.from_name.trim() : undefined,
    reply_to: typeof body.reply_to === 'string' ? body.reply_to.trim() : undefined,
    support_email: typeof body.support_email === 'string' ? body.support_email.trim() : undefined,
    admin_alert_emails: cleanEmailList(body.admin_alert_emails) ?? undefined,
    is_enabled: typeof body.is_enabled === 'boolean' ? body.is_enabled : undefined,
    // Blank means "leave the stored password alone" — the UI never round-trips it.
    smtp_password:
      typeof body.smtp_password === 'string' && body.smtp_password.trim()
        ? body.smtp_password.trim()
        : undefined,
    resend_api_key:
      typeof body.resend_api_key === 'string' && body.resend_api_key.trim()
        ? body.resend_api_key.trim()
        : undefined,
  };

  const result = await saveMailerSettings(input, adminEmail);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  // Log which fields changed, never the values.
  await logAdminAction(adminEmail, 'update_mailer_settings', 'mailer_settings', undefined, {
    fields: Object.keys(input).filter((k) => input[k as keyof MailerSettingsInput] !== undefined),
    password_changed: Boolean(input.smtp_password),
  });

  return NextResponse.json({ success: true, settings: await getMailerSettingsForAdmin() });
}
