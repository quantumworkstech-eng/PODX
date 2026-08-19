import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const PAGE_SIZE = 25;

/**
 * GET /api/admin/email-logs
 *
 * Query: page, status, audience, event_key, q (recipient/subject search), days
 * Returns the paginated log plus counts by status for the summary tiles.
 */
export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const status = searchParams.get('status');
  const audience = searchParams.get('audience');
  const eventKey = searchParams.get('event_key');
  const q = searchParams.get('q')?.trim();
  const days = Number(searchParams.get('days') || 0);

  const offset = (page - 1) * PAGE_SIZE;

  // The rendered HTML is large and never shown in the list — omit it here and
  // fetch it on demand from the detail endpoint.
  let query = supabaseAdmin
    .from('email_notifications')
    .select(
      'id, event_key, audience, priority, recipient_email, recipient_name, subject, status, attempts, last_error, provider_message_id, booking_id, created_at, sent_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status && status !== 'all') query = query.eq('status', status);
  if (audience && audience !== 'all') query = query.eq('audience', audience);
  if (eventKey && eventKey !== 'all') query = query.eq('event_key', eventKey);
  if (days > 0) {
    query = query.gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString());
  }
  if (q) {
    const safe = q.replace(/[%,()]/g, '');
    query = query.or(`recipient_email.ilike.%${safe}%,subject.ilike.%${safe}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({
        logs: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        summary: {},
        eventKeys: [],
        migrationMissing: true,
      });
    }
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
  }

  // Status tallies for the summary row, and the event list for the filter menu.
  const { data: allRows } = await supabaseAdmin
    .from('email_notifications')
    .select('status, event_key');

  const summary: Record<string, number> = { queued: 0, sent: 0, failed: 0, skipped: 0 };
  const eventKeys = new Set<string>();
  for (const row of (allRows || []) as { status: string; event_key: string }[]) {
    summary[row.status] = (summary[row.status] || 0) + 1;
    eventKeys.add(row.event_key);
  }

  return NextResponse.json({
    logs: data || [],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    summary,
    eventKeys: Array.from(eventKeys).sort(),
  });
}
