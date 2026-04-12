"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/booking-types";
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
  Pencil,
  Tag,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BookingAddonsSection } from "@/components/booking/BookingAddonsSection";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";

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
    getStudioPrice,
    getPackagePrice,
    getAddOnsPrice,
    getSubtotal,
    getTax,
    getTotalPrice,
    getDiscount,
    getConvenienceFee,
    openAuthModal,
    saveBookingToStorage,
    proceedToPayment,
    selectedAddOns,
    canProceed,
    goToStep,
    selectionMode,
    appliedCoupon,
    setAppliedCoupon,
    gstNumber,
    setGstNumber,
  } = useBooking();

  const { data: session } = useSession();
  const [showPolicy, setShowPolicy] = useState(false);
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleProceedToPayment = () => {
    saveBookingToStorage();
    if (session) {
      proceedToPayment();
    } else {
      openAuthModal();
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          studioId: selectedStudio?.id,
          subtotal: getSubtotal(),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code,
          discountType: data.coupon.discount_type,
          discountValue: data.coupon.discount_value,
          discountAmount: data.discountAmount,
        });
        setCouponError(null);
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
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
    const [hStr, mStr] = timeSlot.split(":");
    const startH = parseInt(hStr, 10);
    const startM = parseInt(mStr || "0", 10);
    const totalStartMins = startH * 60 + startM;
    const totalEndMins = totalStartMins + Math.round(duration * 60);
    const endH = Math.floor(totalEndMins / 60);
    const endM = totalEndMins % 60;
    const fmtTime = (h: number, m: number) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = (h % 12) || 12;
      return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    return `${fmtTime(startH, startM)} – ${fmtTime(endH, endM)}`;
  };

  // Step numbers depend on selection mode
  const sessionStep = selectionMode === "studio" ? 2 : 1;
  const studioStep = selectionMode === "studio" ? 1 : 2;
  const packageStep = 3;

  const isReadyToCheckout = canProceed();
  const discount = getDiscount();
  const convenienceFee = getConvenienceFee();

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
            <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D9FC67]" />
                Session Details
              </span>
              <button
                onClick={() => goToStep(sessionStep)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D9FC67] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
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
                    {formatDuration(duration)}
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
              <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
                <span>Studio</span>
                <button
                  onClick={() => goToStep(studioStep)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D9FC67] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </h3>
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

          {selectedStudio && (
            <StudioBookingInventoryPanel
              inventory={selectedStudio.booking_inventory}
              selectedAddOns={selectedAddOns}
            />
          )}

          {/* Package */}
          {selectedPackage && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center justify-between">
                <span>Package</span>
                <button
                  onClick={() => goToStep(packageStep)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D9FC67] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{selectedPackage.name}</h4>
                  <p className="text-white/40 text-sm mt-0.5">{selectedPackage.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-white font-semibold">
                    ₹{(getStudioPrice() + getPackagePrice()).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Add-ons (optional services for this studio) */}
          {selectedStudio && (
            <BookingAddonsSection key={selectedStudio.id} variant="checkout" />
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
              {selectedPackage ? (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    {selectedPackage.name} × {formatDuration(duration)}
                  </span>
                  <span className="text-white">
                    ₹{(getStudioPrice() + getPackagePrice()).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Studio × {formatDuration(duration)}
                  </span>
                  <span className="text-white">₹{getStudioPrice().toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Add-ons</span>
                <span
                  className={
                    getAddOnsPrice() > 0
                      ? "text-[#D9FC67] font-semibold tabular-nums"
                      : "text-white/35 tabular-nums"
                  }
                >
                  {getAddOnsPrice() > 0 ? `₹${getAddOnsPrice().toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
            </div>

            {/* Coupon input */}
            <div className="mb-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#D9FC67]/10 border border-[#D9FC67]/30">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D9FC67]" />
                    <div>
                      <p className="text-[#D9FC67] text-sm font-semibold">{appliedCoupon.code}</p>
                      <p className="text-white/50 text-xs">
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}% off`
                          : `₹${appliedCoupon.discountValue} off`}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Promo / coupon code"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* GST number for tax invoice */}
            <div className="mb-5">
              <label className="text-white/50 text-xs mb-1.5 block">
                GST Number <span className="text-white/30">(optional — for tax invoice)</span>
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 27AABCU9603R1ZX"
                maxLength={15}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50 uppercase"
              />
            </div>

            <div className="border-t border-white/10 pt-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">₹{getSubtotal().toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#D9FC67]/80 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Discount ({appliedCoupon?.code})
                  </span>
                  <span className="text-[#D9FC67] font-medium">-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-white/60">GST (18%)</span>
                <span className="text-white">₹{getTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60 flex items-center gap-1.5">
                  Convenience fee
                  <span className="relative group">
                    <Info className="w-3.5 h-3.5 text-white/30 cursor-default" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg bg-[#222] border border-white/10 px-3 py-2 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center shadow-xl">
                      2% of total (incl. taxes), rounded up
                    </span>
                  </span>
                </span>
                <span className="text-white">₹{convenienceFee.toLocaleString()}</span>
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
