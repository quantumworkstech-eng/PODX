"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";
import { cn } from "@/lib/utils";
import {
  computeCancellationRefundBreakdown,
  MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT,
} from "@/lib/cancellationRefund";

interface CancelBookingModalProps {
  booking: BookingData;
  onClose: () => void;
  /** Runs after cancellation succeeds — e.g. refresh bookings from API */
  onSuccess?: () => void | Promise<void>;
}

export function CancelBookingModal({
  booking,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const [hoursUntilSession, setHoursUntilSession] = useState(0);
  const [refundPercentage, setRefundPercentage] = useState(0);
  const [phase, setPhase] = useState<"confirm" | "loading" | "done" | "error">(
    "confirm"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  type DoneState = {
    grossRefundAmount: number;
    mandatoryFeeAmount: number;
    refundAmount: number;
    withheldByPolicyAmount: number;
    totalPrice: number;
    refundPct: number;
  };
  const [result, setResult] = useState<DoneState | null>(null);

  useEffect(() => {
    const sessionStartMs = booking.start_time
      ? new Date(booking.start_time).getTime()
      : (() => {
          const sessionDate = new Date(booking.date);
          sessionDate.setHours(parseInt(booking.timeSlot.split(":")[0]), 0, 0, 0);
          return sessionDate.getTime();
        })();
    const now = Date.now();
    const hours = Math.max(0, (sessionStartMs - now) / (1000 * 60 * 60));
    const hoursFloor = Math.floor(hours);
    setHoursUntilSession(hoursFloor);

    const studioId = booking.studio?.id;
    if (studioId) {
      fetch(`/api/studios/${studioId}/policy`)
        .then((r) => r.json())
        .then(({ rules }) => {
          if (!rules?.length) {
            setRefundPercentage(hoursFloor >= 48 ? 100 : hoursFloor >= 24 ? 50 : 0);
            return;
          }
          let pct = 0;
          for (const rule of rules) {
            if (hours >= rule.hours_before) {
              pct = rule.refund_percentage;
              break;
            }
          }
          setRefundPercentage(pct);
        })
        .catch(() =>
          setRefundPercentage(hoursFloor >= 48 ? 100 : hoursFloor >= 24 ? 50 : 0)
        );
    } else {
      setRefundPercentage(hoursFloor >= 48 ? 100 : hoursFloor >= 24 ? 50 : 0);
    }
  }, [booking]);

  const preview = computeCancellationRefundBreakdown(
    booking.totalPrice,
    refundPercentage
  );

  const apiId = booking.dbId || booking.id;

  const handleConfirmCancel = async () => {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bookings/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not cancel booking"
        );
      }
      setResult({
        grossRefundAmount: Number(data.grossRefundAmount) || 0,
        mandatoryFeeAmount: Number(data.mandatoryCancellationFeeAmount) || 0,
        refundAmount: Number(data.refundAmount) || 0,
        withheldByPolicyAmount: Number(data.withheldByPolicyAmount) || 0,
        totalPrice: Number(data.totalPrice) || booking.totalPrice,
        refundPct: Number(data.refundPercentage) || 0,
      });
      setPhase("done");
      await onSuccess?.();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  phase === "done"
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                )}
              >
                {phase === "done" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {phase === "done"
                  ? "Booking cancelled"
                  : "Cancel booking"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {phase === "confirm" || phase === "loading" ? (
            <>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white font-medium mb-1">{booking.studio.name}</p>
                <p className="text-white/50 text-sm">
                  {new Date(booking.start_time || booking.date).toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      timeZone: "Asia/Kolkata",
                    }
                  )}{" "}
                  ({booking.timeSlot})
                </p>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-white/50" />
                <span className="text-white/70 text-sm">
                  About {hoursUntilSession} hour{hoursUntilSession !== 1 ? "s" : ""}{" "}
                  until your session
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="text-white font-medium mb-3">Refund estimate</h4>
                <p className="text-white/40 text-xs mb-4 leading-relaxed">
                  A mandatory {MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}% processing fee applies
                  to any eligible refund amount (deducted from the refund shown below).
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Paid total</span>
                    <span className="text-white">
                      ₹{booking.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Policy refund eligibility</span>
                    <span
                      className={cn(
                        "font-medium",
                        refundPercentage === 100
                          ? "text-green-400"
                          : refundPercentage === 50
                            ? "text-yellow-400"
                            : "text-red-400"
                      )}
                    >
                      {refundPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <span className="text-white/60">Refund before fees</span>
                    <span className="text-white">
                      ₹{preview.grossRefundAmount.toLocaleString()}
                    </span>
                  </div>
                  {preview.mandatoryFeeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/60">
                        Cancellation fee ({MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}%)
                      </span>
                      <span className="text-orange-300">
                        −₹{preview.mandatoryFeeAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="text-white font-medium">Estimated refund to you</span>
                    <span className="text-xl font-bold text-green-400">
                      ₹{preview.refundAmount.toLocaleString()}
                    </span>
                  </div>
                  {preview.withheldByPolicyAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Not refunded per policy</span>
                      <span className="text-red-400/90">
                        ₹{preview.withheldByPolicyAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {refundPercentage === 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-red-400 text-sm">
                    This booking is not eligible for a refund under the current policy window.
                    Cancelling will forfeit the full amount paid.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={phase === "loading"}
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  Keep booking
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  disabled={phase === "loading"}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-60"
                >
                  {phase === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                      Cancelling…
                    </>
                  ) : (
                    "Confirm cancellation"
                  )}
                </Button>
              </div>
            </>
          ) : null}

          {phase === "done" && result && (
            <>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                Your booking has been cancelled.
                Final amounts reflect your studio&apos;s cancellation policy plus the mandatory{" "}
                {MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}% platform fee on eligible refunds.
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Paid total</span>
                  <span className="text-white">
                    ₹{result.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Eligible refund (before fee)</span>
                  <span className="text-white">
                    ₹{result.grossRefundAmount.toLocaleString()}
                  </span>
                </div>
                {result.mandatoryFeeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      Cancellation fee ({MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}%)
                    </span>
                    <span className="text-orange-300">
                      −₹{result.mandatoryFeeAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-white font-semibold">Amount you should receive</span>
                  <span className="text-xl font-bold text-green-400">
                    ₹{result.refundAmount.toLocaleString()}
                  </span>
                </div>
                {result.withheldByPolicyAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Not refunded (policy)</span>
                    <span className="text-white/50">
                      ₹{result.withheldByPolicyAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-white/35 text-xs mb-6">
                Refunds are typically processed within 5–7 business days on the original payment method.
              </p>
              <Button
                onClick={onClose}
                className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold"
              >
                Close
              </Button>
            </>
          )}

          {phase === "error" && (
            <div className="space-y-4">
              <p className="text-red-400 text-sm">{errorMsg || "Cancellation failed."}</p>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/20 text-white"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setPhase("confirm");
                    setErrorMsg(null);
                  }}
                  className="flex-1 bg-white/10 text-white hover:bg-white/15"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
