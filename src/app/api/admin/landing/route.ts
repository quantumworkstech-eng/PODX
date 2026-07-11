import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ content: {} });

  const { data, error } = await supabaseAdmin
    .from('landing_content')
    .select('section, content, updated_at')
    .order('section');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const content: Record<string, unknown> = {};
  for (const row of data || []) {
    content[row.section] = row.content;
  }

  return NextResponse.json({ content });
}

export async function PATCH(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { section, content } = await req.json();
  if (!section || content === undefined) {
    return NextResponse.json({ error: 'section and content required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('landing_content')
    .upsert({ section, content, updated_at: new Date().toISOString() }, { onConflict: 'section' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
