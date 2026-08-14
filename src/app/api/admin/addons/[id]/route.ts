import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, price, category, addon_type, thumbnail_url, video_url, is_active } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (category !== undefined) updates.category = category;
  if (addon_type !== undefined) updates.addon_type = addon_type;
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
  if (video_url !== undefined) updates.video_url = video_url;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin
    .from('platform_addons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update add-on' }, { status: 500 });

  await logAdminAction(email, 'update_addon', 'addon', id, updates);

  return NextResponse.json({ addon: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  const { error } = await supabaseAdmin.from('platform_addons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete add-on' }, { status: 500 });

  await logAdminAction(email, 'delete_addon', 'addon', id);

  return NextResponse.json({ success: true });
}
