import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;

// POST /api/coupons/validate
// Body: { code, studioId, subtotal }
// Returns: { valid, coupon?, discountAmount?, error? }
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ valid: false, error: "Service unavailable" }, { status: 503 });

  const { code, studioId, subtotal } = await req.json();

  if (!code || !studioId || subtotal == null) {
    return NextResponse.json({ valid: false, error: "Missing required fields" }, { status: 400 });
  }

  const upperCode = String(code).trim().toUpperCase();

  // Find the studio's partner_id so we only accept coupons from that partner
  const { data: studio } = await supabase
    .from("studios")
    .select("owner_id")
    .eq("id", studioId)
    .maybeSingle();

  if (!studio) return NextResponse.json({ valid: false, error: "Studio not found" }, { status: 404 });

  const { data: coupon } = await supabase
    .from("partner_coupons")
    .select("*")
    .eq("partner_id", studio.owner_id)
    .eq("code", upperCode)
    .maybeSingle();

  if (!coupon) return NextResponse.json({ valid: false, error: "Invalid coupon code" });

  // Validation checks
  if (!coupon.is_active) return NextResponse.json({ valid: false, error: "Coupon is no longer active" });

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now)
    return NextResponse.json({ valid: false, error: "Coupon is not yet valid" });
  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return NextResponse.json({ valid: false, error: "Coupon has expired" });

  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses)
    return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });

  if (subtotal < (coupon.min_booking_amount || 0))
    return NextResponse.json({
      valid: false,
      error: `Minimum booking amount ₹${coupon.min_booking_amount.toLocaleString()} required`,
    });

  // If coupon is tied to a specific studio, verify
  if (coupon.studio_id && coupon.studio_id !== studioId)
    return NextResponse.json({ valid: false, error: "Coupon is not valid for this studio" });

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }
  } else {
    discountAmount = coupon.discount_value;
  }
  // Discount cannot exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    },
    discountAmount,
  });
}
