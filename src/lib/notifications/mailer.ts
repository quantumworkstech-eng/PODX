/**
 * Mail transport. The only place in the app that talks to a mail provider.
 *
 * Primary transport is SMTP (Amazon SES). If SMTP is not configured the mailer
 * falls back to the Resend HTTP API, and if neither is configured the message is
 * logged to the console and reported as sent — so the whole notification
 * pipeline stays exercisable in local dev and CI without credentials.
 */

import nodemailer, { type Transporter } from 'nodemailer';

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

const PLACEHOLDER_RE = /^re_\.{3}$|\.{3}$|^your_/i;

function envValue(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw || PLACEHOLDER_RE.test(raw)) return null;
  return raw;
}

// ── SMTP (Amazon SES) ────────────────────────────────────────────────────────

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

function smtpConfig(): SmtpConfig | null {
  const user = envValue('SMTP_USER');
  const pass = envValue('SMTP_PASSWORD');
  if (!user || !pass) return null;

  // SES endpoints are regional. SES_REGION wins so the mail region can differ
  // from the region used for S3 and the rest of the stack.
  const region = envValue('SES_REGION') || envValue('AWS_REGION') || 'ap-south-1';
  const host = envValue('SMTP_HOST') || `email-smtp.${region}.amazonaws.com`;
  const port = Number(envValue('SMTP_PORT') || 587);

  return {
    host,
    port,
    // 465 is implicit TLS; 587 and 2587 negotiate STARTTLS, which SES requires.
    secure: envValue('SMTP_SECURE') === 'true' || port === 465,
    user,
    pass,
  };
}

/**
 * One pooled transporter per process. The app runs as a long-lived Node server
 * (see Dockerfile), so reusing authenticated connections avoids a TLS handshake
 * and an AUTH round-trip on every email.
 */
let transporter: Transporter | null = null;
let transporterKey = '';

function getTransporter(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter?.close();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: true,
    maxConnections: Number(envValue('SMTP_MAX_CONNECTIONS') || 5),
    maxMessages: 100,
    // Stay under the SES send rate. The sandbox allows 1/sec; production
    // accounts start at 14/sec — SMTP_RATE_LIMIT should match the real quota.
    rateDelta: 1000,
    rateLimit: Number(envValue('SMTP_RATE_LIMIT') || 10),
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

export function mailerIsConfigured(): boolean {
  return smtpConfig() !== null || envValue('RESEND_API_KEY') !== null;
}

/** Which transport a send would use right now. Handy for health checks. */
export function activeTransport(): MailResult['transport'] {
  if (smtpConfig()) return 'smtp';
  if (envValue('RESEND_API_KEY')) return 'resend';
  return 'console';
}

export function fromAddress(): string {
  const email = envValue('EMAIL_FROM') || envValue('SUPPORT_EMAIL') || 'onboarding@resend.dev';
  // Allow EMAIL_FROM to already carry a display name ("Yanisa <x@y.com>").
  if (email.includes('<')) return email;
  const name = envValue('EMAIL_FROM_NAME') || 'Yanisa Studios';
  return `${name} <${email}>`;
}

/**
 * Open a connection and authenticate without sending anything. Used by
 * `npm run mail:verify` to prove credentials and region are right.
 */
export async function verifyTransport(): Promise<{ ok: boolean; transport: MailResult['transport']; host?: string; error?: string }> {
  const config = smtpConfig();
  if (!config) {
    return { ok: activeTransport() !== 'console', transport: activeTransport() };
  }
  try {
    await getTransporter(config).verify();
    return { ok: true, transport: 'smtp', host: config.host };
  } catch (err) {
    return {
      ok: false,
      transport: 'smtp',
      host: config.host,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendMail({ to, subject, html, replyTo }: MailRequest): Promise<MailResult> {
  const config = smtpConfig();
  if (config) return sendViaSmtp(config, { to, subject, html, replyTo });

  const resendKey = envValue('RESEND_API_KEY');
  if (resendKey) return sendViaResend(resendKey, { to, subject, html, replyTo });

  console.log(`\n[DEV] ✉️  ${subject}\n      → ${to}\n`);
  return { ok: true, simulated: true, transport: 'console' };
}

async function sendViaSmtp(config: SmtpConfig, mail: MailRequest): Promise<MailResult> {
  try {
    const info = await getTransporter(config).sendMail({
      from: fromAddress(),
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
    // still in the sandbox — a config problem, not a transient failure, so say so.
    const hint = /Email address is not verified/i.test(message)
      ? ' (SES sandbox: verify the sender and recipient identities, or request production access)'
      : '';
    return { ok: false, transport: 'smtp', error: `SMTP: ${message}${hint}` };
  }
}

async function sendViaResend(apiKey: string, mail: MailRequest): Promise<MailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress(),
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
