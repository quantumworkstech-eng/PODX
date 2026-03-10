import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public endpoint — returns all active platform add-ons
export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ addons: [] });

  const { data, error } = await supabaseAdmin
    .from('platform_addons')
    .select('id, name, description, price, category')
    .eq('is_active', true)
    .order('category')
    .order('name');

  if (error) return NextResponse.json({ addons: [] });
  return NextResponse.json({ addons: data || [] });
}
