import { supabase } from "./supabase";
import { Studio } from "./types";

function getFallbackStudios(): Studio[] {
  return [
    {
      id: "1",
      name: "Nest",
      slug: "nest-studio",
      cover_image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90",
      location: { city: "Mumbai", area: "Andheri West", address: "501, Business Hub" },
      price_per_hour: 2500,
      currency: "₹",
      capacity: 4,
      equipment: [],
      rating: 4.9,
      review_count: 127,
      is_instant_bookable: true,
      has_video_support: true,
      description: "Premium podcast studio",
      amenities: ["WiFi", "AC", "Parking"]
    }
  ];
}

export async function getAllStudios(): Promise<Studio[]> {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return getFallbackStudios();
  }

  const { data: studios, error } = await supabase
    .from('studios')
    .select(`*, rooms (id, name, price_per_hour, capacity), studio_amenities (amenities (name)), studio_images (image_url)`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !studios) {
    console.error('Error fetching studios:', error);
    return getFallbackStudios();
  }

  const { data: equipment } = await supabase.from('equipment').select('*');

  return studios.map((studio: any) => {
    const studioAmenities = studio.studio_amenities?.map((sa: any) => sa.amenities?.name).filter(Boolean) || [];
    const rooms = studio.rooms || [];
    const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: any) => r.price_per_hour)) : 0;
    const maxCapacity = rooms.length > 0 ? Math.max(...rooms.map((r: any) => r.capacity)) : 0;
    const coverImage = studio.studio_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90';

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug || studio.name.toLowerCase().replace(/\s+/g, '-'),
      cover_image: coverImage,
      location: { city: studio.city || '', area: '', address: studio.address || '' },
      price_per_hour: minPrice,
      currency: '₹',
      capacity: maxCapacity,
      equipment: equipment?.slice(0, 5).map((eq: any) => ({ id: eq.id, name: eq.name, icon: eq.category || 'microphone' })) || [],
      rating: 4.5,
      review_count: 0,
      is_instant_bookable: true,
      has_video_support: true,
      description: studio.short_description || studio.description || '',
      amenities: studioAmenities.length > 0 ? studioAmenities : ['WiFi', 'AC', 'Parking']
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
    rating: 4.5,
    review_count: 0,
    is_instant_bookable: true,
    has_video_support: true,
    description: studio.short_description || studio.description || '',
    amenities: studio.studio_amenities?.map((sa: any) => sa.amenities?.name).filter(Boolean) || []
  };
}

export async function getStudiosByCity(city: string): Promise<Studio[]> {
  if (!supabase) return getFallbackStudios();

  const { data: studios, error } = await supabase
    .from('studios')
    .select(`*, rooms (id, price_per_hour, capacity), studio_images (image_url)`)
    .eq('city', city)
    .eq('is_active', true);

  if (error || !studios) return getFallbackStudios();

  return studios.map((studio: any) => {
    const rooms = studio.rooms || [];
    const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: any) => r.price_per_hour)) : 0;
    const coverImage = studio.studio_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90';

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
      rating: 4.5,
      review_count: 0,
      is_instant_bookable: true,
      has_video_support: true,
      description: studio.short_description || '',
      amenities: ['WiFi', 'AC', 'Parking']
    };
  });
}

export const cities = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"];

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

export let studios: Studio[] = [];

getAllStudios().then(data => {
  studios = data;
});
