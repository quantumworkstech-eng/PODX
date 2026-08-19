import type { EventKey } from './event-keys';

export type PartyInfo = {
  id?: string | null;
  email: string;
  name?: string | null;
};

export type BookingInfo = {
  id: string;
  bookingNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  durationHours: number;
  participants?: number | null;
  packageName?: string | null;
  addOns: { name: string; price: number; qty: number }[];
  studioId: string;
  studioName: string;
  studioAddress: string;
  paymentId?: string | null;
};

export type StudioInfo = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
};

export type PaymentInfo = {
  id?: string | null;
  providerPaymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
};

export type PayoutInfo = {
  id: string;
  amount: number;
  referenceNumber?: string | null;
  failureReason?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  method?: string | null;
};

/**
 * What a controller passes to `emitNotification`. Everything is optional — the
 * service hydrates whatever the template needs from the ids it is given.
 */
export type NotificationContext = {
  clientId?: string | null;
  partnerId?: string | null;
  bookingId?: string | null;
  studioId?: string | null;
  paymentId?: string | null;
  payoutId?: string | null;
  /** Explicit recipient when there is no user row yet (signup OTP, etc). */
  email?: string | null;
  name?: string | null;
  /** Overrides the derived duplicate-suppression key. */
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fully hydrated data handed to a template renderer. */
export type RenderContext = {
  eventKey: EventKey;
  recipient: PartyInfo;
  booking?: BookingInfo | null;
  studio?: StudioInfo | null;
  payment?: PaymentInfo | null;
  payout?: PayoutInfo | null;
  client?: PartyInfo | null;
  partner?: PartyInfo | null;
  metadata: Record<string, unknown>;
  appUrl: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
};
