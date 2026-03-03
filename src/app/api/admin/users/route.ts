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
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('users')
    .select(`
      id, email, auth_provider, email_verified, created_at,
      profiles(full_name, avatar_url, phone),
      user_roles(roles(name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  const users = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    auth_provider: u.auth_provider,
    email_verified: u.email_verified,
    created_at: u.created_at,
    full_name: u.profiles?.full_name || null,
    avatar_url: u.profiles?.avatar_url || null,
    phone: u.profiles?.phone || null,
    roles: (u.user_roles || []).map((r: any) => r.roles?.name).filter(Boolean),
  }));

  // Filter by role client-side since joining is complex
  const filtered = role ? users.filter((u) => u.roles.includes(role)) : users;

  return NextResponse.json({ users: filtered, total: count || 0, page, limit });
}
