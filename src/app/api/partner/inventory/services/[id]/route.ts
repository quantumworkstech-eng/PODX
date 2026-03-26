import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const SUBS = new Set(["editing", "production", "content_services"]);

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.subcategory != null) {
    const s = String(body.subcategory).toLowerCase();
    if (!SUBS.has(s)) return NextResponse.json({ error: "Invalid subcategory" }, { status: 400 });
    updates.subcategory = s;
  }
  if (body.name != null) {
    const n = String(body.name).trim();
    if (!n) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    updates.name = n;
  }
  if (body.description !== undefined) {
    updates.description = body.description != null ? String(body.description).trim() : null;
  }
  if (body.base_price !== undefined) {
    updates.base_price =
      body.base_price != null && body.base_price !== ""
        ? Number(body.base_price)
        : null;
  }

  const { data, error } = await supabaseAdmin
    .from("partner_service_items")
    .update(updates)
    .eq("id", id)
    .eq("partner_id", partnerId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("partner_service_items")
    .delete()
    .eq("id", id)
    .eq("partner_id", partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
