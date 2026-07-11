import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }

  // Get user with role column
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ isAdmin: false });

  // Primary check: users.role column
  if (user.role === 'admin') {
    return NextResponse.json({ isAdmin: true });
  }

  // Fallback: user_roles join table
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const roles = (roleData || []).map((r: any) => r.roles?.name).filter(Boolean);
  const isAdmin = roles.includes('admin');

  return NextResponse.json({ isAdmin });
}
