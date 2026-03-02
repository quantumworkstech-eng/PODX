import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET() {
  const client = supabaseAdmin ?? supabase;

  if (!client) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await client
    .from('cities')
    .select('id, name, slug, image_url')
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('Error fetching cities:', error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(
    data.map((city: any) => ({
      id: city.slug || String(city.id),
      name: city.name,
      slug: city.slug,
      image_url: city.image_url,
    }))
  );
}
