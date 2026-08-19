import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { verifyTransport, sendMail, recordTestResult, resolveMailerConfig } from '@/lib/notifications';

/**
 * POST /api/admin/mailer-settings/test
 *
 * Body: { to?: string }
 *   without `to` — connect and authenticate only
 *   with `to`    — also send a real test email to that address
 */
export async function POST(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const to = typeof body?.to === 'string' ? body.to.trim() : '';

  const verify = await verifyTransport();
  await recordTestResult(verify.ok, verify.error ?? null);

  if (!verify.ok) {
    return NextResponse.json({
      ok: false,
      stage: 'connection',
      transport: verify.transport,
      host: verify.host,
      error: verify.error || 'Could not authenticate with the mail server',
    });
  }

  if (!to) {
    return NextResponse.json({
      ok: true,
      stage: 'connection',
      transport: verify.transport,
      host: verify.host,
      message: 'Connected and authenticated successfully',
    });
  }

  if (!to.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid recipient address' }, { status: 400 });
  }

  const config = await resolveMailerConfig();
  const sent = await sendMail({
    to,
    subject: 'Yanisa Studios — mailer test',
    html: `<div style="background:#09090b;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px 32px;">
        <h1 style="font-size:22px;margin:0 0 4px;"><span style="color:#fff;">Yanisa </span><span style="color:#D9FC67;">Studios</span></h1>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 28px;">Mailer test</p>
        <h2 style="color:#fff;font-size:19px;margin:0 0 14px;">Your mail settings are working</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:22px;margin:0 0 16px;">
          Sent from the admin panel via <strong style="color:#fff;">${config.smtp?.host || config.provider}</strong>.
        </p>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">Triggered by ${adminEmail}</p>
      </div></div>`,
  });

  await logAdminAction(adminEmail, 'test_mailer', 'mailer_settings', undefined, { to, ok: sent.ok });

  return NextResponse.json({
    ok: sent.ok,
    stage: 'send',
    transport: sent.transport,
    host: verify.host,
    messageId: sent.messageId,
    simulated: sent.simulated,
    error: sent.error,
    message: sent.ok
      ? sent.simulated
        ? `No provider configured — the test was logged to the server console instead of being sent.`
        : `Test email accepted for ${to}`
      : undefined,
  });
}
