-- PodX Database Schema
-- PostgreSQL Schema for Podcast Studio Marketplace & Management Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
