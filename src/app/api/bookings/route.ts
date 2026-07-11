import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  calendarDateInIST,
  startEndFromCalendarAndSlot,
} from "@/lib/bookingTime";
import { isoToISTSlot } from "@/lib/bookingDisplay";

// ── GET /api/bookings ─────────────────────────────────────────────────────────
// Returns the authenticated user's bookings from Supabase.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ bookings: [] });
    }

    // Resolve the Supabase user UUID from the email stored in the JWT
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ bookings: [] });
    }

    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `id, studio_id, booking_number, start_time, end_time, status, total_price, notes, created_at, updated_at, cancelled_at, cancellation_reason,
         studios!studio_id(id, name, location, cover_image, description),
         booking_addons(id, name, price, quantity)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    const bookings = (rows || []).map((b: any) => {
      let notes: Record<string, any> = {};
      try {
        notes = b.notes ? JSON.parse(b.notes) : {};
      } catch {
        /* ignore malformed notes */
      }

      const startTime = new Date(b.start_time);
      const endTime = new Date(b.end_time);
      const duration =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      // timeSlot is a convenience "HH:MM" IST label derived from start_time
      const timeSlot = isoToISTSlot(b.start_time);

      return {
        id: b.booking_number || b.id,
        dbId: b.id,
        studioId: b.studio_id as string,
        // Raw UTC ISO strings — use these for all date/time display
        start_time: b.start_time as string,
        end_time: b.end_time as string,
        // Legacy aliases kept for backward-compat
        date: b.start_time,
        endDate: b.end_time,
        timeSlot,
        duration,
        participants: notes.participants || 1,
        studio: b.studios,
        package: notes.package || null,
        addOns: (b.booking_addons || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price),
        })),
        totalPrice: Number(b.total_price),
        subtotal: notes.subtotal ?? null,
        tax: notes.tax ?? null,
        discountAmount: Number(notes.discountAmount ?? notes.discount_amount ?? 0) || null,
        couponCode:
          typeof notes.couponCode === "string"
            ? notes.couponCode
            : typeof notes.coupon_code === "string"
              ? notes.coupon_code
              : null,
        convenienceFee:
          Number(notes.convenienceFee ?? notes.convenience_fee ?? 0) || null,
        status: b.status,
        paymentId: notes.paymentId || "",
        gstNumber: notes.gstNumber || null,
        createdAt: b.created_at,
        updatedAt: b.updated_at as string,
        cancelledAt: b.cancelled_at as string | null,
        cancellationReason:
          typeof b.cancellation_reason === "string"
            ? b.cancellation_reason
            : null,
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Creates a new booking in Supabase after Razorpay payment is verified.
export async function POST(request: NextRequest) {
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
    const {
      studioId,
      date,
      timeSlot,
      duration,
      participants,
      packageData,
      addOns,
      totalPrice,
      subtotal,
      tax,
      paymentId,
      orderId,
      gstNumber,
      partnerId,
      bookingSource,
      whitelabelSlug,
      discountAmount,
      couponCode,
      convenienceFee,
    } = body;

    if (!studioId || !date || !timeSlot || !duration || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    // Resolve Supabase user UUID — auto-create if missing (handles Google OAuth
    // sign-ins where the DB sync callback may have failed on first login).
    let user: { id: string } | null = null;

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      // User not in custom table — upsert them now so the booking can proceed.
      const { data: upsertedUser, error: upsertErr } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            email: session.user.email,
            auth_provider: "google",
            email_verified: true,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (upsertErr || !upsertedUser) {
        console.error("Failed to auto-create user for booking:", upsertErr);
        return NextResponse.json(
          { error: "Could not resolve your account. Please sign out, sign back in, and try again." },
          { status: 404 }
        );
      }
      user = upsertedUser;
    }

    // Find the first active room for the studio (room_id is required by schema)
    const { data: room } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!room) {
      // Fall back: try any room for this studio
      const { data: anyRoom } = await supabaseAdmin
        .from("rooms")
        .select("id")
        .eq("studio_id", studioId)
        .limit(1)
        .maybeSingle();

      if (!anyRoom) {
        return NextResponse.json(
          { error: "No rooms available for this studio" },
          { status: 404 }
        );
      }
    }

    const roomId = room?.id;

    // Wall-clock date + slot in IST (matches calendar selection, independent of server TZ)
    let dateYYYYMMDD: string;
    try {
      dateYYYYMMDD = calendarDateInIST(String(date));
    } catch {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const { start: startTime, end: endTime } = startEndFromCalendarAndSlot(
      dateYYYYMMDD,
      timeSlot as string,
      Number(duration)
    );

    // Fetch studio's buffer_minutes so we can enforce it in the conflict check.
    // If studio A has buffer_minutes=30 and a booking ending at 14:00, a new
    // booking starting at 14:15 must still be rejected because it falls inside
    // the cleanup window.  We do this by shifting the conflict-check window
    // backwards by buffer_minutes: any existing booking whose end_time is
    // AFTER (newStart - bufferMinutes) is considered a conflict.
    const { data: studioMeta } = await supabaseAdmin
      .from("studios")
      .select("buffer_minutes")
      .eq("id", studioId)
      .maybeSingle();

    const bufferMinutes: number = studioMeta?.buffer_minutes ?? 0;

    // The effective start for conflict detection is pushed back by the buffer
    // so that a booking inside another booking's cleanup window is also caught.
    const conflictCheckStart = new Date(
      startTime.getTime() - bufferMinutes * 60 * 1000
    );

    // Double-booking check (includes buffer enforcement)
    const { data: conflicts } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("studio_id", studioId)
      .neq("status", "cancelled")
      .lt("start_time", endTime.toISOString())
      .gt("end_time", conflictCheckStart.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Human-readable booking number
    const bookingNumber = `POD-${Date.now().toString(36).toUpperCase()}`;

    // Store extra data in the notes TEXT field as JSON
    const notes = JSON.stringify({
      participants,
      package: packageData,
      subtotal,
      tax,
      paymentId,
      orderId,
      ...(gstNumber ? { gstNumber } : {}),
      ...(Number(discountAmount) > 0
        ? { discountAmount: Number(discountAmount), couponCode: couponCode || null }
        : {}),
      ...(Number(convenienceFee) > 0 ? { convenienceFee: Number(convenienceFee) } : {}),
    });

    const insertData: Record<string, any> = {
      booking_number: bookingNumber,
      user_id: user.id,
      studio_id: studioId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      total_price: totalPrice,
      notes,
    };

    if (roomId) {
      insertData.room_id = roomId;
    }

    // White-label partner tracking
    if (partnerId) insertData.partner_id = partnerId;
    if (bookingSource) insertData.booking_source = bookingSource;
    if (whitelabelSlug) insertData.whitelabel_slug = whitelabelSlug;

    let bookingData: any = null;
    let bookingError: any = null;

    // First attempt — with all optional tracking columns
    {
      const res = await supabaseAdmin
        .from("bookings")
        .insert(insertData)
        .select()
        .single();
      bookingData = res.data;
      bookingError = res.error;
    }

    // If the error is about a missing column (whitelabel migration not yet run),
    // retry with only the guaranteed core columns so the booking still saves.
    if (bookingError) {
      const msg = String(bookingError?.message ?? bookingError?.code ?? "").toLowerCase();
      const isMissingColumn =
        msg.includes("column") ||
        msg.includes("does not exist") ||
        msg.includes("42703") || // PostgreSQL error code for undefined_column
        msg.includes("schema");

      if (isMissingColumn) {
        console.warn(
          "Booking insert failed with column error — retrying with core fields only:",
          bookingError.message
        );
        const coreInsert: Record<string, any> = {
          booking_number: insertData.booking_number,
          user_id: insertData.user_id,
          studio_id: insertData.studio_id,
          start_time: insertData.start_time,
          end_time: insertData.end_time,
          status: insertData.status,
          total_price: insertData.total_price,
          notes: insertData.notes,
        };
        if (insertData.room_id) coreInsert.room_id = insertData.room_id;

        const res2 = await supabaseAdmin
          .from("bookings")
          .insert(coreInsert)
          .select()
          .single();
        bookingData = res2.data;
        bookingError = res2.error;
      }
    }

    if (bookingError || !bookingData) {
      console.error("Error creating booking:", bookingError);

      // Detect exclusion constraint violation (DB-level double-booking guard).
      // PostgreSQL error 23P01 = exclusion_violation (from bookings_no_overlap constraint).
      // Also handle 23505 (unique_violation) as a safety net.
      const errMsg = String(
        bookingError?.message ?? bookingError?.code ?? bookingError ?? ""
      ).toLowerCase();
      const isDoubleBooking =
        bookingError?.code === "23P01" ||
        bookingError?.code === "23505" ||
        errMsg.includes("bookings_no_overlap") ||
        errMsg.includes("exclusion") ||
        errMsg.includes("overlap");

      if (isDoubleBooking) {
        return NextResponse.json(
          { error: "This time slot was just taken by another booking. Please choose a different time." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: bookingError?.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    const booking = bookingData;

    // Create add-on records
    if (addOns && addOns.length > 0) {
      const addonRows = addOns.map((a: any) => ({
        booking_id: booking.id,
        name: a.name,
        price: a.price,
        quantity: 1,
      }));
      await supabaseAdmin.from("booking_addons").insert(addonRows);
    }

    // Create payment record
    await supabaseAdmin.from("payments").insert({
      booking_id: booking.id,
      user_id: user.id,
      provider: "razorpay",
      provider_payment_id: paymentId,
      amount: totalPrice,
      currency: "INR",
      status: "succeeded",
      metadata: { order_id: orderId, subtotal, tax },
    });

    return NextResponse.json(
      { bookingId: booking.id, bookingNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
