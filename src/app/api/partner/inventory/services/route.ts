import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const SUBS = new Set(["editing", "production", "content_services"]);

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function POST(request: NextRequest) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  const subcategory = String(body.subcategory || "").toLowerCase();
  const name = String(body.name || "").trim();
  const description = body.description != null ? String(body.description).trim() : null;
  const basePrice =
    body.base_price != null && body.base_price !== ""
      ? Number(body.base_price)
      : null;

  if (!SUBS.has(subcategory) || !name) {
    return NextResponse.json({ error: "subcategory and name are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("partner_service_items")
    .insert({
      partner_id: partnerId,
      subcategory,
      name,
      description: description || null,
      base_price: basePrice != null && !Number.isNaN(basePrice) ? basePrice : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
