import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { applyAuditFilters, parseAuditFilters } from '@/lib/audit/query';
import { createAuditLog, requestContextFrom } from '@/lib/audit';

/** Hard ceiling so one export cannot pull the entire table into memory. */
const EXPORT_LIMIT = 10_000;

const HEADERS = [
  'Date & Time', 'User', 'Email', 'Role', 'Action', 'Module',
  'Description', 'Record Type', 'Record ID', 'Record Name', 'Status', 'IP Address',
];

/**
 * Escape one CSV field.
 *
 * The leading apostrophe on =, +, - and @ blocks spreadsheet formula injection:
 * a description containing `=HYPERLINK(...)` must never execute when the export
 * is opened in Excel or Sheets.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * GET /api/admin/audit-logs/export
 *
 * Streams the current filter selection as CSV. Deliberately excludes
 * old_values, new_values, metadata, browser and device — the export leaves the
 * building, so it carries only the columns specified for it.
 */
export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const filters = parseAuditFilters(searchParams);

  const base = supabaseAdmin
    .from('audit_logs')
    .select(
      'created_at, user_name, user_email, user_role, action, module, description, record_type, record_id, record_name, status, ip_address'
    )
    .order('created_at', { ascending: false })
    .limit(EXPORT_LIMIT);

  const { data, error } = await applyAuditFilters(base, filters);

  // Before the migration is run there is nothing to export; hand back an empty
  // file with headers rather than a 500, matching how the list view degrades.
  const tableMissing = error && /does not exist|schema cache/i.test(error.message);

  if (error && !tableMissing) {
    console.error('Audit export failed:', error);
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
  }

  const rows = (tableMissing ? [] : data || []) as Record<string, unknown>[];

  const csv = [
    HEADERS.join(','),
    ...rows.map((r) =>
      [
        new Date(String(r.created_at)).toISOString(),
        r.user_name, r.user_email, r.user_role, r.action, r.module,
        r.description, r.record_type, r.record_id, r.record_name, r.status, r.ip_address,
      ]
        .map(csvCell)
        .join(',')
    ),
  ].join('\r\n');

  // Exporting data is itself an auditable event.
  if (!tableMissing) {
    await createAuditLog({
      action: 'DATA_EXPORTED',
      module: 'System',
      description: `Exported ${rows.length} audit log ${rows.length === 1 ? 'entry' : 'entries'} to CSV`,
      actor: { email: adminEmail, name: adminEmail.split('@')[0], role: 'admin' },
      recordType: 'audit_logs',
      metadata: { filters, row_count: rows.length, truncated: rows.length >= EXPORT_LIMIT },
      request: requestContextFrom(request),
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-logs-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
