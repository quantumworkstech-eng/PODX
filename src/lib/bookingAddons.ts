import type { AddOnService } from "@/lib/booking-types";
import { isPartnerAddonPublicId } from "@/lib/partner-inventory-ids";

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
  video_url?: string | null;
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
    videoUrl: row.video_url || undefined,
    category: row.category ?? undefined,
    maxQty,
  };
}

export function isRecommendedAddon(addon: AddOnService): boolean {
  return (addon.category || "").toLowerCase() === "popular";
}

export type AddonSection = {
  key: string;
  title: string;
  description: string;
  items: AddOnService[];
};

/** Known section keys, in the order they should appear. Partner add-ons carry
 *  their `addon_kind` as `category`; platform add-ons carry an admin category. */
const SECTION_META: Record<string, { title: string; description: string; order: number }> = {
  equipment: {
    title: "Equipment",
    description: "Extra gear to bring along for your session",
    order: 1,
  },
  studio: {
    title: "Studio Add-ons",
    description: "Extras the studio provides on site",
    order: 2,
  },
  service: {
    title: "Studio Services",
    description: "Editing and production handled by the studio",
    order: 3,
  },
  outsource: {
    title: "Partner Services",
    description: "Delivered by the studio's trusted partners",
    order: 4,
  },
  platform: {
    title: "Platform Services",
    description: "Offered by Yanisa Studios on every booking",
    order: 6,
  },
};

/** Custom partner categories sit between the known partner sections and platform. */
const CUSTOM_SECTION_ORDER = 5;

function resolveSection(addon: AddOnService): AddonSection {
  const raw = (addon.category || "").trim().toLowerCase();

  if (!isPartnerAddonPublicId(addon.id)) {
    // Platform add-ons: `general` / `popular` and anything else are one bucket.
    const meta = SECTION_META.platform;
    return { key: "platform", title: meta.title, description: meta.description, items: [] };
  }

  const known = SECTION_META[raw];
  if (known) {
    return { key: raw, title: known.title, description: known.description, items: [] };
  }

  const label = raw
    ? raw.charAt(0).toUpperCase() + raw.slice(1)
    : SECTION_META.studio.title;
  return {
    key: raw || "studio",
    title: label,
    description: "Offered by this studio",
    items: [],
  };
}

function sectionOrder(key: string): number {
  return SECTION_META[key]?.order ?? CUSTOM_SECTION_ORDER;
}

/** Group the merged catalog into titled sections for the Additional Services step. */
export function groupAddonsIntoSections(addons: AddOnService[]): AddonSection[] {
  const sections = new Map<string, AddonSection>();

  for (const addon of addons) {
    const section = resolveSection(addon);
    const existing = sections.get(section.key);
    if (existing) {
      existing.items.push(addon);
    } else {
      sections.set(section.key, { ...section, items: [addon] });
    }
  }

  return [...sections.values()].sort(
    (a, b) => sectionOrder(a.key) - sectionOrder(b.key) || a.title.localeCompare(b.title)
  );
}
