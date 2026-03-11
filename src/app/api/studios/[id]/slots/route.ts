import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ── GET /api/studios/[id]/slots?date=YYYY-MM-DD ────────────────────────
// Returns the list of hour-slots already booked for this studio on the given date.
// The client uses this to grey-out unavailable time slots in DateTimeStep.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studioId } = await params;

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

    // Fetch bookings and studio buffer_minutes in parallel
    const [{ data: bookings, error }, { data: studio }] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("start_time, end_time")
        .eq("studio_id", studioId)
        .neq("status", "cancelled")
        .gte("start_time", dayStart.toISOString())
        .lte("start_time", dayEnd.toISOString()),
      supabaseAdmin
        .from("studios")
        .select("buffer_minutes")
        .eq("id", studioId)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("Slots query error:", error);
      return NextResponse.json({ bookedSlots: [] });
    }

    const bufferMinutes: number = studio?.buffer_minutes ?? 0;

    // Convert each booking's start→end range (+ buffer) into blocked hour-slot strings.
    // Buffer is invisible to clients — it silently extends the blocked window.
    const bookedSlots: string[] = [];
    for (const b of bookings || []) {
      const start = new Date(b.start_time);
      const effectiveEnd = new Date(new Date(b.end_time).getTime() + bufferMinutes * 60 * 1000);
      // Round up to the next whole hour so partial-hour buffers block the enclosing slot
      const effectiveEndHours = effectiveEnd.getHours() + effectiveEnd.getMinutes() / 60;
      let h = start.getHours();
      while (h < Math.ceil(effectiveEndHours)) {
        bookedSlots.push(`${h.toString().padStart(2, "0")}:00`);
        h++;
      }
    }

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("GET /api/studios/[id]/slots error:", error);
    return NextResponse.json({ bookedSlots: [] });
  }
}
