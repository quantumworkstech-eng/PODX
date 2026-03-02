import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function getPartnerId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

async function verifyOwnership(studioId: string, partnerId: string): Promise<boolean> {
  const { data } = await supabaseAdmin!
    .from('studios')
    .select('id')
    .eq('id', studioId)
    .eq('owner_id', partnerId)
    .maybeSingle();
  return !!data;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const owned = await verifyOwnership(id, partnerId);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, description, address, city, pricePerHour, capacity, images, is_active } = body;

  const studioUpdates: Record<string, any> = {};
  if (name !== undefined) studioUpdates.name = name;
  if (description !== undefined) {
    studioUpdates.description = description;
    studioUpdates.short_description = description.slice(0, 150);
  }
  if (address !== undefined) studioUpdates.address = address;
  if (city !== undefined) studioUpdates.city = city;
  if (is_active !== undefined) studioUpdates.is_active = is_active;

  if (Object.keys(studioUpdates).length > 0) {
    await supabaseAdmin.from('studios').update(studioUpdates).eq('id', id);
  }

  if (pricePerHour !== undefined || capacity !== undefined) {
    const roomUpdates: Record<string, any> = {};
    if (pricePerHour !== undefined) roomUpdates.price_per_hour = pricePerHour;
    if (capacity !== undefined) roomUpdates.capacity = capacity;
    await supabaseAdmin.from('rooms').update(roomUpdates).eq('studio_id', id);
  }

  if (images !== undefined) {
    await supabaseAdmin.from('studio_images').delete().eq('studio_id', id);
    if (images.length > 0) {
      await supabaseAdmin.from('studio_images').insert(
        images.map((url: string, idx: number) => ({
          studio_id: id,
          image_url: url,
          display_order: idx,
        }))
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const owned = await verifyOwnership(id, partnerId);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Soft-delete: mark inactive
  await supabaseAdmin.from('studios').update({ is_active: false }).eq('id', id);

  return NextResponse.json({ success: true });
}
