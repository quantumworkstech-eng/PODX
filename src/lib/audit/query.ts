/**
 * Shared filter parsing + query construction for the audit log endpoints, so
 * the list view and the CSV export can never drift out of sync — the export is
 * required to respect exactly the filters the admin is looking at.
 */

import { supabaseAdmin } from '@/lib/supabase';

export type AuditFilters = {
  search: string | null;
  from: string | null;
  to: string | null;
  userEmail: string | null;
  role: string | null;
  action: string | null;
  module: string | null;
  status: string | null;
};

export function parseAuditFilters(searchParams: URLSearchParams): AuditFilters {
  const clean = (key: string) => {
    const raw = searchParams.get(key)?.trim();
    return raw && raw !== 'all' ? raw : null;
  };
  return {
    search: clean('search'),
    from: clean('from'),
    to: clean('to'),
    userEmail: clean('user'),
    role: clean('role'),
    action: clean('action'),
    module: clean('module'),
    status: clean('status'),
  };
}

export const AUDIT_LIST_COLUMNS =
  'id, created_at, user_id, user_name, user_email, user_role, action, module, description, record_type, record_id, record_name, status, ip_address';

/**
 * Apply filters to a PostgREST builder. Kept generic over the builder type
 * because the list query is a select-with-count and the export is a plain
 * select, but both must filter identically.
 */
export function applyAuditFilters<T extends {
  eq: (c: string, v: unknown) => T;
  gte: (c: string, v: unknown) => T;
  lte: (c: string, v: unknown) => T;
  or: (f: string) => T;
}>(query: T, f: AuditFilters): T {
  let q = query;

  if (f.userEmail) q = q.eq('user_email', f.userEmail);
  if (f.role) q = q.eq('user_role', f.role);
  if (f.action) q = q.eq('action', f.action);
  if (f.module) q = q.eq('module', f.module);
  if (f.status) q = q.eq('status', f.status);
  if (f.from) q = q.gte('created_at', new Date(f.from).toISOString());
  if (f.to) {
    // `to` is an inclusive calendar day, so extend to the end of that day.
    const end = new Date(f.to);
    end.setHours(23, 59, 59, 999);
    q = q.lte('created_at', end.toISOString());
  }

  if (f.search) {
    // Strip PostgREST's or() delimiters so a stray comma or paren cannot alter
    // the filter structure.
    const safe = f.search.replace(/[,()%*]/g, '').trim();
    if (safe) {
      q = q.or(
        [
          `user_name.ilike.%${safe}%`,
          `user_email.ilike.%${safe}%`,
          `description.ilike.%${safe}%`,
          `ip_address.ilike.%${safe}%`,
          `record_id.ilike.%${safe}%`,
          `record_name.ilike.%${safe}%`,
        ].join(',')
      );
    }
  }

  return q;
}

/** Counts for the summary cards, computed over the whole table (not the page). */
export async function auditSummary() {
  if (!supabaseAdmin) return { total: 0, today: 0, activeUsers: 0, failed: 0 };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalRes, todayRes, failedRes, actorRes] = await Promise.all([
    supabaseAdmin.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
    supabaseAdmin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'FAILED'),
    // "Active users" = distinct actors seen in the last 24 hours.
    supabaseAdmin
      .from('audit_logs')
      .select('user_email')
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
      .not('user_email', 'is', null)
      .limit(5000),
  ]);

  const activeUsers = new Set(
    ((actorRes.data || []) as { user_email: string | null }[])
      .map((r) => r.user_email)
      .filter(Boolean)
  ).size;

  return {
    total: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    activeUsers,
    failed: failedRes.count ?? 0,
  };
}
