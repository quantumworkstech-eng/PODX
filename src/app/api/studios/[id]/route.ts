import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMergedStudioEquipmentLabels } from '@/lib/partner-studio-inventory';
import { fetchMergedStudioAddons } from '@/lib/studio-addons-public';
import { buildStudioBookingInventory } from '@/lib/studio-booking-inventory';

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

  let equipmentMerged = (studio as any).equipment ?? [];
  if (supabase) {
    try {
      equipmentMerged = await getMergedStudioEquipmentLabels(
        supabase,
        id,
        ((studio as any).equipment as string[]) || []
      );
    } catch {
      equipmentMerged = (studio as any).equipment ?? [];
    }
  }

  let addons: unknown[] = [];
  try {
    addons = await fetchMergedStudioAddons(supabase, id);
  } catch {
    addons = [];
  }

  let booking_inventory = null as Awaited<ReturnType<typeof buildStudioBookingInventory>> | null;
  try {
    booking_inventory = await buildStudioBookingInventory(supabase, id, (studio as any).equipment);
  } catch {
    booking_inventory = null;
  }

  // Flatten amenities
  const amenities = ((studio as any).studio_amenities ?? [])
    .map((sa: any) => sa.amenities)
    .filter(Boolean);

  // Sort images by display_order
  const images = ((studio as any).studio_images ?? []).sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  // Fetch studio-specific packages
  let studioPackages: any[] = [];
  try {
    const { data: pkgRows } = await supabase
      .from('studio_packages')
      .select('id, name, description, price_per_hour, features, is_popular, display_order')
      .eq('studio_id', id)
      .order('display_order');
    studioPackages = pkgRows ?? [];
  } catch { /* table may not exist yet */ }

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
    equipment: equipmentMerged,
    images,
    rooms: ((studio as any).rooms ?? []).filter((r: any) => r.is_active !== false),
    amenities,
    addons,
    booking_inventory,
    packages: studioPackages,
  });
}
