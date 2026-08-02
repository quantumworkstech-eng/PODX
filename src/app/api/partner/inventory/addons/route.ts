import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const CATEGORIES = new Set(["equipment", "service"]);

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function POST(request: NextRequest) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  // Allow custom addon kinds (UI offers a "Custom…" option).
  const addonKind = String(body.addon_kind || body.type || "").trim().toLowerCase();
  const category = body.category != null ? String(body.category).toLowerCase() : null;
  const addonType = body.addon_type != null ? String(body.addon_type).trim() : null;
  const name = String(body.name || "").trim();
  const description = body.description != null ? String(body.description).trim() : null;
  const price = typeof body.price === "number" ? body.price : Number(body.price ?? 0);
  const quantityRaw = body.quantity ?? body.default_quantity ?? 1;
  const quantity = Math.max(1, Math.floor(Number(quantityRaw) || 1));
  const thumbnailUrl = body.thumbnail_url != null ? String(body.thumbnail_url).trim() : null;
  const isActive = body.is_active !== false;

  if (!addonKind || !name) {
    return NextResponse.json({ error: "addon_kind and name are required" }, { status: 400 });
  }
  if (category != null && !CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("partner_addon_items")
    .insert({
      partner_id: partnerId,
      addon_kind: addonKind,
      category: category || null,
      addon_type: addonType || null,
      name,
      description: description || null,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      quantity,
      thumbnail_url: thumbnailUrl || null,
      is_active: isActive,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
