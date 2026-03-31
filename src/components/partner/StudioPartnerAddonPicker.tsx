"use client";

import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

type PAddon = {
  id: string;
  addon_kind: string;
  name: string;
  description: string | null;
  price: number;
  is_active?: boolean;
};

type Plat = { id: string; name: string; description?: string | null; price: number; category?: string | null };

const KIND_LABEL: Record<string, string> = {
  studio: "Studio",
  service: "Service",
  outsource: "Outsource",
};

export function StudioPartnerAddonPicker({
  platformAddons,
  partnerAddons,
  selectedPlatformIds,
  partnerAddonSelections,
  onChangePlatform,
  onChangePartnerSelections,
}: {
  platformAddons: Plat[];
  partnerAddons: PAddon[];
  selectedPlatformIds: string[];
  partnerAddonSelections: { id: string; enabled_for_booking: boolean }[];
  onChangePlatform: (ids: string[]) => void;
  onChangePartnerSelections: (rows: { id: string; enabled_for_booking: boolean }[]) => void;
}) {
  const partnerById = new Map(partnerAddonSelections.map((r) => [r.id, r.enabled_for_booking]));

  function togglePlatform(id: string) {
    if (selectedPlatformIds.includes(id)) {
      onChangePlatform(selectedPlatformIds.filter((x) => x !== id));
    } else {
      onChangePlatform([...selectedPlatformIds, id]);
    }
  }

  function togglePartner(id: string) {
    if (partnerById.has(id)) {
      onChangePartnerSelections(partnerAddonSelections.filter((r) => r.id !== id));
    } else {
      onChangePartnerSelections([...partnerAddonSelections, { id, enabled_for_booking: true }]);
    }
  }

  function setPartnerEnabled(id: string, enabled: boolean) {
    onChangePartnerSelections(
      partnerAddonSelections.map((r) => (r.id === id ? { ...r, enabled_for_booking: enabled } : r))
    );
  }

  return (
    <div className="space-y-6">
      {platformAddons.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-white/80 text-sm font-medium">Platform add-ons</p>
          </div>
          <p className="text-white/35 text-xs mb-3">
            Created by PodX admin — automatically available to clients on <strong className="text-white/50">all</strong> studios. Cannot be removed.
          </p>
          <div className="space-y-2">
            {platformAddons.map((a) => (
              <div
                key={a.id}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{a.name}</p>
                  {a.description && (
                    <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{a.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-300 text-sm font-semibold">
                    ₹{Number(a.price).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Auto
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {partnerAddons.filter((a) => a.is_active !== false).length > 0 && (
        <div>
          <p className="text-white/80 text-sm font-medium mb-2">Your add-ons</p>
          <p className="text-white/35 text-xs mb-3">
            Priced upsells — only selected items appear in the booking flow.
          </p>
          <div className="space-y-2">
            {partnerAddons
              .filter((a) => a.is_active !== false)
              .map((a) => {
                const selected = partnerById.has(a.id);
                const enabled = partnerById.get(a.id) !== false;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3",
                      selected ? "border-[#D9FC67]/40 bg-[#D9FC67]/5" : "border-white/10 bg-white/[0.02]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => togglePartner(a.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-white/10 text-white/50">
                          {KIND_LABEL[a.addon_kind] || a.addon_kind}
                        </span>
                        {selected && <Check className="w-4 h-4 text-[#D9FC67] shrink-0" />}
                      </div>
                      <p className="text-white text-sm font-medium mt-1">{a.name}</p>
                      {a.description && (
                        <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{a.description}</p>
                      )}
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[#D9FC67] font-semibold text-sm">
                        ₹{Number(a.price).toLocaleString("en-IN")}
                      </span>
                      {selected && (
                        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setPartnerEnabled(a.id, e.target.checked)}
                            className="rounded border-white/20"
                          />
                          Bookable
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
