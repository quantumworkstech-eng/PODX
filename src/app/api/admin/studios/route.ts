import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function requireAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (!user) return false;
  const { data: roleData } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  return (roleData || []).some((r: any) => r.roles?.name === 'admin');
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // pending_review | approved | suspended
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('studios')
    .select(`
      id, name, slug, city, is_active, review_status, created_at,
      users!studios_owner_id_fkey(email, profiles(full_name)),
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
      owner_email: s.users?.email || '',
      owner_name: s.users?.profiles?.full_name || '',
      price_per_hour: price,
      image: sortedImages[0]?.image_url || null,
    };
  });

  return NextResponse.json({ studios, total: count || 0, page, limit });
}
