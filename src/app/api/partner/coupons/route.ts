import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;

async function getPartnerId(email: string) {
  const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: coupons, error } = await supabase
    .from("partner_coupons")
    .select("*, studios(name)")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: coupons || [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partnerId = await getPartnerId(session.user.email);
  if (!partnerId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    code, description, discount_type, discount_value,
    min_booking_amount, max_discount_amount, max_uses,
    valid_from, valid_until, studio_id,
  } = body;

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
  }
  if (!["percentage", "fixed"].includes(discount_type)) {
    return NextResponse.json({ error: "discount_type must be 'percentage' or 'fixed'" }, { status: 400 });
  }
  if (discount_type === "percentage" && (discount_value <= 0 || discount_value > 100)) {
    return NextResponse.json({ error: "Percentage discount must be between 1 and 100" }, { status: 400 });
  }

  const upperCode = String(code).trim().toUpperCase();

  const { data: coupon, error } = await supabase
    .from("partner_coupons")
    .insert({
      partner_id: partnerId,
      studio_id: studio_id || null,
      code: upperCode,
      description,
      discount_type,
      discount_value: Number(discount_value),
      min_booking_amount: Number(min_booking_amount) || 0,
      max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
      max_uses: max_uses ? Number(max_uses) : null,
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ coupon }, { status: 201 });
}
