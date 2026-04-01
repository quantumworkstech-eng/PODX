import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;
import { getPartnerSubscription, isSubscriptionActive, checkFeature } from "@/lib/subscription-gates";
import { isFeatureEnabled } from "@/lib/feature-access";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Feature access gate
  const analyticsEnabled = await isFeatureEnabled(user.id, "analytics_access");
  if (!analyticsEnabled) {
    return NextResponse.json(
      { error: "Analytics access is not enabled for your account.", code: "FEATURE_DISABLED" },
      { status: 403 }
    );
  }

  // Subscription gate
  const sub = await getPartnerSubscription(user.id);
  if (!isSubscriptionActive(sub)) {
    return NextResponse.json(
      { error: "An active subscription is required to access analytics.", code: "SUBSCRIPTION_REQUIRED" },
      { status: 403 }
    );
  }
  const hasFullAnalytics = await checkFeature(user.id, "analytics_full");

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30"; // days
  const days = parseInt(period);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // All bookings for this partner in the period
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_time, end_time, status, total_price, studio_id,
      studios(id, name, city)
    `)
    .eq("partner_id", user.id)
    .gte("created_at", sinceISO)
    .order("start_time", { ascending: true });

  const allBookings = bookings || [];

  // ── Studio performance ──
  const studioMap: Record<string, { name: string; city: string; bookings: number; revenue: number; hours: number }> = {};
  for (const b of allBookings) {
    const studioArray = b.studios as unknown as { id: string; name: string; city: string }[] | null;
    const studio = studioArray?.[0];
    if (!studio) continue;
    if (!studioMap[b.studio_id]) {
      studioMap[b.studio_id] = { name: studio.name, city: studio.city, bookings: 0, revenue: 0, hours: 0 };
    }
    studioMap[b.studio_id].bookings++;
    if (b.status === "completed") {
      studioMap[b.studio_id].revenue += b.total_price || 0;
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      studioMap[b.studio_id].hours += (end.getTime() - start.getTime()) / 3600000;
    }
  }
  const studioPerformance = Object.entries(studioMap).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Daily booking chart ──
  const dailyMap: Record<string, { date: string; bookings: number; revenue: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { date: key, bookings: 0, revenue: 0 };
  }
  for (const b of allBookings) {
    const key = b.start_time.split("T")[0];
    if (dailyMap[key]) {
      dailyMap[key].bookings++;
      if (b.status === "completed") dailyMap[key].revenue += b.total_price || 0;
    }
  }
  const dailyChart = Object.values(dailyMap);

  // ── Peak booking hours ──
  const hourMap: Record<number, number> = {};
  for (const b of allBookings) {
    const hour = new Date(b.start_time).getHours();
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  }
  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? "AM" : "PM"}`,
    bookings: hourMap[h] || 0,
  }));

  // ── Cancellation rate ──
  const totalBookings = allBookings.length;
  const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;
  const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

  // ── Client analytics ──
  const { data: clients } = await supabase
    .from("partner_clients")
    .select("id, client_name, client_email, total_bookings, total_spent, first_booking_at, created_at")
    .eq("partner_id", user.id)
    .order("total_spent", { ascending: false });

  const allClients = clients || [];
  const newClients = allClients.filter(
    (c) => c.first_booking_at && new Date(c.first_booking_at) >= since
  ).length;
  const repeatClients = allClients.filter((c) => c.total_bookings > 1).length;
  const topClients = allClients.slice(0, 10);

  // ── Revenue summary ──
  const completedBookings = allBookings.filter((b) => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const { data: earnings } = await supabase
    .from("partner_earnings")
    .select("partner_amount, platform_fee, payout_status")
    .eq("partner_id", user.id);

  const netEarnings = (earnings || []).reduce((s, e) => s + e.partner_amount, 0);
  const pendingPayout = (earnings || [])
    .filter((e) => e.payout_status === "pending")
    .reduce((s, e) => s + e.partner_amount, 0);

  // Basic tier: limit chart to 7 days and strip detailed breakdowns
  const responseData: Record<string, unknown> = {
    analytics_level: hasFullAnalytics ? "full" : "basic",
    summary: {
      totalRevenue,
      netEarnings,
      pendingPayout,
      totalBookings,
      cancelledCount,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      totalClients: allClients.length,
      newClients,
      repeatClients,
    },
    peakHours,
    dailyChart: hasFullAnalytics ? dailyChart : dailyChart.slice(-7),
  };

  if (hasFullAnalytics) {
    responseData.studioPerformance = studioPerformance;
    responseData.topClients = topClients;
  }

  return NextResponse.json(responseData);
}
