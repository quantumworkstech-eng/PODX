import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("partner_clients")
    .select("*", { count: "exact" })
    .eq("partner_id", user.id)
    .order("last_booking_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `client_name.ilike.%${search}%,client_email.ilike.%${search}%,client_company.ilike.%${search}%`
    );
  }

  const { data: clients, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ clients: clients || [], total: count || 0, page, limit });
}

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

  const { client_name, client_email, client_phone, client_company, notes } = await req.json();

  if (!client_name || !client_email) {
    return NextResponse.json({ error: "client_name and client_email required" }, { status: 400 });
  }

  // Find user by email if they exist on platform
  const { data: clientUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", client_email)
    .single();

  const { data: client, error } = await supabase
    .from("partner_clients")
    .upsert({
      partner_id: user.id,
      user_id: clientUser?.id || null,
      client_name,
      client_email,
      client_phone,
      client_company,
      notes,
      source: "manual",
    }, { onConflict: "partner_id,user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client });
}
