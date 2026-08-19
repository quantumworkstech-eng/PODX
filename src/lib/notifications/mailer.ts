/**
 * Mail transport. The only place in the app that talks to a mail provider.
 *
 * Primary transport is SMTP (Amazon SES). If SMTP is not configured the mailer
 * falls back to the Resend HTTP API, and if neither is configured the message is
 * logged to the console and reported as sent — so the whole notification
 * pipeline stays exercisable in local dev and CI without credentials.
 *
 * Configuration comes from `mailer_settings` in the database (editable at
 * /admin/email) with environment variables as the per-field fallback — see
 * ./mailer-settings.ts.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { resolveMailerConfig, type ResolvedMailerConfig } from './mailer-settings';

export type MailResult = {
  ok: boolean;
  /** Provider message id when the send succeeded. */
  messageId?: string;
  error?: string;
  /** True when the mail was console-logged instead of actually dispatched. */
  simulated?: boolean;
  transport: 'smtp' | 'resend' | 'console';
};

export type MailRequest = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

type SmtpConfig = ResolvedMailerConfig['smtp'];

/**
 * One pooled transporter per process. The app runs as a long-lived Node server
 * (see Dockerfile), so reusing authenticated connections avoids a TLS handshake
 * and an AUTH round-trip on every email.
 */
let transporter: Transporter | null = null;
let transporterKey = '';

function getTransporter(config: NonNullable<SmtpConfig>): Transporter {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter?.close();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: true,
    maxConnections: config.maxConnections,
    maxMessages: 100,
    // Stay under the SES send rate. The sandbox allows 1/sec; production
    // accounts start at 14/sec — the configured rate limit should match the quota.
    rateDelta: 1000,
    rateLimit: config.rateLimit,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  transporterKey = key;
  return transporter;
}

/** SES acknowledges a send with "250 Ok <message-id>". */
function parseSesMessageId(response: string | undefined, fallback: string | undefined): string | undefined {
  const match = response?.match(/\b250 Ok ([0-9a-z-]+)/i);
  return match?.[1] || fallback;
}

// ── public API ───────────────────────────────────────────────────────────────

export async function mailerIsConfigured(): Promise<boolean> {
  const config = await resolveMailerConfig();
  return config.smtp !== null || config.resendApiKey !== null;
}

/** Which transport a send would use right now. Handy for health checks. */
export async function activeTransport(): Promise<MailResult['transport']> {
  const config = await resolveMailerConfig();
  if (!config.enabled) return 'console';
  if (config.smtp) return 'smtp';
  if (config.resendApiKey) return 'resend';
  return 'console';
}

export async function fromAddress(): Promise<string> {
  const config = await resolveMailerConfig();
  // Allow the configured address to already carry a display name.
  if (config.fromEmail.includes('<')) return config.fromEmail;
  return `${config.fromName} <${config.fromEmail}>`;
}

/**
 * Open a connection and authenticate without sending anything. Used by
 * `npm run mail:verify` and the admin screen's "Test connection" button.
 */
export async function verifyTransport(): Promise<{
  ok: boolean;
  transport: MailResult['transport'];
  host?: string;
  error?: string;
}> {
  const config = await resolveMailerConfig();

  if (!config.smtp) {
    const transport = await activeTransport();
    return {
      ok: transport !== 'console',
      transport,
      error: transport === 'console' ? 'No SMTP credentials or Resend key configured' : undefined,
    };
  }

  try {
    await getTransporter(config.smtp).verify();
    return { ok: true, transport: 'smtp', host: config.smtp.host };
  } catch (err) {
    return {
      ok: false,
      transport: 'smtp',
      host: config.smtp.host,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendMail({ to, subject, html, replyTo }: MailRequest): Promise<MailResult> {
  const config = await resolveMailerConfig();

  // Master switch: rows are still recorded, but nothing leaves the building.
  if (!config.enabled) {
    console.log(`[mailer] sending is disabled — skipped "${subject}" to ${to}`);
    return { ok: true, simulated: true, transport: 'console' };
  }

  const from = config.fromEmail.includes('<')
    ? config.fromEmail
    : `${config.fromName} <${config.fromEmail}>`;
  const effectiveReplyTo = replyTo || config.replyTo || undefined;

  if (config.smtp) {
    return sendViaSmtp(config.smtp, from, { to, subject, html, replyTo: effectiveReplyTo });
  }
  if (config.resendApiKey) {
    return sendViaResend(config.resendApiKey, from, { to, subject, html, replyTo: effectiveReplyTo });
  }

  console.log(`\n[DEV] ✉️  ${subject}\n      → ${to}\n`);
  return { ok: true, simulated: true, transport: 'console' };
}

async function sendViaSmtp(
  config: NonNullable<SmtpConfig>,
  from: string,
  mail: MailRequest
): Promise<MailResult> {
  try {
    const info = await getTransporter(config).sendMail({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    });
    return {
      ok: true,
      transport: 'smtp',
      messageId: parseSesMessageId(info.response, info.messageId),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // SES rejects unverified senders/recipients with 554 while the account is
    // still in the sandbox — a config problem, not a transient failure.
    const hint = /Email address is not verified/i.test(message)
      ? ' (SES sandbox: verify the sender and recipient identities, or request production access)'
      : '';
    return { ok: false, transport: 'smtp', error: `SMTP: ${message}${hint}` };
  }
}

async function sendViaResend(apiKey: string, from: string, mail: MailRequest): Promise<MailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, transport: 'resend', error: `Resend ${res.status}: ${body.slice(0, 500)}` };
    }

    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, transport: 'resend', messageId: body.id };
  } catch (err) {
    return { ok: false, transport: 'resend', error: err instanceof Error ? err.message : String(err) };
  }
}
