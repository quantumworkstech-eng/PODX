/**
 * Razorpay webhook — the verified source of truth for payment and refund mail.
 *
 * Configure in the Razorpay dashboard against
 *   POST {APP_URL}/api/razorpay/webhook
 * with secret RAZORPAY_WEBHOOK_SECRET and events:
 *   payment.captured, payment.failed, refund.processed, refund.failed
 *
 * Every handler commits the database status change first and only then emits an
 * event key. Emissions are idempotent on the gateway's own id, so Razorpay's
 * at-least-once delivery cannot produce duplicate email.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { emitNotification } from '@/lib/notifications';
import { createAuditLog, requestContextFrom } from '@/lib/audit';

type RazorpayEntity = Record<string, unknown>;

type WebhookBody = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    refund?: { entity?: RazorpayEntity };
  };
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Locate the payments row (and its booking/user) for a gateway payment id. */
async function findPaymentContext(providerPaymentId: string | undefined) {
  if (!providerPaymentId || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from('payments')
    .select('id, booking_id, user_id, amount, status')
    .eq('provider_payment_id', providerPaymentId)
    .maybeSingle();
  return data ?? null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const auditContext = requestContextFrom(request);
  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  const event = body.event || '';
  const payment = body.payload?.payment?.entity as
    | { id?: string; amount?: number; order_id?: string; error_description?: string; email?: string; notes?: Record<string, string> }
    | undefined;
  const refund = body.payload?.refund?.entity as
    | { id?: string; payment_id?: string; amount?: number; notes?: Record<string, string>; status?: string }
    | undefined;

  try {
    switch (event) {
      // ── Payment captured → receipt to the client ───────────────────────────
      case 'payment.captured': {
        const ctx = await findPaymentContext(payment?.id);
        if (!ctx) {
          // The booking POST has not landed yet. It performs its own verified
          // capture check and emits the same idempotent event, so nothing is lost.
          console.warn(`payment.captured for unknown payment ${payment?.id}`);
          break;
        }

        await supabaseAdmin.from('payments').update({ status: 'succeeded' }).eq('id', ctx.id);

        await createAuditLog({
          action: 'PAYMENT_CAPTURED',
          module: 'Payments',
          // Gateway-driven, so there is no signed-in actor.
          actor: null,
          description: `Payment captured for booking ${ctx.booking_id}`,
          recordType: 'payment',
          recordId: ctx.id,
          oldValues: { status: ctx.status },
          newValues: { status: 'succeeded' },
          metadata: { provider_payment_id: payment?.id, amount: payment?.amount ? payment.amount / 100 : null },
          request: auditContext,
        });

        await emitNotification('PAYMENT_SUCCESS', {
          clientId: ctx.user_id,
          bookingId: ctx.booking_id,
          paymentId: ctx.id,
          idempotencyKey: payment?.id,
        });
        break;
      }

      // ── Payment failed → client is told no booking was made ────────────────
      case 'payment.failed': {
        const ctx = await findPaymentContext(payment?.id);
        if (ctx) {
          await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', ctx.id);
        }

        await createAuditLog({
          action: 'PAYMENT_FAILED',
          module: 'Payments',
          actor: null,
          description: `Payment failed${ctx?.booking_id ? ` for booking ${ctx.booking_id}` : ''}`,
          recordType: 'payment',
          recordId: ctx?.id ?? payment?.id ?? null,
          status: 'FAILED',
          errorMessage: payment?.error_description ?? 'Gateway reported payment.failed',
          metadata: { provider_payment_id: payment?.id, amount: payment?.amount ? payment.amount / 100 : null },
          request: auditContext,
        });

        // A failed payment usually has no user row attached yet; Razorpay gives
        // us the payer's email on the entity, which is enough to notify them.
        await emitNotification('PAYMENT_FAILED', {
          clientId: ctx?.user_id,
          bookingId: ctx?.booking_id,
          email: ctx?.user_id ? undefined : payment?.email,
          idempotencyKey: payment?.id,
          metadata: {
            amount: payment?.amount ? payment.amount / 100 : undefined,
            providerPaymentId: payment?.id,
            failureReason: payment?.error_description,
          },
        });
        break;
      }

      // ── Refund succeeded → client receipt + partner settlement adjustment ──
      case 'refund.processed': {
        const ctx = await findPaymentContext(refund?.payment_id);
        const amount = refund?.amount ? refund.amount / 100 : undefined;

        if (ctx) {
          await supabaseAdmin
            .from('refunds')
            .update({ status: 'succeeded', provider_refund_id: refund?.id })
            .eq('payment_id', ctx.id)
            .neq('status', 'succeeded');
          await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', ctx.id);
        }

        await createAuditLog({
          action: 'REFUND_COMPLETED',
          module: 'Payments',
          actor: null,
          description: `Refund of ${amount ?? 'unknown amount'} completed`,
          recordType: 'refund',
          recordId: refund?.id ?? null,
          newValues: { status: 'succeeded', amount: amount ?? null },
          metadata: { booking_id: ctx?.booking_id ?? null, payment_id: ctx?.id ?? null },
          request: auditContext,
        });

        await emitNotification('REFUND_COMPLETED', {
          clientId: ctx?.user_id,
          bookingId: ctx?.booking_id,
          paymentId: ctx?.id,
          idempotencyKey: refund?.id,
          metadata: { refundAmount: amount, refundReference: refund?.id },
        });

        if (ctx?.booking_id) {
          await emitNotification('PARTNER_REFUND_ADJUSTMENT', {
            bookingId: ctx.booking_id,
            idempotencyKey: refund?.id,
            metadata: { refundAmount: amount, reason: 'Client refund processed' },
          });
        }
        break;
      }

      // ── Refund failed → client + admin, needs manual intervention ──────────
      case 'refund.failed': {
        const ctx = await findPaymentContext(refund?.payment_id);
        const amount = refund?.amount ? refund.amount / 100 : undefined;

        if (ctx) {
          await supabaseAdmin
            .from('refunds')
            .update({ status: 'failed', provider_refund_id: refund?.id })
            .eq('payment_id', ctx.id)
            .neq('status', 'succeeded');
        }

        await createAuditLog({
          action: 'REFUND_FAILED',
          module: 'Payments',
          actor: null,
          description: `Refund of ${amount ?? 'unknown amount'} failed and needs manual action`,
          recordType: 'refund',
          recordId: refund?.id ?? null,
          status: 'FAILED',
          errorMessage: 'Razorpay reported refund.failed',
          metadata: { booking_id: ctx?.booking_id ?? null, payment_id: ctx?.id ?? null },
          request: auditContext,
        });

        await emitNotification('REFUND_FAILED', {
          clientId: ctx?.user_id,
          bookingId: ctx?.booking_id,
          paymentId: ctx?.id,
          idempotencyKey: refund?.id,
          metadata: { refundAmount: amount, reason: 'The payment gateway rejected the refund.' },
        });

        await emitNotification('ADMIN_REFUND_FAILED', {
          bookingId: ctx?.booking_id,
          paymentId: ctx?.id,
          idempotencyKey: refund?.id,
          metadata: {
            refundAmount: amount,
            reason: 'Razorpay reported refund.failed — manual intervention required.',
          },
        });
        break;
      }

      default:
        // Unsubscribed event types are acknowledged and ignored.
        break;
    }
  } catch (err) {
    console.error(`Razorpay webhook handler error for ${event}:`, err);
    // Still acknowledge: Razorpay retries on non-2xx and the emissions above are
    // idempotent, but a poison payload should not be retried forever.
  }

  return NextResponse.json({ received: true });
}
