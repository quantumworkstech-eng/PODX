# Transactional Email Notifications

Implements the *Critical Email Notification Matrix* handoff. Only critical
transactional mail is sent; routine activity (profile edits, dashboard views,
photo uploads, analytics) stays in-app.

## Architecture

```
frontend action → API route / webhook → validate → commit DB state
                                          → emitNotification(eventKey, ctx)
                                          → resolve recipient + render template
                                          → email_notifications row (idempotency guard)
                                          → mail provider (Resend)
```

| File | Role |
| --- | --- |
| `src/lib/notifications/event-keys.ts` | The 35 event keys, their audience and priority |
| `src/lib/notifications/service.ts` | `emitNotification()` — hydration, recipients, queueing, dispatch |
| `src/lib/notifications/templates.ts` | One pure renderer per event key |
| `src/lib/notifications/layout.ts` | Shared dark-theme HTML chrome and formatters |
| `src/lib/notifications/mailer.ts` | The only code that talks to a mail provider (SES SMTP, Resend fallback) |
| `src/lib/notifications/mailer-settings.ts` | Live config: `mailer_settings` row first, env per-field fallback |
| `src/lib/notifications/secret-box.ts` | AES-256-GCM for credentials stored in the database |
| `src/db/email_notifications_migration.sql` | Queue + idempotency + audit table |
| `src/db/mailer_settings_migration.sql` | Admin-editable mailer configuration |

### Emitting an event

```ts
import { emitNotification } from '@/lib/notifications';

await emitNotification('BOOKING_CONFIRMED', {
  clientId, partnerId, bookingId, studioId, paymentId, payoutId,
  email,             // explicit recipient when no user row exists yet (OTP)
  idempotencyKey,    // override the derived duplicate-suppression key
  metadata: { /* template-specific values */ },
});
```

Callers pass ids, not content — the service hydrates the booking, studio,
payment and payout itself. `emitNotification` never throws: a mail problem must
not fail a booking.

## Guarantees

- **Backend only.** Every emission sits after a committed state change in an API
  route or webhook. Nothing is triggered from a frontend success screen.
- **Payment/refund mail is gateway-verified.** `PAYMENT_SUCCESS`,
  `PAYMENT_FAILED`, `REFUND_COMPLETED` and `REFUND_FAILED` come from
  `/api/razorpay/webhook` (HMAC-verified). `POST /api/bookings` may also emit
  `PAYMENT_SUCCESS`, but only after `isPaymentCaptured()` confirms capture
  directly with Razorpay — whichever path runs first wins.
- **No duplicates.** Each mail inserts a row with a unique `idempotency_key`
  (`EVENT:entityId:recipient`). A repeated webhook delivery hits the unique index
  and becomes a no-op. Events that legitimately repeat (OTP, security notices)
  are flagged `repeatable` and get a fresh key each time.
- **Queued.** The row is written before dispatch. If the provider is unreachable
  the row stays `queued` and `/api/cron/email-queue` retries it (5 attempts,
  P0 first), so API latency never depends on the mail provider.

## Triggers

### Client

| Event key | Emitted from |
| --- | --- |
| `CLIENT_OTP_REQUESTED` | `POST /api/auth/send-otp` |
| `BOOKING_CONFIRMED` | `POST /api/bookings` |
| `PAYMENT_SUCCESS` | `payment.captured` webhook, or `POST /api/bookings` after verified capture |
| `PAYMENT_FAILED` | `payment.failed` webhook |
| `BOOKING_CANCELLED_BY_CLIENT` | `PATCH /api/bookings/[id]` `action=cancel` |
| `BOOKING_CANCELLED_BY_PARTNER` | `PATCH /api/admin/bookings/[id]` `force_cancel` / `status=cancelled` |
| `BOOKING_RESCHEDULED` | client, partner, admin and reschedule-approval routes |
| `BOOKING_REMINDER_24H` | `GET /api/cron/booking-reminders` |
| `REFUND_INITIATED` | client cancel with an eligible refund; admin `force_refund` |
| `REFUND_COMPLETED` | `refund.processed` webhook |
| `REFUND_FAILED` | `refund.failed` webhook |
| `BOOKING_CRITICAL_UPDATE` | admin booking edits; studio deactivated/removed with live bookings |
| `CLIENT_SECURITY_UPDATE` | `PATCH /api/admin/users/[id]` ban/unban of a non-partner |

### Partner

| Event key | Emitted from |
| --- | --- |
| `PARTNER_OTP_REQUESTED` | `POST /api/auth/send-otp` with `audience: "partner"` |
| `PARTNER_APPLICATION_RECEIVED` | `POST /api/partner/signup` |
| `PARTNER_APPROVED` | `change_role → partner`, or `partner_decision: approve` |
| `PARTNER_REJECTED` | `PATCH /api/admin/users/[id]` `partner_decision: reject` |
| `PARTNER_SUSPENDED` / `PARTNER_REACTIVATED` | `PATCH /api/admin/users/[id]` ban / unban |
| `STUDIO_SUBMITTED` | `POST /api/partner/studios` (non-draft) |
| `STUDIO_APPROVED` / `STUDIO_REJECTED` / `STUDIO_CHANGES_REQUIRED` / `STUDIO_DEACTIVATED` | `PATCH /api/admin/studios/[id]` actions, `DELETE` |
| `NEW_BOOKING_RECEIVED` | `POST /api/bookings` |
| `PARTNER_BOOKING_CANCELLED_BY_CLIENT` | client cancel; admin force-cancel |
| `PARTNER_BOOKING_RESCHEDULED` | every reschedule path |
| `PARTNER_BOOKING_REMINDER_24H` | `GET /api/cron/booking-reminders` |
| `PAYOUT_COMPLETED` / `PAYOUT_FAILED` | `PATCH /api/admin/payouts` |
| `PARTNER_REFUND_ADJUSTMENT` | `refund.processed` webhook; admin `force_refund` |

### Admin

`ADMIN_NEW_PARTNER_APPLICATION` (partner signup), `ADMIN_STUDIO_REVIEW_REQUIRED`
(studio submitted), `ADMIN_PAYOUT_FAILED` (payout marked failed),
`ADMIN_REFUND_FAILED` (`refund.failed` webhook).

Recipients come from `ADMIN_ALERT_EMAILS` if set, otherwise every active row in
`admins` plus everyone holding the admin role.

## Setup

1. **Migration**

   ```bash
   node scripts/run-sql-file.mjs src/db/email_notifications_migration.sql
   ```

2. **Environment**

   ```
   SES_REGION=ap-south-1
   SMTP_USER=<ses-smtp-username>
   SMTP_PASSWORD=<ses-smtp-password>
   SMTP_PORT=587
   SMTP_RATE_LIMIT=10
   EMAIL_FROM=support@yanisa.in
   EMAIL_FROM_NAME=Yanisa Studios
   SUPPORT_EMAIL=support@yanisa.in
   ADMIN_ALERT_EMAILS=ops@yanisa.in
   RAZORPAY_WEBHOOK_SECRET=...
   CRON_SECRET=<long random string>
   NEXT_PUBLIC_APP_URL=https://yanisastudios.com
   ```

   With no SMTP credentials the mailer falls back to `RESEND_API_KEY`, and with
   neither it logs to the console — the rest of the pipeline (queueing,
   idempotency, retries) still runs, so dev stays testable.

   Verify the transport before trusting it:

   ```bash
   npm run mail:verify                        # connect + authenticate
   npm run mail:verify -- you@example.com     # also send a real test email
   ```

## Admin screens

**`/admin/email` — Email Settings.** Edits the transport and sender identity
without a redeploy: SES region, host, port, username, password, rate limit,
from/reply-to/support addresses, admin alert recipients, and a master
sending switch. "Test connection" authenticates against the server, and
optionally sends a real test email; the result is stored and shown on the page.

**`/admin/email-logs` — Email Logs.** Every message the system has recorded,
with counts by status, filters (status, audience, event key, recipient/subject
search), a rendered preview of the exact HTML that was sent, and a per-message
resend for recovering individual failures.

### Configuration precedence

`mailer_settings` holds at most one row. Each field falls back to its
environment variable **independently**, so an empty table behaves exactly like
the previous env-only setup and a half-filled row degrades field by field. The
screen shows which source is in effect.

Secrets are encrypted with AES-256-GCM using a key derived from
`MAILER_SECRET_KEY` (or `AUTH_SECRET`). They are never returned to the browser —
the API sends a masked hint like `BIbG••••••••yLMh`, and a blank password field
on save means "keep the stored one". **Rotating `AUTH_SECRET` makes stored
secrets undecryptable**; the mailer logs this and falls back to env rather than
authenticating with garbage. Set `MAILER_SECRET_KEY` explicitly if you expect to
rotate `AUTH_SECRET`.

To move the current `.env` credentials into the database:

```bash
npm run db:migrate-mailer-settings   # once
npm run mail:seed                    # encrypts and stores what is in .env.local
```

Note `npm run mail:verify` tests the **environment** config, while the admin
screen's Test connection button tests the **live resolved** config.

## Mail transport

Amazon SES over SMTP, via a single pooled `nodemailer` transporter per process
(the app runs as a long-lived Node server, so connections are reused instead of
re-handshaking per email). The endpoint is derived as
`email-smtp.{SES_REGION}.amazonaws.com`; override with `SMTP_HOST` if needed.

Two SES-specific things to watch:

- **Verified identities.** `EMAIL_FROM` must be a verified identity (domain or
  address) in the same region, or SES rejects the send with 554.
- **Sandbox.** A new SES account can only send *to* verified addresses and is
  capped at 1 message/second. Request production access before launch, and set
  `SMTP_RATE_LIMIT` to your real quota — the transporter throttles to it so SES
  never returns a rate error.

Sends that SES rejects leave the `email_notifications` row `queued`, and
`/api/cron/email-queue` retries them, so a temporary SES problem does not lose
P0 mail.

3. **Razorpay webhook** — dashboard → Webhooks → `POST {APP_URL}/api/razorpay/webhook`,
   secret `RAZORPAY_WEBHOOK_SECRET`, events `payment.captured`, `payment.failed`,
   `refund.processed`, `refund.failed`.

4. **Cron**

   ```cron
   0   * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/booking-reminders"
   */5 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/email-queue"
   ```

## Operations

```sql
-- what went out today
select event_key, status, count(*) from email_notifications
where created_at > now() - interval '1 day' group by 1, 2 order by 1;

-- anything stuck
select event_key, recipient_email, attempts, last_error
from email_notifications where status in ('queued', 'failed') order by created_at;
```

To add an event: add the key to `EVENT_KEYS` + `EVENT_DEFINITIONS`, add a
renderer in `templates.ts` (TypeScript enforces exhaustiveness), then call
`emitNotification` from the route that commits the state change.

## Not yet wired

- `STUDIO_CHANGES_REQUIRED` and `PARTNER_REJECTED` have API support
  (`action: "request_changes"` on the studio route, `action: "partner_decision"`
  on the user route) but no admin UI button yet.
- There is no password-change endpoint in the app, so `CLIENT_SECURITY_UPDATE`
  currently fires only on account access changes.
