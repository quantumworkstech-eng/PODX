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
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('reviews')
    .select(`
      id, rating, title, content, status, is_verified, created_at,
      studios(name, city),
      users!reviews_user_id_fkey(email, profiles(full_name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  const reviews = (data || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    status: r.status,
    is_verified: r.is_verified,
    created_at: r.created_at,
    studio_name: r.studios?.name || '',
    studio_city: r.studios?.city || '',
    user_email: r.users?.email || '',
    user_name: r.users?.profiles?.full_name || '',
  }));

  return NextResponse.json({ reviews, total: count || 0, page, limit });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await supabaseAdmin.from('reviews').update({ status }).eq('id', id);
  return NextResponse.json({ success: true });
}
