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

  // Get user ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ isAdmin: false });

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const roles = (roleData || []).map((r: any) => r.roles?.name).filter(Boolean);
  const isAdmin = roles.includes('admin');

  return NextResponse.json({ isAdmin, roles });
}
