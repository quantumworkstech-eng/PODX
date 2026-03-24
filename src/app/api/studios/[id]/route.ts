import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { data: studio, error } = await supabase
    .from('studios')
    .select(`
      id, name, slug, description, short_description, address, city, state, country,
      featured_image_url, is_verified, phone, email, website, equipment,
      studio_images (id, image_url, caption, display_order),
      rooms (id, name, description, capacity, price_per_hour, min_booking_hours, max_booking_hours, is_active),
      studio_amenities (amenities (id, name, icon, category))
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !studio) {
    return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
  }

  // Fetch add-ons linked to this studio
  const { data: addonRows } = await supabase
    .from('studio_addons')
    .select('platform_addons (id, name, description, price, category, icon)')
    .eq('studio_id', id);

  const addons = (addonRows ?? [])
    .map((r: any) => r.platform_addons)
    .filter(Boolean);

  // Flatten amenities
  const amenities = ((studio as any).studio_amenities ?? [])
    .map((sa: any) => sa.amenities)
    .filter(Boolean);

  // Sort images by display_order
  const images = ((studio as any).studio_images ?? []).sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  return NextResponse.json({
    id: (studio as any).id,
    name: (studio as any).name,
    slug: (studio as any).slug,
    description: (studio as any).description,
    short_description: (studio as any).short_description,
    address: (studio as any).address,
    city: (studio as any).city,
    state: (studio as any).state,
    country: (studio as any).country,
    featured_image_url: (studio as any).featured_image_url,
    is_verified: (studio as any).is_verified,
    phone: (studio as any).phone,
    email: (studio as any).email,
    website: (studio as any).website,
    equipment: (studio as any).equipment ?? [],
    images,
    rooms: ((studio as any).rooms ?? []).filter((r: any) => r.is_active !== false),
    amenities,
    addons,
  });
}
