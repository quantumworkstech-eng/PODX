import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const activeOnly = searchParams.get('active');

  let query = supabaseAdmin
    .from('platform_addons')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('name', `%${search}%`);
  if (activeOnly === 'true') query = query.eq('is_active', true);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch add-ons' }, { status: 500 });

  return NextResponse.json({ addons: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { name, description, price, category, addon_type, thumbnail_url } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('platform_addons')
    .insert({
      name,
      description,
      price: Number(price),
      category: category || 'general',
      addon_type: addon_type || null,
      thumbnail_url: thumbnail_url || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create add-on' }, { status: 500 });

  await logAdminAction(email, 'create_addon', 'addon', data.id, { name, price });

  return NextResponse.json({ addon: data });
}
