import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ content: {} });
  }

  const { data, error } = await supabaseAdmin
    .from('landing_content')
    .select('section, content');

  if (error) {
    console.error('[landing] fetch error:', error);
    return NextResponse.json({ content: {} });
  }

  const content: Record<string, unknown> = {};
  for (const row of data || []) {
    content[row.section] = row.content;
  }

  return NextResponse.json({ content }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
