import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ── GET /api/studios/[studioId]/slots?date=YYYY-MM-DD ────────────────────────
// Returns the list of hour-slots already booked for this studio on the given date.
// The client uses this to grey-out unavailable time slots in DateTimeStep.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  const { studioId } = await params;

  try {
    const date = request.nextUrl.searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date query param required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      // If DB is not configured return an empty list — client falls back gracefully
      return NextResponse.json({ bookedSlots: [] });
    }

    // Query all non-cancelled bookings for this studio that overlap the date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("start_time, end_time")
      .eq("studio_id", studioId)
      .neq("status", "cancelled")
      .gte("start_time", dayStart.toISOString())
      .lte("start_time", dayEnd.toISOString());

    if (error) {
      console.error("Slots query error:", error);
      return NextResponse.json({ bookedSlots: [] });
    }

    // Convert each booking's start→end range into individual hour-slot strings
    const bookedSlots: string[] = [];
    for (const b of bookings || []) {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      let h = start.getHours();
      while (h < end.getHours()) {
        bookedSlots.push(`${h.toString().padStart(2, "0")}:00`);
        h++;
      }
    }

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("GET /api/studios/[studioId]/slots error:", error);
    return NextResponse.json({ bookedSlots: [] });
  }
}
