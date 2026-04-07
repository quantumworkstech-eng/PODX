import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  // 1) Fetch existing `admins` rows (source of truth for admin panel management)
  const { data: adminRows, error: error, count } = await supabaseAdmin
    .from('admins')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });

  // 2) Also include any users who already have admin access but are missing from `admins`
  // (e.g. role was granted via Users page / user_roles).
  const existingEmails = new Set<string>((adminRows || []).map((a: any) => String(a.email || '').toLowerCase()).filter(Boolean));

  const [{ data: byRoleColumn }, { data: byUserRoles }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, email, role, created_at')
      .ilike('role', '%admin%'),
    supabaseAdmin
      .from('user_roles')
      .select('user_id, roles!inner(name)')
      .eq('roles.name', 'admin'),
  ]);

  const roleUserIds = new Set<string>();
  (byUserRoles || []).forEach((r: any) => { if (r.user_id) roleUserIds.add(String(r.user_id)); });

  // Pull user rows for user_roles(admin) as well (email lives on users).
  let usersFromUserRoles: any[] = [];
  const ids = Array.from(roleUserIds);
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at')
      .in('id', ids);
    usersFromUserRoles = data || [];
  }

  const candidates = [...(byRoleColumn || []), ...usersFromUserRoles]
    .filter((u: any) => u?.email)
    .filter((u: any) => !existingEmails.has(String(u.email).toLowerCase()));

  if (candidates.length > 0) {
    // Sync them into `admins` so the admin panel is consistent.
    const upserts = candidates.map((u: any) => ({
      user_id: u.id || null,
      email: u.email,
      role: 'admin',
      added_by_email: email,
      is_active: true,
    }));

    // Ignore duplicate conflicts; we just want to ensure presence.
    await supabaseAdmin.from('admins').upsert(upserts, { onConflict: 'email' });

    await logAdminAction(email, 'sync_admins', 'admin', undefined, {
      added: candidates.map((u: any) => u.email),
    });
  }

  const { data: merged, error: mergedErr, count: mergedCount } = await supabaseAdmin
    .from('admins')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (mergedErr) return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });

  return NextResponse.json({ admins: merged || [], total: mergedCount || 0 });
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
