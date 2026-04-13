import type { SupabaseClient } from "@supabase/supabase-js";
import { toPartnerAddonPublicId } from "@/lib/partner-inventory-ids";

/** Platform + partner add-ons for a studio (public read).
 *  - ALL active platform_addons (admin-created) are auto-applied to every studio.
 *  - Partner add-ons are only included if explicitly linked to this studio.
 */
export async function fetchMergedStudioAddons(
  supabase: SupabaseClient,
  studioId: string
): Promise<
  {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
    thumbnail_url?: string | null;
    is_active?: boolean;
    /** Max bookable quantity; null = unlimited */
    quantity?: number | null;
  }[]
> {
  // 1. Fetch ALL active platform add-ons (admin-created, auto-applied to all studios)
  const { data: platformRows } = await supabase
    .from("platform_addons")
    .select("id, name, description, price, category, is_active, thumbnail_url")
    .eq("is_active", true)
    .order("category")
    .order("name");

  const platform = (platformRows ?? []).map((r: any) => ({ ...r, quantity: null })) as {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
    thumbnail_url?: string | null;
    is_active?: boolean;
    quantity: null;
  }[];

  // 2. Fetch partner add-ons linked to this specific studio
  let partner: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
    thumbnail_url?: string | null;
    is_active?: boolean;
  }[] = [];

  try {
    const { data: links } = await supabase
      .from("studio_partner_addon_items")
      .select("enabled_for_booking, partner_addon_id")
      .eq("studio_id", studioId);

    const ids = (links || []).map((l: { partner_addon_id: string }) => l.partner_addon_id).filter(Boolean);
    if (ids.length > 0) {
      const { data: items } = await supabase
        .from("partner_addon_items")
        .select("id, name, description, price, is_active, addon_kind, thumbnail_url, quantity")
        .in("id", ids);

      const byId = new Map((items || []).map((it: any) => [it.id, it]));
      const enabled = new Map(
        (links || []).map((l: any) => [l.partner_addon_id, l.enabled_for_booking !== false])
      );

      partner = ids
        .map((pid) => {
          const it = byId.get(pid) as any;
          if (!it || !it.is_active) return null;
          if (enabled.get(pid) === false) return null;
          return {
            id: toPartnerAddonPublicId(it.id),
            name: it.name,
            description: it.description,
            price: it.price,
            category: it.addon_kind,
            thumbnail_url: it.thumbnail_url ?? null,
            is_active: true,
            quantity: it.quantity != null ? Number(it.quantity) : null,
          };
        })
        .filter(Boolean) as typeof partner;
    }
  } catch {
    /* optional tables */
  }

  return [...platform, ...partner];
}
