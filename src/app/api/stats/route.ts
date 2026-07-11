import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public stats endpoint — no auth required
export async function GET() {
  if (!supabaseAdmin) {
    // Return fallback values if DB not configured
    return NextResponse.json({
      totalUsers: 2000,
      totalStudios: 9,
      totalHours: 75000,
    });
  }

  const [
    { count: totalUsers },
    { count: totalStudios },
    { data: bookingsData },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('studios').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('bookings').select('duration_hours').eq('status', 'completed'),
  ]);

  const totalHours = (bookingsData || []).reduce(
    (sum: number, b: any) => sum + Number(b.duration_hours || 0),
    0
  );

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalStudios: totalStudios || 0,
    totalHours: Math.round(totalHours),
  });
}
