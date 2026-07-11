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

  return NextResponse.json({
    equipment: eq.data || [],
    services: sv.data || [],
    addons: ad.data || [],
  });
}
