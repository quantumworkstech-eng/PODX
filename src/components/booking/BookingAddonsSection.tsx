"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/context/BookingContext";
import {
  platformAddonToService,
  isRecommendedAddon,
  ADDON_PLACEHOLDER_IMAGE,
  type PlatformAddonRow,
} from "@/lib/bookingAddons";
import type { AddOnService } from "@/lib/booking-types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Loader2, Sparkles, Check, Plus, Minus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Variant = "checkout" | "step";

export function BookingAddonsSection({
  variant,
  searchTerm = "",
}: {
  variant: Variant;
  /** Client-side filter for step variant */
  searchTerm?: string;
}) {
  const { selectedStudio, selectedAddOns, toggleAddOn, updateAddOnQty, pruneAddOnsToIds } = useBooking();
  const [catalog, setCatalog] = useState<AddOnService[]>([]);
  /** Starts true so first paint shows loading without syncing setState in the effect body. */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedStudio?.id) return;
    let cancelled = false;
    fetch(`/api/studios/${encodeURIComponent(selectedStudio.id)}/addons`)
      .then((r) => r.json())
      .then((data: { addons?: PlatformAddonRow[] }) => {
        if (cancelled) return;
        const list = (data.addons || []).map(platformAddonToService);
        setCatalog(list);
        pruneAddOnsToIds(new Set(list.map((a) => a.id)));
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog([]);
          pruneAddOnsToIds(new Set());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStudio?.id, pruneAddOnsToIds]);

  const filtered =
    variant === "step" && searchTerm.trim()
      ? catalog.filter(
          (a) =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : catalog;

  const isSelected = (id: string) => selectedAddOns.some((a) => a.id === id);
  const getQty = (id: string) => selectedAddOns.find((a) => a.id === id)?.qty ?? 1;

  if (!selectedStudio) return null;

  if (loading) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex items-center justify-center gap-3 min-h-[120px]">
        <Loader2 className="w-5 h-5 text-[#D9FC67] animate-spin" />
        <span className="text-white/50 text-sm">Loading add-ons…</span>
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h3 className="text-base font-semibold text-white">Add-ons</h3>
            <p className="text-white/45 text-sm mt-0.5">Enhance your session</p>
          </div>
        </div>
        <p className="text-white/35 text-sm pt-2">
          No optional add-ons are configured for this studio yet.
        </p>
      </div>
    );
  }

  if (variant === "checkout") {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Add-ons</h3>
            <p className="text-white/45 text-sm mt-0.5">Enhance your session</p>
          </div>
        </div>

        <ul className="space-y-3">
          {catalog.map((addon) => {
            const selected = isSelected(addon.id);
            const qty = getQty(addon.id);
            const thumb = addon.thumbnail || ADDON_PLACEHOLDER_IMAGE;
            return (
              <li key={addon.id}>
                <button
                  type="button"
                  onClick={() => toggleAddOn(addon)}
                  className={cn(
                    "w-full text-left rounded-xl border p-4 transition-all duration-200 ease-out",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FC67]/40",
                    selected
                      ? "border-[#D9FC67] bg-[#D9FC67]/[0.07] shadow-[0_0_0_1px_rgba(217,252,103,0.12)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex gap-3 items-center">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                      <Image src={thumb} alt="" fill className="object-cover" sizes="44px" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <Sparkles className="w-4 h-4 text-[#D9FC67]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{addon.name}</span>
                        {selected && qty > 1 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D9FC67]/15 text-[#D9FC67] border border-[#D9FC67]/25">
                            ×{qty}
                          </span>
                        )}
                        {isRecommendedAddon(addon) && (
                          <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-[#D9FC67]/15 text-[#D9FC67] border border-[#D9FC67]/25">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-white/45 text-xs mt-0.5 line-clamp-2">{addon.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-white/90 text-sm font-semibold tabular-nums">
                          ₹{addon.price.toLocaleString("en-IN")}
                        </div>
                        {selected && (
                          <div className="text-[#D9FC67] text-xs font-semibold tabular-nums">
                            + ₹{(addon.price * qty).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                          selected
                            ? "border-[#D9FC67] bg-[#D9FC67] text-black"
                            : "border-white/25 bg-white/5 text-transparent"
                        )}
                        aria-hidden
                      >
                        {selected ? <Check className="w-4 h-4" strokeWidth={2.5} /> : null}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // variant === "step" — grid + search handled by parent via searchTerm
  if (filtered.length === 0 && searchTerm.trim()) {
    return (
      <p className="text-center text-white/40 text-sm py-8">No add-ons match your search.</p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {filtered.map((addon) => {
        const selected = isSelected(addon.id);
        const qty = getQty(addon.id);
        const thumb = addon.thumbnail || ADDON_PLACEHOLDER_IMAGE;
        const maxQty = addon.maxQty;
        const atMax = maxQty != null && qty >= maxQty;
        const outOfStock = maxQty != null && maxQty <= 0;
        return (
          <div
            key={addon.id}
            className={cn(
              "group rounded-2xl border overflow-hidden transition-all duration-300",
              outOfStock
                ? "border-white/5 opacity-60"
                : selected
                ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30"
                : "border-white/10 hover:border-white/30"
            )}
          >
            {/* Square image */}
            <div className="relative aspect-square overflow-hidden">
              <Image src={thumb} alt={addon.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {isRecommendedAddon(addon) && (
                <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-[#D9FC67]/20 text-[#D9FC67] border border-[#D9FC67]/30">
                  Recommended
                </span>
              )}
              {/* Stock badge */}
              {maxQty != null && !outOfStock && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white/70 border border-white/10">
                  {maxQty} avail.
                </span>
              )}
              {outOfStock && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Out of stock
                </span>
              )}
              {selected && !outOfStock && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 pr-3">
                <h3 className="text-base font-semibold text-white drop-shadow-sm leading-tight">{addon.name}</h3>
              </div>
            </div>
            <div className="p-4 bg-[#0a0a0a]">
              <p className="text-white/50 text-sm mb-3 line-clamp-2">{addon.description}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">
                    ₹{addon.price.toLocaleString("en-IN")}
                    <span className="text-white/40 text-sm font-normal ml-1">/ unit</span>
                  </span>
                  {selected && (
                    <span className="text-[#D9FC67] text-xs font-semibold">
                      ₹{(addon.price * qty).toLocaleString("en-IN")} total
                    </span>
                  )}
                </div>
                {outOfStock ? (
                  <span className="text-xs text-red-400/70 font-medium">Unavailable</span>
                ) : selected ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateAddOnQty(addon.id, qty - 1)}
                      className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:border-[#D9FC67] hover:text-[#D9FC67] text-white flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-white font-bold text-base tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => !atMax && updateAddOnQty(addon.id, qty + 1)}
                      disabled={atMax}
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center transition-colors",
                        atMax
                          ? "border-white/10 bg-white/5 text-white/20 cursor-not-allowed"
                          : "border-[#D9FC67]/50 bg-[#D9FC67]/10 hover:bg-[#D9FC67]/20 text-[#D9FC67]"
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => toggleAddOn(addon)}
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20 font-semibold transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              {/* Max qty reached hint */}
              {atMax && selected && (
                <p className="text-[10px] text-amber-400/70 mt-2">
                  Max {maxQty} available
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AddOnsStepSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search add-ons…"
        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
      />
    </div>
  );
}
