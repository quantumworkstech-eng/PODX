import type { SupabaseClient } from "@supabase/supabase-js";
import { toPartnerAddonPublicId } from "@/lib/partner-inventory-ids";

/** Whether an add-on is a physical piece of gear or a service. */
export type StudioAddonGroup = "equipment" | "service";

/** Partners choose Equipment or Service when creating an add-on: that choice is
 *  stored in `category`, and mirrored into `addon_kind` as 'studio' | 'service'.
 *  `category` is null on rows created before it existed, hence the fallback.
 *  Platform add-ons have no such column and are services unless labelled otherwise. */
export function resolveAddonGroup(
  category?: string | null,
  addonKind?: string | null
): StudioAddonGroup {
  const cat = (category || "").trim().toLowerCase();
  if (cat === "equipment") return "equipment";
  if (cat === "service") return "service";
  return (addonKind || "").trim().toLowerCase() === "studio" ? "equipment" : "service";
}

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
    /** Equipment vs service, for grouping in customer-facing listings */
    group?: StudioAddonGroup;
    /** Plays on hover in the booking flow; thumbnail_url stays the resting state */
    video_url?: string | null;
  }[]
> {
  // 1. Fetch ALL active platform add-ons (admin-created, auto-applied to all studios).
  //    `select("*")` on purpose: newer columns (video_url) live in a migration that
  //    may not have been applied yet, and naming them explicitly would fail the whole
  //    query — dropping every add-on from the booking flow — until it is.
  const { data: platformRows } = await supabase
    .from("platform_addons")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");

  const platform = (platformRows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    price: r.price,
    category: r.category ?? null,
    thumbnail_url: r.thumbnail_url ?? null,
    video_url: r.video_url ?? null,
    is_active: r.is_active,
    quantity: null,
    group: resolveAddonGroup(r.category),
  })) as {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
    thumbnail_url?: string | null;
    video_url?: string | null;
    is_active?: boolean;
    quantity: null;
    group: StudioAddonGroup;
  }[];

  // 2. Fetch partner add-ons linked to this specific studio
  let partner: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
    thumbnail_url?: string | null;
    video_url?: string | null;
    is_active?: boolean;
    group?: StudioAddonGroup;
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
        .select("*")
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
            group: resolveAddonGroup(it.category, it.addon_kind),
            thumbnail_url: it.thumbnail_url ?? null,
            video_url: it.video_url ?? null,
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
