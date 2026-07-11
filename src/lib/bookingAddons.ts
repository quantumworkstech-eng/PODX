import type { AddOnService } from "@/lib/booking-types";

/** Placeholder when no image URL is stored for an add-on */
export const ADDON_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80";

export type PlatformAddonRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category?: string | null;
  thumbnail_url?: string | null;
  /** Maximum bookable quantity (null / undefined = unlimited) */
  quantity?: number | null;
};

export function platformAddonToService(row: PlatformAddonRow): AddOnService {
  const maxQty = row.quantity != null && Number(row.quantity) > 0
    ? Number(row.quantity)
    : undefined;
  return {
    id: row.id,
    name: row.name,
    description: row.description?.trim() || "",
    price: Number(row.price),
    thumbnail: row.thumbnail_url || ADDON_PLACEHOLDER_IMAGE,
    category: row.category ?? undefined,
    maxQty,
  };
}

export function isRecommendedAddon(addon: AddOnService): boolean {
  return (addon.category || "").toLowerCase() === "popular";
}
