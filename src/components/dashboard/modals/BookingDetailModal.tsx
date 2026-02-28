"use client";

import { X, Calendar, Clock, MapPin, Users, Package, IndianRupee, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";

interface BookingDetailModalProps {
  booking: BookingData;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  isPastBooking?: boolean;
}

export function BookingDetailModal({
  booking,
  onClose,
  onReschedule,
  onCancel,
  isPastBooking = false,
}: BookingDetailModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot: string, duration: number) => {
    const [hours] = timeSlot.split(":");
    const hour = parseInt(hours);
    const endHour = hour + duration;
    const formatHour = (h: number) => {
      if (h === 12) return "12 PM";
      if (h > 12) return `${h - 12} PM`;
      return `${h} AM`;
    };
    return `${formatHour(hour)} - ${formatHour(endHour)}`;
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
                <p className="text-white font-medium">{formatTime(booking.timeSlot, booking.duration)}</p>
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

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-white/50" />
              Services
            </h4>
            <div className="space-y-3">
              {booking.package && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70">{booking.package.name}</span>
                  <span className="text-white">
                    {booking.package.price_per_hour > 0
                      ? `₹${(booking.package.price_per_hour * booking.duration).toLocaleString()}`
                      : "Included"}
                  </span>
                </div>
              )}
              {booking.addOns.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center py-2">
                  <span className="text-white/70">{addon.name}</span>
                  <span className="text-white">₹{addon.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-[#D9FC67]">
                  ₹{booking.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Cancellation Policy</p>
                <p className="text-yellow-400/70 text-sm mt-1">
                  Cancel up to 24 hours before your session for a full refund. Cancellations within
                  24 hours are eligible for 50% refund. No refund for no-shows.
                </p>
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
        </div>
      </div>
    </div>
  );
}
