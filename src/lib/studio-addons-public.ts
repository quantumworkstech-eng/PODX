import type { SupabaseClient } from "@supabase/supabase-js";
import { toPartnerAddonPublicId } from "@/lib/partner-inventory-ids";

/** Platform + partner add-ons for a studio (public read). */
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
    is_active?: boolean;
  }[]
> {
  const { data: rows } = await supabase
    .from("studio_addons")
    .select(
      `
      platform_addons (
        id,
        name,
        description,
        price,
        category,
        is_active
      )
    `
    )
    .eq("studio_id", studioId);

  const platform = (rows ?? [])
    .map((r: { platform_addons: unknown }) => r.platform_addons)
    .filter((a) => {
      const row = a as { is_active?: boolean } | null;
      return Boolean(row && row.is_active !== false);
    }) as {
      id: string;
      name: string;
      description: string | null;
      price: number | string;
      category?: string | null;
      is_active?: boolean;
    }[];

  let partner: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
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
        .select("id, name, description, price, is_active, addon_kind")
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
            is_active: true,
          };
        })
        .filter(Boolean) as typeof partner;
    }
  } catch {
    /* optional tables */
  }

  return [...platform, ...partner];
}
