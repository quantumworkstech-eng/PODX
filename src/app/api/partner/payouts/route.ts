import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: payout history + pending earnings
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [{ data: history }, { data: earnings }] = await Promise.all([
    supabase
      .from("partner_payout_history")
      .select("*")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_earnings")
      .select("*, bookings(booking_number, start_time, studios(name))")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const allEarnings = earnings || [];
  const pending = allEarnings.filter((e) => e.payout_status === "pending");
  const pendingTotal = pending.reduce((s, e) => s + e.partner_amount, 0);
  const totalPaid = allEarnings
    .filter((e) => e.payout_status === "paid")
    .reduce((s, e) => s + e.partner_amount, 0);

  return NextResponse.json({
    history: history || [],
    earnings: allEarnings,
    pendingEarnings: pending,
    pendingTotal,
    totalPaid,
  });
}

// POST: request a payout
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { bank_account, ifsc_code, upi_id, payment_method } = await req.json();

  // Sum all pending earnings
  const { data: pending } = await supabase
    .from("partner_earnings")
    .select("id, partner_amount")
    .eq("partner_id", user.id)
    .eq("payout_status", "pending");

  if (!pending || pending.length === 0) {
    return NextResponse.json({ error: "No pending earnings to payout" }, { status: 400 });
  }

  const total = pending.reduce((s, e) => s + e.partner_amount, 0);

  const { data: payout, error } = await supabase
    .from("partner_payout_history")
    .insert({
      partner_id: user.id,
      payout_amount: total,
      booking_count: pending.length,
      bank_account,
      ifsc_code,
      upi_id,
      payment_method: payment_method || "bank_transfer",
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark earnings as processing
  await supabase
    .from("partner_earnings")
    .update({ payout_status: "processing" })
    .in("id", pending.map((e) => e.id));

  return NextResponse.json({ payout });
}
