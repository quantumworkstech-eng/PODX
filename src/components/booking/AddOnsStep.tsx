"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BookingAddonsSection,
  AddOnsStepSearchInput,
} from "@/components/booking/BookingAddonsSection";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";

export function AddOnsStep() {
  const {
    selectedAddOns,
    nextStep,
    getAddOnsPrice,
    getSubtotal,
    getTax,
    getTotalPrice,
    getPackagePrice,
    duration,
    date,
    timeSlot,
    selectedStudio,
    selectedPackage,
  } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);

  const formatDate = () => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Add Extra Services</h1>
        <p className="text-white/60 text-lg">Enhance your podcast with optional add-ons for this studio</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {selectedStudio && (
            <StudioBookingInventoryPanel
              className="mb-6"
              inventory={selectedStudio.booking_inventory}
              selectedAddOns={selectedAddOns}
            />
          )}
          <AddOnsStepSearchInput value={searchTerm} onChange={setSearchTerm} />
          {selectedStudio && (
            <BookingAddonsSection
              key={selectedStudio.id}
              variant="step"
              searchTerm={searchTerm}
            />
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              onClick={nextStep}
              className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
            >
              Review Booking
            </Button>
            {selectedAddOns.length === 0 && (
              <button
                type="button"
                onClick={nextStep}
                className="text-white/40 hover:text-white/70 text-sm transition-colors underline underline-offset-4"
              >
                Skip, no add-ons needed
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Booking Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Date</span>
                <span className="text-white font-medium">{formatDate()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Time</span>
                <span className="text-white font-medium">{timeSlot || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Duration</span>
                <span className="text-white font-medium">
                  {duration} hour{duration > 1 ? "s" : ""}
                </span>
              </div>
              {selectedStudio && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Studio</span>
                  <span className="text-white font-medium">{selectedStudio.name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-4">
              {selectedPackage && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">{selectedPackage.name}</span>
                  <span className="text-white">₹{getPackagePrice().toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Add-ons</span>
                <span
                  className={
                    getAddOnsPrice() > 0
                      ? "text-[#D9FC67] font-semibold"
                      : "text-white/35"
                  }
                >
                  {getAddOnsPrice() > 0 ? `₹${getAddOnsPrice().toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOnsDropdown(!showAddOnsDropdown)}
                    className="w-full flex justify-between items-center text-sm py-1 hover:bg-white/5 -mx-1 px-1 rounded transition-colors"
                  >
                    <span className="text-white/60 flex items-center gap-1">
                      Selected ({selectedAddOns.length})
                      {showAddOnsDropdown ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {showAddOnsDropdown && (
                    <div className="mt-2 pl-2 space-y-1.5 border-l-2 border-white/10 ml-1">
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-xs">
                          <span className="text-white/80">{addon.name}</span>
                          <span className="text-white/50">₹{addon.price.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">₹{getSubtotal().toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">GST (18%)</span>
                <span className="text-white">₹{getTax().toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-white">₹{getTotalPrice().toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
