import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public — no auth required
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const { data: plans, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: plans || [] });
}
