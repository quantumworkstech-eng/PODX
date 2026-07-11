"use client";

import type { StudioBookingInventory } from "@/lib/studio-booking-inventory";
import type { AddOnService } from "@/lib/booking-types";
import { Layers, Wrench, Sparkles, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

function groupAddOnsByCategory(
  addons: AddOnService[]
): { category: string; items: AddOnService[] }[] {
  const map = new Map<string, AddOnService[]>();
  for (const a of addons) {
    const raw = (a.category || "general").toString().toLowerCase();
    let cat = "Add-ons";
    if (raw === "studio") cat = "Studio add-ons";
    else if (raw === "service") cat = "Service add-ons";
    else if (raw === "outsource") cat = "Outsource add-ons";
    else if (raw !== "popular" && raw !== "general") cat = raw.charAt(0).toUpperCase() + raw.slice(1);
    else cat = "Platform add-ons";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(a);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

export function StudioBookingInventoryPanel({
  inventory,
  selectedAddOns,
  className,
  title = "What’s included with this studio",
}: {
  inventory: StudioBookingInventory | null | undefined;
  /** When set, shows selected add-ons grouped by category under a separate heading */
  selectedAddOns?: AddOnService[];
  className?: string;
  title?: string;
}) {
  const hasInv =
    inventory &&
    (inventory.equipment.some((g) => g.items.length > 0) ||
      inventory.services.some((g) => g.items.length > 0) ||
      inventory.otherTags.length > 0 ||
      inventory.addonsOffered.some((g) => g.items.length > 0));

  const hasSelected = selectedAddOns && selectedAddOns.length > 0;

  if (!hasInv && !hasSelected) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {hasInv && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D9FC67]" />
            {title}
          </h3>

          <div className="space-y-4">
            {inventory!.equipment.map((group) =>
              group.items.length > 0 ? (
                <div key={group.category}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D9FC67]/80 mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 opacity-80" />
                    {group.category}
                  </p>
                  <ul className="space-y-1.5">
                    {group.items.map((row, i) => (
                      <li
                        key={`${group.category}-${i}`}
                        className="flex justify-between gap-3 text-sm text-white/80 border-b border-white/5 pb-1.5 last:border-0"
                      >
                        <span>{row.name}</span>
                        <span className="text-white/45 tabular-nums shrink-0">×{row.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}

            {inventory!.services.map((group) =>
              group.items.length > 0 ? (
                <div key={group.category}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D9FC67]/80 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 opacity-80" />
                    {group.category}
                  </p>
                  <ul className="space-y-1.5">
                    {group.items.map((row, i) => (
                      <li
                        key={`svc-${i}`}
                        className="flex justify-between gap-3 text-sm text-white/80 border-b border-white/5 pb-1.5 last:border-0"
                      >
                        <span>{row.name}</span>
                        {row.priceLabel && (
                          <span className="text-white/40 text-xs shrink-0">{row.priceLabel}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}

            {inventory!.otherTags.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-2">
                  Also listed
                </p>
                <div className="flex flex-wrap gap-2">
                  {inventory!.otherTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {inventory!.addonsOffered.some((g) => g.items.length > 0) && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Available add-ons (optional)
                </p>
                <div className="space-y-3">
                  {inventory!.addonsOffered.map((group) =>
                    group.items.length > 0 ? (
                      <div key={group.category}>
                        <p className="text-xs text-[#D9FC67]/70 mb-1.5">{group.category}</p>
                        <ul className="space-y-1">
                          {group.items.map((row, i) => (
                            <li
                              key={i}
                              className="flex justify-between gap-2 text-xs text-white/60"
                            >
                              <span className="truncate">{row.name}</span>
                              <span className="text-white/40 shrink-0">
                                ₹{row.price.toLocaleString("en-IN")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasSelected && (
        <div className="rounded-2xl border border-[#D9FC67]/20 bg-[#D9FC67]/[0.06] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#D9FC67]" />
            Selected add-ons for this booking
          </h3>
          <div className="space-y-3">
            {groupAddOnsByCategory(selectedAddOns!).map((group) => (
              <div key={group.category}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D9FC67]/80 mb-1.5">
                  {group.category}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between gap-3 text-sm text-white/85"
                    >
                      <span>{a.name}</span>
                      <span className="text-[#D9FC67] tabular-nums shrink-0">
                        ₹{a.price.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
