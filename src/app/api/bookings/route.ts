import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

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
        `id, booking_number, start_time, end_time, status, total_price, notes, created_at,
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
      const hour = startTime.getHours();
      const timeSlot = `${hour.toString().padStart(2, "0")}:00`;

      return {
        id: b.booking_number || b.id,
        dbId: b.id,
        date: b.start_time,
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
        subtotal: notes.subtotal || null,
        tax: notes.tax || null,
        status: b.status,
        paymentId: notes.paymentId || "",
        createdAt: b.created_at,
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
      partnerId,
      bookingSource,
      whitelabelSlug,
    } = body;

    if (!studioId || !date || !timeSlot || !duration || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required booking fields" },
        { status: 400 }
      );
    }

    // Resolve Supabase user UUID
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Build start/end timestamps
    const dateObj = new Date(date);
    const [hours] = (timeSlot as string).split(":");
    const startTime = new Date(dateObj);
    startTime.setHours(parseInt(hours, 10), 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + Number(duration));

    // Double-booking check
    const { data: conflicts } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("studio_id", studioId)
      .neq("status", "cancelled")
      .lt("start_time", endTime.toISOString())
      .gt("end_time", startTime.toISOString());

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

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert(insertData)
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

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
