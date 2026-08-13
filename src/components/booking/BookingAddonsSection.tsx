"use client";

import { useEffect, useMemo, useState } from "react";
import { useBooking } from "@/context/BookingContext";
import {
  platformAddonToService,
  isRecommendedAddon,
  groupAddonsIntoSections,
  ADDON_PLACEHOLDER_IMAGE,
  type PlatformAddonRow,
} from "@/lib/bookingAddons";
import type { AddOnService } from "@/lib/booking-types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Loader2, Check, Plus, Minus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function AddonCard({ addon }: { addon: AddOnService }) {
  const { selectedAddOns, toggleAddOn, updateAddOnQty, removeAddOn } = useBooking();

  const selected = selectedAddOns.find((a) => a.id === addon.id);
  const qty = selected?.qty ?? 1;
  const thumb = addon.thumbnail || ADDON_PLACEHOLDER_IMAGE;
  const maxQty = addon.maxQty;
  const atMax = maxQty != null && qty >= maxQty;
  const outOfStock = maxQty != null && maxQty <= 0;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border overflow-hidden bg-[#0a0a0a] transition-all duration-300",
        outOfStock
          ? "border-white/5 opacity-60"
          : selected
          ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/25"
          : "border-white/10 hover:border-white/30"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
        <Image
          src={thumb}
          alt={addon.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {isRecommendedAddon(addon) && (
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-[#D9FC67]/20 text-[#D9FC67] border border-[#D9FC67]/30 backdrop-blur-sm">
            Recommended
          </span>
        )}
        {outOfStock ? (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-sm">
            Out of stock
          </span>
        ) : selected ? (
          <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-[#D9FC67] text-black">
            <Check className="w-4 h-4" strokeWidth={2.5} />
          </span>
        ) : maxQty != null ? (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white/70 border border-white/10">
            {maxQty} avail.
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="text-[15px] font-semibold text-white leading-snug">{addon.name}</h4>
        {addon.description ? (
          <p className="mt-1.5 text-sm text-white/45 leading-relaxed line-clamp-3">
            {addon.description}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-bold text-white tabular-nums">
              ₹{addon.price.toLocaleString("en-IN")}
            </span>
            <span className="text-white/40 text-sm">/ unit</span>
            {selected && qty > 1 && (
              <span className="ml-auto text-[#D9FC67] text-xs font-semibold tabular-nums">
                ₹{(addon.price * qty).toLocaleString("en-IN")} total
              </span>
            )}
          </div>

          <div className="mt-3">
            {outOfStock ? (
              <div className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-medium text-red-400/70">
                Unavailable
              </div>
            ) : selected ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center justify-between rounded-xl border border-[#D9FC67]/40 bg-[#D9FC67]/10 p-1">
                  <button
                    type="button"
                    aria-label={`Decrease ${addon.name} quantity`}
                    onClick={() => updateAddOnQty(addon.id, qty - 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[2rem] text-center text-base font-bold text-white tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${addon.name} quantity`}
                    onClick={() => updateAddOnQty(addon.id, qty + 1)}
                    disabled={atMax}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                      atMax
                        ? "text-white/20 cursor-not-allowed"
                        : "text-[#D9FC67] hover:bg-[#D9FC67]/20"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${addon.name}`}
                  onClick={() => removeAddOn(addon.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400/80 transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => toggleAddOn(addon)}
                className="w-full py-5 rounded-xl bg-white/10 text-white hover:bg-white/20 font-semibold transition-all gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            )}
          </div>

          {atMax && selected && (
            <p className="mt-2 text-[10px] text-amber-400/70">Max {maxQty} available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BookingAddonsSection({ searchTerm = "" }: { searchTerm?: string }) {
  const { selectedStudio, pruneAddOnsToIds } = useBooking();
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

  const query = searchTerm.trim().toLowerCase();
  const sections = useMemo(() => {
    const filtered = query
      ? catalog.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query)
        )
      : catalog;
    return groupAddonsIntoSections(filtered);
  }, [catalog, query]);

  if (!selectedStudio) return null;

  if (loading) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex items-center justify-center gap-3 min-h-[120px]">
        <Loader2 className="w-5 h-5 text-[#D9FC67] animate-spin" />
        <span className="text-white/50 text-sm">Loading services…</span>
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
        <h3 className="text-base font-semibold text-white">No additional services</h3>
        <p className="text-white/40 text-sm mt-1">
          This studio has no optional equipment or services configured yet.
        </p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-12">No services match your search.</p>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.key}>
          <div className="mb-4 flex items-baseline gap-3 border-b border-white/10 pb-3">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <span className="text-xs font-medium text-white/35 tabular-nums">
              {section.items.length}
            </span>
            <p className="ml-auto hidden sm:block text-sm text-white/40">{section.description}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {section.items.map((addon) => (
              <AddonCard key={addon.id} addon={addon} />
            ))}
          </div>
        </section>
      ))}
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
    <div className="relative mb-8">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search equipment and services…"
        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
      />
    </div>
  );
}
