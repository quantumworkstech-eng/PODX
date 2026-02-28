"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Eye, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingDetailModal } from "../modals/BookingDetailModal";
import { BookingData } from "./UpcomingBookings";

interface PastBookingsProps {
  bookings: BookingData[];
}

export function PastBookings({ bookings }: PastBookingsProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-[#18181b] rounded-2xl border border-white/5 p-12 text-center">
        <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Past Bookings</h3>
        <p className="text-white/50">Your completed sessions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Studio</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Date & Time</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Duration</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Services</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Total</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={booking.studio.cover_image}
                          alt={booking.studio.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">{booking.studio.name}</p>
                        <p className="text-white/40 text-xs">{booking.studio.location.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{formatDate(booking.date)}</p>
                    <p className="text-white/40 text-xs">{formatTime(booking.timeSlot, booking.duration)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{booking.duration} hour{booking.duration > 1 ? "s" : ""}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {booking.package && (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-xs">
                          {booking.package.name}
                        </span>
                      )}
                      {booking.addOns.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-xs">
                          +{booking.addOns.length} add-on{booking.addOns.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                        booking.status === "completed"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-semibold">₹{booking.totalPrice.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && showDetailModal && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBooking(null);
          }}
          onReschedule={() => {}}
          onCancel={() => {}}
          isPastBooking
        />
      )}
    </div>
  );
}
