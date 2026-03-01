"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  CreditCard,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertCircle,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

const CANCELLATION_POLICY = {
  title: "Standard Cancellation Policy",
  rules: [
    { label: "48+ hrs before session", value: "Full refund" },
    { label: "24–48 hrs before session", value: "50% refund" },
    { label: "< 24 hrs before session", value: "No refund" },
    { label: "No-show", value: "No refund" },
  ],
};

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
    getSubtotal,
    getTax,
    getTotalPrice,
    openAuthModal,
    saveBookingToStorage,
    proceedToPayment,
    canProceed,
  } = useBooking();

  const { data: session } = useSession();
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleProceedToPayment = () => {
    saveBookingToStorage();
    if (session) {
      // Already authenticated — go straight to payment
      proceedToPayment();
    } else {
      openAuthModal();
    }
  };

  const formatDate = () => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = () => {
    if (!timeSlot) return "";
    const [hours] = timeSlot.split(":");
    const hour = parseInt(hours);
    const endTime = hour + duration;
    const fmt = (h: number) => {
      if (h === 12) return "12 PM";
      if (h > 12) return `${h - 12} PM`;
      return `${h} AM`;
    };
    return `${fmt(hour)} – ${fmt(endTime)}`;
  };

  const isReadyToCheckout = canProceed();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Review Your Booking</h1>
        <p className="text-white/60 text-lg">Confirm your details before payment</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: booking details */}
        <div className="lg:col-span-3 space-y-5">
          {/* Date / time / duration / participants */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D9FC67]" />
              Session Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-white font-medium text-sm">{formatDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Time</p>
                  <p className="text-white font-medium text-sm">{formatTime()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Duration</p>
                  <p className="text-white font-medium text-sm">
                    {duration} hr{duration > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">
                    Participants
                  </p>
                  <p className="text-white font-medium text-sm">{participants} people</p>
                </div>
              </div>
            </div>
          </div>

          {/* Studio */}
          {selectedStudio && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-base font-semibold text-white mb-4">Studio</h3>
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedStudio.cover_image}
                    alt={selectedStudio.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{selectedStudio.name}</h4>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {selectedStudio.location.area}, {selectedStudio.location.city}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-2">{selectedStudio.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Package */}
          {selectedPackage && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-base font-semibold text-white mb-3">Package</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{selectedPackage.name}</h4>
                  <p className="text-white/40 text-sm mt-0.5">{selectedPackage.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {selectedPackage.price_per_hour > 0 ? (
                    <span className="text-white font-semibold">
                      +₹{getPackagePrice().toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[#D9FC67] text-sm font-medium">Included</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add-ons */}
          {selectedAddOns.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-base font-semibold text-white mb-4">
                Add-ons ({selectedAddOns.length})
              </h3>
              <div className="space-y-3">
                {selectedAddOns.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={addon.thumbnail}
                          alt={addon.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white text-sm">{addon.name}</span>
                    </div>
                    <span className="text-white font-medium text-sm">
                      ₹{addon.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation policy */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <button
              onClick={() => setShowPolicy(!showPolicy)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D9FC67]" />
                <span className="text-white font-medium text-sm">
                  {CANCELLATION_POLICY.title}
                </span>
              </div>
              {showPolicy ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {showPolicy && (
              <div className="mt-4 space-y-2.5">
                {CANCELLATION_POLICY.rules.map((rule, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white/60 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      {rule.label}
                    </span>
                    <span
                      className={
                        rule.value.includes("Full")
                          ? "text-green-400 font-medium"
                          : rule.value.includes("50%")
                          ? "text-yellow-400 font-medium"
                          : "text-red-400 font-medium"
                      }
                    >
                      {rule.value}
                    </span>
                  </div>
                ))}
                <p className="text-white/30 text-xs pt-2 border-t border-white/10">
                  Cancellation time is calculated based on the session start time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: price summary + CTA */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D9FC67]" />
              Price Summary
            </h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">
                  Studio × {duration} hr{duration > 1 ? "s" : ""}
                </span>
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
                    className="w-full flex justify-between items-center text-sm py-1"
                  >
                    <span className="text-white/60 flex items-center gap-1">
                      Add-ons ({selectedAddOns.length})
                      {showAddOnsDropdown ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="text-white">₹{getAddOnsPrice().toLocaleString()}</span>
                  </button>
                  {showAddOnsDropdown && (
                    <div className="mt-2 pl-3 space-y-1.5 border-l-2 border-white/10">
                      {selectedAddOns.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-xs">
                          <span className="text-white/60">{addon.name}</span>
                          <span className="text-white/40">₹{addon.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">₹{getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">GST (18%)</span>
                <span className="text-white">₹{getTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-white">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>

            {!isReadyToCheckout && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-400/90 text-xs">
                  Please complete all required selections (studio, date/time, and package) before
                  proceeding.
                </p>
              </div>
            )}

            <Button
              onClick={handleProceedToPayment}
              disabled={!isReadyToCheckout}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
            >
              <Check className="w-4 h-4 mr-2" />
              {session ? "Proceed to Payment" : "Sign In & Pay"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-white/30 text-xs mt-4">
              <Shield className="w-3.5 h-3.5" />
              <span>Secured by Razorpay · 256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
