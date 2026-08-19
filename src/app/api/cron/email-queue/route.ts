/**
 * Retry worker for the email queue.
 *
 * Rows land in `email_notifications` with status 'queued'; the emitting request
 * tries to send immediately and only leaves the row queued if the provider was
 * unreachable. This endpoint drains that backlog so a provider outage does not
 * silently drop P0 mail.
 *
 * Schedule every 5 minutes:
 *   *\/5 * * * *  curl -H "Authorization: Bearer $CRON_SECRET" \
 *                      "$APP_URL/api/cron/email-queue"
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchQueuedRow } from '@/lib/notifications';
import { isAuthorizedCron } from '@/lib/notifications/cron-auth';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from('email_notifications')
    .select('id, recipient_email, subject, html, attempts')
    .eq('status', 'queued')
    .lt('attempts', 5)
    // P0 first, then oldest first, so business-critical mail drains ahead of P1.
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Email queue drain failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  let sent = 0;
  let stillQueued = 0;

  for (const row of rows || []) {
    const result = await dispatchQueuedRow(row.id, row.recipient_email, row.subject, row.html);
    if (result.status === 'sent') sent += 1;
    else stillQueued += 1;
  }

  return NextResponse.json({ processed: rows?.length ?? 0, sent, stillQueued });
}
