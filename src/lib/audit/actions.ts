/**
 * Audit action and module taxonomy.
 *
 * Two groups are defined:
 *
 *  - the standard SaaS taxonomy (authentication, users, files, settings,
 *    billing, data) which applies to any product, and
 *  - the domain actions for this product. This platform is a studio *booking
 *    marketplace*, so its records are studios, bookings, rooms, packages,
 *    add-ons and payouts rather than podcasts and episodes. The podcast/episode
 *    actions are retained so recordings made against a future content module
 *    remain valid, but nothing emits them today.
 */

export const AUDIT_ACTIONS = [
  // Authentication
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',

  // Users
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'ROLE_CHANGED',

  // Podcasts (reserved — no content module in this product yet)
  'PODCAST_CREATED',
  'PODCAST_UPDATED',
  'PODCAST_DELETED',
  'PODCAST_PUBLISHED',
  'PODCAST_UNPUBLISHED',

  // Episodes (reserved)
  'EPISODE_CREATED',
  'EPISODE_UPDATED',
  'EPISODE_DELETED',
  'EPISODE_PUBLISHED',
  'EPISODE_UNPUBLISHED',
  'EPISODE_SCHEDULED',
  'EPISODE_UNSCHEDULED',
  'EPISODE_AUDIO_UPLOADED',
  'EPISODE_AUDIO_DELETED',

  // Guests
  'GUEST_CREATED',
  'GUEST_UPDATED',
  'GUEST_DELETED',

  // Files
  'FILE_UPLOADED',
  'FILE_DELETED',
  'FILE_DOWNLOADED',

  // Settings & integrations
  'SETTINGS_UPDATED',
  'INTEGRATION_CONNECTED',
  'INTEGRATION_DISCONNECTED',

  // Subscription / billing
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_CHANGED',
  'SUBSCRIPTION_CANCELLED',

  // Data & API
  'DATA_EXPORTED',
  'DATA_IMPORTED',
  'API_KEY_CREATED',
  'API_KEY_REVOKED',

  // ── Domain: studios ───────────────────────────────────────────────────────
  'STUDIO_CREATED',
  'STUDIO_UPDATED',
  'STUDIO_DELETED',
  'STUDIO_SUBMITTED',
  'STUDIO_APPROVED',
  'STUDIO_REJECTED',
  'STUDIO_SUSPENDED',
  'STUDIO_ACTIVATED',

  // ── Domain: bookings ──────────────────────────────────────────────────────
  'BOOKING_CREATED',
  'BOOKING_UPDATED',
  'BOOKING_CANCELLED',
  'BOOKING_RESCHEDULED',
  'BOOKING_STATUS_CHANGED',

  // ── Domain: payments ──────────────────────────────────────────────────────
  'PAYMENT_CAPTURED',
  'PAYMENT_FAILED',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
  'REFUND_FAILED',
  'PAYOUT_PROCESSED',
  'PAYOUT_FAILED',

  // ── Domain: partners ──────────────────────────────────────────────────────
  'PARTNER_APPLIED',
  'PARTNER_APPROVED',
  'PARTNER_REJECTED',
  'PARTNER_SUSPENDED',
  'PARTNER_REACTIVATED',

  // ── Domain: reviews & content ─────────────────────────────────────────────
  'REVIEW_CREATED',
  'REVIEW_DELETED',
  'REVIEW_RESPONDED',
  'CONTENT_PUBLISHED',
  'CONTENT_UPDATED',

  // Fallback for anything not yet classified
  'OTHER',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_MODULES = [
  'Authentication',
  'Users',
  'Podcasts',
  'Episodes',
  'Guests',
  'Files',
  'Settings',
  'Integrations',
  'Billing',
  'System',
  // Domain modules
  'Studios',
  'Bookings',
  'Payments',
  'Partners',
  'Reviews',
  'Content',
] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];

export type AuditStatus = 'SUCCESS' | 'FAILED';

/** Actions that destroy data — surfaced with a distinct treatment in the UI. */
export const DESTRUCTIVE_ACTIONS: ReadonlySet<string> = new Set([
  'USER_DELETED',
  'PODCAST_DELETED',
  'EPISODE_DELETED',
  'EPISODE_AUDIO_DELETED',
  'GUEST_DELETED',
  'FILE_DELETED',
  'STUDIO_DELETED',
  'REVIEW_DELETED',
  'BOOKING_CANCELLED',
  'SUBSCRIPTION_CANCELLED',
  'API_KEY_REVOKED',
  'USER_DEACTIVATED',
  'PARTNER_SUSPENDED',
  'STUDIO_SUSPENDED',
  'INTEGRATION_DISCONNECTED',
]);

/** Rough grouping used for colour in the UI. */
export function actionTone(action: string): 'danger' | 'success' | 'warning' | 'neutral' {
  if (DESTRUCTIVE_ACTIONS.has(action)) return 'danger';
  if (/_FAILED$/.test(action)) return 'danger';
  if (/(_CREATED|_APPROVED|_PUBLISHED|_ACTIVATED|_COMPLETED|_CAPTURED|_PROCESSED|_CONNECTED|_REACTIVATED)$/.test(action)) {
    return 'success';
  }
  if (/(_UPDATED|_CHANGED|_RESCHEDULED|_SUBMITTED|_INITIATED|_APPLIED|_REQUESTED)$/.test(action)) {
    return 'warning';
  }
  return 'neutral';
}

/** "USER_ROLE_CHANGED" → "User Role Changed" */
export function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
