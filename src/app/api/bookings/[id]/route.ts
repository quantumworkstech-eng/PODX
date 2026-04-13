import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  calendarDateInIST,
  startEndFromCalendarAndSlot,
} from "@/lib/bookingTime";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v: string) => UUID_RE.test(v);

// ── PATCH /api/bookings/[id] ──────────────────────────────────────────────────
// Supports: action=cancel | action=reschedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, newDate, newTimeSlot } = body;

    // Resolve Supabase user UUID
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify booking belongs to this user — support both UUID and booking_number
    const bookingQuery = supabaseAdmin
      .from("bookings")
      .select("id, booking_number, start_time, end_time, status, studio_id, total_price")
      .eq("user_id", user.id);
    const { data: booking } = await (isUUID(id)
      ? bookingQuery.eq("id", id)
      : bookingQuery.eq("booking_number", id)
    ).maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // ── Cancel ────────────────────────────────────────────────────────────────
    if (action === "cancel") {
      const now = new Date();
      const startTime = new Date(booking.start_time);
      const hoursUntil =
        (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Fetch studio-specific cancellation policies
      const { data: customPolicies } = await supabaseAdmin
        .from("cancellation_policies")
        .select("hours_before, refund_percentage")
        .eq("studio_id", booking.studio_id)
        .order("hours_before", { ascending: false });

      const policies =
        customPolicies && customPolicies.length > 0
          ? customPolicies
          : [
              { hours_before: 48, refund_percentage: 100 },
              { hours_before: 24, refund_percentage: 50 },
              { hours_before: 0, refund_percentage: 0 },
            ];

      // Find the applicable refund: highest hours_before threshold that hoursUntil meets
      let refundPercentage = 0;
      for (const policy of policies) {
        if (hoursUntil >= policy.hours_before) {
          refundPercentage = policy.refund_percentage;
          break;
        }
      }

      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Cancelled by user",
          cancelled_at: now.toISOString(),
        })
        .eq("id", booking.id);

      if (error) {
        console.error("Cancel error:", error);
        return NextResponse.json(
          { error: "Failed to cancel booking" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, refundPercentage });
    }

    // ── Reschedule ────────────────────────────────────────────────────────────
    if (action === "reschedule" && newDate && newTimeSlot) {
      // Check reschedule cutoff
      const nowCheck = new Date();
      const currentStart = new Date(booking.start_time);
      const hoursUntilCurrent =
        (currentStart.getTime() - nowCheck.getTime()) / (1000 * 60 * 60);

      const { data: studioData } = await supabaseAdmin
        .from("studios")
        .select("reschedule_cutoff_hours")
        .eq("id", booking.studio_id)
        .maybeSingle();

      const cutoff = studioData?.reschedule_cutoff_hours ?? 48;
      if (hoursUntilCurrent < cutoff) {
        return NextResponse.json(
          {
            error: `Rescheduling is only allowed at least ${cutoff} hours before the session`,
          },
          { status: 400 }
        );
      }
      let dateYYYYMMDD: string;
      try {
        dateYYYYMMDD = calendarDateInIST(String(newDate));
      } catch {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }

      const oldDuration =
        (new Date(booking.end_time).getTime() -
          new Date(booking.start_time).getTime()) /
        (1000 * 60 * 60);

      const { start: newStart, end: newEnd } = startEndFromCalendarAndSlot(
        dateYYYYMMDD,
        newTimeSlot as string,
        oldDuration
      );

      // Conflict check (exclude current booking)
      const { data: conflicts } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("studio_id", booking.studio_id)
        .neq("status", "cancelled")
        .neq("id", booking.id)
        .lt("start_time", newEnd.toISOString())
        .gt("end_time", newStart.toISOString());

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "New time slot is not available" },
          { status: 409 }
        );
      }

      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        })
        .eq("id", booking.id);

      if (error) {
        console.error("Reschedule error:", error);
        return NextResponse.json(
          { error: "Failed to reschedule booking" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/bookings/[id] ─────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  // Hard-delete is almost never the right call for financial records.
  // Redirect callers to use PATCH with action=cancel instead.
  return NextResponse.json(
    { error: "Use PATCH with action=cancel to cancel a booking" },
    { status: 405 }
  );
}
