-- Seed Data for PodX Development
-- Run this after creating the schema

-- ============================================
-- SAMPLE STUDIOS
-- ============================================

-- Insert sample studios
INSERT INTO studios (owner_id, name, slug, description, short_description, address, city, state, country, phone, email, is_active, is_verified) VALUES
(NULL, 'PodX Mumbai Studio 1', 'podx-mumbai-studio-1', 'Premium podcast studio in the heart of Mumbai with state-of-the-art equipment and professional acoustics.', 'Professional podcast studio in Mumbai', '123, Film City Road, Goregaon East', 'Mumbai', 'Maharashtra', 'India', '+91-9876543210', 'mumbai1@podx.com', true, true),
(NULL, 'PodX Bandra Workspace', 'podx-bandra-workspace', 'Cozy podcast studio perfect for intimate interviews and solo recordings.', 'Cozy podcast studio in Bandra', '456, Hill Road, Bandra West', 'Mumbai', 'Maharashtra', 'India', '+91-9876543211', 'bandra@podx.com', true, true),
(NULL, 'PodX Andheri Hub', 'podx-andheri-hub', 'Large multi-room facility perfect for podcasts, video shoots, and live streaming.', 'Multi-room podcast facility in Andheri', '789, Veera Desai Road, Andheri West', 'Mumbai', 'Maharashtra', 'India', '+91-9876543212', 'andheri@podx.com', true, true);

-- Insert rooms for Mumbai Studio 1
INSERT INTO rooms (studio_id, name, description, capacity, price_per_hour, min_booking_hours, max_booking_hours, is_active) VALUES
((SELECT id FROM studios WHERE slug = 'podx-mumbai-studio-1'), 'Studio A - Professional Setup', 'Full-featured studio with 4K cameras and professional audio', 4, 2500, 1, 8, true),
((SELECT id FROM studios WHERE slug = 'podx-mumbai-studio-1'), 'Studio B - Intimate Space', 'Perfect for solo podcasts and interviews', 2, 1500, 1, 4, true);

-- Insert rooms for Bandra Workspace
INSERT INTO rooms (studio_id, name, description, capacity, price_per_hour, min_booking_hours, max_booking_hours, is_active) VALUES
((SELECT id FROM studios WHERE slug = 'podx-bandra-workspace'), 'The Nest', 'Warm, intimate space for thoughtful conversations', 2, 1800, 1, 4, true);

-- Insert rooms for Andheri Hub
INSERT INTO rooms (studio_id, name, description, capacity, price_per_hour, min_booking_hours, max_booking_hours, is_active) VALUES
((SELECT id FROM studios WHERE slug = 'podx-andheri-hub'), 'The Arena', 'Large studio for live shows and events', 10, 5000, 2, 12, true),
((SELECT id FROM studios WHERE slug = 'podx-andheri-hub'), 'Focus Room', 'Soundproof room for focused recording', 3, 2000, 1, 6, true);

-- Link equipment to rooms
INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 
  CASE 
    WHEN e.category = 'mic' THEN 2
    WHEN e.category = 'camera' THEN 2
    WHEN e.category = 'headphones' THEN 4
    ELSE 1
  END
FROM rooms r
CROSS JOIN equipment e
WHERE r.name IN ('Studio A - Professional Setup', 'The Arena')
AND e.name IN ('Shure SM7B', 'Sony FX3', 'Audio-Technica ATH-M50x', 'Elgato Key Light');

INSERT INTO room_equipment (room_id, equipment_id, quantity)
SELECT r.id, e.id, 2
FROM rooms r
CROSS JOIN equipment e
WHERE r.name IN ('Studio B - Intimate Space', 'The Nest', 'Focus Room')
AND e.name IN ('Rode PodMic', 'Audio-Technica ATH-M50x');

-- Link amenities to studios
INSERT INTO studio_amenities (studio_id, amenity_id)
SELECT s.id, a.id
FROM studios s
CROSS JOIN amenities a
WHERE s.slug = 'podx-mumbai-studio-1';

-- Insert studio hours
INSERT INTO studio_hours (studio_id, day_of_week, open_time, close_time, is_closed)
SELECT 
  s.id,
  day.day_of_week,
  '10:00'::TIME,
  '22:00'::TIME,
  CASE WHEN day.day_of_week = 6 THEN TRUE ELSE FALSE END
FROM studios s
CROSS JOIN (SELECT generate_series(0, 6) as day_of_week) day
WHERE s.slug IN ('podx-mumbai-studio-1', 'podx-bandra-workspace', 'podx-andheri-hub');

-- Insert availability slots for next 7 days
INSERT INTO availability_slots (room_id, start_time, end_time, is_available)
SELECT 
  r.id,
  date_trunc('hour', CURRENT_DATE + (day_offset || ' days')::INTERVAL) + (hour_offset || ' hours')::INTERVAL,
  date_trunc('hour', CURRENT_DATE + (day_offset || ' days')::INTERVAL) + ((hour_offset + 1) || ' hours')::INTERVAL,
  TRUE
FROM rooms r
CROSS JOIN generate_series(0, 6) AS day_offset
CROSS JOIN generate_series(10, 21) AS hour_offset
WHERE r.is_active = true;

-- ============================================
-- SAMPLE BOOKINGS
-- ============================================

-- Note: These require actual user IDs from your auth system
-- Uncomment and modify when you have real users

-- INSERT INTO bookings (user_id, room_id, studio_id, start_time, end_time, status, total_price, notes)
-- VALUES 
--   ('user-uuid-here', 'room-uuid-here', 'studio-uuid-here', '2025-02-21 14:00:00', '2025-02-21 16:00:00', 'confirmed', 5000, 'Test recording session');

-- ============================================
-- CANCELLATION POLICIES
-- ============================================

INSERT INTO cancellation_policies (studio_id, hours_before, refund_percentage, description)
SELECT 
  s.id,
  24,
  100.00,
  'Full refund if cancelled 24 hours before'
FROM studios s;

INSERT INTO cancellation_policies (studio_id, hours_before, refund_percentage, description)
SELECT 
  s.id,
  12,
  50.00,
  '50% refund if cancelled 12-24 hours before'
FROM studios s;

INSERT INTO cancellation_policies (studio_id, hours_before, refund_percentage, description)
SELECT 
  s.id,
  0,
  0.00,
  'No refund if cancelled less than 12 hours before'
FROM studios s;
