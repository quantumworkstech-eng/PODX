import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string })?.id ?? null;
}

/** GET — full partner inventory library (equipment, services, add-ons). */
export async function GET() {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ equipment: [], services: [], addons: [] });

  const [eq, sv, ad] = await Promise.all([
    supabaseAdmin
      .from("partner_equipment_items")
      .select("*")
      .eq("partner_id", partnerId)
      .order("use_count", { ascending: false }),
    supabaseAdmin
      .from("partner_service_items")
      .select("*")
      .eq("partner_id", partnerId)
      .order("use_count", { ascending: false }),
    supabaseAdmin
      .from("partner_addon_items")
      .select("*")
      .eq("partner_id", partnerId)
      .order("use_count", { ascending: false }),
  ]);

  // An add-on is only bookable once it is linked to a studio, so report how many
  // studios each one is live on — otherwise a partner cannot tell why a new item
  // never reaches customers.
  const addons = ad.data || [];
  const studioCounts = new Map<string, number>();
  if (addons.length > 0) {
    const { data: links } = await supabaseAdmin
      .from("studio_partner_addon_items")
      .select("partner_addon_id, enabled_for_booking")
      .in(
        "partner_addon_id",
        addons.map((a: { id: string }) => a.id)
      );
    for (const link of links || []) {
      if (link.enabled_for_booking === false) continue;
      const id = link.partner_addon_id as string;
      studioCounts.set(id, (studioCounts.get(id) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    equipment: eq.data || [],
    services: sv.data || [],
    addons: addons.map((a: { id: string }) => ({
      ...a,
      studio_count: studioCounts.get(a.id) ?? 0,
    })),
  });
}
