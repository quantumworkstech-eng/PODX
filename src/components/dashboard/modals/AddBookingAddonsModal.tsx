"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  PackagePlus,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { BookingData } from "../bookings/UpcomingBookings";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type StudioAddon = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category?: string | null;
};

interface AddBookingAddonsModalProps {
  booking: BookingData;
  open: boolean;
  onClose: () => void;
  /** After successful payment — refresh list and reopen booking details from parent */
  onSuccess: () => void | Promise<void>;
}

type Step = "select" | "summary";

export function AddBookingAddonsModal({
  booking,
  open,
  onClose,
  onSuccess,
}: AddBookingAddonsModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("select");
  const [studioAddons, setStudioAddons] = useState<StudioAddon[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderPreview, setOrderPreview] = useState<{
    orderId: string;
    keyId: string;
    amount: number;
    subtotal: number;
    tax: number;
    lineItems: { id: string; name: string; price: number }[];
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const paymentInFlight = useRef(false);

  const bookingApiId = booking.dbId || booking.id;

  const existingNames = new Set(
    booking.addOns.map((a) => a.name.trim().toLowerCase())
  );

  const availableAddons = studioAddons.filter(
    (a) => !existingNames.has(a.name.trim().toLowerCase())
  );

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
    script.onerror = () => setPaymentError("Could not load payment system.");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!open) return;
    setStep("select");
    setSelectedIds(new Set());
    setOrderPreview(null);
    setPaymentError(null);
    setFetchError(null);
    setLoadingAddons(true);

    fetch(`/api/studios/${booking.studio.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load studio");
        return r.json();
      })
      .then((data: { addons?: StudioAddon[] }) => {
        setStudioAddons(data.addons || []);
      })
      .catch(() => setFetchError("Could not load add-ons for this studio."))
      .finally(() => setLoadingAddons(false));
  }, [open, booking.studio.id]);

  const toggleAddon = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContinueToSummary = async () => {
    if (selectedIds.size === 0) {
      setPaymentError("Select at least one add-on.");
      return;
    }
    setPaymentError(null);
    setIsPaying(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingApiId)}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "order",
          addonIds: Array.from(selectedIds),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentError(data.error || "Could not start checkout.");
        return;
      }
      setOrderPreview({
        orderId: data.orderId,
        keyId: data.keyId,
        amount: data.amount,
        subtotal: data.subtotal,
        tax: data.tax,
        lineItems: data.lineItems || [],
      });
      setStep("summary");
    } catch {
      setPaymentError("Something went wrong. Try again.");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePay = async () => {
    if (!orderPreview || !razorpayLoaded || paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaymentError(null);
    setIsPaying(true);

    const handler = async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingApiId)}/addons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: "confirm",
            addonIds: orderPreview.lineItems.map((l) => l.id),
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setPaymentError(data.error || "Could not complete purchase.");
          paymentInFlight.current = false;
          setIsPaying(false);
          return;
        }
        paymentInFlight.current = false;
        setIsPaying(false);
        await Promise.resolve(onSuccess());
        onClose();
      } catch {
        setPaymentError("Could not verify payment.");
        paymentInFlight.current = false;
        setIsPaying(false);
      }
    };

    const options = {
      key: orderPreview.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      amount: Math.round(orderPreview.amount * 100),
      currency: "INR",
      order_id: orderPreview.orderId,
      name: "PodX",
      description: `Add-ons · ${booking.studio.name}`,
      prefill: {
        name: session?.user?.name || "",
        email: session?.user?.email || "",
      },
      theme: { color: "#D9FC67" },
      handler,
      modal: {
        ondismiss: () => {
          paymentInFlight.current = false;
          setIsPaying(false);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        paymentInFlight.current = false;
        setIsPaying(false);
        setPaymentError("Payment failed. Try another method.");
      });
      rzp.open();
    } catch {
      paymentInFlight.current = false;
      setIsPaying(false);
      setPaymentError("Could not open payment window.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[min(90dvh,90vh)] flex flex-col bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl my-auto overflow-hidden">
        <div className="shrink-0 p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {step === "summary" && (
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setOrderPreview(null);
                  setPaymentError(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5 text-[#D9FC67]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">Add add-ons</h2>
              <p className="text-white/50 text-sm truncate">{booking.studio.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 touch-pan-y">
          {step === "select" && (
            <>
              {loadingAddons && (
                <div className="flex items-center justify-center py-16 text-white/40 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading add-ons…
                </div>
              )}
              {fetchError && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {fetchError}
                </div>
              )}
              {!loadingAddons && !fetchError && availableAddons.length === 0 && (
                <p className="text-white/50 text-sm text-center py-12">
                  No extra add-ons are available for this studio right now, or you already have
                  everything on this booking.
                </p>
              )}
              {!loadingAddons && availableAddons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/40 text-xs mb-3">
                    Choose one or more services. Prices exclude GST until checkout.
                  </p>
                  {availableAddons.map((a) => {
                    const selected = selectedIds.has(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAddon(a.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all flex gap-3",
                          selected
                            ? "bg-[#D9FC67]/10 border-[#D9FC67]/40 ring-1 ring-[#D9FC67]/20"
                            : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
                            selected
                              ? "bg-[#D9FC67] border-[#D9FC67]"
                              : "border-white/20"
                          )}
                        >
                          {selected && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium">{a.name}</p>
                          {a.description && (
                            <p className="text-white/45 text-sm mt-0.5 line-clamp-2">{a.description}</p>
                          )}
                          <p className="text-[#D9FC67] text-sm font-semibold mt-2">
                            ₹{a.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === "summary" && orderPreview && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <p className="text-white/50 text-xs uppercase tracking-wide">Order summary</p>
                {orderPreview.lineItems.map((line) => (
                  <div key={line.id} className="flex justify-between text-sm gap-3">
                    <span className="text-white/80">{line.name}</span>
                    <span className="text-white tabular-nums">₹{line.price.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span className="text-white tabular-nums">
                      ₹{orderPreview.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>GST (18%)</span>
                    <span className="text-white tabular-nums">
                      ₹{orderPreview.tax.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
                    <span>Total due</span>
                    <span className="text-[#D9FC67] tabular-nums">
                      ₹{orderPreview.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs">
                <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
                Secure payment with Razorpay. Your booking will update immediately after payment.
              </div>
            </div>
          )}

          {paymentError && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {paymentError}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/5 p-5 pt-4 bg-[#18181b]">
          {step === "select" && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleContinueToSummary}
                disabled={
                  selectedIds.size === 0 || loadingAddons || availableAddons.length === 0 || isPaying
                }
                className="flex-1 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  "Review & pay"
                )}
              </Button>
            </div>
          )}
          {step === "summary" && orderPreview && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("select");
                  setOrderPreview(null);
                }}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handlePay}
                disabled={isPaying || !razorpayLoaded}
                className="flex-1 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : !razorpayLoaded ? (
                  "Loading payment…"
                ) : (
                  "Pay now"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
