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
