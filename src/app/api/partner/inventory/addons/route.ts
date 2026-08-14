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
  const videoUrl = body.video_url != null ? String(body.video_url).trim() : null;
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
      video_url: videoUrl || null,
      is_active: isActive,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Offer it on the partner's studios straight away. Without this link the add-on
  // exists in the library but is invisible to customers, and nothing in the UI
  // explained that a separate trip to My Studios was required. Partners can still
  // turn it off per studio from the studio editor.
  let studioCount = 0;
  try {
    const { data: studios } = await supabaseAdmin
      .from("studios")
      .select("id")
      .eq("owner_id", partnerId);

    const requested: string[] | null = Array.isArray(body.studio_ids)
      ? body.studio_ids.map((s: unknown) => String(s))
      : null;
    const targets = (studios || [])
      .map((s: { id: string }) => s.id)
      .filter((id: string) => !requested || requested.includes(id));

    if (targets.length > 0) {
      const { error: linkError } = await supabaseAdmin
        .from("studio_partner_addon_items")
        .upsert(
          targets.map((studioId: string) => ({
            studio_id: studioId,
            partner_addon_id: data.id,
            enabled_for_booking: true,
          })),
          { onConflict: "studio_id,partner_addon_id" }
        );
      if (!linkError) studioCount = targets.length;
    }
  } catch {
    /* the add-on was created; linking is best-effort and reported below */
  }

  return NextResponse.json({ item: { ...data, studio_count: studioCount } }, { status: 201 });
}
