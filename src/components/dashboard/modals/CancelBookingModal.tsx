"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";
import { cn } from "@/lib/utils";

interface CancelBookingModalProps {
  booking: BookingData;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelBookingModal({ booking, onClose, onConfirm }: CancelBookingModalProps) {
  const [hoursUntilSession, setHoursUntilSession] = useState(0);
  const [refundPercentage, setRefundPercentage] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const sessionDate = new Date(booking.date);
    sessionDate.setHours(parseInt(booking.timeSlot.split(":")[0]), 0, 0, 0);
    const now = new Date();
    const hours = Math.max(0, Math.floor((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
    setHoursUntilSession(hours);

    // Fetch studio-specific cancellation policy
    const studioId = booking.studio?.id;
    if (studioId) {
      fetch(`/api/studios/${studioId}/policy`)
        .then((r) => r.json())
        .then(({ rules }) => {
          if (!rules) return;
          // rules are sorted descending by hours_before
          let pct = 0;
          for (const rule of rules) {
            if (hours >= rule.hours_before) { pct = rule.refund_percentage; break; }
          }
          setRefundPercentage(pct);
        })
        .catch(() => {
          // fallback to platform defaults
          setRefundPercentage(hours >= 48 ? 100 : hours >= 24 ? 50 : 0);
        });
    } else {
      setRefundPercentage(hours >= 48 ? 100 : hours >= 24 ? 50 : 0);
    }
  }, [booking]);

  const refundAmount = Math.round((booking.totalPrice * refundPercentage) / 100);
  const nonRefundableAmount = booking.totalPrice - refundAmount;

  const handleCancel = () => {
    setIsCancelling(true);
    setTimeout(() => {
      onConfirm();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Cancel Booking</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-white font-medium mb-1">{booking.studio.name}</p>
            <p className="text-white/50 text-sm">
              {new Date(booking.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {booking.timeSlot}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-white/50" />
            <span className="text-white/70 text-sm">
              {hoursUntilSession} hours until your session
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <h4 className="text-white font-medium mb-4">Refund Calculation</h4>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Booking Total</span>
                <span className="text-white">₹{booking.totalPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-white/60">Refund Eligibility</span>
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

              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">Refund Amount</span>
                  <span className="text-xl font-bold text-green-400">
                    ₹{refundAmount.toLocaleString()}
                  </span>
                </div>
                {nonRefundableAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Non-refundable</span>
                    <span className="text-red-400">₹{nonRefundableAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {refundPercentage === 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">
                Unfortunately, your booking is not eligible for a refund as it&apos;s too close to the
                session time. Cancelling will forfeit the full amount.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm">
                  You&apos;ll receive a {refundPercentage}% refund (₹{refundAmount.toLocaleString()})
                  within 5-7 business days.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Go Back
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
