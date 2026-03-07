import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const { role, is_active } = await request.json();

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin
    .from('admins')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });

  await logAdminAction(email, 'update_admin', 'admin', id, updates);

  return NextResponse.json({ admin: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  // Get admin details before deleting
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('email')
    .eq('id', id)
    .maybeSingle();

  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

  // Prevent self-revocation
  if (admin.email === email) {
    return NextResponse.json({ error: 'Cannot revoke your own admin access' }, { status: 400 });
  }

  // Remove from admins table
  const { error } = await supabaseAdmin.from('admins').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 });

  // Remove from admin_credentials
  await supabaseAdmin.from('admin_credentials').delete().eq('email', admin.email);

  await logAdminAction(email, 'remove_admin', 'admin', id, { removedEmail: admin.email });

  return NextResponse.json({ success: true });
}
