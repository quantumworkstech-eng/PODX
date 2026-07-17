-- PodX production database bootstrap
-- Generated from schema.sql followed by all *_migration.sql files in alphabetical order.
-- Run this file only once against a new, empty database.
-- ===== BEGIN schema.sql =====
-- PodX Database Schema
-- PostgreSQL Schema for Podcast Studio Marketplace & Management Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shared public bucket for all server-side image uploads.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'studio-images',
    'studio-images',
    TRUE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- Core identity table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    auth_provider TEXT DEFAULT 'email',      -- google / email / etc
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User metadata separated from auth
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company_name TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Flexible role system
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,          -- podcaster / studio_owner / admin / editor
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
    ('podcaster', 'Content creator who books studios'),
    ('studio_owner', 'Owner or manager of podcast studios'),
    ('admin', 'Platform administrator'),
    ('editor', 'Post-production specialist');

-- ============================================
-- CITIES TABLE
-- ============================================

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cities
INSERT INTO cities (name, slug, image_url, display_order) VALUES 
    ('Mumbai', 'mumbai', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80', 1),
    ('Delhi', 'delhi', 'https://images.unsplash.com/photo-1585506935092-10651126cebb?w=800&q=80', 2),
    ('Bangalore', 'bangalore', 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=800&q=80', 3),
    ('Hyderabad', 'hyderabad', 'https://images.unsplash.com/photo-1613156730504-7b66c56f3ae8?w=800&q=80', 4),
    ('Pune', 'pune', 'https://images.unsplash.com/photo-1557191446-6f1a73a2fcc1?w=800&q=80', 5),
    ('Chennai', 'chennai', 'https://images.unsplash.com/photo-1580637249871-a1119e27f9d9?w=800&q=80', 6),
    ('Kolkata', 'kolkata', 'https://images.unsplash.com/photo-1583508916039-35a4d5c78da4?w=800&q=80', 7),
    ('Dubai', 'dubai', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', 8);

-- ============================================
-- 2. STUDIOS & ROOMS
-- ============================================

-- Studios table
CREATE TABLE studios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    short_description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    featured_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Studio images
CREATE TABLE studio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Studio amenities/features
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    category TEXT              -- tech / comfort / services / accessibility
);

-- Studio amenities junction
CREATE TABLE studio_amenities (
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (studio_id, amenity_id)
);

-- Insert default amenities
INSERT INTO amenities (name, icon, category) VALUES 
    ('Free WiFi', 'wifi', 'tech'),
    ('Air Conditioning', 'wind', 'comfort'),
    ('Parking Available', 'car', 'services'),
    ('Wheelchair Accessible', 'accessibility', 'accessibility'),
    ('Green Room', 'sofa', 'comfort'),
    ('Kitchen/Cafe', 'coffee', 'services'),
    ('Waiting Area', 'users', 'comfort'),
    ('24/7 Access', 'clock', 'services');

-- Rooms within studios
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 1,
    price_per_hour NUMERIC(10, 2) NOT NULL,
    min_booking_hours INTEGER DEFAULT 1,
    max_booking_hours INTEGER DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    featured_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room images
CREATE TABLE room_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment catalog
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,     -- mic / camera / lighting / mixer / headphones / accessories
    brand TEXT,
    model TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room equipment junction
CREATE TABLE room_equipment (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    PRIMARY KEY (room_id, equipment_id)
);

-- Insert default equipment
INSERT INTO equipment (name, description, category, brand, model) VALUES 
    ('Shure SM7B', 'Professional dynamic microphone', 'mic', 'Shure', 'SM7B'),
    ('Sony FX3', 'Full-frame cinema camera', 'camera', 'Sony', 'FX3'),
    ('Rode PodMic', 'Dynamic podcasting microphone', 'mic', 'Rode', 'PodMic'),
    ('Elgato Key Light', 'Professional studio lighting', 'lighting', 'Elgato', 'Key Light'),
    ('Audio-Technica ATH-M50x', 'Professional studio headphones', 'headphones', 'Audio-Technica', 'ATH-M50x'),
    ('Zoom PodTrak P4', 'Portable podcast recorder', 'mixer', 'Zoom', 'PodTrak P4'),
    ('Canon EOS R5', 'Mirrorless camera', 'camera', 'Canon', 'EOS R5'),
    ('Aputure 120D', 'LED video light', 'lighting', 'Aputure', '120D Mark II');

-- ============================================
-- 3. AVAILABILITY & SCHEDULING
-- ============================================

-- Precomputed bookable slots (important for performance)
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price_override NUMERIC(10, 2),  -- Special pricing for this slot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Studio operating hours
CREATE TABLE studio_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, 6=Saturday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(studio_id, day_of_week)
);

-- ============================================
-- 4. BOOKINGS SYSTEM
-- ============================================

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE,  -- Human-readable booking ID (e.g., PODX-2025-0001)
    user_id UUID REFERENCES users(id),
    room_id UUID REFERENCES rooms(id),
    studio_id UUID REFERENCES studios(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending / confirmed / cancelled / completed / no_show
    total_price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking guests (additional people attending)
CREATE TABLE booking_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking add-ons (extra services)
CREATE TABLE booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1
);

-- Cancellation policies per studio
CREATE TABLE cancellation_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    hours_before INTEGER NOT NULL,
    refund_percentage NUMERIC(5, 2) NOT NULL CHECK (refund_percentage BETWEEN 0 AND 100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. PAYMENTS & BILLING
-- ============================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    provider TEXT NOT NULL,  -- stripe / razorpay / paypal
    provider_payment_id TEXT,
    provider_customer_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending',  -- pending / processing / succeeded / failed / refunded / partially_refunded
    payment_method TEXT,  -- card / upi / netbanking / wallet
    receipt_url TEXT,
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    provider_refund_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',  -- pending / succeeded / failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    payment_id UUID REFERENCES payments(id),
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'draft',  -- draft / issued / paid / cancelled
    invoice_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet/Store credits
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL,  -- credit / debit
    description TEXT,
    reference_type TEXT,  -- booking / refund / topup
    reference_id UUID,
    balance_after NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. RECORDING SESSIONS & ASSETS
-- ============================================

-- Recording sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    studio_id UUID REFERENCES studios(id),
    room_id UUID REFERENCES rooms(id),
    session_code TEXT UNIQUE,  -- For easy reference
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    status TEXT DEFAULT 'scheduled',  -- scheduled / in_progress / completed / cancelled
    engineer_id UUID REFERENCES users(id),  -- Assigned studio engineer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media assets (recordings, files)
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,  -- audio / video / image / document / thumbnail
    file_format TEXT,  -- mp3 / mp4 / wav / mov / etc
    file_size BIGINT,  -- In bytes
    duration INTEGER,  -- In seconds (for audio/video)
    uploaded_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session notes/annotations
CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note_type TEXT DEFAULT 'general',  -- general / timestamp / edit_mark / feedback
    content TEXT NOT NULL,
    timestamp INTEGER,  -- For audio/video timestamp markers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. POST-PRODUCTION WORKFLOW
-- ============================================

-- Production tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT,  -- editing / sound_mix / color_grade / thumbnail / show_notes / distribution
    priority TEXT DEFAULT 'medium',  -- low / medium / high / urgent
    status TEXT DEFAULT 'pending',  -- pending / in_progress / in_review / completed / cancelled
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours NUMERIC(4, 2),
    actual_hours NUMERIC(4, 2),
    price NUMERIC(10, 2),  -- For paid post-production services
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task attachments
CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name TEXT,
    file_url TEXT,
    file_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task comments
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,  -- Internal team notes vs client-facing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task status history
CREATE TABLE task_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. REVIEWS & RATINGS
-- ============================================

-- Studio reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT,
    is_verified BOOLEAN DEFAULT FALSE,  -- Verified booking
    helpful_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',  -- pending / published / rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, user_id, booking_id)
);

-- Review responses (studio owner replies)
CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. NOTIFICATIONS & MESSAGING
-- ============================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,  -- booking_confirmed / booking_reminder / payment_success / task_assigned / etc
    title TEXT NOT NULL,
    content TEXT,
    data JSONB,  -- Structured data related to notification
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_booking_confirmation BOOLEAN DEFAULT TRUE,
    email_booking_reminder BOOLEAN DEFAULT TRUE,
    email_payment_receipts BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    sms_booking_reminder BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- 10. ANALYTICS & METRICS
-- ============================================

-- Episode metrics (for distributed content)
CREATE TABLE episode_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    episode_title TEXT,
    platform TEXT NOT NULL,  -- spotify / youtube / apple_podcasts / google_podcasts / etc
    listens INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Studio analytics
CREATE TABLE studio_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id UUID REFERENCES studios(id),
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_revenue NUMERIC(12, 2) DEFAULT 0,
    total_hours_booked NUMERIC(6, 2) DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    avg_rating NUMERIC(3, 2),
    page_views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(studio_id, date)
);

-- User activity log
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,  -- booking / studio / session / etc
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users & Auth
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Cities
CREATE INDEX idx_cities_active ON cities(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_cities_display_order ON cities(display_order);

-- Studios
CREATE INDEX idx_studios_owner_id ON studios(owner_id);
CREATE INDEX idx_studios_city ON studios(city);
CREATE INDEX idx_studios_is_active ON studios(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_studios_location ON studios(latitude, longitude);

-- Rooms
CREATE INDEX idx_rooms_studio_id ON rooms(studio_id);
CREATE INDEX idx_rooms_price ON rooms(price_per_hour);

-- Availability
CREATE INDEX idx_availability_room_id ON availability_slots(room_id);
CREATE INDEX idx_availability_time ON availability_slots(start_time, end_time);
CREATE INDEX idx_availability_available ON availability_slots(room_id, start_time) WHERE is_available = TRUE;

-- Bookings
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time ON bookings(start_time, end_time);

-- Sessions
CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Media
CREATE INDEX idx_media_session_id ON media_assets(session_id);

-- Tasks
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Analytics
CREATE INDEX idx_analytics_studio_date ON studio_analytics(studio_id, date);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ===== END schema.sql =====
-- ===== BEGIN admin_bookings_migration.sql =====
-- Migration: Add admin-created booking tracking
-- Run this in your Supabase SQL editor
--
-- Fixes admin "Add Booking" errors when API writes `created_by_admin`.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;
-- ===== END admin_bookings_migration.sql =====
-- ===== BEGIN admin_credentials_migration.sql =====
-- Admin credentials table
-- Manually insert admin emails here; password_hash is null until first login
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- NULL until admin sets password on first login
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: insert an admin email (admin sets their password on first visit)
-- INSERT INTO admin_credentials (email) VALUES ('your-admin@example.com');
-- ===== END admin_credentials_migration.sql =====
-- ===== BEGIN admin_studio_audit_migration.sql =====
-- Admin audit fields on studios (run once on your database)
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS admin_last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_last_edited_by TEXT;

COMMENT ON COLUMN studios.admin_last_edited_at IS 'Last time an admin saved changes via admin panel';
COMMENT ON COLUMN studios.admin_last_edited_by IS 'Admin email that last edited this studio';
-- ===== END admin_studio_audit_migration.sql =====
-- ===== BEGIN admin_system_migration.sql =====
-- Admin System Migration
-- Run this in your Supabase SQL editor

-- ==========================================
-- 1. PLATFORM ADD-ONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default add-ons
INSERT INTO platform_addons (name, description, price, category, is_active) VALUES
  ('Video Editing', 'Professional video editing for your podcast episode', 2500, 'post-production', true),
  ('Reels Creation', 'Create short-form social media reels from your content', 1500, 'social-media', true),
  ('Thumbnail Design', 'Custom thumbnail design for YouTube/podcast platforms', 800, 'design', true),
  ('Social Clips', 'Extract and edit highlight clips for social media', 1200, 'social-media', true),
  ('Transcription', 'Full episode transcription (per hour of audio)', 600, 'content', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. BOOKING RESCHEDULE REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS booking_reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES users(id),
  requested_by_role TEXT CHECK (requested_by_role IN ('customer', 'partner', 'admin')) DEFAULT 'customer',
  old_date DATE,
  old_start_time TEXT,
  old_end_time TEXT,
  new_date DATE,
  new_start_time TEXT,
  new_end_time TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. ADMIN AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- ==========================================
-- 4. ADMINS TABLE (for admin management)
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  added_by_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. PLATFORM SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_email TEXT
);

-- Seed default settings
INSERT INTO platform_settings (key, value, category) VALUES
  ('platform_commission_percent', '10', 'payments'),
  ('gst_percent', '18', 'payments'),
  ('default_currency', 'INR', 'general'),
  ('default_language', 'en', 'general'),
  ('min_booking_hours', '1', 'bookings'),
  ('max_booking_hours', '8', 'bookings'),
  ('cancellation_full_refund_hours', '48', 'bookings'),
  ('cancellation_partial_refund_hours', '24', 'bookings'),
  ('cancellation_partial_refund_percent', '50', 'bookings'),
  ('maintenance_mode', 'false', 'system'),
  ('partner_min_payout', '1000', 'payments')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 6. RLS POLICIES
-- ==========================================
ALTER TABLE platform_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reschedule_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by admin panel via supabaseAdmin)
CREATE POLICY "Service role full access on platform_addons"
  ON platform_addons FOR ALL USING (true);

CREATE POLICY "Service role full access on booking_reschedule_requests"
  ON booking_reschedule_requests FOR ALL USING (true);

CREATE POLICY "Service role full access on admin_audit_logs"
  ON admin_audit_logs FOR ALL USING (true);

CREATE POLICY "Service role full access on admins"
  ON admins FOR ALL USING (true);

CREATE POLICY "Service role full access on platform_settings"
  ON platform_settings FOR ALL USING (true);

-- Public can read active add-ons
CREATE POLICY "Public read active addons"
  ON platform_addons FOR SELECT USING (is_active = true);
-- ===== END admin_system_migration.sql =====
-- ===== BEGIN booking_guests_phone_migration.sql =====
-- Add guest_phone column to booking_guests table
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS guest_phone TEXT;
-- ===== END booking_guests_phone_migration.sql =====
-- ===== BEGIN booking_tracking_columns_migration.sql =====
-- Migration: Add booking tracking columns required by the booking API
-- These columns are also added by whitelabel_migration.sql, but this file
-- can be run independently if the full whitelabel migration hasn't been applied.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'marketplace',
    ADD COLUMN IF NOT EXISTS whitelabel_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);
-- ===== END booking_tracking_columns_migration.sql =====
-- ===== BEGIN buffer_time_migration.sql =====
-- ============================================================
-- PodX Buffer Time Migration
-- Adds per-studio buffer time (cleanup/prep time after bookings)
-- ============================================================

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (buffer_minutes >= 0);

COMMENT ON COLUMN studios.buffer_minutes IS
  'Minutes of buffer added after each booking for cleanup/prep. '
  'These slots are blocked for new bookings but not shown to clients.';
-- ===== END buffer_time_migration.sql =====
-- ===== BEGIN cities_migration.sql =====
-- Cities Table Migration
-- Run this separately to add cities to existing database

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default cities (will fail if already exists - that's OK)
INSERT INTO cities (name, slug, image_url, display_order) VALUES 
    ('Mumbai', 'mumbai', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80', 1),
    ('Delhi', 'delhi', 'https://images.unsplash.com/photo-1585506935092-10651126cebb?w=800&q=80', 2),
    ('Bangalore', 'bangalore', 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=800&q=80', 3),
    ('Hyderabad', 'hyderabad', 'https://images.unsplash.com/photo-1613156730504-7b66c56f3ae8?w=800&q=80', 4),
    ('Pune', 'pune', 'https://images.unsplash.com/photo-1557191446-6f1a73a2fcc1?w=800&q=80', 5),
    ('Chennai', 'chennai', 'https://images.unsplash.com/photo-1580637249871-a1119e27f9d9?w=800&q=80', 6),
    ('Kolkata', 'kolkata', 'https://images.unsplash.com/photo-1583508916039-35a4d5c78da4?w=800&q=80', 7),
    ('Dubai', 'dubai', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', 8)
ON CONFLICT (slug) DO NOTHING;

-- Add trigger (PostgreSQL requires checking differently)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_cities_updated_at'
    ) THEN
        CREATE TRIGGER update_cities_updated_at 
        BEFORE UPDATE ON cities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add indexes if not exists
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cities_display_order ON cities(display_order);
-- ===== END cities_migration.sql =====
-- ===== BEGIN coupon_migration.sql =====
-- ============================================================
-- PodX Coupon / Promo Code Migration
-- ============================================================
-- Apply once to your database (required for partner coupons):
--   • Supabase: SQL Editor → paste this file → Run
--   • Or: DATABASE_URL=... npm run db:migrate-coupons (use direct port 5432 URI for DDL)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,  -- NULL = all partner studios

    code TEXT NOT NULL,
    description TEXT,

    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),

    -- Guard rails
    min_booking_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),   -- cap for percentage discounts (NULL = no cap)

    -- Usage limits
    max_uses INTEGER,                     -- NULL = unlimited
    uses_count INTEGER DEFAULT 0,

    -- Validity window
    valid_from  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,  -- NULL = no expiry

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id, code)
);

CREATE INDEX IF NOT EXISTS idx_partner_coupons_partner_id ON partner_coupons(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_code      ON partner_coupons(code);
CREATE INDEX IF NOT EXISTS idx_partner_coupons_studio_id ON partner_coupons(studio_id);

-- Store coupon info on the booking (in notes JSON is fine; but add explicit columns too)
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS coupon_code      TEXT,
    ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10, 2) DEFAULT 0;

-- Track which coupon was used per booking (for usage counting + audit)
CREATE TABLE IF NOT EXISTS coupon_uses (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id  UUID REFERENCES partner_coupons(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id)   ON DELETE SET NULL,
    discount_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id)
);

-- updated_at trigger (idempotent for re-runs)
DROP TRIGGER IF EXISTS update_partner_coupons_updated_at ON partner_coupons;
CREATE TRIGGER update_partner_coupons_updated_at
    BEFORE UPDATE ON partner_coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ===== END coupon_migration.sql =====
-- ===== BEGIN feature_access_migration.sql =====
-- ============================================================
-- PodX Feature Access Control System Migration
-- Creates features catalog + per-partner feature access tables
-- Run this AFTER base schema.sql
-- ============================================================

-- Master features catalog
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_default_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-partner feature access overrides
CREATE TABLE IF NOT EXISTS partner_feature_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES features(feature_key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_id, feature_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_feature_access_partner ON partner_feature_access(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_feature_access_key ON partner_feature_access(feature_key);

-- Seed default feature catalog
INSERT INTO features (feature_key, feature_name, description, category, is_default_enabled) VALUES
  ('studio_create',       'Create Studio',          'Allow partner to create new studios',                    'studio',       true),
  ('studio_edit',         'Edit Studio',            'Allow partner to edit existing studios',                 'studio',       true),
  ('booking_management',  'Booking Management',     'View and manage all bookings',                           'booking',      true),
  ('client_management',   'Client Management',      'View and manage clients list',                           'booking',      true),
  ('coupon_management',   'Coupon Management',       'Create and manage discount coupons',                     'booking',      true),
  ('policies_management', 'Policies Management',    'Set cancellation and rescheduling policies',             'booking',      true),
  ('analytics_access',    'Analytics',              'Access the analytics dashboard',                         'analytics',    true),
  ('addons_management',   'Add-ons Management',     'Create and manage studio add-ons and equipment',         'studio',       true),
  ('reviews_management',  'Reviews Management',     'View and respond to customer reviews',                   'studio',       true),
  ('landing_builder',     'Landing Page Builder',   'Build and publish a custom partner landing page',        'branding',     true),
  ('white_label',         'White Label Branding',   'Custom branding, colors, and logo on the partner page',  'branding',     false),
  ('custom_domain',       'Custom Domain',          'Use a custom domain for the partner page',               'branding',     false),
  ('calendar_integration','Calendar Integration',   'Sync bookings with Google Calendar',                     'integrations', true),
  ('payout_access',       'Earnings & Payouts',     'View earnings reports and manage payout settings',       'earnings',     true),
  ('billing_access',      'Billing & Plans',        'Access subscription billing and plan management',        'billing',      true)
ON CONFLICT (feature_key) DO NOTHING;
-- ===== END feature_access_migration.sql =====
-- ===== BEGIN landing_cms_migration.sql =====
CREATE TABLE IF NOT EXISTS landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default content for all sections
INSERT INTO landing_content (section, content) VALUES
('hero', '{
  "headline": "Where Great Podcasts Begin",
  "subheadline": "Over 500 podcasters, creators, and brands produce their content with Yanisa Studio. Book world-class podcast studios with professional equipment and expert support.",
  "cta_primary_text": "Browse Studios",
  "cta_primary_url": "/studios",
  "cta_secondary_text": "Book a Session",
  "cta_secondary_url": "/book",
  "media_type": "image",
  "media_url": "",
  "overlay_opacity": 60
}'),
('stats', '[
  {"number": "500+", "label": "Creators"},
  {"number": "50+", "label": "Studios"},
  {"number": "10K+", "label": "Hours Recorded"},
  {"number": "#1", "label": "In India"}
]'),
('marquee', '[
  "Spotify", "YouTube", "Apple Podcasts", "Google Podcasts", "Amazon Music", "JioSaavn", "Gaana", "Audible", "iHeartRadio", "Pocket Casts"
]'),
('we_help_create', '[
  "Podcasts", "Viral Videos", "Masterclasses", "YouTube Videos", "Video Content", "Audio Dramas"
]'),
('services', '[
  {"title": "Hands-on Strategy Design", "description": "Expert podcast concept and strategy tailored to your brand. We help you define your niche, audience, and content calendar for maximum impact.", "image_url": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80"},
  {"title": "End-to-End Production", "description": "Record in our industry-leading studios with trained operators. Full post-production including editing, mixing, mastering, and show notes.", "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80"},
  {"title": "Distribution & Promotion", "description": "Get your podcast on all major platforms. We handle distribution, create viral clips, and monitor your growth across channels.", "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
]'),
('how_it_works', '[
  {"step": "01", "title": "Choose Your Studio", "description": "Browse our curated studios across India. Filter by city, capacity, equipment, and price to find your perfect match."},
  {"step": "02", "title": "Book Your Slot", "description": "Pick a date and time that works for you. Instant confirmation with flexible cancellation up to 48 hours before."},
  {"step": "03", "title": "Create Your Content", "description": "Arrive and get started. Our trained operators handle all the technical setup so you can focus on creating."},
  {"step": "04", "title": "Publish & Grow", "description": "Receive your polished audio and video files. Add our editing and distribution services for full end-to-end delivery."}
]'),
('testimonials', '[
  {"name": "Rahul Sharma", "role": "Content Creator, 250K followers", "quote": "Yanisa Studio completely transformed my podcast quality. The equipment is world-class and the operators know exactly what they''re doing.", "avatar_url": ""},
  {"name": "Priya Mehta", "role": "Founder, TechTalk Podcast", "quote": "I have been recording here for 6 months and every session is flawless. The team is professional, the studios are stunning.", "avatar_url": ""},
  {"name": "Arjun Kapoor", "role": "CEO, 1.2M YouTube subscribers", "quote": "Best podcast studio network in India. The booking process is seamless and the quality speaks for itself. Highly recommended.", "avatar_url": ""}
]'),
('bundles', '[
  {"name": "Starter", "price": "₹5,999", "billing": "per month", "description": "Perfect for beginners and solo podcasters", "features": ["2 studio sessions/month", "Basic editing", "RSS feed setup", "Email support"]},
  {"name": "Creator", "price": "₹12,999", "billing": "per month", "description": "For serious content creators scaling their brand", "features": ["6 studio sessions/month", "Full editing + mixing", "Social clips (3/episode)", "Distribution to all platforms", "Priority booking", "Dedicated account manager"]},
  {"name": "Studio Pro", "price": "₹29,999", "billing": "per month", "description": "Enterprise-grade for agencies and high-volume creators", "features": ["Unlimited sessions", "Full post-production suite", "12 social clips/episode", "Custom branding package", "White-label option", "24/7 priority support"]}
]'),
('faq', '[
  {"question": "What equipment is available in the studios?", "answer": "All studios are equipped with professional-grade microphones, headphones, audio interfaces, mixers, acoustic panels, and lighting. Video-enabled studios also include cameras and green screens."},
  {"question": "Do I need experience to book a studio?", "answer": "Not at all! Our trained operators are there to handle all technical aspects. You just need to show up and start recording."},
  {"question": "What is the cancellation policy?", "answer": "You can cancel for a full refund up to 48 hours before your session. Cancellations 24–48 hours before receive a 50% refund. No refund for cancellations under 24 hours."},
  {"question": "How do I get my recordings after the session?", "answer": "Your raw files are shared via a secure download link within 2 hours of your session. Edited files (if purchased) are delivered within 3–5 business days."},
  {"question": "Can I bring guests or co-hosts?", "answer": "Absolutely! Each studio has a capacity of 2–6 people. Check the studio listing for exact capacity and microphone count."},
  {"question": "Do you offer editing services?", "answer": "Yes! We offer full audio/video editing, mixing, mastering, transcript creation, show notes, and social media clip packages as add-ons."},
  {"question": "Is there a membership or bundle option?", "answer": "Yes, our bundle plans offer significant discounts for regular creators. Check our pricing section or contact us for custom enterprise plans."},
  {"question": "How do I find the right studio for my needs?", "answer": "Use our studio browser to filter by city, capacity, and equipment. Each listing shows photos, full equipment lists, and pricing. Contact our team if you need help choosing."}
]'),
('footer', '{
  "tagline": "India''s premier podcast studio network. Book world-class studios in your city.",
  "address": "Mumbai, Delhi, Bangalore, Hyderabad & more",
  "hours": "Monday – Saturday, 9:00 AM – 9:00 PM",
  "email": "support@yanisa.in",
  "phone": "+91 98765 43210",
  "instagram_url": "https://instagram.com",
  "linkedin_url": "https://linkedin.com",
  "youtube_url": "https://youtube.com"
}'),
('nav', '{
  "logo_text": "Yanisa Studio",
  "nav_links": [
    {"label": "Studios", "url": "/studios"},
    {"label": "Services", "url": "/services"},
    {"label": "Pricing", "url": "#pricing"},
    {"label": "Contact Us", "url": "/contact"}
  ]
}')
ON CONFLICT (section) DO NOTHING;
-- ===== END landing_cms_migration.sql =====
-- ===== BEGIN otp_migration.sql =====
-- Migration: OTP-based email authentication
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verification_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email, used);
CREATE INDEX IF NOT EXISTS idx_email_otps_token ON email_otps(verification_token) WHERE verification_token IS NOT NULL;

-- Clean up expired OTPs automatically (optional, Supabase supports pg_cron)
-- SELECT cron.schedule('delete-expired-otps', '0 * * * *', 'DELETE FROM email_otps WHERE expires_at < NOW()');

-- Allow auth_provider to be 'email' for OTP users
-- (password_hash will be NULL for OTP users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
-- ===== END otp_migration.sql =====
-- ===== BEGIN partner_inventory_migration.sql =====
-- Partner reusable inventory: equipment (model + qty), services, add-ons
-- Run in Supabase SQL editor after reviewing.

-- ── Equipment catalog (per partner) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory TEXT NOT NULL CHECK (subcategory IN ('camera', 'mic', 'light', 'accessory')),
  model_name TEXT NOT NULL,
  default_quantity INTEGER NOT NULL DEFAULT 1 CHECK (default_quantity >= 1),
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_equipment_items_partner
  ON partner_equipment_items(partner_id);

-- Per-studio quantity override for catalog items
CREATE TABLE IF NOT EXISTS studio_partner_equipment (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  equipment_item_id UUID NOT NULL REFERENCES partner_equipment_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  PRIMARY KEY (studio_id, equipment_item_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_partner_equipment_studio ON studio_partner_equipment(studio_id);

-- ── Services catalog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory TEXT NOT NULL CHECK (subcategory IN ('editing', 'production', 'content_services')),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2),
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_service_items_partner ON partner_service_items(partner_id);

CREATE TABLE IF NOT EXISTS studio_partner_services (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  service_item_id UUID NOT NULL REFERENCES partner_service_items(id) ON DELETE CASCADE,
  PRIMARY KEY (studio_id, service_item_id)
);

-- ── Partner add-ons (studio / service / outsource) ────────────────────────────
CREATE TABLE IF NOT EXISTS partner_addon_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addon_kind TEXT NOT NULL CHECK (addon_kind IN ('studio', 'service', 'outsource')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_addon_items_partner ON partner_addon_items(partner_id);

CREATE TABLE IF NOT EXISTS studio_partner_addon_items (
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  partner_addon_id UUID NOT NULL REFERENCES partner_addon_items(id) ON DELETE CASCADE,
  enabled_for_booking BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (studio_id, partner_addon_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_partner_addon_studio ON studio_partner_addon_items(studio_id);

-- RLS (service role used by Next.js APIs — mirror other partner tables)
ALTER TABLE partner_equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_addon_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_partner_addon_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_partner_equipment_items" ON partner_equipment_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_equipment" ON studio_partner_equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_partner_service_items" ON partner_service_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_services" ON studio_partner_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_partner_addon_items" ON partner_addon_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_studio_partner_addon_items" ON studio_partner_addon_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public_read_studio_partner_equipment" ON studio_partner_equipment FOR SELECT USING (true);
CREATE POLICY "public_read_studio_partner_services" ON studio_partner_services FOR SELECT USING (true);
CREATE POLICY "public_read_partner_addon_items" ON partner_addon_items FOR SELECT USING (true);
CREATE POLICY "public_read_studio_partner_addon_items" ON studio_partner_addon_items FOR SELECT USING (true);
-- ===== END partner_inventory_migration.sql =====
-- ===== BEGIN partner_addon_thumbnail_migration.sql =====
-- Migration: Add thumbnail/type/category/quantity to partner_addon_items
-- Run this in Supabase SQL editor

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('equipment', 'service')) DEFAULT 'service';

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS addon_type TEXT;

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS quantity INTEGER
  NOT NULL DEFAULT 1 CHECK (quantity >= 1);

ALTER TABLE partner_addon_items
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- ===== END partner_addon_thumbnail_migration.sql =====
-- ===== BEGIN partner_landing_migration.sql =====
-- ============================================================
-- PodX Partner Landing Page Builder Migration
-- Creates tables for section-based landing pages per partner
-- Run this in your Supabase SQL editor
-- ============================================================

-- Landing page record (one per partner) — stores status + SEO metadata
CREATE TABLE IF NOT EXISTS partner_landing_pages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'published')),
  meta_title       TEXT,
  meta_description TEXT,
  og_image_url     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id)
);

-- Individual sections that make up the landing page
CREATE TABLE IF NOT EXISTS partner_landing_sections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL
                             CHECK (type IN (
                               'hero', 'studios', 'features', 'reviews',
                               'about', 'cta', 'contact', 'footer', 'custom'
                             )),
  order_index  INTEGER     NOT NULL DEFAULT 0,
  content_json JSONB       NOT NULL DEFAULT '{}',
  is_visible   BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_landing_sections_order
  ON partner_landing_sections(partner_id, order_index);

-- Section impression tracking (conversion analytics)
CREATE TABLE IF NOT EXISTS partner_section_impressions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id   UUID        REFERENCES partner_landing_sections(id) ON DELETE SET NULL,
  section_type TEXT        NOT NULL,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_impressions_partner
  ON partner_section_impressions(partner_id, viewed_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE partner_landing_pages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_landing_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_section_impressions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by Next.js API routes via supabaseAdmin)
CREATE POLICY "Service role full access on partner_landing_pages"
  ON partner_landing_pages FOR ALL USING (true);

CREATE POLICY "Service role full access on partner_landing_sections"
  ON partner_landing_sections FOR ALL USING (true);

CREATE POLICY "Service role full access on partner_section_impressions"
  ON partner_section_impressions FOR ALL USING (true);

-- Public can read published landing pages and their sections
CREATE POLICY "Public read published landing pages"
  ON partner_landing_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read landing sections"
  ON partner_landing_sections FOR SELECT
  USING (is_visible = true);

-- Public can insert impressions (anonymous analytics)
CREATE POLICY "Public insert impressions"
  ON partner_section_impressions FOR INSERT
  WITH CHECK (true);

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_landing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partner_landing_pages_updated_at
  BEFORE UPDATE ON partner_landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER trg_partner_landing_sections_updated_at
  BEFORE UPDATE ON partner_landing_sections
  FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();
-- ===== END partner_landing_migration.sql =====
-- ===== BEGIN platform_addon_fields_migration.sql =====
-- Platform Add-ons Fields Migration
-- Run this in your Supabase SQL editor

-- Add addon_type and thumbnail_url columns to platform_addons
ALTER TABLE platform_addons
  ADD COLUMN IF NOT EXISTS addon_type TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
-- ===== END platform_addon_fields_migration.sql =====
-- ===== BEGIN platform_features_migration.sql =====
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
-- ===== END platform_features_migration.sql =====
-- ===== BEGIN prevent_double_booking_migration.sql =====
-- Migration: Prevent double-booking via a PostgreSQL exclusion constraint
-- Requires the btree_gist extension (available by default in Supabase/PostgreSQL 9.6+)
-- Run this once in the Supabase SQL Editor

-- Enable the btree_gist extension needed for the exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint so two non-cancelled bookings for the same studio
-- cannot have overlapping time ranges.
-- If a booking has status = 'cancelled' it is excluded from the constraint.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    studio_id   WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status <> 'cancelled');
-- ===== END prevent_double_booking_migration.sql =====
-- ===== BEGIN reschedule_policy_migration.sql =====
-- Yanisa Studio: Reschedule cutoff per studio
-- Run this migration in your Supabase SQL editor

-- Add reschedule_cutoff_hours to studios table
-- Default: 48 hours (must reschedule at least 48h before session)
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS reschedule_cutoff_hours INTEGER NOT NULL DEFAULT 48;

-- Ensure cancellation_policies table exists with correct columns
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL,       -- cancel X+ hours before → this refund %
  refund_percentage INTEGER NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_policies_studio ON cancellation_policies(studio_id);

-- Seed default platform policy (applies when studio has no custom rules)
-- These are just reference rows; the app uses them as fallback when studio has none.
-- DO NOT insert here — let the app logic handle defaults.
-- ===== END reschedule_policy_migration.sql =====
-- ===== BEGIN studio_addons_migration.sql =====
-- ==========================================
-- studio_addons — per-studio add-on configuration
-- Run this in your Supabase SQL editor
-- ==========================================

CREATE TABLE IF NOT EXISTS studio_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  addon_id  UUID NOT NULL REFERENCES platform_addons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(studio_id, addon_id)
);

-- Enable RLS
ALTER TABLE studio_addons ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on studio_addons"
  ON studio_addons FOR ALL USING (true);

-- Public can read studio add-on associations
CREATE POLICY "Public read studio_addons"
  ON studio_addons FOR SELECT USING (true);
-- ===== END studio_addons_migration.sql =====
-- ===== BEGIN studio_draft_migration.sql =====
-- Migration: Add 'draft' to review_status CHECK so studios can be saved as drafts
-- Run this in Supabase SQL editor

-- Drop the existing CHECK constraint (Postgres generates the name from the column)
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_review_status_check;

-- Re-add with 'draft' included
ALTER TABLE studios
ADD CONSTRAINT studios_review_status_check
CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected'));

-- Existing rows are fine (they're all 'pending_review' or 'approved')
-- ===== END studio_draft_migration.sql =====
-- ===== BEGIN studio_packages_migration.sql =====
-- Migration: Create studio_packages table for custom per-studio booking packages
-- Run this once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS studio_packages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   UUID        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  price_per_hour  INTEGER NOT NULL DEFAULT 0,
  features    JSONB       NOT NULL DEFAULT '[]',
  is_popular  BOOLEAN     NOT NULL DEFAULT false,
  display_order INTEGER   NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studio_packages_studio_id_idx ON studio_packages (studio_id, display_order);
-- ===== END studio_packages_migration.sql =====
-- ===== BEGIN studio_review_migration.sql =====
-- Migration: Add review_status to studios table
-- Run this in Supabase SQL editor

ALTER TABLE studios
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending_review'
CHECK (review_status IN ('pending_review', 'approved', 'rejected'));

-- Update existing active studios to approved
UPDATE studios SET review_status = 'approved' WHERE is_active = TRUE;

-- Also add business_name to profiles if not exists (used by partner profile)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add role column to users table if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- ===== END studio_review_migration.sql =====
-- ===== BEGIN studio_status_migration.sql =====
-- Migration: Expand `studios.review_status` allowed values
-- Run this in Supabase SQL editor
--
-- Needed for admin actions like "pause" and "suspend" and for filtering by status.
-- `paused` / `suspended` keep the studio hidden from booking (is_active=false).
--
-- This migration is safe to run multiple times.

-- Drop existing CHECK constraint (name used in prior migrations)
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_review_status_check;

-- Re-add with additional statuses
ALTER TABLE studios
ADD CONSTRAINT studios_review_status_check
CHECK (
  review_status IN (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'paused',
    'suspended',
    'deleted'
  )
);
-- ===== END studio_status_migration.sql =====
-- ===== BEGIN subscription_migration.sql =====
-- ============================================================
-- PodX Partner Subscription Model Migration
-- Adds subscription plans, partner subscriptions, and payment tracking
-- ============================================================

-- ============================================================
-- 1. SUBSCRIPTION PLANS (Tier Configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'annual')),
    price NUMERIC(10, 2) NOT NULL,              -- in INR (not paise)
    max_studios INTEGER,                         -- NULL = unlimited
    commission_pct NUMERIC(5, 2) NOT NULL,       -- platform commission %
    whitelabel_enabled BOOLEAN DEFAULT FALSE,
    analytics_level TEXT DEFAULT 'basic'
        CHECK (analytics_level IN ('basic', 'full')),
    api_access BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '{}',                 -- extensibility
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tier, billing_cycle)
);

-- ============================================================
-- 2. PARTNER SUBSCRIPTIONS (Active Subscription per Partner)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'grace_period', 'expired', 'cancelled')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_end TIMESTAMP WITH TIME ZONE,   -- current_period_end + 7 days
    billing_cycle TEXT NOT NULL
        CHECK (billing_cycle IN ('monthly', 'annual')),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_partner_id
    ON partner_subscriptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_status
    ON partner_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_period_end
    ON partner_subscriptions(current_period_end);

-- ============================================================
-- 3. SUBSCRIPTION PAYMENTS (Per-Payment History)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES partner_subscriptions(id),
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    billing_cycle TEXT NOT NULL
        CHECK (billing_cycle IN ('monthly', 'annual')),
    plan_id UUID REFERENCES subscription_plans(id),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_partner_id
    ON subscription_payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_order_id
    ON subscription_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status
    ON subscription_payments(status);

-- ============================================================
-- 4. SEED SUBSCRIPTION PLANS (6 variants: 3 tiers × 2 cycles)
-- Annual = monthly × 10 (≈17% discount)
-- ============================================================

INSERT INTO subscription_plans
    (name, tier, billing_cycle, price, max_studios, commission_pct,
     whitelabel_enabled, analytics_level, api_access)
VALUES
    ('Basic Monthly',       'basic',      'monthly', 1999,   2,    10.00, FALSE, 'basic', FALSE),
    ('Basic Annual',        'basic',      'annual',  19990,  2,    10.00, FALSE, 'basic', FALSE),
    ('Pro Monthly',         'pro',        'monthly', 4999,   10,   8.00,  TRUE,  'full',  FALSE),
    ('Pro Annual',          'pro',        'annual',  49990,  10,   8.00,  TRUE,  'full',  FALSE),
    ('Enterprise Monthly',  'enterprise', 'monthly', 12999,  NULL, 5.00,  TRUE,  'full',  TRUE),
    ('Enterprise Annual',   'enterprise', 'annual',  129990, NULL, 5.00,  TRUE,  'full',  TRUE)
ON CONFLICT (tier, billing_cycle) DO NOTHING;

-- ============================================================
-- 5. ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE subscription_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments     ENABLE ROW LEVEL SECURITY;

-- Plans: publicly readable (active only)
CREATE POLICY sub_plans_public_read ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- Subscriptions: partner sees only their own row
CREATE POLICY partner_sub_select ON partner_subscriptions
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_sub_insert ON partner_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_sub_update ON partner_subscriptions
    FOR UPDATE USING (auth.uid() = partner_id);

-- Subscription payments: partner sees only their own
CREATE POLICY partner_sub_payments_select ON subscription_payments
    FOR SELECT USING (auth.uid() = partner_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_subscriptions_updated_at
    BEFORE UPDATE ON partner_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. AUTO-HIDE STUDIOS ON SUBSCRIPTION EXPIRY
-- When a subscription transitions to 'expired', mark all
-- studios owned by that partner as inactive (hidden from marketplace)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes TO 'expired'
    IF NEW.status = 'expired' AND OLD.status != 'expired' THEN
        UPDATE studios
        SET is_active = FALSE
        WHERE owner_id = NEW.partner_id
          AND is_active = TRUE;
    END IF;

    -- When status changes FROM 'expired' back to 'active' (re-subscription)
    -- Do NOT auto-reactivate studios — admin must review & re-approve
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_expiry
    AFTER UPDATE OF status ON partner_subscriptions
    FOR EACH ROW
    WHEN (NEW.status = 'expired' AND OLD.status != 'expired')
    EXECUTE FUNCTION handle_subscription_expiry();

-- ============================================================
-- Add equipment column to studios table
-- ============================================================
ALTER TABLE studios ADD COLUMN IF NOT EXISTS equipment text[] DEFAULT '{}';
-- ===== END subscription_migration.sql =====
-- ===== BEGIN video_url_migration.sql =====
-- Migration: Add video_url column to studios table
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE studios ADD COLUMN IF NOT EXISTS video_url TEXT;
-- ===== END video_url_migration.sql =====
-- ===== BEGIN whitelabel_migration.sql =====
-- ============================================================
-- PodX White-Label SaaS Migration
-- Adds partner branding, payout, client portal, and invoice tables
-- ============================================================

-- ============================================================
-- 1. PARTNER BRANDING (White-Label Configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    brand_name TEXT,
    partner_slug TEXT UNIQUE,               -- used in /p/{slug} paths
    logo_url TEXT,
    favicon_url TEXT,
    tagline TEXT,

    -- Colors
    primary_color TEXT DEFAULT '#D9FC67',
    secondary_color TEXT DEFAULT '#09090b',
    accent_color TEXT DEFAULT '#ffffff',
    background_color TEXT DEFAULT '#09090b',
    text_color TEXT DEFAULT '#ffffff',
    button_text_color TEXT DEFAULT '#000000',

    -- Typography
    font_family TEXT DEFAULT 'Inter',

    -- Booking page content
    booking_page_title TEXT,
    booking_page_description TEXT,

    -- Social links
    website_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    youtube_url TEXT,

    -- Contact details
    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,

    -- Email branding
    email_sender_name TEXT,
    email_sender_address TEXT,
    email_footer_text TEXT,

    -- Domain configuration
    subdomain TEXT UNIQUE,                  -- subdomain.podx.com
    custom_domain TEXT UNIQUE,              -- booking.partnerdomain.com
    domain_verified BOOLEAN DEFAULT FALSE,
    domain_verification_token TEXT,
    domain_verified_at TIMESTAMP WITH TIME ZONE,

    -- URL mode: slug | subdomain | custom_domain
    url_mode TEXT DEFAULT 'slug' CHECK (url_mode IN ('slug', 'subdomain', 'custom_domain')),

    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    is_whitelabel_enabled BOOLEAN DEFAULT FALSE,

    -- Admin overrides
    admin_disabled BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_branding_partner_id ON partner_branding(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_branding_slug ON partner_branding(partner_slug);
CREATE INDEX IF NOT EXISTS idx_partner_branding_subdomain ON partner_branding(subdomain);
CREATE INDEX IF NOT EXISTS idx_partner_branding_custom_domain ON partner_branding(custom_domain);

-- ============================================================
-- 2. PARTNER EARNINGS (Per-Booking Commission Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

    booking_amount NUMERIC(10, 2) NOT NULL,
    platform_fee_pct NUMERIC(5, 2) DEFAULT 10.00,   -- % taken by platform
    platform_fee NUMERIC(10, 2) NOT NULL,
    partner_amount NUMERIC(10, 2) NOT NULL,

    -- Payout lifecycle
    payout_status TEXT DEFAULT 'pending'
        CHECK (payout_status IN ('pending', 'processing', 'paid', 'on_hold', 'cancelled')),
    payout_date TIMESTAMP WITH TIME ZONE,
    payout_reference TEXT,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner_id ON partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_booking_id ON partner_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(payout_status);

-- ============================================================
-- 3. PARTNER PAYOUT HISTORY (Batch Payout Records)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_payout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Batch summary
    payout_amount NUMERIC(10, 2) NOT NULL,
    booking_count INTEGER DEFAULT 0,
    period_start DATE,
    period_end DATE,

    -- Bank / UPI details snapshot at time of payout
    bank_account TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    payment_method TEXT DEFAULT 'bank_transfer',   -- bank_transfer | upi | cheque

    -- Status
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    initiated_by TEXT,                    -- admin email who triggered payout
    processed_at TIMESTAMP WITH TIME ZONE,
    reference_number TEXT,
    failure_reason TEXT,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_history_partner_id ON partner_payout_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_status ON partner_payout_history(status);

-- ============================================================
-- 4. PARTNER CLIENTS (Customer–Partner Relationship)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Client profile snapshot (for display without joining)
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    client_company TEXT,

    -- Relationship data
    first_booking_at TIMESTAMP WITH TIME ZONE,
    last_booking_at TIMESTAMP WITH TIME ZONE,
    total_bookings INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,

    -- Source
    source TEXT DEFAULT 'whitelabel'       -- whitelabel | direct | referral
        CHECK (source IN ('whitelabel', 'direct', 'referral', 'manual')),

    notes TEXT,
    tags TEXT[],                           -- partner-defined tags
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(partner_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_clients_partner_id ON partner_clients(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_clients_user_id ON partner_clients(user_id);

-- ============================================================
-- 5. PARTNER INVOICES (White-Label Branded Invoices)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES partner_clients(id),

    invoice_number TEXT UNIQUE NOT NULL,   -- WL-2025-00001
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Line items snapshot
    studio_name TEXT,
    session_date DATE,
    duration_hours NUMERIC(4, 2),
    base_amount NUMERIC(10, 2) NOT NULL,
    addon_amount NUMERIC(10, 2) DEFAULT 0,
    package_amount NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,

    -- Branding snapshot at invoice time
    brand_name TEXT,
    brand_logo_url TEXT,
    brand_address TEXT,
    brand_email TEXT,
    brand_phone TEXT,

    -- Client snapshot
    client_name TEXT,
    client_email TEXT,
    client_address TEXT,

    status TEXT DEFAULT 'issued'
        CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_invoices_partner_id ON partner_invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_booking_id ON partner_invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_client_id ON partner_invoices(client_id);

-- ============================================================
-- 6. EXTEND BOOKINGS TABLE (White-Label Tracking)
-- ============================================================

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'marketplace'
        CHECK (booking_source IN ('marketplace', 'whitelabel', 'partner_direct', 'api')),
    ADD COLUMN IF NOT EXISTS whitelabel_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(booking_source);

-- ============================================================
-- 7. PLATFORM COMMISSION CONFIG (extend platform_settings)
-- ============================================================

-- Ensure platform_settings has commission field (already defined in admin_system_migration.sql,
-- but added here for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='platform_settings' AND column_name='whitelabel_enabled'
    ) THEN
        ALTER TABLE platform_settings
            ADD COLUMN whitelabel_enabled BOOLEAN DEFAULT TRUE,
            ADD COLUMN default_commission_pct NUMERIC(5, 2) DEFAULT 10.00,
            ADD COLUMN whitelabel_fee_pct NUMERIC(5, 2) DEFAULT 5.00;
    END IF;
END $$;

-- ============================================================
-- 8. ROW-LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE partner_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invoices ENABLE ROW LEVEL SECURITY;

-- partner_branding: partners see their own row; public can read published rows by slug
CREATE POLICY partner_branding_partner_select ON partner_branding
    FOR SELECT USING (
        auth.uid() = partner_id
        OR is_published = TRUE
    );

CREATE POLICY partner_branding_partner_insert ON partner_branding
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_branding_partner_update ON partner_branding
    FOR UPDATE USING (auth.uid() = partner_id);

-- partner_earnings: partner sees their own
CREATE POLICY partner_earnings_partner_select ON partner_earnings
    FOR SELECT USING (auth.uid() = partner_id);

-- partner_payout_history: partner sees their own
CREATE POLICY payout_history_partner_select ON partner_payout_history
    FOR SELECT USING (auth.uid() = partner_id);

-- partner_clients: partner sees their own
CREATE POLICY partner_clients_partner_select ON partner_clients
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_clients_partner_insert ON partner_clients
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY partner_clients_partner_update ON partner_clients
    FOR UPDATE USING (auth.uid() = partner_id);

-- partner_invoices: partner sees their own; client can see invoices for their bookings
CREATE POLICY partner_invoices_partner_select ON partner_invoices
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY partner_invoices_partner_insert ON partner_invoices
    FOR INSERT WITH CHECK (auth.uid() = partner_id);

-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_partner_branding_updated_at
    BEFORE UPDATE ON partner_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_earnings_updated_at
    BEFORE UPDATE ON partner_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_payout_history_updated_at
    BEFORE UPDATE ON partner_payout_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_clients_updated_at
    BEFORE UPDATE ON partner_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_invoices_updated_at
    BEFORE UPDATE ON partner_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ===== END whitelabel_migration.sql =====
