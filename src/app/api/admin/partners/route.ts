import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles!inner(name), users!inner(id, email, profiles(full_name))')
    .eq('roles.name', 'partner')
    .order('user_id');

  if (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }

  const partners = (data || []).map((row: any) => ({
    id: row.users?.id,
    email: row.users?.email || '',
    name: row.users?.profiles?.full_name || row.users?.email || '',
  })).filter((p: any) => p.id && p.email);

  return NextResponse.json({ partners });
}
