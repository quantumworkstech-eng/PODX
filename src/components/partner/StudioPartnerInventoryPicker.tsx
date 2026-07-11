"use client";

import { cn } from "@/lib/utils";
import { Check, Package } from "lucide-react";

type EqItem = { id: string; subcategory: string; model_name: string; default_quantity: number };
type SvItem = { id: string; name: string; subcategory: string };

const EQ_LABEL: Record<string, string> = {
  camera: "Camera",
  mic: "Mics",
  light: "Lights",
  accessory: "Acc.",
};

export function StudioPartnerInventoryPicker({
  equipment,
  services,
  partnerEquipmentSelections,
  onChangeEquipment,
  partnerServiceIds,
  onChangeServices,
  onManageInventory,
}: {
  equipment: EqItem[];
  services: SvItem[];
  partnerEquipmentSelections: { id: string; quantity: number }[];
  onChangeEquipment: (next: { id: string; quantity: number }[]) => void;
  partnerServiceIds: string[];
  onChangeServices: (next: string[]) => void;
  onManageInventory: () => void;
}) {
  const eqById = new Map(partnerEquipmentSelections.map((e) => [e.id, e.quantity]));

  function toggleEq(id: string, defaultQty: number) {
    if (eqById.has(id)) {
      onChangeEquipment(partnerEquipmentSelections.filter((e) => e.id !== id));
    } else {
      onChangeEquipment([...partnerEquipmentSelections, { id, quantity: defaultQty }]);
    }
  }

  function setQty(id: string, q: number) {
    const qty = Math.max(1, Math.floor(q) || 1);
    onChangeEquipment(
      partnerEquipmentSelections.map((e) => (e.id === id ? { ...e, quantity: qty } : e))
    );
  }

  function toggleSvc(id: string) {
    if (partnerServiceIds.includes(id)) {
      onChangeServices(partnerServiceIds.filter((s) => s !== id));
    } else {
      onChangeServices([...partnerServiceIds, id]);
    }
  }

  const hasLibrary = equipment.length > 0 || services.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/90 text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D9FC67]" />
            Your saved inventory
          </p>
          <p className="text-white/40 text-xs mt-1">
            Select catalog items for this studio. Quantities apply to equipment only.
          </p>
        </div>
        <button
          type="button"
          onClick={onManageInventory}
          className="text-xs font-medium text-[#D9FC67]/80 hover:text-[#D9FC67] whitespace-nowrap"
        >
          + Manage custom
        </button>
      </div>

      {!hasLibrary ? (
        <p className="text-white/35 text-sm">
          You have not added reusable equipment or services yet. Click{" "}
          <button type="button" onClick={onManageInventory} className="text-[#D9FC67]/80 underline">
            Manage custom
          </button>{" "}
          to create your library.
        </p>
      ) : (
        <>
          {equipment.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wide">
                Equipment
              </p>
              <div className="flex flex-wrap gap-2">
                {equipment.map((it) => {
                  const selected = eqById.has(it.id);
                  return (
                    <div key={it.id} className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleEq(it.id, it.default_quantity || 1)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          selected
                            ? "border-[#D9FC67] bg-[#D9FC67]/10 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        )}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-[#D9FC67]" />}
                        <span>
                          [{EQ_LABEL[it.subcategory] || it.subcategory}] {it.model_name}
                        </span>
                      </button>
                      {selected && (
                        <input
                          type="number"
                          min={1}
                          value={eqById.get(it.id) ?? 1}
                          onChange={(e) => setQty(it.id, parseInt(e.target.value, 10))}
                          className="w-14 h-8 px-2 rounded-lg bg-black/50 border border-white/15 text-white text-xs"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wide">
                Services
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((it) => {
                  const selected = partnerServiceIds.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggleSvc(it.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        selected
                          ? "border-[#D9FC67] bg-[#D9FC67]/10 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                      )}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-[#D9FC67]" />}
                      {it.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
