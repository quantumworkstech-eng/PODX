import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { applyAuditFilters, auditSummary, parseAuditFilters, AUDIT_LIST_COLUMNS } from '@/lib/audit/query';

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/admin/audit-logs
 *
 * Admin-only. Server-side filtered, sorted and paginated — the full table is
 * never loaded. Newest first.
 */
export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE)));
  const offset = (page - 1) * pageSize;

  const filters = parseAuditFilters(searchParams);

  const base = supabaseAdmin
    .from('audit_logs')
    .select(AUDIT_LIST_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await applyAuditFilters(base, filters);

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        logs: [], total: 0, page, pageSize,
        summary: { total: 0, today: 0, activeUsers: 0, failed: 0 },
        facets: { actions: [], modules: [], roles: [], users: [] },
        migrationMissing: true,
      });
    }
    console.error('Audit log query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }

  // Facets populate the filter dropdowns with values that actually occur.
  const { data: facetRows } = await supabaseAdmin
    .from('audit_logs')
    .select('action, module, user_role, user_email, user_name')
    .order('created_at', { ascending: false })
    .limit(5000);

  const actions = new Set<string>();
  const modules = new Set<string>();
  const roles = new Set<string>();
  const users = new Map<string, string>();
  for (const r of (facetRows || []) as {
    action: string; module: string; user_role: string | null; user_email: string | null; user_name: string | null;
  }[]) {
    if (r.action) actions.add(r.action);
    if (r.module) modules.add(r.module);
    if (r.user_role) roles.add(r.user_role);
    if (r.user_email && !users.has(r.user_email)) users.set(r.user_email, r.user_name || r.user_email);
  }

  return NextResponse.json({
    logs: data || [],
    total: count || 0,
    page,
    pageSize,
    summary: await auditSummary(),
    facets: {
      actions: Array.from(actions).sort(),
      modules: Array.from(modules).sort(),
      roles: Array.from(roles).sort(),
      users: Array.from(users, ([email, name]) => ({ email, name })).sort((a, b) => a.name.localeCompare(b.name)),
    },
  });
}
