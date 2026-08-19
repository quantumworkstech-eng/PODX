import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchQueuedRow } from '@/lib/notifications';

/** GET one log row including the rendered HTML, for the preview drawer. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('email_notifications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });

  return NextResponse.json({ log: data });
}

/**
 * POST /api/admin/email-logs/[id] — re-send this exact message.
 *
 * Used to recover individual failures without waiting for the queue worker.
 * The stored HTML is re-used verbatim so the recipient gets what was intended.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const { data: row } = await supabaseAdmin
    .from('email_notifications')
    .select('id, recipient_email, subject, html, status')
    .eq('id', id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });

  // A manual retry should not be blocked by the 5-attempt ceiling the cron
  // worker respects, so reset the counter before dispatching.
  await supabaseAdmin
    .from('email_notifications')
    .update({ status: 'queued', attempts: 0, last_error: null })
    .eq('id', id);

  const result = await dispatchQueuedRow(row.id, row.recipient_email, row.subject, row.html);

  await logAdminAction(adminEmail, 'resend_email', 'email_notification', id, {
    to: row.recipient_email,
    result: result.status,
  });

  const { data: updated } = await supabaseAdmin
    .from('email_notifications')
    .select('id, status, attempts, last_error, sent_at, provider_message_id')
    .eq('id', id)
    .maybeSingle();

  return NextResponse.json({ ok: result.status === 'sent', log: updated });
}
