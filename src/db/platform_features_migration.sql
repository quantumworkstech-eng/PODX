-- ============================================================
-- PodX Platform Features Migration
-- Admin Panel + Notifications + Reviews
-- Run this AFTER the base schema.sql
-- ============================================================

-- Add review_status column to studios if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='studios' AND column_name='review_status'
  ) THEN
    ALTER TABLE studios ADD COLUMN review_status TEXT DEFAULT 'pending_review';
    COMMENT ON COLUMN studios.review_status IS 'pending_review | approved | rejected | suspended';
  END IF;
END
$$;

-- Add latitude/longitude to studios if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='studios' AND column_name='latitude'
  ) THEN
    ALTER TABLE studios ADD COLUMN latitude NUMERIC(10, 7);
    ALTER TABLE studios ADD COLUMN longitude NUMERIC(10, 7);
  END IF;
END
$$;

-- Ensure notifications table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notifications' AND column_name='action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url TEXT;
  END IF;
END
$$;

-- Create index on studios.review_status for admin filtering
CREATE INDEX IF NOT EXISTS idx_studios_review_status ON studios(review_status);

-- Create index on notifications for real-time queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Create index on reviews for studio pages
CREATE INDEX IF NOT EXISTS idx_reviews_studio_status ON reviews(studio_id, status) WHERE status = 'published';

-- Create index on review_responses
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);

-- Ensure refunds table has status index
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);

-- ============================================================
-- Enable Supabase Realtime for notifications table
-- Run this in Supabase Dashboard → Database → Replication
-- or via the SQL editor:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- Row Level Security (RLS) Policies for notifications
-- ============================================================

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "users_read_own_notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Service role can insert notifications (admin/system)
CREATE POLICY "service_role_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- RLS for reviews
-- ============================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read published reviews
CREATE POLICY "anyone_read_published_reviews"
  ON reviews FOR SELECT
  USING (status = 'published');

-- Authenticated users can insert reviews for their own bookings
CREATE POLICY "users_insert_own_reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Review authors can delete their own reviews
CREATE POLICY "users_delete_own_reviews"
  ON reviews FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- RLS for review_responses
-- ============================================================

ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read review responses
CREATE POLICY "anyone_read_review_responses"
  ON review_responses FOR SELECT
  USING (true);

-- Studio owners can insert responses (validated in application layer)
CREATE POLICY "service_role_insert_responses"
  ON review_responses FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Sample notification types reference
-- ============================================================
-- booking_confirmed    — Podcaster: booking confirmed
-- booking_cancelled    — Podcaster: booking cancelled
-- refund_processed     — Podcaster: refund done
-- studio_rescheduled   — Podcaster: studio changed time
-- new_booking          — Partner: new booking received
-- cancellation_request — Partner: user wants to cancel
-- reschedule_request   — Partner: user wants to reschedule
-- new_review           — Partner: new review received
-- studio_approved      — Partner: studio approved by admin
-- studio_rejected      — Partner: studio rejected by admin
-- new_partner_signup   — Admin: new partner registered
-- refund_request       — Admin: refund requested
-- policy_conflict      — Admin: policy violation
