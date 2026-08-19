/**
 * Sanitisation and change detection for audit payloads.
 *
 * Nothing reaches `audit_logs` without passing through here: credentials,
 * tokens, payment instruments and private keys must never be written to the
 * log, in old_values, new_values, metadata or the description.
 */

/** Field names whose values are replaced with a placeholder, matched loosely. */
const SENSITIVE_PATTERNS: RegExp[] = [
  /pass(word|wd|phrase)/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /private[_-]?key/i,
  /signature/i,
  /\bhash\b/i,
  /salt/i,
  /otp|verification[_-]?code/i,
  /card[_-]?(number|cvv|cvc)/i,
  /\bcvv\b|\bcvc\b/i,
  /account[_-]?number/i,
  /ifsc|upi[_-]?id|bank/i,
  /razorpay[_-]?(key|secret)/i,
  /webhook[_-]?secret/i,
];

const REDACTED = '[redacted]';
const MAX_DEPTH = 6;
const MAX_STRING = 2_000;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(key));
}

/**
 * Deep-copy a value, replacing anything that looks like a credential and
 * capping size so a stray large blob cannot bloat the log.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth >= MAX_DEPTH) return '[truncated]';

  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    // Long collections are summarised rather than stored wholesale.
    const capped = value.slice(0, 50).map((v) => redact(v, depth + 1));
    return value.length > 50 ? [...capped, `…${value.length - 50} more`] : capped;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redact(val, depth + 1);
    }
    return out;
  }

  return String(value);
}

export function redactObject(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!value) return null;
  const result = redact(value) as Record<string, unknown>;
  return Object.keys(result).length > 0 ? result : null;
}

/** Strip anything credential-shaped that leaked into a free-text description. */
export function redactText(text: string): string {
  return text
    .replace(/\b(?:AKIA|ASIA)[0-9A-Z]{12,}\b/g, REDACTED)
    .replace(/\b(?:sk|pk|rzp|re|ghp|gho|whsec)_[A-Za-z0-9_-]{8,}\b/g, REDACTED)
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, REDACTED)
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, REDACTED)
    .slice(0, 1_000);
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

export type ValueDiff = {
  old: Record<string, unknown> | null;
  new: Record<string, unknown> | null;
};

/**
 * Reduce a before/after pair to only the fields that actually changed, with
 * both sides redacted. Returns nulls when nothing changed, so an update that
 * altered nothing does not produce an empty Changes section in the UI.
 */
export function diffValues(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): ValueDiff {
  if (!before && !after) return { old: null, new: null };

  // A create (no before) or delete (no after) records the whole snapshot.
  if (!before) return { old: null, new: redactObject(after) };
  if (!after) return { old: redactObject(before), new: null };

  const oldChanged: Record<string, unknown> = {};
  const newChanged: Record<string, unknown> = {};

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    // A field present on only one side still counts as a change.
    if (!isEqual(before[key], after[key])) {
      oldChanged[key] = isSensitiveKey(key) ? REDACTED : redact(before[key]);
      newChanged[key] = isSensitiveKey(key) ? REDACTED : redact(after[key]);
    }
  }

  return {
    old: Object.keys(oldChanged).length ? oldChanged : null,
    new: Object.keys(newChanged).length ? newChanged : null,
  };
}
