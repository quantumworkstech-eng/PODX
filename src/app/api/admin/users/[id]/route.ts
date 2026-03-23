import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { action, role } = body;

  if (action === 'ban') {
    // We store ban state by updating a metadata field - for now mark as unverified
    await supabaseAdmin.from('users').update({ email_verified: false }).eq('id', id);
    return NextResponse.json({ success: true, message: 'User banned' });
  }

  if (action === 'unban') {
    await supabaseAdmin.from('users').update({ email_verified: true }).eq('id', id);
    return NextResponse.json({ success: true, message: 'User unbanned' });
  }

  if (action === 'change_role' && role) {
    const validRoles = ['user', 'partner', 'admin'];
    if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    await supabaseAdmin.from('users').update({ role }).eq('id', id);
    return NextResponse.json({ success: true, message: 'Role updated' });
  }

  if (action === 'update_profile') {
    const { full_name, phone } = body;
    const { data: existing } = await supabaseAdmin.from('profiles').select('user_id').eq('user_id', id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('profiles').update({ full_name: full_name ?? null, phone: phone ?? null }).eq('user_id', id);
    } else {
      await supabaseAdmin.from('profiles').insert({ user_id: id, full_name: full_name ?? null, phone: phone ?? null });
    }
    return NextResponse.json({ success: true, message: 'Profile updated' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const [{ data: user }, { data: bookings }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, email, auth_provider, email_verified, created_at, role, profiles(full_name, avatar_url, phone), user_roles(roles(name)), studios!studios_owner_id_fkey(id)')
      .eq('id', id)
      .maybeSingle(),
    supabaseAdmin
      .from('bookings')
      .select('id, booking_number, status, total_price, start_time, created_at, studios(name)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const allRoles = new Set<string>();
  if (user.role) allRoles.add(user.role);
  ((user as any).user_roles || []).forEach((ur: any) => { if (ur.roles?.name) allRoles.add(ur.roles.name); });
  const studioCount = ((user as any).studios || []).length;
  if (studioCount > 0 && !allRoles.has('admin')) allRoles.add('partner');

  return NextResponse.json({
    user: {
      ...user,
      roles: Array.from(allRoles),
      studio_count: studioCount,
    },
    bookings: bookings || [],
  });
}
