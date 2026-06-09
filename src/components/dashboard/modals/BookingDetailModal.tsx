"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Users, Package, AlertCircle, RefreshCw, Navigation, Star, CheckCircle2, Sparkles, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { formatBookingDateLong, formatBookingTimeRange } from "@/lib/bookingDisplay";
import { BookingActivityTimeline } from "@/components/booking/BookingActivityTimeline";
import { MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT } from "@/lib/cancellationRefund";


interface BookingDetailModalProps {
  booking: BookingData;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  isPastBooking?: boolean;
  isReviewed?: boolean;
  onReviewSubmitted?: (dbId: string) => void;
}

export function BookingDetailModal({
  booking,
  onClose,
  onReschedule,
  onCancel,
  isPastBooking = false,
  isReviewed = false,
  onReviewSubmitted,
}: BookingDetailModalProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [policyRules, setPolicyRules] = useState<{ hours_before: number; refund_percentage: number }[] | null>(null);
  const [rescheduleCutoff, setRescheduleCutoff] = useState<number | null>(null);

  useEffect(() => {
    if (!booking.studio?.id) return;
    fetch(`/api/studios/${booking.studio.id}/policy`)
      .then((r) => r.json())
      .then(({ rules, reschedule_cutoff_hours }) => {
        setPolicyRules(rules);
        setRescheduleCutoff(reschedule_cutoff_hours ?? 48);
      })
      .catch(() => {});
  }, [booking.studio?.id]);
  // Use centralized IST-aware formatters — never browser-local timezone
  const formatDate = (dateStr: string) => {
    // Use start_time if available on the booking for accurate IST date
    const src = booking.start_time || dateStr;
    return formatBookingDateLong(src);
  };

  const formatTime = (booking: BookingData) => {
    if (booking.start_time && booking.end_time) {
      return formatBookingTimeRange(booking.start_time, booking.end_time);
    }
    // Fallback from timeSlot + duration
    const [hoursStr, minutesStr = "00"] = booking.timeSlot.split(":");
    const hour = parseInt(hoursStr, 10);
    const minute = parseInt(minutesStr, 10);
    const totalStartMinutes = hour * 60 + minute;
    const totalEndMinutes = totalStartMinutes + Math.round(booking.duration * 60);
    const fmt = (total: number) => {
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };
    return `${fmt(totalStartMinutes)} – ${fmt(totalEndMinutes)}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#18181b] border-b border-white/5 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <p className="text-white/50 text-sm mt-1">{booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative h-48 rounded-xl overflow-hidden mb-6">
            <img
              src={booking.studio.cover_image}
              alt={booking.studio.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h3 className="text-2xl font-bold text-white">{booking.studio.name}</h3>
              <p className="text-white/70 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {booking.studio.location.area}, {booking.studio.location.city}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Date</p>
                <p className="text-white font-medium">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Time</p>
                <p className="text-white font-medium">{formatTime(booking)}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Duration</p>
                <p className="text-white font-medium">
                  {booking.duration} hour{booking.duration > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white/50 text-sm">Participants</p>
                <p className="text-white font-medium">
                  {booking.participants} people
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl overflow-hidden mb-6">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D9FC67]" />
                Studio Location
              </h4>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${booking.studio.location.area}, ${booking.studio.location.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-[#D9FC67] hover:text-[#E8FF8A] transition-colors bg-[#D9FC67]/10 px-3 py-1.5 rounded-full"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
              </a>
            </div>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${booking.studio.location.area}, ${booking.studio.location.city}`)}&t=m&z=15&output=embed&hl=en`}
              className="w-full h-48 border-0"
              loading="lazy"
              title="Studio location"
            />
            <div className="px-4 py-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="text-white/60 text-sm">{booking.studio.location.area}, {booking.studio.location.city}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-white/50" />
              Services
            </h4>
            <div className="space-y-1">
              {booking.package && (
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/70">{booking.package.name}</span>
                  <span className="text-white">
                    {booking.package.price_per_hour > 0
                      ? `₹${(booking.package.price_per_hour * booking.duration).toLocaleString()}`
                      : "Included"}
                  </span>
                </div>
              )}
              {booking.addOns.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D9FC67]/70 pt-3 pb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Add-ons
                  </p>
                  {booking.addOns.map((addon) => {
                    const qty = Number(addon.qty) || 1;
                    const total = addon.price * qty;
                    return (
                    <div key={addon.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-white/70">
                        {addon.name}
                        {qty > 1 && <span className="text-white/40"> × {qty}</span>}
                      </span>
                      <span className="text-white">₹{total.toLocaleString()}</span>
                    </div>
                    );
                  })}
                </>
              )}
              {(booking.subtotal != null && booking.subtotal > 0) && (
                <div className="flex justify-between items-center py-2 border-t border-white/10 mt-2">
                  <span className="text-white/55 text-sm">Subtotal (services)</span>
                  <span className="text-white/90 text-sm">
                    ₹{Number(booking.subtotal).toLocaleString()}
                  </span>
                </div>
              )}
              {(booking.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/55 text-sm">
                    Coupon discount{booking.couponCode ? ` (${booking.couponCode})` : ""}
                  </span>
                  <span className="text-[#D9FC67] text-sm font-medium">
                    −₹{Number(booking.discountAmount).toLocaleString()}
                  </span>
                </div>
              )}
              {booking.tax != null && booking.tax > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/55 text-sm">GST</span>
                  <span className="text-white/90 text-sm">₹{Number(booking.tax).toLocaleString()}</span>
                </div>
              )}
              {(booking.convenienceFee ?? 0) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/55 text-sm">Processing fee</span>
                  <span className="text-white/90 text-sm">₹{Number(booking.convenienceFee).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 mt-2 flex justify-between items-center">
                <span className="text-white font-semibold">Total paid</span>
                <span className="text-2xl font-bold text-[#D9FC67]">
                  ₹{booking.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <BookingActivityTimeline
            createdAt={booking.createdAt}
            updatedAt={booking.updatedAt ?? null}
            startTime={booking.start_time || booking.date}
            endTime={booking.end_time || booking.endDate}
            status={booking.status}
            cancelledAt={booking.cancelledAt ?? null}
            cancellationReason={booking.cancellationReason ?? null}
            paymentRecorded={Boolean(booking.paymentId)}
          />

          {booking.bookingNote && (
            <div className="bg-white/5 rounded-xl p-5 mb-6">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[#D9FC67]" />
                Note for studio
              </h4>
              <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">
                {booking.bookingNote}
              </p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-400 font-medium">Cancellation Policy</p>
                {policyRules ? (
                  <ul className="text-yellow-400/70 text-sm mt-1 space-y-0.5">
                    {policyRules.map((rule, i) => {
                      const next = policyRules[i + 1];
                      const label = next
                        ? `${next.hours_before}–${rule.hours_before} hrs before`
                        : rule.hours_before > 0
                        ? `${rule.hours_before}+ hrs before`
                        : `Under ${policyRules[i - 1]?.hours_before ?? 24} hrs`;
                      return (
                        <li key={i}>
                          {label}: {rule.refund_percentage === 100 ? 'Full refund' : rule.refund_percentage === 0 ? 'No refund' : `${rule.refund_percentage}% refund`}
                        </li>
                      );
                    })}
                    <li className="text-yellow-400/60 text-[11px] mt-2">
                      A mandatory {MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}% platform processing fee is deducted from any eligible refund amount.
                    </li>
                    {rescheduleCutoff !== null && (
                      <li className="mt-1 pt-1 border-t border-yellow-400/20">
                        Rescheduling allowed up to {rescheduleCutoff} hrs before session
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-yellow-400/70 text-sm mt-1">
                    Cancel up to 48 hours before for a full refund. 24–48 hrs: 50% refund. Under 24 hrs: no refund.
                    {" "}
                    A mandatory {MANDATORY_CANCELLATION_FEE_ON_REFUND_PERCENT}% fee applies to eligible refunds.
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isPastBooking && booking.status !== "cancelled" && (
            <div className="flex gap-3">
              <Button
                onClick={onReschedule}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                Cancel Booking
              </Button>
            </div>
          )}

          {isPastBooking && booking.status === "completed" && (
            isReviewed ? (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                You&apos;ve reviewed this session
              </div>
            ) : (
              <Button
                onClick={() => setShowReviewModal(true)}
                className="w-full bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold"
              >
                <Star className="w-4 h-4 mr-2" />
                Leave a Review
              </Button>
            )
          )}
        </div>
      </div>

      {showReviewModal && (booking.dbId || booking.id) && (
        <ReviewModal
          bookingId={booking.dbId || booking.id}
          studioId={booking.studio.id}
          studioName={booking.studio.name}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            if (booking.dbId) onReviewSubmitted?.(booking.dbId);
          }}
        />
      )}
    </div>
  );
}
