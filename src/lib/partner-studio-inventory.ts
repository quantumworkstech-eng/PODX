import type { SupabaseClient } from "@supabase/supabase-js";

const EQUIPMENT_LABEL: Record<string, string> = {
  camera: "Camera",
  mic: "Mics",
  light: "Lights",
  accessory: "Accessories",
};

export type PartnerEquipmentSelection = { id: string; quantity: number };

export function formatPartnerEquipmentLine(
  subcategory: string,
  modelName: string,
  quantity: number
): string {
  const label = EQUIPMENT_LABEL[subcategory] || subcategory;
  return `${label}: ${modelName} ×${quantity}`;
}

export function formatPartnerServiceLine(name: string, basePrice: number | null): string {
  if (basePrice != null && !Number.isNaN(Number(basePrice))) {
    return `Service: ${name} (from ₹${Number(basePrice).toLocaleString("en-IN")})`;
  }
  return `Service: ${name}`;
}

async function bumpUseCount(
  supabase: SupabaseClient,
  table: "partner_equipment_items" | "partner_service_items" | "partner_addon_items",
  ids: string[]
) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return;
  const { data: rows } = await supabase.from(table).select("id, use_count").in("id", unique);
  for (const row of rows || []) {
    const r = row as { id: string; use_count: number | null };
    await supabase
      .from(table)
      .update({ use_count: (r.use_count ?? 0) + 1 })
      .eq("id", r.id);
  }
}

/**
 * Persists per-studio junctions for partner inventory (reusable catalog items).
 */
export async function saveStudioPartnerInventory(
  supabase: SupabaseClient,
  studioId: string,
  partnerId: string,
  input: {
    partnerEquipmentSelections?: PartnerEquipmentSelection[];
    partnerServiceIds?: string[];
    partnerAddonSelections?: { id: string; enabled_for_booking: boolean }[];
  }
): Promise<void> {
  const eqSel = input.partnerEquipmentSelections || [];
  const svcIds = input.partnerServiceIds || [];
  const addonSel = input.partnerAddonSelections || [];

  await supabase.from("studio_partner_equipment").delete().eq("studio_id", studioId);
  await supabase.from("studio_partner_services").delete().eq("studio_id", studioId);
  await supabase.from("studio_partner_addon_items").delete().eq("studio_id", studioId);

  const bumpedEquipment: string[] = [];
  const bumpedServices: string[] = [];
  const bumpedAddons: string[] = [];

  if (eqSel.length > 0) {
    const ids = eqSel.map((e) => e.id);
    const { data: rows } = await supabase
      .from("partner_equipment_items")
      .select("id, partner_id, subcategory, model_name")
      .in("id", ids)
      .eq("partner_id", partnerId);

    const allowed = new Map((rows || []).map((r: any) => [r.id, r]));
    const toInsert = eqSel
      .map((e) => {
        const row = allowed.get(e.id);
        if (!row) return null;
        const qty = Math.max(1, Math.floor(Number(e.quantity) || 1));
        bumpedEquipment.push(e.id);
        return {
          studio_id: studioId,
          equipment_item_id: e.id,
          quantity: qty,
        };
      })
      .filter(Boolean) as { studio_id: string; equipment_item_id: string; quantity: number }[];

    if (toInsert.length > 0) {
      await supabase.from("studio_partner_equipment").insert(toInsert);
    }
  }

  if (svcIds.length > 0) {
    const { data: svcRows } = await supabase
      .from("partner_service_items")
      .select("id, partner_id, name, base_price")
      .in("id", svcIds)
      .eq("partner_id", partnerId);

    const allowedSvc = (svcRows || []) as any[];
    if (allowedSvc.length > 0) {
      await supabase.from("studio_partner_services").insert(
        allowedSvc.map((s) => ({
          studio_id: studioId,
          service_item_id: s.id,
        }))
      );
      for (const s of allowedSvc) {
        bumpedServices.push(s.id);
      }
    }
  }

  if (addonSel.length > 0) {
    const addonIds = addonSel.map((a) => a.id);
    const { data: addonRows } = await supabase
      .from("partner_addon_items")
      .select("id, partner_id")
      .in("id", addonIds)
      .eq("partner_id", partnerId);

    const allowedAddon = new Set((addonRows || []).map((r: any) => r.id));
    const toInsertAddons = addonSel
      .filter((a) => allowedAddon.has(a.id))
      .map((a) => ({
        studio_id: studioId,
        partner_addon_id: a.id,
        enabled_for_booking: a.enabled_for_booking !== false,
      }));

    if (toInsertAddons.length > 0) {
      await supabase.from("studio_partner_addon_items").insert(toInsertAddons);
      for (const a of toInsertAddons) {
        bumpedAddons.push(a.partner_addon_id);
      }
    }
  }

  await bumpUseCount(supabase, "partner_equipment_items", bumpedEquipment);
  await bumpUseCount(supabase, "partner_service_items", bumpedServices);
  await bumpUseCount(supabase, "partner_addon_items", bumpedAddons);
}

export type StudioPartnerInventorySnapshot = {
  partnerEquipmentSelections: { id: string; quantity: number }[];
  partnerServiceIds: string[];
  partnerAddonSelections: { id: string; enabled_for_booking: boolean }[];
};

export async function fetchStudioPartnerInventorySnapshot(
  supabase: SupabaseClient,
  studioId: string
): Promise<StudioPartnerInventorySnapshot> {
  const empty: StudioPartnerInventorySnapshot = {
    partnerEquipmentSelections: [],
    partnerServiceIds: [],
    partnerAddonSelections: [],
  };

  const [eqRes, svRes, adRes] = await Promise.all([
    supabase
      .from("studio_partner_equipment")
      .select("quantity, equipment_item_id")
      .eq("studio_id", studioId),
    supabase.from("studio_partner_services").select("service_item_id").eq("studio_id", studioId),
    supabase
      .from("studio_partner_addon_items")
      .select("partner_addon_id, enabled_for_booking")
      .eq("studio_id", studioId),
  ]);

  if (eqRes.error || svRes.error || adRes.error) {
    return empty;
  }

  return {
    partnerEquipmentSelections: (eqRes.data || []).map((r: any) => ({
      id: r.equipment_item_id,
      quantity: Math.max(1, Number(r.quantity) || 1),
    })),
    partnerServiceIds: (svRes.data || []).map((r: any) => r.service_item_id),
    partnerAddonSelections: (adRes.data || []).map((r: any) => ({
      id: r.partner_addon_id,
      enabled_for_booking: r.enabled_for_booking !== false,
    })),
  };
}

/** Labels for studio detail: legacy slug list + partner inventory lines (deduped). */
export async function getMergedStudioEquipmentLabels(
  supabase: SupabaseClient,
  studioId: string,
  baseEquipment: string[]
): Promise<string[]> {
  const lines: string[] = [...(baseEquipment || [])];

  const { data: eqJoin } = await supabase
    .from("studio_partner_equipment")
    .select("quantity, equipment_item_id")
    .eq("studio_id", studioId);

  if (eqJoin?.length) {
    const ids = [...new Set(eqJoin.map((r: any) => r.equipment_item_id))];
    const { data: items } = await supabase
      .from("partner_equipment_items")
      .select("id, subcategory, model_name")
      .in("id", ids);
    const byId = new Map((items || []).map((r: any) => [r.id, r]));
    for (const row of eqJoin) {
      const it = byId.get((row as any).equipment_item_id);
      if (!it) continue;
      const qty = Math.max(1, Number((row as any).quantity) || 1);
      lines.push(formatPartnerEquipmentLine(it.subcategory, it.model_name, qty));
    }
  }

  const { data: svJoin } = await supabase
    .from("studio_partner_services")
    .select("service_item_id")
    .eq("studio_id", studioId);

  if (svJoin?.length) {
    const sids = [...new Set(svJoin.map((r: any) => r.service_item_id))];
    const { data: sitems } = await supabase
      .from("partner_service_items")
      .select("id, name, base_price")
      .in("id", sids);
    const sbyId = new Map((sitems || []).map((r: any) => [r.id, r]));
    for (const sid of sids) {
      const s = sbyId.get(sid);
      if (s) {
        lines.push(
          formatPartnerServiceLine(s.name, s.base_price != null ? Number(s.base_price) : null)
        );
      }
    }
  }

  return [...new Set(lines)];
}
