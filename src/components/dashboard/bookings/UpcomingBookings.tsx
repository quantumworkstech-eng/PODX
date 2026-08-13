"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  RefreshCw,
  X,
  ChevronDown,
  PackagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { BookingDetailModal } from "../modals/BookingDetailModal";
import { CancelBookingModal } from "../modals/CancelBookingModal";
import { RescheduleModal } from "../modals/RescheduleModal";
import { AddBookingAddonsModal } from "../modals/AddBookingAddonsModal";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/bookingDisplay";


export interface BookingData {
  id: string;
  dbId?: string;   // actual UUID in DB (id may be booking_number)
  /** Raw UTC ISO string for session start — use formatBookingDate/Time from bookingDisplay.ts */
  start_time?: string;
  /** Raw UTC ISO string for session end */
  end_time?: string;
  /** @deprecated use start_time */
  date: string;
  /** @deprecated use end_time */
  endDate?: string;
  timeSlot: string;
  duration: number;
  participants: number;
  studio: {
    id: string;
    name: string;
    location: { area: string; city: string };
    cover_image: string;
    description?: string;
  };
  package: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
  addOns: { id: string; name: string; price: number; qty?: number }[];
  totalPrice: number;
  /** Pre-tax package + addons (before coupon), from booking notes when available */
  subtotal?: number | null;
  tax?: number | null;
  discountAmount?: number | null;
  couponCode?: string | null;
  convenienceFee?: number | null;
  bookingNote?: string | null;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "rescheduled";
  paymentId: string;
  createdAt: string;
  updatedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

interface UpcomingBookingsProps {
  bookings: BookingData[];
  /** Called after a booking is cancelled successfully via the modal (reload from API recommended). */
  onBookingCancelled?: () => void | Promise<void>;
  onReschedule: (bookingId: string, newDate: Date, newTime: string) => boolean | Promise<boolean>;
  /** Reload bookings from API after add-on purchase */
  onRefreshBookings?: () => Promise<BookingData[] | undefined>;
}

function ActionDropdown({
  isOpen,
  onClose,
  onViewDetails,
  onAddAddons,
  onReschedule,
  onCancel,
  anchorRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onAddAddons?: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function updatePosition() {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          left: rect.right - 224,
        });
      }
    }

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] w-56 bg-[#27272a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 origin-top-right"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="p-1">
        <button
          onClick={() => {
            onViewDetails();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={() => {
            onReschedule();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reschedule
        </button>
        {onAddAddons && (
          <button
            onClick={() => {
              onAddAddons();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            Add add-ons
          </button>
        )}
        <div className="h-px bg-white/10 my-1" />
        <button
          onClick={() => {
            onCancel();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel Booking
        </button>
      </div>
    </div>,
    document.body
  );
}

export function UpcomingBookings({
  bookings,
  onBookingCancelled,
  onReschedule,
  onRefreshBookings,
}: UpcomingBookingsProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAddAddonsModal, setShowAddAddonsModal] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const anchorRefs = useRef<Record<string, HTMLButtonElement>>({});

  const getAddonUnitCount = (booking: BookingData) =>
    booking.addOns.reduce((sum, addon) => sum + (Number(addon.qty) || 1), 0);

  useEffect(() => {
    if (!showDetailModal && !showRescheduleModal) return;
    setSelectedBooking((prev) => {
      if (!prev) return prev;
      const fresh = bookings.find(
        (b) => b.id === prev.id || (!!prev.dbId && b.dbId === prev.dbId)
      );
      if (!fresh) return prev;
      // Compare the fields the modal actually renders — start_time/end_time drive
      // the displayed date and time range, so a reschedule must be detected there.
      if (
        (fresh.start_time || "") === (prev.start_time || "") &&
        (fresh.end_time || "") === (prev.end_time || "") &&
        fresh.date === prev.date &&
        fresh.timeSlot === prev.timeSlot &&
        fresh.status === prev.status &&
        (fresh.endDate || "") === (prev.endDate || "")
      ) {
        return prev;
      }
      return fresh;
    });
  }, [bookings, showDetailModal, showRescheduleModal]);

  // Use centralized IST-aware formatters — single source of truth
  const formatDate = (b: BookingData) =>
    formatBookingDate(b.start_time || b.date);

  const formatTimeRange = (b: BookingData) =>
    formatBookingTimeRange(b.start_time, b.end_time);

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleReschedule = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleCancel = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-[#18181b] rounded-2xl border border-white/5 p-12 text-center">
        <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Bookings</h3>
        <p className="text-white/50 mb-6">You don&apos;t have any scheduled sessions yet.</p>
        <Button
          onClick={() => (window.location.href = "/book?fresh=1")}
          className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
        >
          Book Your First Session
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#18181b] rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 group"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-48 h-40 lg:h-auto relative flex-shrink-0 overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
                  <img
                    src={booking.studio.cover_image}
                    alt={booking.studio.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent lg:bg-gradient-to-t lg:from-black/60 lg:to-transparent" />
                </div>

                <div className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{booking.studio.name}</h3>
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                            booking.status === "confirmed"
                              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
                              : booking.status === "rescheduled"
                                ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                                : "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30"
                          )}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-white/60 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/40" />
                          <span>{formatDate(booking)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white/40" />
                          <span>{formatTimeRange(booking)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-white/40" />
                          <span className="truncate">{booking.studio.location.area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-white/40" />
                          <span>{booking.participants} people</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {booking.package && (
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-medium ring-1 ring-white/10">
                            {booking.package.name}
                          </span>
                        )}
                        {booking.addOns.length > 0 && (
                          <span className="px-3 py-1.5 rounded-lg bg-[#D9FC67]/10 text-[#D9FC67] text-xs font-medium ring-1 ring-[#D9FC67]/20">
                            +{getAddonUnitCount(booking)} add-on{getAddonUnitCount(booking) > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2 mt-4 sm:mt-0">
                      <div className="text-right">
                        <p className="text-white/40 text-xs uppercase tracking-wide">Total</p>
                        <p className="text-2xl font-bold text-white">
                          ₹{booking.totalPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReschedule(booking)}
                          className="gap-1 bg-white/5 border-white/10 text-white/75 hover:bg-white/10 hover:text-white"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking)}
                          className="gap-1 bg-red-500/10 border-red-500/25 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                        {onRefreshBookings && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowAddAddonsModal(true);
                            }}
                            className="gap-1 bg-[#D9FC67]/10 border-[#D9FC67]/25 text-[#D9FC67] hover:bg-[#D9FC67]/15 hover:text-[#E8FF8A]"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            Add-ons
                          </Button>
                        )}
                        <Button
                          ref={(el) => { if (el) anchorRefs.current[booking.id] = el }}
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveDropdownId(activeDropdownId === booking.id ? null : booking.id)}
                          className={cn(
                            "gap-1 transition-all duration-200",
                            activeDropdownId === booking.id
                              ? "bg-white/10 border-white/30 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          More
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              activeDropdownId === booking.id && "rotate-180"
                            )}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ActionDropdown
        isOpen={activeDropdownId !== null}
        onClose={() => setActiveDropdownId(null)}
        anchorRef={{ current: activeDropdownId ? anchorRefs.current[activeDropdownId] : null }}
        onViewDetails={() => {
          const booking = bookings.find((b) => b.id === activeDropdownId);
          if (booking) handleViewDetails(booking);
        }}
        onAddAddons={
          onRefreshBookings
            ? () => {
              const booking = bookings.find((b) => b.id === activeDropdownId);
              if (booking) {
                setSelectedBooking(booking);
                setShowAddAddonsModal(true);
              }
            }
            : undefined
        }
        onReschedule={() => {
          const booking = bookings.find((b) => b.id === activeDropdownId);
          if (booking) handleReschedule(booking);
        }}
        onCancel={() => {
          const booking = bookings.find((b) => b.id === activeDropdownId);
          if (booking) handleCancel(booking);
        }}
      />

      {selectedBooking && showAddAddonsModal && (
        <AddBookingAddonsModal
          booking={selectedBooking}
          open={showAddAddonsModal}
          onClose={() => {
            setShowAddAddonsModal(false);
          }}
          onSuccess={async () => {
            const list = await onRefreshBookings?.();
            const id = selectedBooking?.id;
            if (list && id) {
              const fresh = list.find((b) => b.id === id);
              if (fresh) setSelectedBooking(fresh);
            }
            setShowAddAddonsModal(false);
            setShowDetailModal(true);
          }}
        />
      )}

      {selectedBooking && showDetailModal && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBooking(null);
          }}
          onReschedule={() => {
            setShowDetailModal(false);
            setShowRescheduleModal(true);
          }}
          onCancel={() => {
            setShowDetailModal(false);
            setShowCancelModal(true);
          }}
        />
      )}

      {selectedBooking && showCancelModal && (
        <CancelBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={async () => {
            await onBookingCancelled?.();
          }}
        />
      )}

      {selectedBooking && showRescheduleModal && (
        <RescheduleModal
          booking={selectedBooking}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedBooking(null);
          }}
          onConfirm={async (newDate: Date, newTime: string) => {
            const b = selectedBooking;
            if (!b) return false;
            return await Promise.resolve(onReschedule(b.dbId || b.id, newDate, newTime));
          }}
        />
      )}
    </>
  );
}
