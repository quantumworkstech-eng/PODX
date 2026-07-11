import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Fetch client (must belong to this partner)
  const { data: client, error } = await supabase
    .from("partner_clients")
    .select("*")
    .eq("id", id)
    .eq("partner_id", user.id)
    .single();

  if (error || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Fetch their bookings with this partner's studios
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, booking_number, start_time, end_time, status, total_price,
      studios(name, city),
      payments(status, payment_method)
    `)
    .eq("partner_id", user.id)
    .eq("user_id", client.user_id)
    .order("start_time", { ascending: false })
    .limit(50);

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("partner_invoices")
    .select("id, invoice_number, invoice_date, total_amount, status")
    .eq("partner_id", user.id)
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ client, bookings: bookings || [], invoices: invoices || [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const allowed = ["client_name", "client_phone", "client_company", "notes", "tags", "is_blocked"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data: client, error } = await supabase
    .from("partner_clients")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("partner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client });
}
