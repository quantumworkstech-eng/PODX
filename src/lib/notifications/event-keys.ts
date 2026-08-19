/**
 * Event keys for the Critical Email Notification Matrix.
 *
 * Controllers and webhooks emit an event key — they never pick a template or a
 * recipient themselves. `emitNotification()` in ./service.ts resolves the
 * audience, renders the template and queues the mail.
 *
 * Priorities mirror the handoff doc: P0 = business-critical, P1 = important
 * transactional, P2 = later phase.
 */

export const EVENT_KEYS = [
  // ── 1. Client / customer ───────────────────────────────────────────────────
  'CLIENT_OTP_REQUESTED',
  'BOOKING_CONFIRMED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'BOOKING_CANCELLED_BY_CLIENT',
  'BOOKING_CANCELLED_BY_PARTNER',
  'BOOKING_RESCHEDULED',
  'BOOKING_REMINDER_24H',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'BOOKING_CRITICAL_UPDATE',
  'CLIENT_SECURITY_UPDATE',

  // ── 2. Partner / studio owner ──────────────────────────────────────────────
  'PARTNER_OTP_REQUESTED',
  'PARTNER_APPLICATION_RECEIVED',
  'PARTNER_APPROVED',
  'PARTNER_REJECTED',
  'PARTNER_SUSPENDED',
  'PARTNER_REACTIVATED',
  'STUDIO_SUBMITTED',
  'STUDIO_APPROVED',
  'STUDIO_REJECTED',
  'STUDIO_CHANGES_REQUIRED',
  'STUDIO_DEACTIVATED',
  'NEW_BOOKING_RECEIVED',
  'PARTNER_BOOKING_CANCELLED_BY_CLIENT',
  'PARTNER_BOOKING_RESCHEDULED',
  'PARTNER_BOOKING_REMINDER_24H',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'PARTNER_REFUND_ADJUSTMENT',

  // ── 3. Admin alerts ────────────────────────────────────────────────────────
  'ADMIN_NEW_PARTNER_APPLICATION',
  'ADMIN_STUDIO_REVIEW_REQUIRED',
  'ADMIN_PAYOUT_FAILED',
  'ADMIN_REFUND_FAILED',
] as const;

export type EventKey = (typeof EVENT_KEYS)[number];

export type Audience = 'client' | 'partner' | 'admin';
export type Priority = 'P0' | 'P1' | 'P2';

export type EventDefinition = {
  audience: Audience;
  priority: Priority;
  /**
   * Events that legitimately repeat for the same entity (OTPs, security
   * notices, generic critical updates). These get a unique idempotency key per
   * emission instead of one derived from the entity, so the duplicate guard
   * does not swallow the second one.
   */
  repeatable?: boolean;
};

export const EVENT_DEFINITIONS: Record<EventKey, EventDefinition> = {
  // Client
  CLIENT_OTP_REQUESTED: { audience: 'client', priority: 'P0', repeatable: true },
  BOOKING_CONFIRMED: { audience: 'client', priority: 'P0' },
  PAYMENT_SUCCESS: { audience: 'client', priority: 'P0' },
  PAYMENT_FAILED: { audience: 'client', priority: 'P0' },
  BOOKING_CANCELLED_BY_CLIENT: { audience: 'client', priority: 'P0' },
  BOOKING_CANCELLED_BY_PARTNER: { audience: 'client', priority: 'P0' },
  BOOKING_RESCHEDULED: { audience: 'client', priority: 'P0', repeatable: true },
  BOOKING_REMINDER_24H: { audience: 'client', priority: 'P1' },
  REFUND_INITIATED: { audience: 'client', priority: 'P0' },
  REFUND_COMPLETED: { audience: 'client', priority: 'P0' },
  REFUND_FAILED: { audience: 'client', priority: 'P0' },
  BOOKING_CRITICAL_UPDATE: { audience: 'client', priority: 'P0', repeatable: true },
  CLIENT_SECURITY_UPDATE: { audience: 'client', priority: 'P1', repeatable: true },

  // Partner
  PARTNER_OTP_REQUESTED: { audience: 'partner', priority: 'P0', repeatable: true },
  PARTNER_APPLICATION_RECEIVED: { audience: 'partner', priority: 'P1' },
  PARTNER_APPROVED: { audience: 'partner', priority: 'P0' },
  PARTNER_REJECTED: { audience: 'partner', priority: 'P0', repeatable: true },
  PARTNER_SUSPENDED: { audience: 'partner', priority: 'P0', repeatable: true },
  PARTNER_REACTIVATED: { audience: 'partner', priority: 'P1', repeatable: true },
  STUDIO_SUBMITTED: { audience: 'partner', priority: 'P1', repeatable: true },
  STUDIO_APPROVED: { audience: 'partner', priority: 'P0', repeatable: true },
  STUDIO_REJECTED: { audience: 'partner', priority: 'P0', repeatable: true },
  STUDIO_CHANGES_REQUIRED: { audience: 'partner', priority: 'P0', repeatable: true },
  STUDIO_DEACTIVATED: { audience: 'partner', priority: 'P0', repeatable: true },
  NEW_BOOKING_RECEIVED: { audience: 'partner', priority: 'P0' },
  PARTNER_BOOKING_CANCELLED_BY_CLIENT: { audience: 'partner', priority: 'P0' },
  PARTNER_BOOKING_RESCHEDULED: { audience: 'partner', priority: 'P0', repeatable: true },
  PARTNER_BOOKING_REMINDER_24H: { audience: 'partner', priority: 'P1' },
  PAYOUT_COMPLETED: { audience: 'partner', priority: 'P0' },
  PAYOUT_FAILED: { audience: 'partner', priority: 'P0' },
  PARTNER_REFUND_ADJUSTMENT: { audience: 'partner', priority: 'P1' },

  // Admin
  ADMIN_NEW_PARTNER_APPLICATION: { audience: 'admin', priority: 'P1' },
  ADMIN_STUDIO_REVIEW_REQUIRED: { audience: 'admin', priority: 'P1' },
  ADMIN_PAYOUT_FAILED: { audience: 'admin', priority: 'P0' },
  ADMIN_REFUND_FAILED: { audience: 'admin', priority: 'P0' },
};

/** Events that must reach both sides of a booking — see §4 of the handoff doc. */
export const CLIENT_AND_PARTNER_EVENT_PAIRS: {
  client: EventKey;
  partner: EventKey;
}[] = [
  { client: 'BOOKING_CONFIRMED', partner: 'NEW_BOOKING_RECEIVED' },
  { client: 'BOOKING_CANCELLED_BY_CLIENT', partner: 'PARTNER_BOOKING_CANCELLED_BY_CLIENT' },
  { client: 'BOOKING_RESCHEDULED', partner: 'PARTNER_BOOKING_RESCHEDULED' },
  { client: 'BOOKING_REMINDER_24H', partner: 'PARTNER_BOOKING_REMINDER_24H' },
];
