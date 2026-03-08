import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, logAdminAction } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET full booking details for admin
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;

  const [
    { data: booking, error: bookingErr },
    { data: payments },
    { data: addons },
    { data: guests },
    { data: refunds },
  ] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users!bookings_user_id_fkey(id, email, phone, profiles(full_name, avatar_url)),
        studios(id, name, city, address, price_per_hour, owner_id, users!studios_owner_id_fkey(email, profiles(full_name)))
      `)
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('booking_addons')
      .select('*, platform_addons(name, price)')
      .eq('booking_id', id),
    supabaseAdmin
      .from('booking_guests')
      .select('*')
      .eq('booking_id', id),
    supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      ...booking,
      user_email: booking.users?.email || '',
      user_name: booking.users?.profiles?.full_name || '',
      user_phone: booking.users?.phone || '',
      user_avatar: booking.users?.profiles?.avatar_url || '',
      studio_name: booking.studios?.name || '',
      studio_city: booking.studios?.city || '',
      studio_address: booking.studios?.address || '',
      studio_price_per_hour: booking.studios?.price_per_hour || 0,
      studio_owner_email: booking.studios?.users?.email || '',
      studio_owner_name: booking.studios?.users?.profiles?.full_name || '',
    },
    payments: payments || [],
    addons: (addons || []).map((a: any) => ({
      ...a,
      addon_name: a.platform_addons?.name || 'Unknown',
      addon_price: a.platform_addons?.price || 0,
    })),
    guests: guests || [],
    refunds: refunds || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getAdminEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const { action, status, bookingFields } = body;

  if (action === 'force_cancel') {
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Cancelled by admin', cancelled_at: new Date().toISOString() })
      .eq('id', id);

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id, booking_number')
      .eq('id', id)
      .maybeSingle();

    if (booking?.user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        content: `Your booking ${booking.booking_number} has been cancelled by admin.`,
        action_url: '/dashboard',
      });
    }

    await logAdminAction(email, 'booking_force_cancel', 'booking', id);
    return NextResponse.json({ success: true });
  }

  if (action === 'force_refund') {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, amount, provider_payment_id')
      .eq('booking_id', id)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (!payment) return NextResponse.json({ error: 'No successful payment found' }, { status: 404 });

    await supabaseAdmin.from('refunds').insert({
      payment_id: payment.id,
      booking_id: id,
      amount: payment.amount,
      reason: 'Admin force refund',
      status: 'pending',
    });

    await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
    await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', id);

    await logAdminAction(email, 'booking_force_refund', 'booking', id);
    return NextResponse.json({ success: true, message: 'Refund initiated' });
  }

  // Direct field updates
  if (bookingFields) {
    const allowed = [
      'status', 'start_time', 'end_time', 'booking_date', 'notes',
      'total_price', 'cancellation_reason',
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in bookingFields) updates[key] = bookingFields[key];
    }

    const { error } = await supabaseAdmin.from('bookings').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });

    await logAdminAction(email, 'booking_edit', 'booking', id, { fields: Object.keys(bookingFields) });
    return NextResponse.json({ success: true });
  }

  if (status) {
    await supabaseAdmin.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await logAdminAction(email, 'booking_status_change', 'booking', id, { status });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
