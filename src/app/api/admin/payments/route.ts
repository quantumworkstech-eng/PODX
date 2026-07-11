import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('payments')
    .select(`
      id, provider, provider_payment_id, amount, currency, status, payment_method, created_at,
      users!payments_user_id_fkey(email, profiles(full_name)),
      bookings!payments_booking_id_fkey(booking_number, studios(name))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }

  // Fetch refunds
  const { data: refunds } = await supabaseAdmin
    .from('refunds')
    .select('id, payment_id, amount, status, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const payments = (data || []).map((p: any) => ({
    id: p.id,
    provider: p.provider,
    provider_payment_id: p.provider_payment_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    payment_method: p.payment_method,
    created_at: p.created_at,
    user_email: p.users?.email || '',
    user_name: p.users?.profiles?.full_name || '',
    booking_number: p.bookings?.booking_number || '',
    studio_name: p.bookings?.studios?.name || '',
  }));

  return NextResponse.json({ payments, refunds: refunds || [], total: count || 0, page, limit });
}

export async function POST(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { payment_id, amount, reason } = await request.json();

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, amount')
    .eq('id', payment_id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const refundAmount = amount || payment.amount;

  await supabaseAdmin.from('refunds').insert({
    payment_id,
    amount: refundAmount,
    reason: reason || 'Admin manual refund',
    status: 'pending',
  });

  await supabaseAdmin.from('payments').update({ status: 'refunded' }).eq('id', payment_id);

  return NextResponse.json({ success: true, message: 'Refund initiated' });
}
