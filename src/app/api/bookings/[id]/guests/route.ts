import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v: string) => UUID_RE.test(v);

// POST /api/bookings/[id]/guests
// Body: { guests: [{ name, email, phone }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await request.json();
  const guests: { name: string; email: string; phone: string }[] = body.guests || [];

  if (!Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: "guests array is required" }, { status: 400 });
  }

  // Resolve user
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch booking — support booking_number or UUID, verify ownership
  const bookingQuery = supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("user_id", user.id);

  const { data: booking } = await (isUUID(id)
    ? bookingQuery.eq("id", id)
    : bookingQuery.eq("booking_number", id)
  ).maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Remove previous guests for this booking (idempotent re-save)
  await supabaseAdmin.from("booking_guests").delete().eq("booking_id", booking.id);

  // Insert new guest rows — try with phone, fall back without if column missing
  const rows = guests
    .filter((g) => g.name?.trim() || g.email?.trim())
    .map((g) => ({
      booking_id: booking.id,
      guest_name: g.name?.trim() || "",
      guest_email: g.email?.trim() || null,
      guest_phone: g.phone?.trim() || null,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ success: true, saved: 0 });
  }

  const { error } = await supabaseAdmin.from("booking_guests").insert(rows);

  if (error) {
    // guest_phone column might not exist yet — retry without it
    const msg = String(error.message ?? "").toLowerCase();
    if (msg.includes("guest_phone") || msg.includes("column") || msg.includes("42703")) {
      const rowsWithoutPhone = rows.map(({ guest_phone: _, ...rest }) => rest);
      const { error: e2 } = await supabaseAdmin.from("booking_guests").insert(rowsWithoutPhone);
      if (e2) {
        console.error("booking_guests insert error:", e2);
        return NextResponse.json({ error: "Failed to save participants" }, { status: 500 });
      }
    } else {
      console.error("booking_guests insert error:", error);
      return NextResponse.json({ error: "Failed to save participants" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, saved: rows.length });
}
