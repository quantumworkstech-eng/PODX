import { supabase } from "./supabase";
import { Studio } from "./types";

export interface City {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

export async function getCities(): Promise<City[]> {
  try {
    const res = await fetch('/api/cities');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Build a per-studio rating map from published reviews
async function fetchRatingMap(studioIds: string[]): Promise<Record<string, { avg: number; count: number }>> {
  if (!supabase || studioIds.length === 0) return {};
  const { data: reviews } = await supabase
    .from('reviews')
    .select('studio_id, rating')
    .eq('status', 'published')
    .in('studio_id', studioIds);

  const map: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews || []) {
    if (!map[r.studio_id]) map[r.studio_id] = { sum: 0, count: 0 };
    map[r.studio_id].sum += r.rating;
    map[r.studio_id].count += 1;
  }
  const result: Record<string, { avg: number; count: number }> = {};
  for (const [id, { sum, count }] of Object.entries(map)) {
    result[id] = { avg: Math.round((sum / count) * 10) / 10, count };
  }
  return result;
}

export async function getAllStudios(): Promise<Studio[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return [];
  }

  // Keep query simple — avoid nested joins that can fail with RLS restrictions
  const { data: studios, error } = await supabase
    .from('studios')
    .select(`
      id, name, slug, description, short_description, address, city, featured_image_url, created_at,
      rooms (id, price_per_hour, capacity, is_active),
      studio_images (image_url, display_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !studios) {
    console.error('Error fetching studios:', error?.message ?? JSON.stringify(error));
    return [];
  }

  const studioIds = studios.map((s: any) => s.id);
  const ratingMap = await fetchRatingMap(studioIds);

  return studios.map((studio: any) => {
    const rooms: any[] = studio.rooms || [];
    const activeRooms = rooms.filter((r: any) => r.is_active !== false);
    const minPrice = activeRooms.length > 0
      ? Math.min(...activeRooms.map((r: any) => r.price_per_hour ?? 0))
      : 0;
    const maxCapacity = activeRooms.length > 0
      ? Math.max(...activeRooms.map((r: any) => r.capacity ?? 0))
      : 2;
    const sortedImages = (studio.studio_images || []).sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    const coverImage =
      sortedImages[0]?.image_url ||
      studio.featured_image_url ||
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90';
    const ratings = ratingMap[studio.id];

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug || studio.name.toLowerCase().replace(/\s+/g, '-'),
      cover_image: coverImage,
      location: { city: studio.city || '', area: studio.city || '', address: studio.address || '' },
      price_per_hour: minPrice,
      currency: '₹',
      capacity: maxCapacity,
      equipment: [],
      rating: ratings?.avg ?? 0,
      review_count: ratings?.count ?? 0,
      is_instant_bookable: true,
      description: studio.short_description || studio.description || '',
      amenities: ['WiFi', 'AC', 'Parking'],
    };
  });
}

export async function getStudioBySlug(slug: string): Promise<Studio | null> {
  if (!supabase) return null;

  const { data: studio, error } = await supabase
    .from('studios')
    .select(`*, rooms (*), studio_amenities (amenities (name, icon)), studio_images (*)`)
    .eq('slug', slug)
    .single();

  if (error || !studio) return null;

  const coverImage = studio.studio_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90';
  const ratingMap = await fetchRatingMap([studio.id]);
  const ratings = ratingMap[studio.id];

  return {
    id: studio.id,
    name: studio.name,
    slug: studio.slug,
    cover_image: coverImage,
    location: { city: studio.city || '', area: '', address: studio.address || '' },
    price_per_hour: studio.rooms?.[0]?.price_per_hour || 0,
    currency: '₹',
    capacity: studio.rooms?.[0]?.capacity || 0,
    equipment: [],
    rating: ratings?.avg ?? 0,
    review_count: ratings?.count ?? 0,
    is_instant_bookable: true,
    description: studio.short_description || studio.description || '',
    amenities: studio.studio_amenities?.map((sa: any) => sa.amenities?.name).filter(Boolean) || []
  };
}

export async function getStudiosByCity(city: string): Promise<Studio[]> {
  if (!supabase) return [];

  const { data: studios, error } = await supabase
    .from('studios')
    .select(`*, rooms (id, price_per_hour, capacity), studio_images (image_url)`)
    .eq('city', city)
    .eq('is_active', true);

  if (error || !studios) return [];

  const studioIds = studios.map((s: any) => s.id);
  const ratingMap = await fetchRatingMap(studioIds);

  return studios.map((studio: any) => {
    const rooms = studio.rooms || [];
    const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: any) => r.price_per_hour)) : 0;
    const coverImage = studio.studio_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90';
    const ratings = ratingMap[studio.id];

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug,
      cover_image: coverImage,
      location: { city: studio.city || '', area: '', address: studio.address || '' },
      price_per_hour: minPrice,
      currency: '₹',
      capacity: studio.capacity || 2,
      equipment: [],
      rating: ratings?.avg ?? 0,
      review_count: ratings?.count ?? 0,
      is_instant_bookable: true,
      description: studio.short_description || '',
      amenities: ['WiFi', 'AC', 'Parking']
    };
  });
}

export const equipmentOptions = [
  { id: "microphone", name: "Microphones" },
  { id: "headphones", name: "Headphones" },
  { id: "camera", name: "Cameras" },
  { id: "lighting", name: "Lighting" },
  { id: "mixer", name: "Audio Mixer" },
  { id: "teleprompter", name: "Teleprompter" },
  { id: "soundproofing", name: "Soundproofing" },
  { id: "monitor", name: "Reference Monitors" }
];

