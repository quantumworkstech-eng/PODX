/**
 * Authenticated symmetric encryption for credentials held in the database.
 *
 * Used for the SMTP password and Resend key in `mailer_settings`, so a database
 * dump alone does not hand over the ability to send mail as the platform.
 *
 * The key is derived from MAILER_SECRET_KEY when set, otherwise from AUTH_SECRET
 * — which means rotating AUTH_SECRET invalidates stored secrets. Decryption
 * failure is reported, never silently treated as an empty password, so the
 * mailer falls back to env instead of authenticating with garbage.
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'v1';
const SALT = 'yanisa-mailer-settings';

function encryptionKey(): Buffer {
  const source =
    process.env.MAILER_SECRET_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!source) {
    throw new Error(
      'No encryption key available — set MAILER_SECRET_KEY or AUTH_SECRET before storing mailer credentials.'
    );
  }
  return crypto.scryptSync(source, SALT, 32);
}

export function canEncrypt(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/** Returns `v1:<iv>:<authTag>:<ciphertext>`, all base64. */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/** Returns null when the value is absent, malformed, or fails authentication. */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;

  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    console.error('[mailer] stored secret is not in the expected v1 format');
    return null;
  }

  try {
    const [, iv, tag, ciphertext] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // Wrong key (AUTH_SECRET rotated) or tampered ciphertext.
    console.error('[mailer] could not decrypt stored secret — has AUTH_SECRET changed?');
    return null;
  }
}

/** "AKIA…GKPV" — enough to recognise a credential without revealing it. */
export function maskSecret(value: string | null | undefined, visible = 4): string | null {
  if (!value) return null;
  if (value.length <= visible * 2) return '•'.repeat(8);
  return `${value.slice(0, visible)}${'•'.repeat(8)}${value.slice(-visible)}`;
}
