import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const SUBS = new Set(["camera", "mic", "light", "accessory"]);

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
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.subcategory != null) {
    const s = String(body.subcategory).toLowerCase();
    if (!SUBS.has(s)) return NextResponse.json({ error: "Invalid subcategory" }, { status: 400 });
    updates.subcategory = s;
  }
  if (body.model_name != null) {
    const m = String(body.model_name).trim();
    if (!m) return NextResponse.json({ error: "model_name cannot be empty" }, { status: 400 });
    updates.model_name = m;
  }
  if (body.default_quantity != null) {
    updates.default_quantity = Math.max(1, Math.floor(Number(body.default_quantity) || 1));
  }

  const { data, error } = await supabaseAdmin
    .from("partner_equipment_items")
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
    .from("partner_equipment_items")
    .delete()
    .eq("id", id)
    .eq("partner_id", partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
