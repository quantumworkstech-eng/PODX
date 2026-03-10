import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;

async function getPartnerId(email: string) {
  const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const allowed = [
    "description", "discount_type", "discount_value",
    "min_booking_amount", "max_discount_amount", "max_uses",
    "valid_from", "valid_until", "studio_id", "is_active",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate discount_type / discount_value if provided
  if (update.discount_type && !["percentage", "fixed"].includes(update.discount_type as string)) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'fixed'" }, { status: 400 });
  }
  if (update.discount_value !== undefined) {
    update.discount_value = Number(update.discount_value);
  }
  if (update.min_booking_amount !== undefined) {
    update.min_booking_amount = Number(update.min_booking_amount);
  }
  if (update.max_discount_amount !== undefined) {
    update.max_discount_amount = update.max_discount_amount ? Number(update.max_discount_amount) : null;
  }
  if (update.max_uses !== undefined) {
    update.max_uses = update.max_uses ? Number(update.max_uses) : null;
  }

  const { data: coupon, error } = await supabase
    .from("partner_coupons")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("partner_id", partnerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

  return NextResponse.json({ coupon });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("partner_coupons")
    .delete()
    .eq("id", id)
    .eq("partner_id", partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
