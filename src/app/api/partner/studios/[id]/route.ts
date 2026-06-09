import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchStudioPartnerInventorySnapshot, saveStudioPartnerInventory } from '@/lib/partner-studio-inventory';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const owned = await verifyOwnership(id, partnerId);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let studio: any = null;
  let error: any = null;
  // Some deployments may not have all optional columns yet.
  // Try full projection first, then fallback to a minimal projection.
  const fullRes = await supabaseAdmin
    .from('studios')
    .select(`
      id, name, description, short_description, address, city, state, country,
      is_active, review_status, latitude, longitude, video_url,
      buffer_minutes, reschedule_cutoff_hours, equipment,
      rooms(id, name, description, price_per_hour, capacity, featured_image_url, is_active),
      studio_images(image_url, display_order),
      studio_addons(addon_id),
      studio_hours(day_of_week, open_time, close_time, is_closed)
    `)
    .eq('id', id)
    .maybeSingle();
  studio = fullRes.data;
  error = fullRes.error;

  if (error) {
    const fallbackRes = await supabaseAdmin
      .from('studios')
      .select(`
        id, name, description, short_description, address, city, is_active,
        rooms(id, name, description, price_per_hour, capacity, featured_image_url, is_active),
        studio_images(image_url, display_order),
        studio_addons(addon_id),
        studio_hours(day_of_week, open_time, close_time, is_closed)
      `)
      .eq('id', id)
      .maybeSingle();
    studio = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error || !studio) {
    return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
  }

  const activeRooms = (studio.rooms || []).filter((r: any) => r.is_active !== false);
  const pricePerHour = activeRooms.length > 0 ? Math.min(...activeRooms.map((r: any) => r.price_per_hour || 0)) : 0;
  const capacity = activeRooms.length > 0 ? Math.max(...activeRooms.map((r: any) => r.capacity || 0)) : 2;
  const images = [...(studio.studio_images || [])]
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((i: any) => i.image_url);
  const dayNumToName: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  const openHours = [...(studio.studio_hours || [])].filter((h: any) => h.is_closed !== true);
  const firstOpen = openHours[0];
  const availableDays = openHours
    .map((h: any) => dayNumToName[Number(h.day_of_week)])
    .filter(Boolean);
  const workingHours = {
    start: firstOpen?.open_time?.slice(0, 5) || '09:00',
    end: firstOpen?.close_time?.slice(0, 5) || '21:00',
  };
  const setups = (studio.rooms || []).map((room: any) => ({
    id: room.id,
    name: room.name || 'Studio setup',
    description: room.description || '',
    capacity: Number(room.capacity) || 1,
    price_per_hour: Number(room.price_per_hour) || 0,
    featured_image_url: room.featured_image_url || null,
    is_active: room.is_active !== false,
  }));

  let partnerInventory = null as Awaited<ReturnType<typeof fetchStudioPartnerInventorySnapshot>> | null;
  try {
    partnerInventory = await fetchStudioPartnerInventorySnapshot(supabaseAdmin, id);
  } catch {
    partnerInventory = null;
  }

  let packages: any[] = [];
  try {
    const { data: pkgRows } = await supabaseAdmin
      .from('studio_packages')
      .select('id, name, description, price_per_hour, features, is_popular, display_order')
      .eq('studio_id', id)
      .order('display_order');
    packages = pkgRows ?? [];
  } catch { /* table may not exist yet */ }

  return NextResponse.json({
    studio: {
      id: studio.id,
      name: studio.name || '',
      short_description: studio.short_description || '',
      description: studio.short_description || studio.description || '',
      full_description: studio.description || '',
      address: studio.address || '',
      city: studio.city || '',
      state: studio.state || '',
      country: studio.country || 'India',
      latitude: studio.latitude ?? null,
      longitude: studio.longitude ?? null,
      video_url: studio.video_url || '',
      price_per_hour: pricePerHour,
      capacity,
      buffer_minutes: studio.buffer_minutes ?? 0,
      reschedule_cutoff_hours: studio.reschedule_cutoff_hours ?? 48,
      availableDays: availableDays.length > 0 ? availableDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      workingHours,
      setups,
      equipment: studio.equipment || [],
      addon_ids: (studio.studio_addons || []).map((a: any) => a.addon_id),
      partner_inventory: partnerInventory,
      packages,
      images,
      status: studio.is_active ? 'active' : 'inactive',
      review_status: studio.review_status || 'pending_review',
    },
  });
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
    buffer_minutes,
    reschedule_cutoff_hours,
    equipment,   // string[] of equipment names
    addonIds,    // string[] of platform_addon UUIDs
    partnerEquipmentSelections,
    partnerServiceIds,
    partnerAddonSelections,
    amenities,   // string[] of amenity names like ['wifi', 'ac']
    availableDays, // string[] like ['Mon', 'Tue']
    workingHours, // { start: string, end: string }
    setups,
    cancellationRules, // [{ type, value, refundPercent, deductionPercent }]
    useCustomPolicies,
    review_status, // allow transitioning draft → pending_review
    videoUrl,
    packages, // [{ name, description, price_per_hour, features, is_popular }]
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
  if (buffer_minutes !== undefined) studioUpdates.buffer_minutes = Math.max(0, parseInt(buffer_minutes) || 0);
  if (reschedule_cutoff_hours !== undefined) studioUpdates.reschedule_cutoff_hours = Math.max(0, parseInt(reschedule_cutoff_hours) || 48);
  if (equipment !== undefined && Array.isArray(equipment)) studioUpdates.equipment = equipment;
  if (review_status !== undefined && ['draft', 'pending_review', 'approved', 'rejected'].includes(review_status)) {
    studioUpdates.review_status = review_status;
  }
  if (videoUrl !== undefined) studioUpdates.video_url = videoUrl;

  let { error: studioErr } = await supabaseAdmin.from('studios').update(studioUpdates).eq('id', id);
  if (studioErr) {
    // Backward-compatible retry for tenants where optional columns are missing.
    const retryUpdates = { ...studioUpdates };
    const msg = String(studioErr.message || '').toLowerCase();
    if (msg.includes('buffer_minutes')) delete (retryUpdates as any).buffer_minutes;
    if (msg.includes('reschedule_cutoff_hours')) delete (retryUpdates as any).reschedule_cutoff_hours;
    if (msg.includes('equipment')) delete (retryUpdates as any).equipment;

    if (Object.keys(retryUpdates).length > 1) {
      const retry = await supabaseAdmin.from('studios').update(retryUpdates).eq('id', id);
      studioErr = retry.error;
    }
  }
  if (studioErr) {
    console.error('Studio update error:', studioErr);
    return NextResponse.json(
      { error: studioErr.message || 'Failed to update studio' },
      { status: 500 }
    );
  }

  // Update rooms table for price and capacity
  if (Array.isArray(setups)) {
    const { data: existingRooms } = await supabaseAdmin
      .from('rooms')
      .select('id')
      .eq('studio_id', id);
    const existingIds = new Set((existingRooms || []).map((room: any) => room.id));
    const keptIds = new Set<string>();

    for (const raw of setups) {
      const roomPayload = {
        studio_id: id,
        name: String(raw.name || 'Studio setup').trim(),
        description: raw.description ? String(raw.description).trim() : null,
        price_per_hour: Math.max(0, Number(raw.price_per_hour) || 0),
        capacity: Math.max(1, Math.floor(Number(raw.capacity) || 1)),
        featured_image_url: raw.featured_image_url ? String(raw.featured_image_url) : null,
        is_active: raw.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      if (raw.id && existingIds.has(raw.id)) {
        await supabaseAdmin.from('rooms').update(roomPayload).eq('id', raw.id).eq('studio_id', id);
        keptIds.add(raw.id);
      } else {
        const { data: inserted } = await supabaseAdmin
          .from('rooms')
          .insert(roomPayload)
          .select('id')
          .single();
        if (inserted?.id) keptIds.add(inserted.id);
      }
    }

    const toDelete = [...existingIds].filter((roomId) => !keptIds.has(roomId));
    if (toDelete.length > 0) {
      await supabaseAdmin.from('rooms').delete().in('id', toDelete).eq('studio_id', id);
    }
  } else if (pricePerHour !== undefined || capacity !== undefined) {
    const { data: existingRoom } = await supabaseAdmin
      .from('rooms').select('id').eq('studio_id', id).maybeSingle();
    if (existingRoom) {
      const roomUpdates: Record<string, any> = {};
      if (pricePerHour !== undefined) roomUpdates.price_per_hour = Number(pricePerHour);
      if (capacity !== undefined) roomUpdates.capacity = Number(capacity);
      await supabaseAdmin.from('rooms').update(roomUpdates).eq('studio_id', id);
    } else {
      // No room exists yet — create one
      await supabaseAdmin.from('rooms').insert({
        studio_id: id,
        name: 'Main Room',
        price_per_hour: Number(pricePerHour) || 1000,
        capacity: Number(capacity) || 4,
        is_active: true,
      });
    }
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

  // Update platform add-on associations
  if (addonIds !== undefined && Array.isArray(addonIds)) {
    await supabaseAdmin.from('studio_addons').delete().eq('studio_id', id);
    if (addonIds.length > 0) {
      await supabaseAdmin.from('studio_addons').insert(
        addonIds.map((addon_id: string) => ({ studio_id: id, addon_id }))
      );
    }
  }

  if (
    partnerEquipmentSelections !== undefined ||
    partnerServiceIds !== undefined ||
    partnerAddonSelections !== undefined
  ) {
    try {
      const existing = await fetchStudioPartnerInventorySnapshot(supabaseAdmin, id);
      await saveStudioPartnerInventory(supabaseAdmin, id, partnerId, {
        partnerEquipmentSelections: Array.isArray(partnerEquipmentSelections)
          ? partnerEquipmentSelections
          : existing.partnerEquipmentSelections,
        partnerServiceIds: Array.isArray(partnerServiceIds)
          ? partnerServiceIds
          : existing.partnerServiceIds,
        partnerAddonSelections: Array.isArray(partnerAddonSelections)
          ? partnerAddonSelections
          : existing.partnerAddonSelections,
      });
    } catch (e) {
      console.error('partner inventory save (update studio):', e);
    }
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

  // Save packages if provided
  if (packages !== undefined && Array.isArray(packages)) {
    await supabaseAdmin.from('studio_packages').delete().eq('studio_id', id);
    const validPackages = packages.filter((p: any) => p.name?.trim());
    if (validPackages.length > 0) {
      await supabaseAdmin.from('studio_packages').insert(
        validPackages.map((pkg: any, idx: number) => ({
          studio_id: id,
          name: String(pkg.name).trim(),
          description: pkg.description || null,
          price_per_hour: Math.max(0, parseInt(pkg.price_per_hour) || 0),
          features: Array.isArray(pkg.features) ? pkg.features : [],
          is_popular: !!pkg.is_popular,
          display_order: idx,
        }))
      );
    }
  }

  // If draft is being submitted for review, notify admins
  if (review_status === 'pending_review') {
    try {
      const { data: studioRow } = await supabaseAdmin.from('studios').select('name').eq('id', id).maybeSingle();
      const studioName = studioRow?.name || 'Studio';
      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'admin');
      if (adminRoles && adminRoles.length > 0) {
        await supabaseAdmin.from('notifications').insert(
          adminRoles.map((ar: any) => ({
            user_id: ar.user_id,
            type: 'new_partner_signup',
            title: 'New Studio Pending Review',
            message: `"${studioName}" has been submitted and is awaiting approval.`,
            action_url: '/admin/studios',
          }))
        );
      }
    } catch { /* non-critical */ }
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
