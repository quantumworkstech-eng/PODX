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
  const {
    name, description, fullDescription, shortDescription, address, city, state, country,
    pricePerHour, capacity, images, is_active,
    latitude, longitude,
    amenities, // string[] of amenity names like ['wifi', 'ac']
    availableDays, // string[] like ['Mon', 'Tue']
    workingHours, // { start: string, end: string }
    cancellationRules, // [{ type, value, refundPercent, deductionPercent }]
    useCustomPolicies,
  } = body;

  // Update studios table
  const studioUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (name !== undefined) studioUpdates.name = name;
  if (fullDescription !== undefined) studioUpdates.description = fullDescription;
  if (description !== undefined) studioUpdates.description = description;
  if (shortDescription !== undefined) studioUpdates.short_description = shortDescription;
  else if (description !== undefined) studioUpdates.short_description = description.slice(0, 150);
  if (address !== undefined) studioUpdates.address = address;
  if (city !== undefined) studioUpdates.city = city;
  if (state !== undefined) studioUpdates.state = state;
  if (country !== undefined) studioUpdates.country = country;
  if (is_active !== undefined) studioUpdates.is_active = is_active;
  if (latitude !== undefined) studioUpdates.latitude = latitude;
  if (longitude !== undefined) studioUpdates.longitude = longitude;

  const { error: studioErr } = await supabaseAdmin.from('studios').update(studioUpdates).eq('id', id);
  if (studioErr) {
    console.error('Studio update error:', studioErr);
    return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });
  }

  // Update rooms table for price and capacity
  if (pricePerHour !== undefined || capacity !== undefined) {
    const roomUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (pricePerHour !== undefined) roomUpdates.price_per_hour = Number(pricePerHour);
    if (capacity !== undefined) roomUpdates.capacity = Number(capacity);
    await supabaseAdmin.from('rooms').update(roomUpdates).eq('studio_id', id);
  }

  // Update images (replace all)
  if (images !== undefined) {
    await supabaseAdmin.from('studio_images').delete().eq('studio_id', id);
    if (images.length > 0) {
      await supabaseAdmin.from('studio_images').insert(
        images.map((url: string, idx: number) => ({ studio_id: id, image_url: url, display_order: idx }))
      );
    }
  }

  // Update amenities via studio_amenities (lookup by name)
  if (amenities !== undefined && Array.isArray(amenities)) {
    // Fetch amenity IDs from names
    if (amenities.length > 0) {
      const { data: amenityRows } = await supabaseAdmin
        .from('amenities')
        .select('id, name')
        .in('name', amenities.map((a: string) => a));

      await supabaseAdmin.from('studio_amenities').delete().eq('studio_id', id);

      if (amenityRows && amenityRows.length > 0) {
        await supabaseAdmin.from('studio_amenities').insert(
          amenityRows.map((a: any) => ({ studio_id: id, amenity_id: a.id }))
        );
      }
    } else {
      await supabaseAdmin.from('studio_amenities').delete().eq('studio_id', id);
    }
  }

  // Update studio hours
  if (availableDays !== undefined && workingHours !== undefined) {
    const dayNameToNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hoursData = Object.entries(dayNameToNum).map(([name, num]) => ({
      studio_id: id,
      day_of_week: num,
      open_time: workingHours.start || '09:00',
      close_time: workingHours.end || '21:00',
      is_closed: !availableDays.includes(name),
    }));

    await supabaseAdmin.from('studio_hours').delete().eq('studio_id', id);
    await supabaseAdmin.from('studio_hours').insert(hoursData);
  }

  // Update cancellation policies
  if (useCustomPolicies && cancellationRules !== undefined && Array.isArray(cancellationRules)) {
    await supabaseAdmin.from('cancellation_policies').delete().eq('studio_id', id);
    if (cancellationRules.length > 0) {
      await supabaseAdmin.from('cancellation_policies').insert(
        cancellationRules.map((rule: any) => ({
          studio_id: id,
          hours_before: rule.type === 'days' ? Number(rule.value) * 24 : Number(rule.value),
          refund_percentage: Number(rule.refundPercent),
          description: `${rule.refundPercent}% refund if cancelled ${rule.value}+ ${rule.type} before`,
        }))
      );
    }
  } else if (useCustomPolicies === false) {
    // Clear custom policies to use platform defaults
    await supabaseAdmin.from('cancellation_policies').delete().eq('studio_id', id);
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

  await supabaseAdmin.from('studios').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({ success: true });
}
