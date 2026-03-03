import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getPartnerId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ studios: [] });

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ studios: [] });

  const { data, error } = await supabaseAdmin
    .from('studios')
    .select(`
      id, name, slug, description, short_description, address, city, is_active, review_status, latitude, longitude, created_at,
      rooms(id, price_per_hour, capacity, is_active),
      studio_images(image_url, display_order)
    `)
    .eq('owner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partner studios:', error);
    return NextResponse.json({ studios: [] });
  }

  const studios = (data || []).map((s: any) => {
    const activeRooms = (s.rooms || []).filter((r: any) => r.is_active !== false);
    const price = activeRooms.length > 0 ? Math.min(...activeRooms.map((r: any) => r.price_per_hour)) : 0;
    const capacity = activeRooms.length > 0 ? Math.max(...activeRooms.map((r: any) => r.capacity)) : 0;
    const sortedImages = [...(s.studio_images || [])].sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    return {
      id: s.id,
      name: s.name,
      description: s.short_description || s.description || '',
      address: s.address || '',
      city: s.city || '',
      is_active: s.is_active,
      review_status: s.review_status || 'pending_review',
      latitude: s.latitude,
      longitude: s.longitude,
      price_per_hour: price,
      capacity,
      images: sortedImages.map((i: any) => i.image_url),
      status: s.is_active ? 'active' : 'inactive',
    };
  });

  return NextResponse.json({ studios });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { name, description, fullDescription, address, city, pricePerHour, capacity, equipment, images, latitude, longitude } = body;

  if (!name || !city) {
    return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
  }

  const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

  const { data: studio, error: studioError } = await supabaseAdmin
    .from('studios')
    .insert({
      name,
      slug,
      description: fullDescription || description || '',
      short_description: (description || '').slice(0, 150),
      address: address || '',
      city,
      is_active: false,
      review_status: 'pending_review',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      owner_id: partnerId,
    })
    .select()
    .single();

  if (studioError || !studio) {
    console.error('Error creating studio:', studioError);
    return NextResponse.json({ error: 'Failed to create studio' }, { status: 500 });
  }

  // Create default room
  await supabaseAdmin.from('rooms').insert({
    studio_id: studio.id,
    price_per_hour: pricePerHour || 0,
    capacity: capacity || 2,
    is_active: true,
  });

  // Store images
  if (images && images.length > 0) {
    const imageRows = images.map((url: string, idx: number) => ({
      studio_id: studio.id,
      image_url: url,
      display_order: idx,
    }));
    await supabaseAdmin.from('studio_images').insert(imageRows);
  }

  return NextResponse.json({ studioId: studio.id }, { status: 201 });
}
