"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";
import {
  BookingAddonsSection,
  AddOnsStepSearchInput,
} from "@/components/booking/BookingAddonsSection";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";
import { formatDuration } from "@/lib/booking-types";

function formatSessionWindow(date: Date | null, timeSlot: string | null, duration: number) {
  if (!date || !timeSlot) return null;

  const [hStr, mStr] = timeSlot.split(":");
  const startMins = parseInt(hStr, 10) * 60 + parseInt(mStr || "0", 10);
  const endMins = startMins + Math.round(duration * 60);
  const fmt = (total: number) => {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const day = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day}, ${fmt(startMins)} – ${fmt(endMins)}`;
}

export function AddOnsStep() {
  const {
    selectedAddOns,
    nextStep,
    selectedStudio,
    date,
    timeSlot,
    duration,
    getAddOnsPrice,
    getSubtotal,
  } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");

  const itemCount = selectedAddOns.reduce((sum, a) => sum + (a.qty ?? 1), 0);
  const sessionWindow = formatSessionWindow(date, timeSlot, duration);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-40">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Additional Services</h1>
        <p className="text-white/60 text-lg">
          Add equipment, studio services and post-production — or skip and continue.
        </p>
      </div>

      {selectedStudio && (
        <StudioBookingInventoryPanel
          className="mb-8"
          inventory={selectedStudio.booking_inventory}
          selectedAddOns={selectedAddOns}
        />
      )}

      <AddOnsStepSearchInput value={searchTerm} onChange={setSearchTerm} />

      {selectedStudio && (
        <BookingAddonsSection key={selectedStudio.id} searchTerm={searchTerm} />
      )}

      {/* Sticky session + total bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
            <CalendarDays className="w-4 h-4 shrink-0 text-white/35" />
            <span className="truncate">
              {sessionWindow ?? `Session · ${formatDuration(duration)}`}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/35">
                {itemCount === 0
                  ? "No extras"
                  : `${itemCount} extra${itemCount === 1 ? "" : "s"} · ₹${getAddOnsPrice().toLocaleString("en-IN")}`}
              </p>
              <p className="text-base font-bold text-white tabular-nums leading-tight">
                ₹{getSubtotal().toLocaleString("en-IN")}
              </p>
            </div>
            <Button
              onClick={nextStep}
              className="px-5 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black rounded-xl gap-2"
            >
              {itemCount === 0 ? "Skip & Review" : "Proceed to Review"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
