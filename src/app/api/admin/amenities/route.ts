import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('amenities')
    .select('*')
    .order('category, name');

  if (error) return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });

  return NextResponse.json({ amenities: data || [] });
}
