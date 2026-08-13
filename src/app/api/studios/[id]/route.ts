import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMergedStudioEquipmentLabels } from '@/lib/partner-studio-inventory';
import { fetchMergedStudioAddons } from '@/lib/studio-addons-public';
import { buildStudioBookingInventory } from '@/lib/studio-booking-inventory';
import { resolveBasePricing } from '@/lib/pricing';

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
      featured_image_url, is_verified, phone, email, website, equipment, video_url,
      studio_images (id, image_url, caption, display_order),
      rooms (
        id, name, description, capacity, price_per_hour, min_booking_hours, max_booking_hours,
        featured_image_url, is_active,
        room_images (image_url, display_order)
      ),
      studio_packages (id, name, description, price_per_hour, discount_percentage, features, is_popular, display_order),
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

  const rooms = ((studio as any).rooms ?? []).filter((r: any) => r.is_active !== false);
  // One option per room — the booking flow's Setup step picks a room, not a photo.
  const setupOptions = rooms
    .map((room: any) => {
      const roomImages: string[] = [
        ...new Set(
          [
            room.featured_image_url,
            ...((room.room_images ?? [])
              .slice()
              .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((img: any) => img.image_url)),
          ].filter(Boolean) as string[]
        ),
      ];

      return {
        id: room.id,
        name: room.name || "Studio setup",
        description: room.description || null,
        // Rooms without their own photos still need a card — fall back to the studio cover.
        image_url: roomImages[0] || (studio as any).featured_image_url || images[0]?.image_url || "",
        images: roomImages,
        capacity: room.capacity ?? null,
        price_per_hour: room.price_per_hour != null ? Number(room.price_per_hour) : null,
      };
    })
    .filter((setup: any) => setup.image_url);

  // Studio-specific packages (embedded in the studios query above — the same
  // mechanism the studios list uses, so the price is guaranteed consistent).
  const studioPackages: any[] = [...((studio as any).studio_packages ?? [])].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  // Canonical "starting from" price, computed the same way everywhere.
  const pricing = resolveBasePricing(studioPackages, rooms);

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
    video_url: (studio as any).video_url || null,
    equipment: equipmentMerged,
    images,
    rooms,
    setup_options: setupOptions,
    amenities,
    addons,
    booking_inventory,
    packages: studioPackages,
    price_per_hour: pricing.price,
    original_price_per_hour: pricing.originalPrice ?? null,
  });
}
