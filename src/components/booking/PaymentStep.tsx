"use client";

import { useState, useEffect, useRef } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Loader2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Tag,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookingRecord {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  participants: number;
  studio: {
    id: string;
    name: string;
    location: { area: string; city: string };
    cover_image: string;
  };
  package: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
  addOns: { id: string; name: string; price: number }[];
  totalPrice: number;
  subtotal: number;
  tax: number;
  status: "confirmed";
  paymentId: string;
  createdAt: string;
}

const BOOKINGS_STORAGE_KEY = "yanisa_bookings";

export function saveBookingToHistory(booking: BookingRecord) {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
  const bookings: BookingRecord[] = stored ? JSON.parse(stored) : [];
  bookings.unshift(booking);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings.slice(0, 50)));
}

export function PaymentStep() {
  const router = useRouter();
  const { data: session } = useSession();
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
    getDiscount,
    getConvenienceFee,
    appliedCoupon,
    resetBooking,
    prevStep,
    partnerId,
    bookingSource,
    partnerBranding,
    partnerSlug,
    gstNumber,
  } = useBooking();

  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentInFlight = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () =>
      setPaymentError("Failed to load payment system. Please refresh and try again.");
    document.body.appendChild(script);
  }, []);

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

  const handlePaymentSuccess = async (paymentResponse: any) => {
    setPaymentError(null);

    const subtotal = getSubtotal();
    const tax = getTax();
    const convenienceFee = getConvenienceFee();
    const total = getTotalPrice();
    const paymentId =
      paymentResponse?.razorpay_payment_id || `PAY-${Date.now()}`;
    const orderId = paymentResponse?.razorpay_order_id || "";

    let bookingNumber = `POD-${Date.now().toString(36).toUpperCase()}`;

    try {
      // ── Step 1: Server-side Razorpay signature verification ─────────────────
      if (orderId && paymentResponse?.razorpay_signature) {
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: paymentResponse.razorpay_signature,
          }),
        });
        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({}));
          throw new Error(err.error || "Payment verification failed");
        }
      }

      // ── Step 2: Create booking record in Supabase ───────────────────────────
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: selectedStudio?.id,
          date: date?.toISOString(),
          timeSlot,
          duration,
          participants,
          packageData: selectedPackage
            ? {
                id: selectedPackage.id,
                name: selectedPackage.name,
                price_per_hour: selectedPackage.price_per_hour,
              }
            : null,
          addOns: selectedAddOns.map((a) => ({
            id: a.id,
            name: a.name,
            price: a.price,
          })),
          totalPrice: total,
          subtotal,
          tax,
          convenienceFee,
          discountAmount: getDiscount(),
          couponCode: appliedCoupon?.code || null,
          paymentId,
          orderId,
          gstNumber: gstNumber || null,
          // White-label partner context
          partnerId: partnerId || null,
          bookingSource: bookingSource || "marketplace",
          whitelabelSlug: partnerSlug || null,
        }),
      });

      if (createRes.ok) {
        const data = await createRes.json();
        if (data.bookingNumber) bookingNumber = data.bookingNumber;
      } else {
        console.error("DB booking creation failed — using local record only");
      }
    } catch (err: any) {
      console.error("Post-payment error:", err);
      // Payment was captured — don't block the user. Show a soft warning.
      setPaymentError(
        err?.message ||
          "Payment captured but booking confirmation had an issue. Please check your dashboard."
      );
    }

    // ── Step 3: Build local record and persist ──────────────────────────────
    const booking: BookingRecord = {
      id: bookingNumber,
      date: date?.toISOString() || "",
      timeSlot: timeSlot || "",
      duration,
      participants,
      studio: {
        id: selectedStudio?.id || "",
        name: selectedStudio?.name || "",
        location: selectedStudio?.location || { area: "", city: "" },
        cover_image: selectedStudio?.cover_image || "",
      },
      package: selectedPackage
        ? {
            id: selectedPackage.id,
            name: selectedPackage.name,
            price_per_hour: selectedPackage.price_per_hour,
          }
        : null,
      addOns: selectedAddOns.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      totalPrice: total,
      subtotal,
      tax,
      status: "confirmed",
      paymentId,
      createdAt: new Date().toISOString(),
    };

    saveBookingToHistory(booking);
    sessionStorage.setItem("yanisa_new_booking", JSON.stringify(booking));

    paymentInFlight.current = false;
    setIsProcessing(false);
    resetBooking();
    router.push("/dashboard?booking=success");
  };

  const handlePayment = async () => {
    if (isProcessing || paymentInFlight.current) return;
    if (!razorpayLoaded) {
      setPaymentError("Payment system is still loading. Please wait a moment.");
      return;
    }
    if (!selectedStudio || !date || !timeSlot || !selectedPackage) {
      setPaymentError("Booking details are incomplete. Please go back and review.");
      return;
    }

    paymentInFlight.current = true;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const amount = getTotalPrice();

      let orderData: any = null;
      try {
        const response = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        if (response.ok) {
          orderData = await response.json();
        }
      } catch {
        // API might not be set up — fall through to test mode
      }

      const rzpColor = partnerBranding?.primary_color || "#D9FC67";
      const rzpName = partnerBranding?.brand_name || "PodX Studio";

      const options = {
        key: orderData?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData?.amount || amount * 100,
        currency: "INR",
        order_id: orderData?.orderId,
        name: rzpName,
        description: `${selectedStudio.name} · ${duration} hr${duration > 1 ? "s" : ""}`,
        image: partnerBranding?.logo_url || "/logo.png",
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: { color: rzpColor },
        handler: handlePaymentSuccess,
        modal: {
          ondismiss: () => {
            paymentInFlight.current = false;
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        paymentInFlight.current = false;
        setIsProcessing(false);
        setPaymentError(
          resp?.error?.description || "Payment failed. Please try a different payment method."
        );
      });
      rzp.open();
    } catch (error: any) {
      paymentInFlight.current = false;
      setIsProcessing(false);
      setPaymentError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Complete Your Payment</h1>
        <p className="text-white/60 text-lg">Secure payment powered by Razorpay</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: booking details */}
        <div className="lg:col-span-3 space-y-5">
          {/* Session details */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D9FC67]" />
              Session Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: "Date", value: formatDate() },
                { icon: Clock, label: "Time", value: formatTime() },
                {
                  icon: Clock,
                  label: "Duration",
                  value: `${duration} hr${duration > 1 ? "s" : ""}`,
                },
                { icon: Users, label: "Participants", value: `${participants} people` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-medium text-sm">{value}</p>
                  </div>
                </div>
              ))}
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
                <div className="text-right ml-4 shrink-0">
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

          {/* Back button */}
          <button
            onClick={() => prevStep()}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to review
          </button>
        </div>

        {/* Right: payment summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D9FC67]" />
              Payment Summary
            </h3>

            <div className="space-y-3 mb-4">
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
              {getDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#D9FC67]/80">Discount ({appliedCoupon?.code})</span>
                  <span className="text-[#D9FC67] font-medium">-₹{getDiscount().toLocaleString()}</span>
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
                <span className="text-white">₹{getConvenienceFee().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-white">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400/90 text-xs">{paymentError}</p>
              </div>
            )}

            {!razorpayLoaded && !paymentError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                <Loader2 className="w-4 h-4 text-white/40 animate-spin flex-shrink-0" />
                <p className="text-white/40 text-xs">Loading payment system…</p>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={isProcessing || !razorpayLoaded}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing…
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{getTotalPrice().toLocaleString()}
                </>
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-white/30 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Secured by Razorpay · 256-bit SSL</span>
            </div>

            <p className="text-white/25 text-xs text-center mt-3">
              By confirming, you agree to our cancellation policy and terms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
