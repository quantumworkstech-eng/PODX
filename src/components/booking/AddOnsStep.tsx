"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { ADD_ON_SERVICES } from "@/lib/booking-types";
import { Button } from "@/components/ui/button";
import { Plus, Check, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function AddOnsStep() {
  const { selectedAddOns, addAddOn, removeAddOn, nextStep, prevStep, getAddOnsPrice, getTotalPrice, getStudioPrice, getPackagePrice, duration, date, timeSlot, selectedStudio, selectedPackage } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);

  const filteredAddons = ADD_ON_SERVICES.filter(addon =>
    addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAddOnSelected = (id: string) => selectedAddOns.some((a) => a.id === id);

  const formatDate = () => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Add Extra Services
        </h1>
        <p className="text-white/60 text-lg">
          Enhance your podcast with these optional add-ons
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search add-ons..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#D9FC67] transition-colors"
            />
          </div>

          {showDropdown && searchTerm && (
            <div className="absolute z-10 w-full max-w-md mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
              {filteredAddons.length > 0 ? (
                filteredAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => {
                      addAddOn(addon);
                      setSearchTerm("");
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={addon.thumbnail} alt={addon.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{addon.name}</p>
                      <p className="text-white/50 text-xs">₹{addon.price}</p>
                    </div>
                    <Plus className="w-4 h-4 text-white/40" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-white/40">No results found</div>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {(searchTerm ? filteredAddons : ADD_ON_SERVICES).map((addon) => {
              const isSelected = isAddOnSelected(addon.id);

              return (
                <div
                  key={addon.id}
                  className={cn(
                    "group rounded-2xl border overflow-hidden transition-all duration-300",
                    isSelected
                      ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={addon.thumbnail}
                      alt={addon.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#D9FC67] flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-lg font-semibold text-white">{addon.name}</h3>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0a0a]">
                    <p className="text-white/50 text-sm mb-3 line-clamp-2">
                      {addon.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">
                        ₹{addon.price.toLocaleString()}
                      </span>
                      <Button
                        onClick={() => isSelected ? removeAddOn(addon.id) : addAddOn(addon)}
                        size="sm"
                        className={cn(
                          "font-semibold transition-all",
                          isSelected
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        {isSelected ? (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={nextStep}
              className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
            >
              Review Booking
            </Button>
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
                <span className="text-white font-medium">{timeSlot || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Duration</span>
                <span className="text-white font-medium">{duration} hour{duration > 1 ? "s" : ""}</span>
              </div>
              {selectedStudio && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Studio</span>
                  <span className="text-white font-medium">{selectedStudio.name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Studio</span>
                <span className="text-white">₹{getStudioPrice().toLocaleString()}</span>
              </div>
              {selectedPackage && selectedPackage.price_per_hour > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Package</span>
                  <span className="text-white">₹{getPackagePrice().toLocaleString()}</span>
                </div>
              )}
              {selectedAddOns.length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={() => setShowAddOnsDropdown(!showAddOnsDropdown)}
                    className="w-full flex justify-between items-center text-sm py-1 hover:bg-white/5 -mx-1 px-1 rounded transition-colors"
                  >
                    <span className="text-white/60 flex items-center gap-1">
                      Add-ons ({selectedAddOns.length})
                      {showAddOnsDropdown ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-white">₹{getAddOnsPrice().toLocaleString()}</span>
                  </button>
                  {showAddOnsDropdown && (
                    <div className="mt-2 pl-2 space-y-1.5 border-l-2 border-white/10 ml-1">
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-xs">
                          <span className="text-white/80">{addon.name}</span>
                          <span className="text-white/50">₹{addon.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-white font-medium">Total</span>
                <span className="text-2xl font-bold text-white">₹{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
