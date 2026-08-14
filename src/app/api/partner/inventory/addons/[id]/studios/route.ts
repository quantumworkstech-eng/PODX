import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

/** POST — offer this add-on on the partner's studios.
 *  Body: { studio_ids?: string[] }  (omit to attach to every studio they own)
 *
 *  An add-on is only bookable once it is linked to a studio. Library items created
 *  before this was automatic sit unlinked, so this is the one-click repair.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await params;

  // The add-on must belong to this partner
  const { data: addon } = await supabaseAdmin
    .from("partner_addon_items")
    .select("id")
    .eq("id", id)
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (!addon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const requested: string[] | null = Array.isArray(body.studio_ids)
    ? body.studio_ids.map((s: unknown) => String(s))
    : null;

  const { data: studios } = await supabaseAdmin
    .from("studios")
    .select("id")
    .eq("owner_id", partnerId);

  const targets = (studios || [])
    .map((s: { id: string }) => s.id)
    .filter((studioId: string) => !requested || requested.includes(studioId));

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "You have no studios to offer this add-on on yet." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("studio_partner_addon_items").upsert(
    targets.map((studioId: string) => ({
      studio_id: studioId,
      partner_addon_id: id,
      enabled_for_booking: true,
    })),
    { onConflict: "studio_id,partner_addon_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, studio_count: targets.length });
}
