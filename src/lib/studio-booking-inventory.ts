import type { SupabaseClient } from "@supabase/supabase-js";
import { getMergedStudioEquipmentLabels } from "@/lib/partner-studio-inventory";
import { fetchMergedStudioAddons } from "@/lib/studio-addons-public";

export type StudioBookingInventory = {
  equipment: { category: string; items: { name: string; quantity: number }[] }[];
  services: { category: string; items: { name: string; priceLabel?: string }[] }[];
  /** Legacy / slug-style tags not parsed into structured rows */
  otherTags: string[];
  addonsOffered: {
    category: string;
    items: { name: string; price: number; description?: string | null }[];
  }[];
};

const EQ_CAT = new Set(["Camera", "Mics", "Lights", "Accessories"]);

function parseMergedLines(lines: string[]): Pick<StudioBookingInventory, "equipment" | "services" | "otherTags"> {
  const equipmentMap = new Map<string, { name: string; quantity: number }[]>();
  const servicesMap = new Map<string, { name: string; priceLabel?: string }[]>();
  const other: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const eqMatch = trimmed.match(/^(Camera|Mics|Lights|Accessories):\s*(.+?)\s*×\s*(\d+)$/i);
    if (eqMatch && EQ_CAT.has(eqMatch[1])) {
      const cat = eqMatch[1];
      const name = eqMatch[2].trim();
      const qty = Math.max(1, parseInt(eqMatch[3], 10) || 1);
      if (!equipmentMap.has(cat)) equipmentMap.set(cat, []);
      equipmentMap.get(cat)!.push({ name, quantity: qty });
      continue;
    }

    const svcMatch = trimmed.match(/^Service:\s*(.+)$/i);
    if (svcMatch) {
      let rest = svcMatch[1].trim();
      let priceLabel: string | undefined;
      const priceFrom = rest.match(/^(.+?)\s*\(from\s*(₹[\d,]+)\)\s*$/i);
      if (priceFrom) {
        rest = priceFrom[1].trim();
        priceLabel = priceFrom[2];
      }
      const sub = "Services";
      if (!servicesMap.has(sub)) servicesMap.set(sub, []);
      servicesMap.get(sub)!.push({ name: rest, priceLabel });
      continue;
    }

    other.push(trimmed);
  }

  return {
    equipment: [...equipmentMap.entries()].map(([category, items]) => ({ category, items })),
    services: [...servicesMap.entries()].map(([category, items]) => ({ category, items })),
    otherTags: other,
  };
}

function labelAddonCategory(raw: string): string {
  const c = raw.toLowerCase();
  if (c === "studio") return "Studio add-ons";
  if (c === "service") return "Service add-ons";
  if (c === "outsource") return "Outsource add-ons";
  if (c === "general" || c === "popular" || c === "") return "Platform add-ons";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function groupAddonsByCategory(
  addons: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category?: string | null;
  }[]
): { category: string; items: { name: string; price: number; description?: string | null }[] }[] {
  const map = new Map<string, { name: string; price: number; description?: string | null }[]>();
  for (const a of addons) {
    const category = labelAddonCategory((a.category || "general").toString().trim());
    if (!map.has(category)) map.set(category, []);
    map.get(category)!.push({
      name: a.name,
      price: Number(a.price),
      description: a.description,
    });
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

export async function buildStudioBookingInventory(
  supabase: SupabaseClient,
  studioId: string,
  baseEquipmentColumn: string[] | null | undefined
): Promise<StudioBookingInventory> {
  const merged = await getMergedStudioEquipmentLabels(supabase, studioId, baseEquipmentColumn || []);
  const parsed = parseMergedLines(merged);

  let addonsOffered: StudioBookingInventory["addonsOffered"] = [];
  try {
    const addons = await fetchMergedStudioAddons(supabase, studioId);
    addonsOffered = groupAddonsByCategory(addons);
  } catch {
    addonsOffered = [];
  }

  return {
    ...parsed,
    addonsOffered,
  };
}
