import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { checkStudioLimit } from '@/lib/subscription-gates';

async function getPartnerId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json({ studios: [] });

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ studios: [] });

  const { data, error } = await supabaseAdmin
    .from('studios')
    .select(`
      id, name, slug, description, short_description, address, city, is_active, review_status, latitude, longitude, buffer_minutes, equipment, created_at,
      rooms(id, price_per_hour, capacity, is_active),
      studio_images(image_url, display_order),
      studio_addons(addon_id)
    `)
    .eq('owner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partner studios:', error);
    return NextResponse.json({ studios: [] });
  }

  const studios = (data || []).map((s: any) => {
    const activeRooms = (s.rooms || []).filter((r: any) => r.is_active !== false);
    const price = activeRooms.length > 0 ? Math.min(...activeRooms.map((r: any) => r.price_per_hour)) : 0;
    const capacity = activeRooms.length > 0 ? Math.max(...activeRooms.map((r: any) => r.capacity)) : 0;
    const sortedImages = [...(s.studio_images || [])].sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    return {
      id: s.id,
      name: s.name,
      description: s.short_description || s.description || '',
      address: s.address || '',
      city: s.city || '',
      is_active: s.is_active,
      review_status: s.review_status || 'pending_review',
      latitude: s.latitude,
      longitude: s.longitude,
      price_per_hour: price,
      capacity,
      buffer_minutes: s.buffer_minutes ?? 0,
      equipment: s.equipment || [],
      addon_ids: (s.studio_addons || []).map((a: any) => a.addon_id),
      images: sortedImages.map((i: any) => i.image_url),
      status: s.is_active ? 'active' : 'inactive',
    };
  });

  return NextResponse.json({ studios });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Subscription gate: check studio limit
  const studioCheck = await checkStudioLimit(partnerId);
  if (!studioCheck.allowed) {
    return NextResponse.json(
      {
        error: studioCheck.max === 0
          ? 'An active subscription is required to list studios. Visit Billing & Plans to subscribe.'
          : `Studio limit reached. Your plan allows ${studioCheck.max} studio${studioCheck.max === 1 ? '' : 's'} (you have ${studioCheck.current}). Upgrade your plan to add more.`,
        code: 'STUDIO_LIMIT_REACHED',
        current: studioCheck.current,
        max: studioCheck.max,
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    name, description, fullDescription, address, city, state,
    pricePerHour, capacity, equipment, services, amenities,
    addonIds, images, videoUrl, latitude, longitude,
    cancellationRules, rescheduleRules,
  } = body;

  if (!name || !city) {
    return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
  }

  const slug = `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

  // Merge equipment + services + amenities into a single text[] for storage
  const allEquipment = [
    ...(Array.isArray(equipment) ? equipment : []),
    ...(Array.isArray(services) ? services : []),
    ...(Array.isArray(amenities) ? amenities : []),
  ];

  const studioInsert: Record<string, unknown> = {
    name,
    slug,
    description: fullDescription || description || '',
    short_description: (description || '').slice(0, 150),
    address: address || '',
    city,
    state: state || null,
    is_active: false,
    review_status: 'pending_review',
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    owner_id: partnerId,
    equipment: allEquipment,
  };
  if (videoUrl) studioInsert.video_url = videoUrl;

  const { data: studio, error: studioError } = await supabaseAdmin
    .from('studios')
    .insert(studioInsert)
    .select()
    .single();

  if (studioError || !studio) {
    console.error('Error creating studio:', studioError);
    return NextResponse.json(
      { error: studioError?.message || 'Failed to create studio' },
      { status: 500 }
    );
  }

  // Create default room
  await supabaseAdmin.from('rooms').insert({
    studio_id: studio.id,
    name: 'Main Room',
    price_per_hour: pricePerHour || 0,
    capacity: capacity || 2,
    is_active: true,
  });

  // Store images
  if (images && images.length > 0) {
    const imageRows = images.map((url: string, idx: number) => ({
      studio_id: studio.id,
      image_url: url,
      display_order: idx,
    }));
    await supabaseAdmin.from('studio_images').insert(imageRows);
  }

  // Store custom cancellation policies
  if (Array.isArray(cancellationRules) && cancellationRules.length > 0) {
    await supabaseAdmin.from('cancellation_policies').insert(
      cancellationRules.map((rule: any) => ({
        studio_id: studio.id,
        type: rule.type,
        value: rule.value,
        refund_percent: rule.refundPercent,
        deduction_percent: rule.deductionPercent,
        policy_type: 'cancellation',
      }))
    );
  }
  if (Array.isArray(rescheduleRules) && rescheduleRules.length > 0) {
    await supabaseAdmin.from('cancellation_policies').insert(
      rescheduleRules.map((rule: any) => ({
        studio_id: studio.id,
        type: rule.type,
        value: rule.value,
        refund_percent: 0,
        deduction_percent: rule.deductionPercent,
        policy_type: 'reschedule',
      }))
    );
  }

  // Link platform add-ons
  if (addonIds && Array.isArray(addonIds) && addonIds.length > 0) {
    await supabaseAdmin.from('studio_addons').insert(
      addonIds.map((addon_id: string) => ({ studio_id: studio.id, addon_id }))
    );
  }

  // Notify all admin users about the new studio pending review
  const { data: adminRoles } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, roles!inner(name)')
    .eq('roles.name', 'admin');

  if (adminRoles && adminRoles.length > 0) {
    const notifications = adminRoles.map((ar: any) => ({
      user_id: ar.user_id,
      type: 'new_partner_signup',
      title: 'New Studio Pending Review',
      message: `"${name}" has been submitted and is awaiting approval.`,
      action_url: '/admin/studios',
    }));
    await supabaseAdmin.from('notifications').insert(notifications);
  }

  return NextResponse.json({ studioId: studio.id }, { status: 201 });
}
