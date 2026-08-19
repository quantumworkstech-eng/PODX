import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { emitNotification } from '@/lib/notifications';
import type { EventKey } from '@/lib/notifications';
import { createAuditLog } from '@/lib/audit';
import type { AuditAction } from '@/lib/audit';

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
    { data: studioAddons },
    { data: allAddons },
    { data: studioPackages },
  ] = await Promise.all([
    supabaseAdmin
      .from('studios')
      .select('*, users!studios_owner_id_fkey(email, profiles(full_name))')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('rooms')
      .select('id, name, price_per_hour, capacity, is_active, description')
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
    supabaseAdmin
      .from('studio_addons')
      .select('addon_id')
      .eq('studio_id', id),
    supabaseAdmin
      .from('platform_addons')
      .select('id, name, description, price, category')
      .eq('is_active', true)
      .order('category')
      .order('name'),
    supabaseAdmin
      .from('studio_packages')
      .select('*')
      .eq('studio_id', id)
      .order('display_order'),
  ]);

  if (studioErr || !studio) {
    return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
  }

  // Get the primary room for price/capacity
  const primaryRoom = (rooms || [])[0] || null;

  return NextResponse.json({
    studio: {
      ...studio,
      owner_email: studio.users?.email || '',
      owner_name: studio.users?.profiles?.full_name || '',
      price_per_hour: primaryRoom?.price_per_hour || 0,
      capacity: primaryRoom?.capacity || 0,
    },
    rooms: rooms || [],
    images: images || [],
    studioAmenities: (studioAmenities || []).map((sa: any) => sa.amenities).filter(Boolean),
    allAmenities: allAmenities || [],
    hours: hours || [],
    policies: policies || [],
    studioAddonIds: (studioAddons || []).map((sa: any) => sa.addon_id),
    allAddons: allAddons || [],
    packages: (studioPackages || []).map((p: any) => ({
      name: p.name,
      description: p.description || '',
      price_per_hour: p.price_per_hour || 0,
      discount_percentage: Number(p.discount_percentage) || 0,
      features: Array.isArray(p.features) ? p.features : [],
      is_popular: !!p.is_popular,
    })),
  });
}

// PUT — full studio replace (used by the edit page)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const {
    name, description, short_description, address, city, state, country,
    owner_email, price_per_hour, capacity, video_url,
    images, available_days, working_hours, cancellation_rules, packages,
    addon_ids, buffer_minutes, reschedule_cutoff_hours, amenity_ids, equipment,
  } = body;

  // Optionally update owner
  if (owner_email) {
    const { data: ownerUser } = await supabaseAdmin.from('users').select('id').eq('email', owner_email).maybeSingle();
    if (!ownerUser) return NextResponse.json({ error: 'Owner user not found.' }, { status: 400 });
    await supabaseAdmin.from('studios').update({ owner_id: ownerUser.id }).eq('id', id);
  }

  // Update basic studio fields
  const studioUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
    admin_last_edited_at: new Date().toISOString(),
    admin_last_edited_by: email,
  };
  if (name) studioUpdate.name = name;
  if (description !== undefined) studioUpdate.description = description;
  if (short_description !== undefined) studioUpdate.short_description = short_description;
  if (address !== undefined) studioUpdate.address = address;
  if (city) studioUpdate.city = city;
  if (state !== undefined) studioUpdate.state = state;
  if (country) studioUpdate.country = country;
  if (video_url !== undefined) studioUpdate.video_url = video_url;
  if (buffer_minutes !== undefined) studioUpdate.buffer_minutes = Number(buffer_minutes) || 0;
  if (reschedule_cutoff_hours !== undefined) studioUpdate.reschedule_cutoff_hours = Number(reschedule_cutoff_hours) || 0;
  if (Array.isArray(equipment)) studioUpdate.equipment = equipment;
  await supabaseAdmin.from('studios').update(studioUpdate).eq('id', id);

  // Update room price/capacity
  const { data: existingRoom } = await supabaseAdmin.from('rooms').select('id').eq('studio_id', id).maybeSingle();
  if (existingRoom) {
    await supabaseAdmin.from('rooms').update({
      price_per_hour: Number(price_per_hour) || 1000,
      capacity: Number(capacity) || 4,
    }).eq('studio_id', id);
  }

  // Replace images
  if (Array.isArray(images)) {
    await supabaseAdmin.from('studio_images').delete().eq('studio_id', id);
    if (images.length > 0) {
      await supabaseAdmin.from('studio_images').insert(
        images.map((url: string, idx: number) => ({ studio_id: id, image_url: url, display_order: idx }))
      );
    }
  }

  // Replace hours
  if (Array.isArray(available_days) && working_hours?.start) {
    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    await supabaseAdmin.from('studio_hours').delete().eq('studio_id', id);
    await supabaseAdmin.from('studio_hours').insert(
      allDays.map((day) => ({
        studio_id: id,
        day_of_week: day,
        open_time: working_hours.start,
        close_time: working_hours.end,
        is_closed: !available_days.includes(day),
      }))
    );
  }

  // Replace cancellation policies
  if (Array.isArray(cancellation_rules)) {
    await supabaseAdmin.from('cancellation_policies').delete().eq('studio_id', id);
    if (cancellation_rules.length > 0) {
      await supabaseAdmin.from('cancellation_policies').insert(
        cancellation_rules.map((rule: any) => ({
          studio_id: id,
          hours_before: rule.type === 'days' ? Number(rule.value) * 24 : Number(rule.value),
          refund_percentage: Number(rule.refundPercent),
          description: `${rule.refundPercent}% refund if cancelled ${rule.value}+ ${rule.type} before`,
        }))
      );
    }
  }

  // Replace packages
  if (Array.isArray(packages)) {
    try {
      await supabaseAdmin.from('studio_packages').delete().eq('studio_id', id);
      const validPackages = packages.filter((p: any) => p.name?.trim());
      if (validPackages.length > 0) {
        await supabaseAdmin.from('studio_packages').insert(
          validPackages.map((pkg: any, idx: number) => ({
            studio_id: id,
            name: String(pkg.name).trim(),
            description: pkg.description || null,
            price_per_hour: Math.max(0, parseInt(pkg.price_per_hour) || 0),
            discount_percentage: Math.max(0, Math.min(100, Number(pkg.discount_percentage) || 0)),
            features: Array.isArray(pkg.features) ? pkg.features : [],
            is_popular: !!pkg.is_popular,
            display_order: idx,
          }))
        );
      }
    } catch { /* studio_packages table may not exist */ }
  }

  // Replace addons
  if (Array.isArray(addon_ids)) {
    await supabaseAdmin.from('studio_addons').delete().eq('studio_id', id);
    if (addon_ids.length > 0) {
      await supabaseAdmin.from('studio_addons').insert(
        addon_ids.map((addon_id: string) => ({ studio_id: id, addon_id }))
      );
    }
  }

  // Replace amenities
  if (Array.isArray(amenity_ids)) {
    await supabaseAdmin.from('studio_amenities').delete().eq('studio_id', id);
    if (amenity_ids.length > 0) {
      await supabaseAdmin.from('studio_amenities').insert(
        amenity_ids.map((amenity_id: string) => ({ studio_id: id, amenity_id }))
      );
    }
  }

  await logAdminAction(email, 'studio_full_edit', 'studio', id);
  return NextResponse.json({ success: true, studioId: id });
}

// PATCH update studio details or perform actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  const db = supabaseAdmin;

  const { id } = await params;
  const body = await request.json();
  const { action, reason } = body;

  // Status actions
  if (action) {
    const statusMap: Record<string, { review_status: string; is_active: boolean }> = {
      approve: { review_status: 'approved', is_active: true },
      reject: { review_status: 'rejected', is_active: false },
      suspend: { review_status: 'suspended', is_active: false },
      pause: { review_status: 'paused', is_active: false },
      activate: { review_status: 'approved', is_active: true },
      // Returns the listing to the partner for mandatory corrections.
      request_changes: { review_status: 'changes_required', is_active: false },
    };

    const updates = statusMap[action];
    if (!updates) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('studios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });

    const { data: studio } = await supabaseAdmin
      .from('studios')
      .select('owner_id, name')
      .eq('id', id)
      .maybeSingle();

    if (studio?.owner_id) {
      const messages: Record<string, { type: string; title: string; content: string }> = {
        approve: { type: 'studio_approved', title: 'Studio Approved!', content: `Your studio "${studio.name}" has been approved and is now live.` },
        reject: { type: 'studio_rejected', title: 'Studio Rejected', content: `Your studio "${studio.name}" was not approved. Please contact support.` },
        suspend: { type: 'studio_suspended', title: 'Studio Suspended', content: `Your studio "${studio.name}" has been suspended.` },
        pause: { type: 'studio_paused', title: 'Studio Paused', content: `Your studio "${studio.name}" has been temporarily paused.` },
      };
      const msg = messages[action];
      if (msg) {
        await supabaseAdmin.from('notifications').insert({
          user_id: studio.owner_id, type: msg.type, title: msg.title, content: msg.content, action_url: '/partner/studios',
        });
      }
    }

    // ── Transactional email to the partner ──────────────────────────────────
    const studioEmailEvent: Record<string, EventKey> = {
      approve: 'STUDIO_APPROVED',
      activate: 'STUDIO_APPROVED',
      reject: 'STUDIO_REJECTED',
      suspend: 'STUDIO_DEACTIVATED',
      pause: 'STUDIO_DEACTIVATED',
      request_changes: 'STUDIO_CHANGES_REQUIRED',
    };
    const eventKey = studioEmailEvent[action];
    if (eventKey) {
      await emitNotification(eventKey, {
        partnerId: studio?.owner_id,
        studioId: id,
        metadata: { reason: reason || null },
      });
    }

    const studioAuditAction: Record<string, AuditAction> = {
      approve: 'STUDIO_APPROVED', activate: 'STUDIO_ACTIVATED',
      reject: 'STUDIO_REJECTED', suspend: 'STUDIO_SUSPENDED',
      pause: 'STUDIO_SUSPENDED', request_changes: 'STUDIO_UPDATED',
    };
    await createAuditLog({
      action: studioAuditAction[action] ?? 'STUDIO_UPDATED',
      module: 'Studios',
      description: `Studio "${studio?.name ?? id}" — ${action.replace(/_/g, ' ')}`,
      recordType: 'studio',
      recordId: id,
      recordName: studio?.name ?? null,
      newValues: { review_status: updates.review_status, is_active: updates.is_active },
      metadata: reason ? { reason } : null,
    });

    // §4: a studio going unavailable must also reach the clients who already
    // hold bookings there.
    if (!statusMap[action].is_active) {
      await notifyUpcomingBookingClients(
        id,
        `${studio?.name || 'The studio'} is temporarily unavailable on our platform. Our team will contact you about your booking.`
      );
    }

    await logAdminAction(email, `studio_${action}`, 'studio', id);
    return NextResponse.json({ success: true });
  }

  // Direct field updates
  const { studioFields, amenityIds, addonIds, hoursData, policyUpdates, imageUrls } = body;

  const applyAdminAudit = async () => {
    await db
      .from('studios')
      .update({
        admin_last_edited_at: new Date().toISOString(),
        admin_last_edited_by: email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  };

  if (studioFields) {
    // Only allow actual columns that exist in the studios table
    const studioTableAllowed = [
      'name', 'description', 'short_description', 'address', 'city', 'state',
      'country', 'postal_code', 'phone', 'email', 'website', 'is_active',
      'review_status', 'featured_image_url', 'latitude', 'longitude',
    ];
    const studioUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of studioTableAllowed) {
      if (key in studioFields) studioUpdates[key] = studioFields[key];
    }
    studioUpdates.admin_last_edited_at = new Date().toISOString();
    studioUpdates.admin_last_edited_by = email;

    const { error: studioErr } = await supabaseAdmin.from('studios').update(studioUpdates).eq('id', id);
    if (studioErr) return NextResponse.json({ error: 'Failed to update studio fields' }, { status: 500 });

    // Update rooms table for price_per_hour and capacity
    const hasPrice = studioFields.price_per_hour !== undefined;
    const hasCapacity = studioFields.capacity !== undefined;
    if (hasPrice || hasCapacity) {
      const { data: existingRoom } = await supabaseAdmin
        .from('rooms').select('id').eq('studio_id', id).maybeSingle();
      if (existingRoom) {
        const roomUpdates: Record<string, unknown> = {};
        if (hasPrice) roomUpdates.price_per_hour = Number(studioFields.price_per_hour);
        if (hasCapacity) roomUpdates.capacity = Number(studioFields.capacity);
        await supabaseAdmin.from('rooms').update(roomUpdates).eq('studio_id', id);
      } else {
        // No room exists yet — create one
        await supabaseAdmin.from('rooms').insert({
          studio_id: id,
          name: 'Main Room',
          price_per_hour: Number(studioFields.price_per_hour) || 1000,
          capacity: Number(studioFields.capacity) || 4,
          is_active: true,
        });
      }
    }
  }

  // Update amenities (replace all) — amenityIds are UUIDs from the amenities table
  if (amenityIds && Array.isArray(amenityIds)) {
    await supabaseAdmin.from('studio_amenities').delete().eq('studio_id', id);
    if (amenityIds.length > 0) {
      await supabaseAdmin.from('studio_amenities').insert(
        amenityIds.map((amenityId: string) => ({ studio_id: id, amenity_id: amenityId }))
      );
    }
    await applyAdminAudit();
  }

  // Update studio add-ons (replace all)
  if (addonIds && Array.isArray(addonIds)) {
    await supabaseAdmin.from('studio_addons').delete().eq('studio_id', id);
    if (addonIds.length > 0) {
      await supabaseAdmin.from('studio_addons').insert(
        addonIds.map((addonId: string) => ({ studio_id: id, addon_id: addonId }))
      );
    }
    await applyAdminAudit();
  }

  // Update studio hours
  if (hoursData && Array.isArray(hoursData)) {
    await supabaseAdmin.from('studio_hours').delete().eq('studio_id', id);
    if (hoursData.length > 0) {
      await supabaseAdmin.from('studio_hours').insert(
        hoursData.map((h: any) => ({
          studio_id: id,
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
          is_closed: h.is_closed || false,
        }))
      );
    }
    await applyAdminAudit();
  }

  // Update cancellation policies
  if (policyUpdates && Array.isArray(policyUpdates)) {
    await supabaseAdmin.from('cancellation_policies').delete().eq('studio_id', id);
    if (policyUpdates.length > 0) {
      await supabaseAdmin.from('cancellation_policies').insert(
        policyUpdates.map((p: any) => ({
          studio_id: id,
          hours_before: Number(p.hours_before),
          refund_percentage: Number(p.refund_percentage),
          description: p.description || null,
        }))
      );
    }
    await applyAdminAudit();
  }

  // Replace gallery (order = cover first). Empty array clears all images.
  if ('imageUrls' in body && Array.isArray(imageUrls)) {
    await supabaseAdmin.from('studio_images').delete().eq('studio_id', id);
    if (imageUrls.length > 0) {
      await supabaseAdmin.from('studio_images').insert(
        imageUrls.map((url: string, idx: number) => ({
          studio_id: id,
          image_url: url,
          display_order: idx,
          caption: null,
        }))
      );
    }
    await supabaseAdmin
      .from('studios')
      .update({
        featured_image_url: imageUrls[0] || null,
        admin_last_edited_at: new Date().toISOString(),
        admin_last_edited_by: email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  await logAdminAction(email, 'studio_edit', 'studio', id, {
    sections: [studioFields && 'basic', amenityIds && 'amenities', addonIds && 'addons', hoursData && 'hours', policyUpdates && 'policies', imageUrls !== undefined && 'images'].filter(Boolean),
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
  const { data: studio } = await supabaseAdmin.from('studios').select('name, owner_id').eq('id', id).maybeSingle();
  if (!studio) return NextResponse.json({ error: 'Studio not found' }, { status: 404 });

  const { error } = await supabaseAdmin.from('studios').update({ review_status: 'deleted', is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete studio' }, { status: 500 });

  if (studio.owner_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: studio.owner_id, type: 'studio_deleted', title: 'Studio Removed',
      content: `Your studio "${studio.name}" has been removed from the platform by admin.`,
      action_url: '/partner/studios',
    });
  }

  await emitNotification('STUDIO_DEACTIVATED', {
    partnerId: studio.owner_id,
    studioId: id,
    metadata: { reason: 'The listing has been removed from the platform by an administrator.' },
  });
  await notifyUpcomingBookingClients(
    id,
    `${studio.name} is no longer available on our platform. Our team will contact you about your booking.`
  );

  await logAdminAction(email, 'studio_delete', 'studio', id, { name: studio.name });
  return NextResponse.json({ success: true });
}

/**
 * Tell every client with a live upcoming booking that the studio they booked
 * has become unavailable. Matrix §4: "studio becomes unavailable for an
 * existing booking" must notify both sides — the partner is emailed separately
 * by the caller.
 */
async function notifyUpcomingBookingClients(studioId: string, changeSummary: string): Promise<void> {
  if (!supabaseAdmin) return;

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id, user_id')
    .eq('studio_id', studioId)
    .in('status', ['confirmed', 'rescheduled'])
    .gte('start_time', new Date().toISOString());

  for (const booking of bookings || []) {
    await emitNotification('BOOKING_CRITICAL_UPDATE', {
      clientId: booking.user_id,
      bookingId: booking.id,
      studioId,
      // One notice per (booking, change) — a repeated admin action on the same
      // studio does not re-mail the same clients.
      idempotencyKey: `${booking.id}:${changeSummary}`,
      metadata: { changeSummary },
    });
  }
}
