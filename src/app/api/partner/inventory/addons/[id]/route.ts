import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const KINDS = new Set(["studio", "service", "outsource"]);
const CATEGORIES = new Set(["equipment", "service"]);

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

  if (body.addon_kind != null || body.type != null) {
    const k = String(body.addon_kind || body.type).toLowerCase();
    if (!KINDS.has(k)) return NextResponse.json({ error: "Invalid addon_kind" }, { status: 400 });
    updates.addon_kind = k;
  }
  if (body.name != null) {
    const n = String(body.name).trim();
    if (!n) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    updates.name = n;
  }
  if (body.description !== undefined) {
    updates.description = body.description != null ? String(body.description).trim() : null;
  }
  if (body.category !== undefined) {
    const c = body.category != null ? String(body.category).toLowerCase() : null;
    if (c != null && !CATEGORIES.has(c)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    updates.category = c;
  }
  if (body.addon_type !== undefined) {
    updates.addon_type = body.addon_type != null ? String(body.addon_type).trim() : null;
  }
  if (body.quantity !== undefined || body.default_quantity !== undefined) {
    const qRaw = body.quantity ?? body.default_quantity;
    const q = Math.max(1, Math.floor(Number(qRaw) || 1));
    updates.quantity = q;
  }
  if (body.thumbnail_url !== undefined) {
    updates.thumbnail_url = body.thumbnail_url != null ? String(body.thumbnail_url).trim() : null;
  }
  if (body.video_url !== undefined) {
    updates.video_url = body.video_url != null ? String(body.video_url).trim() : null;
  }
  if (body.price != null) {
    const p = Number(body.price);
    if (!Number.isFinite(p) || p < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    updates.price = p;
  }
  if (body.is_active !== undefined) {
    updates.is_active = Boolean(body.is_active);
  }

  const { data, error } = await supabaseAdmin
    .from("partner_addon_items")
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
    .from("partner_addon_items")
    .delete()
    .eq("id", id)
    .eq("partner_id", partnerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
