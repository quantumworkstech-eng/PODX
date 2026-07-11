import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('features')
    .select('*')
    .order('category')
    .order('feature_name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ features: data });
}
