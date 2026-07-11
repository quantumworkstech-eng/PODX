import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getPartnerFeatureMap } from '@/lib/feature-access';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ features: {} });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  const features = await getPartnerFeatureMap(user.id);
  return NextResponse.json({ features });
}
