import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';

async function requireAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (!user) return false;
  const { data: roleData } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  return (roleData || []).some((r: any) => r.roles?.name === 'admin');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await requireAdmin(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const body = await request.json();
  const { action, status } = body;

  if (action === 'force_cancel') {
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Cancelled by admin', cancelled_at: new Date().toISOString() })
      .eq('id', id);

    // Get booking info to notify user
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

    return NextResponse.json({ success: true });
  }

  if (action === 'force_refund') {
    // Get payment
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, amount, provider_payment_id')
      .eq('booking_id', id)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (!payment) return NextResponse.json({ error: 'No successful payment found' }, { status: 404 });

    // Create refund record
    await supabaseAdmin.from('refunds').insert({
      payment_id: payment.id,
      amount: payment.amount,
      reason: 'Admin force refund',
      status: 'pending',
    });

    await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
    await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', id);

    return NextResponse.json({ success: true, message: 'Refund initiated' });
  }

  if (status) {
    await supabaseAdmin.from('bookings').update({ status }).eq('id', id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
