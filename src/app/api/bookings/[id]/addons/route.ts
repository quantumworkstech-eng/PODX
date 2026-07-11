import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parsePartnerAddonPublicId } from "@/lib/partner-inventory-ids";

const TAX_RATE = 0.18;

type Phase = "order" | "confirm";

async function resolveBookingForUser(bookingRef: string, userId: string) {
  const { data: booking, error } = await supabaseAdmin!
    .from("bookings")
    .select("id, booking_number, user_id, studio_id, start_time, end_time, status, total_price")
    .or(`id.eq.${bookingRef},booking_number.eq.${bookingRef}`)
    .maybeSingle();

  if (error || !booking) return { error: "Booking not found" as const };
  if (booking.user_id !== userId) return { error: "Forbidden" as const };
  return { booking };
}

function isUpcomingBooking(booking: {
  start_time: string;
  end_time: string;
  status: string;
}) {
  if (booking.status === "cancelled") return false;
  const end = new Date(booking.end_time).getTime();
  return end >= Date.now();
}

async function loadValidAddonsForStudio(
  studioId: string,
  addonIds: string[]
): Promise<
  | { error: string }
  | { addons: { id: string; name: string; price: number; description: string | null }[] }
> {
  if (!addonIds.length) return { error: "No add-ons selected" };

  const unique = [...new Set(addonIds)];
  const platformIds: string[] = [];
  const partnerUuids: string[] = [];

  for (const id of unique) {
    const p = parsePartnerAddonPublicId(id);
    if (p) partnerUuids.push(p);
    else platformIds.push(id);
  }

  const result: { id: string; name: string; price: number; description: string | null }[] = [];

  if (platformIds.length > 0) {
    const { data: links, error: linkErr } = await supabaseAdmin!
      .from("studio_addons")
      .select("addon_id")
      .eq("studio_id", studioId)
      .in("addon_id", platformIds);

    if (linkErr) return { error: "Could not validate add-ons" };
    const allowed = new Set((links || []).map((r: { addon_id: string }) => r.addon_id));
    if (allowed.size !== platformIds.length) {
      return { error: "One or more add-ons are not available for this studio" };
    }

    const { data: rows, error: paErr } = await supabaseAdmin!
      .from("platform_addons")
      .select("id, name, description, price")
      .in("id", platformIds)
      .eq("is_active", true);

    if (paErr || !rows?.length || rows.length !== platformIds.length) {
      return { error: "Invalid or inactive add-on" };
    }

    for (const r of rows as any[]) {
      result.push({
        id: r.id,
        name: r.name,
        price: Number(r.price),
        description: r.description ?? null,
      });
    }
  }

  if (partnerUuids.length > 0) {
    const { data: plinks, error: pLinkErr } = await supabaseAdmin!
      .from("studio_partner_addon_items")
      .select("partner_addon_id, enabled_for_booking")
      .eq("studio_id", studioId)
      .in("partner_addon_id", partnerUuids);

    if (pLinkErr) return { error: "Could not validate add-ons" };
    const allowedP = new Set(
      (plinks || [])
        .filter((r: any) => r.enabled_for_booking !== false)
        .map((r: any) => r.partner_addon_id)
    );
    if (allowedP.size !== partnerUuids.length) {
      return { error: "One or more add-ons are not available for this studio" };
    }

    const { data: prows, error: pErr } = await supabaseAdmin!
      .from("partner_addon_items")
      .select("id, name, description, price, is_active")
      .in("id", partnerUuids)
      .eq("is_active", true);

    if (pErr || !prows?.length || prows.length !== partnerUuids.length) {
      return { error: "Invalid or inactive add-on" };
    }

    for (const r of prows as any[]) {
      result.push({
        id: `paddon_${r.id}`,
        name: r.name,
        price: Number(r.price),
        description: r.description ?? null,
      });
    }
  }

  if (result.length !== unique.length) {
    return { error: "Could not load add-on details" };
  }

  return { addons: result };
}

function computeTotals(
  addons: { price: number }[]
): { subtotal: number; tax: number; total: number } {
  const subtotal = addons.reduce((s, a) => s + a.price, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

async function createRazorpayOrder(amountRupees: number) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { error: "Payment not configured" as const };
  }
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt: `addon_${Date.now()}`,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Razorpay order failed:", t);
    return { error: "Failed to create payment order" as const };
  }
  const order = await res.json();
  return { orderId: order.id as string, keyId, amountPaise: order.amount as number };
}

async function fetchRazorpayOrder(orderId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
  return expected === signature;
}

// POST { phase: "order", addonIds: string[] } | { phase: "confirm", addonIds, razorpay_* }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id: bookingRef } = await params;
    const body = await request.json();
    const phase = (body.phase || "order") as Phase;

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolved = await resolveBookingForUser(bookingRef, user.id);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.error === "Forbidden" ? 403 : 404 }
      );
    }
    const { booking } = resolved;

    if (!isUpcomingBooking(booking)) {
      return NextResponse.json(
        { error: "Add-ons can only be added to upcoming bookings" },
        { status: 400 }
      );
    }
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return NextResponse.json({ error: "Booking is not eligible" }, { status: 400 });
    }

    const addonIds: string[] = Array.isArray(body.addonIds) ? body.addonIds : [];

    if (phase === "order") {
      const loaded = await loadValidAddonsForStudio(booking.studio_id, addonIds);
      if ("error" in loaded) {
        return NextResponse.json({ error: loaded.error }, { status: 400 });
      }

      const { data: existingRows } = await supabaseAdmin
        .from("booking_addons")
        .select("name")
        .eq("booking_id", booking.id);

      const existingNames = new Set(
        (existingRows || []).map((r: { name: string }) => r.name.trim().toLowerCase())
      );
      const newAddons = loaded.addons.filter(
        (a) => !existingNames.has(a.name.trim().toLowerCase())
      );

      if (!newAddons.length) {
        return NextResponse.json(
          { error: "Selected add-ons are already on this booking" },
          { status: 400 }
        );
      }

      const { subtotal, tax, total } = computeTotals(newAddons);
      const rz = await createRazorpayOrder(total);
      if ("error" in rz) {
        return NextResponse.json({ error: rz.error }, { status: 500 });
      }

      if (rz.amountPaise !== Math.round(total * 100)) {
        return NextResponse.json({ error: "Payment amount mismatch" }, { status: 500 });
      }

      return NextResponse.json({
        orderId: rz.orderId,
        keyId: rz.keyId,
        amount: total,
        subtotal,
        tax,
        currency: "INR",
        lineItems: newAddons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
      });
    }

    if (phase === "confirm") {
      const {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      } = body;

      if (!paymentId || !orderId || !signature) {
        return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
      }

      if (!verifyPaymentSignature(orderId, paymentId, signature)) {
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }

      const loaded = await loadValidAddonsForStudio(booking.studio_id, addonIds);
      if ("error" in loaded) {
        return NextResponse.json({ error: loaded.error }, { status: 400 });
      }

      const { data: existingRows } = await supabaseAdmin
        .from("booking_addons")
        .select("name")
        .eq("booking_id", booking.id);

      const existingNames = new Set(
        (existingRows || []).map((r: { name: string }) => r.name.trim().toLowerCase())
      );
      const newAddons = loaded.addons.filter(
        (a) => !existingNames.has(a.name.trim().toLowerCase())
      );

      if (!newAddons.length) {
        return NextResponse.json(
          { error: "Selected add-ons are already on this booking" },
          { status: 400 }
        );
      }

      const { subtotal, tax, total } = computeTotals(newAddons);
      const order = await fetchRazorpayOrder(orderId);
      if (!order || order.amount !== Math.round(total * 100)) {
        return NextResponse.json(
          { error: "Payment order does not match this purchase" },
          { status: 400 }
        );
      }

      const insertRows = newAddons.map((a) => ({
        booking_id: booking.id,
        name: a.name,
        description: a.description,
        price: a.price,
        quantity: 1,
      }));

      const { error: insErr } = await supabaseAdmin.from("booking_addons").insert(insertRows);
      if (insErr) {
        console.error("booking_addons insert:", insErr);
        return NextResponse.json({ error: "Failed to save add-ons" }, { status: 500 });
      }

      const newTotal = Number(booking.total_price) + total;
      const { error: upErr } = await supabaseAdmin
        .from("bookings")
        .update({ total_price: newTotal, updated_at: new Date().toISOString() })
        .eq("id", booking.id);

      if (upErr) {
        console.error("booking total update:", upErr);
        return NextResponse.json({ error: "Failed to update booking total" }, { status: 500 });
      }

      await supabaseAdmin.from("payments").insert({
        booking_id: booking.id,
        user_id: user.id,
        provider: "razorpay",
        provider_payment_id: paymentId,
        amount: total,
        currency: "INR",
        status: "succeeded",
        metadata: {
          type: "addon_purchase",
          order_id: orderId,
          subtotal,
          tax,
          addon_ids: newAddons.map((a) => a.id),
        },
      });

      return NextResponse.json({
        success: true,
        totalPaid: total,
        newBookingTotal: newTotal,
      });
    }

    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  } catch (e) {
    console.error("POST /api/bookings/[id]/addons", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
