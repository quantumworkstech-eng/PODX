import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('studios')
    .select(`
      id, name, slug, city, is_active, review_status, created_at, owner_id,
      users!studios_owner_id_fkey(id, email, profiles(full_name)),
      rooms(price_per_hour, capacity),
      studio_images(image_url, display_order)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('review_status', status);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching admin studios:', error);
    return NextResponse.json({ error: 'Failed to fetch studios' }, { status: 500 });
  }

  const studios = (data || []).map((s: any) => {
    const activeRooms = (s.rooms || []);
    const price = activeRooms.length > 0 ? Math.min(...activeRooms.map((r: any) => r.price_per_hour)) : 0;
    const sortedImages = [...(s.studio_images || [])].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      city: s.city,
      is_active: s.is_active,
      review_status: s.review_status || 'pending_review',
      created_at: s.created_at,
      owner_id: s.owner_id || s.users?.id || null,
      owner_email: s.users?.email || '',
      owner_name: s.users?.profiles?.full_name || '',
      price_per_hour: price,
      image: sortedImages[0]?.image_url || null,
    };
  });

  return NextResponse.json({ studios, total: count || 0, page, limit });
}

export async function POST(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { name, description, short_description, address, city, state, country, owner_email, price_per_hour, capacity } = body;

  if (!name || !city || !owner_email) {
    return NextResponse.json({ error: 'name, city, and owner_email are required' }, { status: 400 });
  }

  const { data: ownerUser } = await supabaseAdmin.from('users').select('id').eq('email', owner_email).maybeSingle();
  if (!ownerUser) return NextResponse.json({ error: 'Owner user not found. Create the user first.' }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

  const { data: studio, error: studioErr } = await supabaseAdmin.from('studios').insert({
    name,
    slug,
    description: description || null,
    short_description: short_description || null,
    address: address || null,
    city,
    state: state || null,
    country: country || 'India',
    owner_id: ownerUser.id,
    is_active: false,
    review_status: 'pending_review',
  }).select('id, name, slug').single();

  if (studioErr || !studio) {
    return NextResponse.json({ error: studioErr?.message || 'Failed to create studio' }, { status: 500 });
  }

  await supabaseAdmin.from('rooms').insert({
    studio_id: studio.id,
    name: 'Main Room',
    price_per_hour: Number(price_per_hour) || 1000,
    capacity: Number(capacity) || 4,
    is_active: true,
  });

  return NextResponse.json({ studio }, { status: 201 });
}
