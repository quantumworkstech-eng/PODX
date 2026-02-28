"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, MapPin, CreditCard, Check, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export function CheckoutStep() {
  const {
    date,
    timeSlot,
    duration,
    participants,
    selectedStudio,
    selectedPackage,
    selectedAddOns,
    getStudioPrice,
    getPackagePrice,
    getAddOnsPrice,
    getTotalPrice,
    prevStep,
    openAuthModal,
    saveBookingToStorage,
  } = useBooking();

  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);

  const handleProceedToPayment = () => {
    saveBookingToStorage();
    openAuthModal();
  };

  const formatDate = () => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = () => {
    if (!timeSlot) return "";
    const [hours] = timeSlot.split(":");
    const hour = parseInt(hours);
    const endTime = hour + duration;
    const formatHour = (h: number) => {
      if (h === 12) return "12 PM";
      if (h > 12) return `${h - 12} PM`;
      return `${h} AM`;
    };
    return `${formatHour(hour)} - ${formatHour(endTime)}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Review Your Booking
        </h1>
        <p className="text-white/60 text-lg">
          Please review your booking details before proceeding
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D9FC67]" />
              Booking Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Date</p>
                  <p className="text-white font-medium">{formatDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Time</p>
                  <p className="text-white font-medium">{formatTime()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Duration</p>
                  <p className="text-white font-medium">{duration} hour{duration > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Participants</p>
                  <p className="text-white font-medium">{participants} people</p>
                </div>
              </div>
            </div>
          </div>

          {selectedStudio && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Studio</h3>
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedStudio.cover_image}
                    alt={selectedStudio.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">{selectedStudio.name}</h4>
                  <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedStudio.location.area}, {selectedStudio.location.city}</span>
                  </div>
                  <p className="text-white/50 text-sm mt-2">{selectedStudio.description}</p>
                </div>
              </div>
            </div>
          )}

          {selectedPackage && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Package</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{selectedPackage.name}</h4>
                  <p className="text-white/50 text-sm mt-1">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  {selectedPackage.price_per_hour > 0 ? (
                    <span className="text-white font-semibold">+₹{getPackagePrice().toLocaleString()}</span>
                  ) : (
                    <span className="text-[#D9FC67] text-sm font-medium">Included</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedAddOns.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add-ons ({selectedAddOns.length})</h3>
              <div className="space-y-3">
                {selectedAddOns.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={addon.thumbnail}
                          alt={addon.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white">{addon.name}</span>
                    </div>
                    <span className="text-white font-medium">₹{addon.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D9FC67]" />
              Price Summary
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Studio ({duration}h)</span>
                <span className="text-white">₹{getStudioPrice().toLocaleString()}</span>
              </div>
              {selectedPackage && selectedPackage.price_per_hour > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{selectedPackage.name}</span>
                  <span className="text-white">₹{getPackagePrice().toLocaleString()}</span>
                </div>
              )}
              {selectedAddOns.length > 0 && (
                <div>
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
                <span className="text-3xl font-bold text-white">₹{getTotalPrice().toLocaleString()}</span>
              </div>
              <p className="text-white/40 text-sm mt-1">Including all taxes</p>
            </div>

            <Button
              onClick={openAuthModal}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
            >
              <Check className="w-5 h-5 mr-2" />
              Proceed to Payment
            </Button>

            <p className="text-white/40 text-xs text-center mt-4">
              You&apos;ll need to sign in or create an account to complete your booking
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleProceedToPayment}
          className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
