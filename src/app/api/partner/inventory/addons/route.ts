import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const KINDS = new Set(["studio", "service", "outsource"]);

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

export async function POST(request: NextRequest) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  const addonKind = String(body.addon_kind || body.type || "").toLowerCase();
  const name = String(body.name || "").trim();
  const description = body.description != null ? String(body.description).trim() : null;
  const price = typeof body.price === "number" ? body.price : Number(body.price ?? 0);
  const isActive = body.is_active !== false;

  if (!KINDS.has(addonKind) || !name) {
    return NextResponse.json({ error: "addon_kind and name are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("partner_addon_items")
    .insert({
      partner_id: partnerId,
      addon_kind: addonKind,
      name,
      description: description || null,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      is_active: isActive,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
