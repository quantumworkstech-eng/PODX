import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data, error, count } = await supabaseAdmin
    .from('admins')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });

  return NextResponse.json({ admins: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { inviteEmail, role } = await request.json();
  if (!inviteEmail) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  // Find user by email
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', inviteEmail)
    .maybeSingle();

  // Insert into admins table
  const { data, error } = await supabaseAdmin
    .from('admins')
    .insert({
      user_id: user?.id || null,
      email: inviteEmail,
      role: role || 'admin',
      added_by_email: email,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 });
  }

  // Also insert into admin_credentials so they can log in
  await supabaseAdmin
    .from('admin_credentials')
    .insert({ email: inviteEmail })
    .select()
    .maybeSingle();

  // Add admin role in user_roles if user exists
  if (user?.id) {
    const { data: roleRow } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .maybeSingle();

    if (roleRow?.id) {
      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: user.id, role_id: roleRow.id });
    }
  }

  await logAdminAction(email, 'add_admin', 'admin', data.id, { inviteEmail, role });

  return NextResponse.json({ admin: data });
}
