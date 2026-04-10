import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { computeBookedSlotLabels, istDayRangeUtc } from "@/lib/bookingTime";

// Must match client TIME_SLOTS range in src/lib/booking-types.ts (30-min intervals 09:00–20:30)
const SLOT_MIN_MINUTES = 9 * 60;   // 09:00
const SLOT_MAX_MINUTES = 20 * 60 + 30; // 20:30

// ── GET /api/studios/[id]/slots?date=YYYY-MM-DD ────────────────────────
// Returns hour labels ("09:00" … "20:00") that overlap existing bookings
// on this IST calendar day for the studio (incl. buffer after each booking).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studioId } = await params;

  try {
    const date = request.nextUrl.searchParams.get("date");
    const excludeBookingId = request.nextUrl.searchParams.get("excludeBookingId");

    if (!date) {
      return NextResponse.json(
        { error: "date query param required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ bookedSlots: [] });
    }

    const { dayStart, dayEnd } = istDayRangeUtc(date);

    // Overlap with [dayStart, dayEnd] in UTC:
    // booking overlaps this IST day iff start_time < dayEnd AND end_time > dayStart
    // (Do NOT filter only by start_time in the day — that misses cross-midnight spans.)
    const [{ data: bookingRows, error }, { data: studio }] = await Promise.all([
      supabaseAdmin
        .from("bookings")
        .select("id, booking_number, start_time, end_time")
        .eq("studio_id", studioId)
        .neq("status", "cancelled")
        .lt("start_time", dayEnd.toISOString())
        .gt("end_time", dayStart.toISOString()),
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

    let bookings = (bookingRows || []) as {
      id: string;
      booking_number: string | null;
      start_time: string;
      end_time: string;
    }[];
    // Client may send UUID (db id) or human-readable booking_number — exclude that row only.
    if (excludeBookingId) {
      bookings = bookings.filter(
        (b) =>
          b.id !== excludeBookingId &&
          (b.booking_number == null || b.booking_number !== excludeBookingId)
      );
    }

    const bookedSlots = computeBookedSlotLabels(
      date,
      bookings.map(({ start_time, end_time }) => ({ start_time, end_time })),
      bufferMinutes,
      SLOT_MIN_MINUTES,
      SLOT_MAX_MINUTES
    );

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("GET /api/studios/[id]/slots error:", error);
    return NextResponse.json({ bookedSlots: [] });
  }
}
