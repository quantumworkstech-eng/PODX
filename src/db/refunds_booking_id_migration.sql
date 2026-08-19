-- ============================================================
-- refunds.booking_id
--
-- `refunds` was created with only payment_id, but three call sites address
-- refunds by booking:
--   * GET  /api/admin/bookings/[id]   — lists a booking's refunds
--   * PATCH /api/admin/bookings/[id]  — action=force_refund inserts one
--   * PATCH /api/bookings/[id]        — action=cancel records the policy refund
-- Without this column those queries fail with 42703 (undefined_column): the
-- admin detail page shows no refunds and the inserts are rejected.
--
-- Run with: npm run db:migrate-refund-booking-id
-- ============================================================

ALTER TABLE refunds
    ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Backfill from the linked payment so existing rows are addressable by booking.
UPDATE refunds r
   SET booking_id = p.booking_id
  FROM payments p
 WHERE r.payment_id = p.id
   AND r.booking_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
