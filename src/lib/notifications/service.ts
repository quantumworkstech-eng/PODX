/**
 * Centralised transactional notification service.
 *
 *   emitNotification(eventKey, { clientId, partnerId, bookingId, studioId, paymentId, metadata })
 *
 * Controllers and webhooks emit an event key after they have committed the
 * state change. This module then:
 *
 *   1. hydrates the booking / studio / payment / payout the event refers to,
 *   2. resolves the recipient from the event's audience,
 *   3. renders the template,
 *   4. inserts an `email_notifications` row — a unique idempotency key makes a
 *      duplicate emission a no-op, which is what protects webhook retries,
 *   5. dispatches through the mailer and records the outcome.
 *
 * Step 5 failures leave the row in `queued`/`failed`; /api/cron/email-queue
 * retries them. Nothing here ever throws into the caller: a mail problem must
 * not fail a booking.
 */

import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { EVENT_DEFINITIONS, type EventKey } from './event-keys';
import { sendMail } from './mailer';
import { resolveMailerConfig } from './mailer-settings';
import { renderEmail } from './templates';
import type {
  BookingInfo,
  NotificationContext,
  PartyInfo,
  PaymentInfo,
  PayoutInfo,
  RenderContext,
  StudioInfo,
} from './types';

export type EmitResult =
  | { status: 'sent'; id: string }
  | { status: 'queued'; id: string }
  | { status: 'duplicate' }
  | { status: 'skipped'; reason: string };

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://yanisastudios.com'
  ).replace(/\/$/, '');
}

// ── hydration ────────────────────────────────────────────────────────────────

type BookingRow = {
  id: string;
  booking_number: string | null;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number | string;
  notes: string | null;
  user_id: string | null;
  studio_id: string;
  studios?: {
    id?: string;
    name?: string | null;
    city?: string | null;
    address?: string | null;
    owner_id?: string | null;
  } | null;
  booking_addons?: { name: string; price: number | string; quantity: number | null }[] | null;
};

const BOOKING_SELECT = `id, booking_number, start_time, end_time, status, total_price, notes, user_id, studio_id,
   studios!studio_id(id, name, city, address, owner_id),
   booking_addons(name, price, quantity)`;

function parseNotes(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toBookingInfo(row: BookingRow): BookingInfo {
  const notes = parseNotes(row.notes);
  const studio = row.studios || {};
  const pkg = notes.package as { name?: string } | null | undefined;
  const durationHours =
    (new Date(row.end_time).getTime() - new Date(row.start_time).getTime()) / 3_600_000;

  return {
    id: row.id,
    bookingNumber: row.booking_number || row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    totalPrice: Number(row.total_price) || 0,
    durationHours: Math.round(durationHours * 100) / 100,
    participants: Number(notes.participants) || null,
    packageName: pkg?.name || null,
    addOns: (row.booking_addons || []).map((a) => ({
      name: a.name,
      price: Number(a.price) || 0,
      qty: Number(a.quantity) || 1,
    })),
    studioId: row.studio_id,
    studioName: studio.name || 'your studio',
    studioAddress: [studio.address, studio.city].filter(Boolean).join(', '),
    paymentId: typeof notes.paymentId === 'string' ? notes.paymentId : null,
  };
}

/** Resolve a user's email + display name from their id. */
async function loadParty(userId: string | null | undefined): Promise<PartyInfo | null> {
  if (!userId || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, profiles(full_name)')
    .eq('id', userId)
    .maybeSingle();

  if (!data?.email) return null;
  const profiles = data.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null;
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return { id: data.id, email: data.email, name: profile?.full_name ?? null };
}

/**
 * Admin alert recipients: the ADMIN_ALERT_EMAILS override if set, otherwise
 * every active row in `admins` plus anyone holding the admin role.
 */
async function loadAdminRecipients(): Promise<PartyInfo[]> {
  const { adminAlertEmails } = await resolveMailerConfig();
  if (adminAlertEmails.length > 0) return adminAlertEmails.map((email) => ({ email }));

  if (!supabaseAdmin) return [];

  const byEmail = new Map<string, PartyInfo>();

  const { data: admins } = await supabaseAdmin
    .from('admins')
    .select('email, user_id')
    .eq('is_active', true);
  for (const a of admins || []) {
    if (a.email) byEmail.set(a.email.toLowerCase(), { id: a.user_id, email: a.email });
  }

  const { data: roleAdmins } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, users!inner(email), roles!inner(name)')
    .eq('roles.name', 'admin');
  for (const r of (roleAdmins || []) as { user_id: string; users?: { email?: string } }[]) {
    const email = r.users?.email;
    if (email) byEmail.set(email.toLowerCase(), { id: r.user_id, email });
  }

  return Array.from(byEmail.values());
}

// ── idempotency ──────────────────────────────────────────────────────────────

/**
 * Duplicate-suppression key. Derived from the event plus the entity it is about
 * so that a webhook delivered twice produces one mail. Events flagged
 * `repeatable` (OTPs, security notices) instead get a fresh key each time.
 */
function buildIdempotencyKey(
  eventKey: EventKey,
  ctx: NotificationContext,
  recipientEmail: string
): string {
  if (ctx.idempotencyKey) return `${eventKey}:${ctx.idempotencyKey}:${recipientEmail}`;
  if (EVENT_DEFINITIONS[eventKey].repeatable) return `${eventKey}:${randomUUID()}`;

  const scope =
    ctx.payoutId || ctx.paymentId || ctx.bookingId || ctx.studioId || ctx.partnerId || ctx.clientId || randomUUID();
  return `${eventKey}:${scope}:${recipientEmail}`;
}

// ── emit ─────────────────────────────────────────────────────────────────────

/**
 * Emit one transactional notification. Never throws — a mailer or DB problem is
 * logged and reported in the return value so the calling request still succeeds.
 */
export async function emitNotification(
  eventKey: EventKey,
  ctx: NotificationContext = {}
): Promise<EmitResult[]> {
  try {
    return await emitInternal(eventKey, ctx);
  } catch (err) {
    console.error(`[notifications] ${eventKey} failed:`, err);
    return [{ status: 'skipped', reason: 'internal error' }];
  }
}

/** Fire several events at once (e.g. the client + partner halves of one change). */
export async function emitNotifications(
  events: { eventKey: EventKey; context: NotificationContext }[]
): Promise<void> {
  await Promise.all(events.map((e) => emitNotification(e.eventKey, e.context)));
}

async function emitInternal(
  eventKey: EventKey,
  ctx: NotificationContext
): Promise<EmitResult[]> {
  const definition = EVENT_DEFINITIONS[eventKey];
  if (!definition) return [{ status: 'skipped', reason: `unknown event ${eventKey}` }];
  if (!supabaseAdmin) return [{ status: 'skipped', reason: 'database not configured' }];

  // ── hydrate ────────────────────────────────────────────────────────────────
  let booking: BookingInfo | null = null;
  let studio: StudioInfo | null = null;
  let studioOwnerId: string | null = null;
  let bookingUserId: string | null = null;

  if (ctx.bookingId) {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', ctx.bookingId)
      .maybeSingle();
    if (data) {
      const row = data as unknown as BookingRow;
      booking = toBookingInfo(row);
      studioOwnerId = row.studios?.owner_id ?? null;
      bookingUserId = row.user_id;
    }
  }

  const studioId = ctx.studioId || booking?.studioId || null;
  if (studioId) {
    const { data } = await supabaseAdmin
      .from('studios')
      .select('id, name, city, address, owner_id')
      .eq('id', studioId)
      .maybeSingle();
    if (data) {
      studio = { id: data.id, name: data.name, city: data.city, address: data.address };
      studioOwnerId = studioOwnerId || data.owner_id || null;
    }
  }

  let payment: PaymentInfo | null = null;
  if (ctx.paymentId) {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id, provider_payment_id, amount, currency')
      .eq('id', ctx.paymentId)
      .maybeSingle();
    payment = data
      ? {
          id: data.id,
          providerPaymentId: data.provider_payment_id,
          amount: Number(data.amount) || 0,
          currency: data.currency,
        }
      : { providerPaymentId: ctx.paymentId };
  }
  // Metadata may carry gateway-only detail that has no payments row yet
  // (a failed payment is never persisted as a payment).
  const metaAmount = Number(ctx.metadata?.amount);
  const metaReason = ctx.metadata?.failureReason;
  if (!payment && (Number.isFinite(metaAmount) || metaReason)) {
    payment = {
      providerPaymentId: (ctx.metadata?.providerPaymentId as string) || null,
      amount: Number.isFinite(metaAmount) ? metaAmount : null,
      reason: metaReason ? String(metaReason) : null,
    };
  } else if (payment && metaReason) {
    payment.reason = String(metaReason);
  }

  let payout: PayoutInfo | null = null;
  let payoutPartnerId: string | null = null;
  if (ctx.payoutId) {
    const { data } = await supabaseAdmin
      .from('partner_payout_history')
      .select('id, partner_id, payout_amount, reference_number, failure_reason, period_start, period_end, payment_method')
      .eq('id', ctx.payoutId)
      .maybeSingle();
    if (data) {
      payoutPartnerId = data.partner_id;
      payout = {
        id: data.id,
        amount: Number(data.payout_amount) || 0,
        referenceNumber: data.reference_number,
        failureReason: data.failure_reason,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        method: data.payment_method,
      };
    }
  }

  // The booking's own user is the client unless the caller named someone else.
  const client = await loadParty(ctx.clientId || bookingUserId);
  const partner = await loadParty(ctx.partnerId || payoutPartnerId || studioOwnerId);

  // ── resolve recipients ─────────────────────────────────────────────────────
  let recipients: PartyInfo[];
  if (definition.audience === 'admin') {
    recipients = await loadAdminRecipients();
  } else {
    const derived = definition.audience === 'client' ? client : partner;
    const explicit = ctx.email ? { email: ctx.email, name: ctx.name ?? null } : null;
    const chosen = explicit ?? derived;
    recipients = chosen ? [chosen] : [];
  }

  recipients = recipients.filter((r) => r.email && r.email.includes('@'));

  if (recipients.length === 0) {
    console.warn(`[notifications] ${eventKey}: no ${definition.audience} recipient resolved`);
    return [{ status: 'skipped', reason: 'no recipient' }];
  }

  // ── render + queue + send ──────────────────────────────────────────────────
  const mailerConfig = await resolveMailerConfig();
  const results: EmitResult[] = [];

  for (const recipient of recipients) {
    const renderCtx: RenderContext = {
      eventKey,
      recipient,
      booking,
      studio,
      payment,
      payout,
      client,
      partner,
      metadata: ctx.metadata || {},
      appUrl: appUrl(),
      supportEmail: mailerConfig.supportEmail,
    };

    const { subject, html } = renderEmail(renderCtx);
    const idempotencyKey = buildIdempotencyKey(eventKey, ctx, recipient.email);

    const { data: row, error } = await supabaseAdmin
      .from('email_notifications')
      .insert({
        event_key: eventKey,
        audience: definition.audience,
        priority: definition.priority,
        recipient_email: recipient.email,
        recipient_user_id: recipient.id || null,
        recipient_name: recipient.name || null,
        subject,
        html,
        idempotency_key: idempotencyKey,
        status: 'queued',
        booking_id: booking?.id || null,
        studio_id: studio?.id || null,
        payment_id: payment?.id || null,
        partner_id: partner?.id || null,
        metadata: ctx.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      // 23505 = unique_violation on idempotency_key: this exact mail was already
      // queued or sent by an earlier (possibly retried) emission.
      if (error.code === '23505') {
        results.push({ status: 'duplicate' });
        continue;
      }
      // The table may not exist yet (migration not run). Fall back to a direct
      // send so P0 mail is never lost to a missing migration.
      console.error(`[notifications] could not queue ${eventKey}:`, error.message);
      const direct = await sendMail({ to: recipient.email, subject, html });
      results.push(
        direct.ok
          ? { status: 'sent', id: 'unqueued' }
          : { status: 'skipped', reason: direct.error || 'send failed' }
      );
      continue;
    }

    results.push(await dispatchQueuedRow(row.id, recipient.email, subject, html));
  }

  return results;
}

/** Send one queued row and write back the outcome. Shared with the cron worker. */
export async function dispatchQueuedRow(
  id: string,
  to: string,
  subject: string,
  html: string
): Promise<EmitResult> {
  const result = await sendMail({ to, subject, html });

  if (!supabaseAdmin) return result.ok ? { status: 'sent', id } : { status: 'queued', id };

  const { data: current } = await supabaseAdmin
    .from('email_notifications')
    .select('attempts')
    .eq('id', id)
    .maybeSingle();
  const attempts = (Number(current?.attempts) || 0) + 1;

  if (result.ok) {
    await supabaseAdmin
      .from('email_notifications')
      .update({
        status: 'sent',
        attempts,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider_message_id: result.messageId || null,
        last_error: null,
      })
      .eq('id', id);
    return { status: 'sent', id };
  }

  // Give up after 5 attempts so the queue does not grow unbounded.
  await supabaseAdmin
    .from('email_notifications')
    .update({
      status: attempts >= 5 ? 'failed' : 'queued',
      attempts,
      last_error: result.error?.slice(0, 1000) || 'unknown error',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  console.error(`[notifications] send failed (attempt ${attempts}) for ${id}: ${result.error}`);
  return { status: 'queued', id };
}
