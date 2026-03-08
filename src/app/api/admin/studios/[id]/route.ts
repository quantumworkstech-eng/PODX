import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET full studio details for admin editing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  const [
    { data: studio, error: studioErr },
    { data: rooms },
    { data: images },
    { data: studioAmenities },
    { data: allAmenities },
    { data: hours },
    { data: policies },
  ] = await Promise.all([
    supabaseAdmin
      .from('studios')
      .select('*, users!studios_owner_id_fkey(email, profiles(full_name))')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('rooms')
      .select('*, room_equipment(quantity, equipment(id, name, category, brand, model))')
      .eq('studio_id', id)
      .order('created_at'),
    supabaseAdmin
      .from('studio_images')
      .select('*')
      .eq('studio_id', id)
      .order('display_order'),
    supabaseAdmin
      .from('studio_amenities')
      .select('amenity_id, amenities(id, name, icon, category)')
      .eq('studio_id', id),
    supabaseAdmin
      .from('amenities')
      .select('*')
      .order('category, name'),
    supabaseAdmin
      .from('studio_hours')
      .select('*')
      .eq('studio_id', id)
      .order('day_of_week'),
    supabaseAdmin
      .from('cancellation_policies')
      .select('*')
      .eq('studio_id', id)
      .order('hours_before', { ascending: false }),
  ]);

  if (studioErr || !studio) {
    return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
  }

  return NextResponse.json({
    studio: {
      ...studio,
      owner_email: studio.users?.email || '',
      owner_name: studio.users?.profiles?.full_name || '',
    },
    rooms: rooms || [],
    images: images || [],
    studioAmenities: (studioAmenities || []).map((sa: any) => sa.amenities),
    allAmenities: allAmenities || [],
    hours: hours || [],
    policies: policies || [],
  });
}

// PATCH update studio details or perform actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  // Status actions
  if (action) {
    const statusMap: Record<string, { review_status: string; is_active: boolean }> = {
      approve: { review_status: 'approved', is_active: true },
      reject: { review_status: 'rejected', is_active: false },
      suspend: { review_status: 'suspended', is_active: false },
      pause: { review_status: 'paused', is_active: false },
      activate: { review_status: 'approved', is_active: true },
    };

    const updates = statusMap[action];
    if (!updates) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('studios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });

    // Notify studio owner
    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('owner_id, name')
      .eq('id', id)
      .maybeSingle();

    if (studio?.owner_id) {
      const messages: Record<string, { type: string; title: string; content: string }> = {
        approve: {
          type: 'studio_approved',
          title: 'Studio Approved!',
          content: `Your studio "${studio.name}" has been approved and is now live.`,
        },
        reject: {
          type: 'studio_rejected',
          title: 'Studio Rejected',
          content: `Your studio "${studio.name}" was not approved. Please contact support for details.`,
        },
        suspend: {
          type: 'studio_suspended',
          title: 'Studio Suspended',
          content: `Your studio "${studio.name}" has been suspended. Contact support for more info.`,
        },
        pause: {
          type: 'studio_paused',
          title: 'Studio Paused',
          content: `Your studio "${studio.name}" listing has been temporarily paused by admin.`,
        },
      };

      const msg = messages[action];
      if (msg) {
        await supabaseAdmin.from('notifications').insert({
          user_id: studio.owner_id,
          type: msg.type,
          title: msg.title,
          content: msg.content,
          action_url: '/partner/studios',
        });
      }
    }

    await logAdminAction(email, `studio_${action}`, 'studio', id);
    return NextResponse.json({ success: true });
  }

  // Direct field updates
  const { studioFields, roomUpdates, amenityIds, hoursData, policyUpdates } = body;

  if (studioFields) {
    const allowed = [
      'name', 'description', 'short_description', 'address', 'city', 'state',
      'country', 'postal_code', 'phone', 'email', 'website', 'is_active',
      'review_status', 'featured_image_url', 'price_per_hour', 'discount_percent',
      'capacity', 'equipment', 'amenities', 'available_days',
      'working_hours_start', 'working_hours_end', 'latitude', 'longitude',
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in studioFields) updates[key] = studioFields[key];
    }

    const { error } = await supabaseAdmin.from('studios').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to update studio fields' }, { status: 500 });
  }

  // Update rooms (pricing, capacity, etc.)
  if (roomUpdates && Array.isArray(roomUpdates)) {
    for (const room of roomUpdates) {
      if (room.id) {
        const roomFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (room.name !== undefined) roomFields.name = room.name;
        if (room.price_per_hour !== undefined) roomFields.price_per_hour = Number(room.price_per_hour);
        if (room.capacity !== undefined) roomFields.capacity = Number(room.capacity);
        if (room.is_active !== undefined) roomFields.is_active = room.is_active;
        if (room.description !== undefined) roomFields.description = room.description;

        await supabaseAdmin.from('rooms').update(roomFields).eq('id', room.id);
      }
    }
  }

  // Update amenities (replace all)
  if (amenityIds && Array.isArray(amenityIds)) {
    await supabaseAdmin.from('studio_amenities').delete().eq('studio_id', id);
    if (amenityIds.length > 0) {
      const inserts = amenityIds.map((amenityId: string) => ({
        studio_id: id,
        amenity_id: amenityId,
      }));
      await supabaseAdmin.from('studio_amenities').insert(inserts);
    }
  }

  // Update studio hours
  if (hoursData && Array.isArray(hoursData)) {
    await supabaseAdmin.from('studio_hours').delete().eq('studio_id', id);
    if (hoursData.length > 0) {
      const inserts = hoursData.map((h: any) => ({
        studio_id: id,
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed || false,
      }));
      await supabaseAdmin.from('studio_hours').insert(inserts);
    }
  }

  // Update cancellation policies
  if (policyUpdates && Array.isArray(policyUpdates)) {
    await supabaseAdmin.from('cancellation_policies').delete().eq('studio_id', id);
    if (policyUpdates.length > 0) {
      const inserts = policyUpdates.map((p: any) => ({
        studio_id: id,
        hours_before: Number(p.hours_before),
        refund_percentage: Number(p.refund_percentage),
        description: p.description || null,
      }));
      await supabaseAdmin.from('cancellation_policies').insert(inserts);
    }
  }

  await logAdminAction(email, 'studio_edit', 'studio', id, {
    sections: [
      studioFields && 'basic',
      roomUpdates && 'rooms',
      amenityIds && 'amenities',
      hoursData && 'hours',
      policyUpdates && 'policies',
    ].filter(Boolean),
  });

  return NextResponse.json({ success: true });
}

// DELETE studio (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  const { data: studio } = await supabaseAdmin
    .from('studios')
    .select('name, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (!studio) return NextResponse.json({ error: 'Studio not found' }, { status: 404 });

  const { error } = await supabaseAdmin
    .from('studios')
    .update({
      review_status: 'deleted',
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to delete studio' }, { status: 500 });

  if (studio.owner_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: studio.owner_id,
      type: 'studio_deleted',
      title: 'Studio Removed',
      content: `Your studio "${studio.name}" has been removed from the platform by admin.`,
      action_url: '/partner/studios',
    });
  }

  await logAdminAction(email, 'studio_delete', 'studio', id, { name: studio.name });

  return NextResponse.json({ success: true });
}
