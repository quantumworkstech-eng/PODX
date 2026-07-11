import { NextRequest, NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { istDayRangeUtc } from "@/lib/bookingTime";

/**
 * Bookings overlapping [from, to] inclusive (IST calendar days).
 * Includes studio, client (booking user), and partner (studio owner).
 */
export async function GET(request: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ bookings: [] });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "from and to (YYYY-MM-DD) are required" }, { status: 400 });
  }

  const { dayStart: rangeStart } = istDayRangeUtc(from);
  const { dayEnd: rangeEnd } = istDayRangeUtc(to);

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id,
      booking_number,
      status,
      total_price,
      start_time,
      end_time,
      studio_id,
      users!bookings_user_id_fkey(email, profiles(full_name)),
      studios!studio_id(
        id,
        name,
        city,
        users!studios_owner_id_fkey(email, profiles(full_name))
      )
    `
    )
    .lt("start_time", rangeEnd.toISOString())
    .gt("end_time", rangeStart.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("admin calendar bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  const bookings = (data || []).map((b: Record<string, unknown>) => {
    const u = b.users as { email?: string; profiles?: unknown } | null;
    const profileArr = u?.profiles;
    const profile = Array.isArray(profileArr) ? profileArr[0] : profileArr;
    const clientName =
      (profile as { full_name?: string } | undefined)?.full_name?.trim() ||
      u?.email?.split("@")[0] ||
      "Customer";

    const studio = b.studios as {
      id?: string;
      name?: string;
      city?: string;
      users?: { email?: string; profiles?: unknown };
    } | null;

    const owner = studio?.users;
    const ownerProfiles = owner?.profiles;
    const ownerProfile = Array.isArray(ownerProfiles) ? ownerProfiles[0] : ownerProfiles;
    const partnerName =
      (ownerProfile as { full_name?: string } | undefined)?.full_name?.trim() ||
      owner?.email?.split("@")[0] ||
      "—";

    return {
      id: (b.booking_number as string) || (b.id as string),
      dbId: b.id as string,
      date: b.start_time as string,
      endDate: b.end_time as string,
      studioId: (b.studio_id as string) || studio?.id,
      studio: {
        id: studio?.id,
        name: studio?.name || "—",
        city: studio?.city || "",
      },
      customer: {
        name: clientName,
        email: u?.email || "",
      },
      partnerName,
      partnerEmail: owner?.email || "",
      status: b.status as "confirmed" | "pending" | "cancelled" | "completed",
      package: null as { name: string } | null,
      totalPrice: Number(b.total_price),
    };
  });

  return NextResponse.json({ bookings });
}
