#!/usr/bin/env node
/**
 * Proves the mail transport works end to end.
 *
 *   npm run mail:verify                  # connect + authenticate only
 *   npm run mail:verify -- you@example.com   # also send a real test email
 *
 * Reads .env.local the same way Next does.
 */
import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* file is optional */ }
}

const region = process.env.SES_REGION || process.env.AWS_REGION || 'ap-south-1';
const host = process.env.SMTP_HOST || `email-smtp.${region}.amazonaws.com`;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL;
const fromName = process.env.EMAIL_FROM_NAME || 'Yanisa Studios';

if (!user || !pass) {
  console.error('✗ SMTP_USER / SMTP_PASSWORD are not set in .env.local');
  process.exit(1);
}

console.log(`host   ${host}:${port}`);
console.log(`user   ${user}`);
console.log(`from   ${fromName} <${from}>`);

const transport = nodemailer.createTransport({
  host, port, secure: port === 465, auth: { user, pass },
  connectionTimeout: 10_000, greetingTimeout: 10_000,
});

try {
  await transport.verify();
  console.log('\n✓ SMTP connection and authentication succeeded');
} catch (err) {
  console.error(`\n✗ SMTP verify failed: ${err.message}`);
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.log('\nPass a recipient to send a real test email:');
  console.log('  npm run mail:verify -- you@example.com');
  transport.close();
  process.exit(0);
}

try {
  const info = await transport.sendMail({
    from: `${fromName} <${from}>`,
    to,
    subject: 'Yanisa Studios — mailer test',
    html: `<div style="background:#09090b;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px 32px;">
        <h1 style="font-size:22px;margin:0 0 4px;"><span style="color:#fff;">Yanisa </span><span style="color:#D9FC67;">Studios</span></h1>
        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 28px;">Mailer test</p>
        <h2 style="color:#fff;font-size:19px;margin:0 0 14px;">SES SMTP is working</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:22px;margin:0;">
          Sent via <strong style="color:#fff;">${host}</strong>. If you can read this, transactional email is live.
        </p>
      </div></div>`,
  });
  console.log(`\n✓ Test email accepted by SES`);
  console.log(`  response: ${info.response}`);
} catch (err) {
  console.error(`\n✗ Send failed: ${err.message}`);
  if (/not verified/i.test(err.message)) {
    console.error('  SES is still in the sandbox — verify this recipient in the SES console,');
    console.error('  or request production access.');
  }
  process.exit(1);
} finally {
  transport.close();
}
