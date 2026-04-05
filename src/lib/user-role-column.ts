/**
 * `users.role` is a comma-separated list (e.g. "user,partner").
 * Middleware and onboarding merge roles; admin must not replace the whole string with only "partner"
 * or client routes (/dashboard) reject the session.
 */

export function parseRoleColumn(role: string | null | undefined): string[] {
  return (role || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

export function roleColumnHas(role: string | null | undefined, name: string): boolean {
  return parseRoleColumn(role).includes(name);
}

/** Ordered canonical string for known role names we use in the app. */
export function canonicalRoleString(parts: Iterable<string>): string {
  const order = ['admin', 'user', 'partner'] as const;
  const set = new Set(parseRoleColumn(Array.from(parts).join(',')));
  return order.filter((r) => set.has(r)).join(',');
}

/**
 * Apply admin "primary role" selection while keeping multi-role rules:
 * - partner → always includes user + partner (and keeps admin if present)
 * - user → customer: drop partner, keep admin if any
 * - admin → exclusive admin flag for that account
 */
export function mergeAdminRoleSelection(
  currentRole: string | null | undefined,
  selection: 'user' | 'partner' | 'admin'
): string {
  const existing = parseRoleColumn(currentRole);

  if (selection === 'admin') {
    return 'admin';
  }

  if (selection === 'user') {
    const next = new Set(existing.filter((r) => r !== 'partner'));
    next.add('user');
    return canonicalRoleString(next);
  }

  // partner
  const next = new Set(existing);
  next.add('user');
  next.add('partner');
  return canonicalRoleString(next);
}

/** Supabase `.in('role', …)` for rows whose role column includes partner (canonical + legacy). */
export const ROLE_COLUMN_VALUES_WITH_PARTNER = [
  'partner',
  'user,partner',
  'admin,user,partner',
  'partner,user',
  'admin,partner,user',
];
