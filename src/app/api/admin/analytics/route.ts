import { NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  // Monthly revenue for last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'succeeded')
    .gte('created_at', twelveMonthsAgo.toISOString());

  // Group by month
  const monthlyRevenue: Record<string, number> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyRevenue[key] = 0;
  }

  (payments || []).forEach((p: any) => {
    const d = new Date(p.created_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (key in monthlyRevenue) monthlyRevenue[key] += Number(p.amount);
  });

  const revenueChart = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

  // Booking trends (last 12 months)
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('created_at, status')
    .gte('created_at', twelveMonthsAgo.toISOString());

  const bookingTrends: Record<string, number> = {};
  for (const key of Object.keys(monthlyRevenue)) bookingTrends[key] = 0;

  (bookings || []).forEach((b: any) => {
    const d = new Date(b.created_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (key in bookingTrends) bookingTrends[key] += 1;
  });

  const bookingChart = Object.entries(bookingTrends).map(([month, bookings]) => ({ month, bookings }));

  // Top performing studios
  const { data: topStudios } = await supabaseAdmin
    .from('bookings')
    .select('studio_id, total_price, studios(name, city)')
    .eq('status', 'confirmed')
    .not('studio_id', 'is', null);

  const studioMap: Record<string, { name: string; city: string; revenue: number; bookings: number }> = {};
  (topStudios || []).forEach((b: any) => {
    const sid = b.studio_id;
    if (!studioMap[sid]) {
      studioMap[sid] = { name: b.studios?.name || '', city: b.studios?.city || '', revenue: 0, bookings: 0 };
    }
    studioMap[sid].revenue += Number(b.total_price);
    studioMap[sid].bookings += 1;
  });

  const topStudiosList = Object.entries(studioMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Partner earnings leaderboard
  const { data: partnerStudios } = await supabaseAdmin
    .from('studios')
    .select('id, name, owner_id, users!studios_owner_id_fkey(email, profiles(full_name))');

  const partnerMap: Record<string, { name: string; email: string; studios: number; revenue: number }> = {};
  (partnerStudios || []).forEach((s: any) => {
    const oid = s.owner_id;
    if (!oid) return;
    if (!partnerMap[oid]) {
      partnerMap[oid] = {
        name: s.users?.profiles?.full_name || s.users?.email || '',
        email: s.users?.email || '',
        studios: 0,
        revenue: 0,
      };
    }
    partnerMap[oid].studios += 1;
    // Add revenue from studioMap
    partnerMap[oid].revenue += studioMap[s.id]?.revenue || 0;
  });

  const partnerLeaderboard = Object.entries(partnerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    revenueChart,
    bookingChart,
    topStudios: topStudiosList,
    partnerLeaderboard,
  });
}
