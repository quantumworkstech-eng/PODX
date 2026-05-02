"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus,
  Building2, User, Phone, Mail, MapPin, Package, ShoppingBag,
  IndianRupee, Receipt, Hash, CalendarCheck, X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";
import type { StudioBookingInventory } from "@/lib/studio-booking-inventory";
import type { AddOnService } from "@/lib/booking-types";
import { FeatureGate } from "@/components/partner/FeatureGate";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/bookingDisplay";
import { BookingActivityTimeline } from "@/components/booking/BookingActivityTimeline";
import {
  formatSessionClock12hIST,
  formatSessionDateCalendarIST,
  formatSessionDateShortIST,
  formatSessionDateTimeShortIST,
  formatSessionTimeRangeIST,
} from "@/lib/bookingTime";

interface AddOn {
  name: string;
  price: number;
}

interface Booking {
  id: string;
  dbId?: string;
  studioId?: string;
  studio: { id: string; name: string; city: string; address: string };
  customer: { name: string; email: string; phone: string };
  /** Raw UTC ISO — preferred for display */
  start_time?: string;
  end_time?: string;
  /** Legacy aliases */
  date: string;
  endDate?: string;
  timeSlot: string;
  endTime: string;
  duration: number;
  participants: number | null;
  package: { name: string; pricePerHour: number } | null;
  addOns: AddOn[];
  pricing: {
    subtotalBeforeDiscount: number;
    discountAmount: number;
    couponCode: string | null;
    preTaxAfterDiscount: number;
    packagePrice: number;
    addOnsTotal: number;
    gst: number;
    convenienceFee: number;
    total: number;
  };
  totalPrice: number;
  paymentId: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "rescheduled";
  createdAt: string;
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const map = {
    confirmed: { icon: CheckCircle, label: "Confirmed", cls: "text-green-400 bg-green-400/10" },
    pending: { icon: AlertCircle, label: "Pending", cls: "text-yellow-400 bg-yellow-400/10" },
    cancelled: { icon: XCircle, label: "Cancelled", cls: "text-red-400 bg-red-400/10" },
    completed: { icon: CheckCircle, label: "Completed", cls: "text-blue-400 bg-blue-400/10" },
    rescheduled: { icon: CalendarPlus, label: "Rescheduled", cls: "text-cyan-400 bg-cyan-400/10" },
  };
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-sm">{label}</span>
      <span className={cn("text-sm text-right", mono ? "font-mono text-white/70" : "text-white font-medium")}>
        {value}
      </span>
    </div>
  );
}

function PriceRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-2", highlight && "border-t border-white/10 mt-1 pt-3")}>
      <span className={cn("text-sm", highlight ? "text-white font-semibold" : "text-white/50")}>{label}</span>
      <span className={cn("text-sm font-semibold", highlight ? "text-[#D9FC67] text-base" : "text-white/80")}>
        ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
      </span>
    </div>
  );
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [studioInventory, setStudioInventory] = useState<StudioBookingInventory | null>(null);

  const loadBookingsFromApi = useCallback(async (): Promise<Booking[] | undefined> => {
    try {
      const r = await fetch("/api/partner/bookings");
      if (!r.ok) return undefined;
      const d = await r.json();
      const list = (d.bookings || []) as Booking[];
      setBookings(list);
      return list;
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    loadBookingsFromApi().catch(console.error).finally(() => setIsFetching(false));
  }, [loadBookingsFromApi]);

  useEffect(() => {
    const sid = selectedBooking?.studio?.id || selectedBooking?.studioId;
    if (!showDetailModal || !sid) {
      setStudioInventory(null);
      return;
    }
    fetch(`/api/studios/${sid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStudioInventory(d?.booking_inventory ?? null))
      .catch(() => setStudioInventory(null));
  }, [showDetailModal, selectedBooking?.studio?.id, selectedBooking?.studioId]);

  // Keep detail modal aligned with the table after refetch / reschedule (avoid stale object).
  useEffect(() => {
    if (!showDetailModal) return;
    setSelectedBooking((prev) => {
      if (!prev) return prev;
      const fresh = bookings.find(
        (b) => b.id === prev.id || (!!prev.dbId && b.dbId === prev.dbId)
      );
      if (!fresh) return prev;
      if (
        fresh.date === prev.date &&
        fresh.timeSlot === prev.timeSlot &&
        fresh.endTime === prev.endTime &&
        fresh.duration === prev.duration &&
        fresh.status === prev.status
      ) {
        return prev;
      }
      return fresh;
    });
  }, [bookings, showDetailModal]);

  const updateBookingStatus = async (dbId: string | undefined, status: Booking["status"], localId: string) => {
    if (dbId) {
      await fetch("/api/partner/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingDbId: dbId, status }),
      }).catch(console.error);
    }
    setBookings((prev) => prev.map((b) => (b.id === localId ? { ...b, status } : b)));
    if (selectedBooking?.id === localId) setSelectedBooking((b) => b ? { ...b, status } : b);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchFilter = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.id.toLowerCase().includes(q) ||
      b.customer.name.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q) ||
      b.studio.name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const handleCancel = () => {
    if (!selectedBooking) return;
    updateBookingStatus(selectedBooking.dbId, "cancelled", selectedBooking.id);
    setShowCancelModal(false);
  };

  const handleReschedule = async () => {
    if (!selectedBooking || !newDate || !newTime) return;
    setIsRescheduling(true);
    setRescheduleError(null);

    const localBookingId = selectedBooking.id;
    const localDbId = selectedBooking.dbId;
    const apiId = selectedBooking.dbId || selectedBooking.id;
    const [th, tm = "00"] = newTime.split(":");
    const newTimeSlot = `${String(parseInt(th, 10)).padStart(2, "0")}:${String(parseInt(tm, 10)).padStart(2, "0")}`;

    try {
      const res = await fetch(`/api/partner/bookings/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate,
          newTimeSlot,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRescheduleError(json.error || "Failed to reschedule. Please try again.");
        return;
      }
      const list = await loadBookingsFromApi();
      if (list) {
        const fresh = list.find((b) => b.id === localBookingId || b.dbId === localDbId);
        if (fresh) setSelectedBooking(fresh);
      }
      setShowRescheduleModal(false);
      setNewDate("");
      setNewTime("");
    } catch {
      setRescheduleError("Network error. Please try again.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const openDetail = (b: Booking) => { setSelectedBooking(b); setShowDetailModal(true); };
  const openCancel = (b: Booking) => { setSelectedBooking(b); setShowCancelModal(true); };
  const openReschedule = (b: Booking) => {
    setSelectedBooking(b);
    setNewDate(formatSessionDateCalendarIST(b.date));
    setNewTime(b.timeSlot);
    setRescheduleError(null);
    setShowRescheduleModal(true);
  };

  const fmtDate = (iso: string) => formatSessionDateShortIST(iso);
  const fmtDateTime = (iso: string) => formatSessionDateTimeShortIST(iso);

  return (
    <FeatureGate featureKey="booking_management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/40">Manage customer bookings for your studios</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings, customers…"
                className="pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67] w-64"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "confirmed", "pending", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                filter === f ? "bg-[#D9FC67] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={cn("text-xs rounded-full px-1.5 py-0.5", filter === f ? "bg-black/20 text-black" : "bg-white/10 text-white/40")}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {isFetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Table */}
        {!isFetching && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Booking</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Studio</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Session</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Package / Add-ons</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-white/40 text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => openDetail(booking)}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <p className="text-white font-mono text-sm">{booking.id}</p>
                        <p className="text-white/30 text-xs mt-0.5">{fmtDateTime(booking.createdAt)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm font-medium">{booking.customer.name}</p>
                        <p className="text-white/40 text-xs">{booking.customer.email}</p>
                        {booking.customer.phone && (
                          <p className="text-white/30 text-xs">{booking.customer.phone}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#D9FC67] shrink-0" />
                          <div>
                            <p className="text-white text-sm">{booking.studio.name}</p>
                            {booking.studio.city && <p className="text-white/40 text-xs">{booking.studio.city}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{fmtDate(booking.date)}</p>
                        <p className="text-white/50 text-xs">
                          {formatSessionTimeRangeIST(booking.start_time || booking.date, booking.end_time || booking.endDate || booking.date)}
                        </p>
                        <p className="text-white/30 text-xs">{booking.duration}h session</p>
                      </td>
                      <td className="p-4">
                        {booking.package ? (
                          <span className="text-xs bg-[#D9FC67]/10 text-[#D9FC67] px-2 py-0.5 rounded-full">
                            {booking.package.name}
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs">No package</span>
                        )}
                        {booking.addOns.length > 0 && (
                          <p className="text-white/40 text-xs mt-1">+{booking.addOns.length} add-on{booking.addOns.length > 1 ? "s" : ""}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-[#D9FC67] font-bold text-sm">₹{booking.totalPrice.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {booking.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.dbId, "confirmed", booking.id)}
                                className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.dbId, "cancelled", booking.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(booking.status === "confirmed" || booking.status === "pending" || booking.status === "rescheduled") && (
                            <>
                              <button
                                onClick={() => openReschedule(booking)}
                                className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                                title="Reschedule"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openCancel(booking)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBookings.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No bookings found</p>
                {search && <p className="text-white/20 text-sm mt-1">Try clearing your search</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Detail Modal ── */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent
            showCloseButton={false}
            className="bg-[#141414] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto p-0"
          >
            {selectedBooking && (
              <>
                {/* Modal header */}
                <div className="flex items-start justify-between p-6 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <StatusBadge status={selectedBooking.status} />
                      {selectedBooking.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateBookingStatus(selectedBooking.dbId, "confirmed", selectedBooking.id)}
                            className="text-xs px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-full transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { updateBookingStatus(selectedBooking.dbId, "cancelled", selectedBooking.id); }}
                            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    <h2 className="text-white font-bold text-lg font-mono">{selectedBooking.id}</h2>
                    <p className="text-white/30 text-xs mt-0.5">
                      Booked on {fmtDateTime(selectedBooking.createdAt)}
                    </p>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 grid sm:grid-cols-2 gap-4">

                  {/* Customer */}
                  <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <h3 className="text-white font-semibold text-sm">Customer</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D9FC67]/20 to-[#B8E050]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#D9FC67] text-sm font-bold">
                            {selectedBooking.customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-white font-medium">{selectedBooking.customer.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedBooking.customer.email}</span>
                      </div>
                      {selectedBooking.customer.phone && (
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{selectedBooking.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Studio */}
                  <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#D9FC67]/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#D9FC67]" />
                      </div>
                      <h3 className="text-white font-semibold text-sm">Studio</h3>
                    </div>
                    <p className="text-white font-medium mb-1">{selectedBooking.studio.name}</p>
                    {selectedBooking.studio.city && (
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedBooking.studio.city}</span>
                      </div>
                    )}
                    {selectedBooking.studio.address && (
                      <p className="text-white/30 text-xs mt-1 ml-5">{selectedBooking.studio.address}</p>
                    )}
                  </div>

                  {/* Session Details */}
                  <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <CalendarCheck className="w-4 h-4 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold text-sm">Session Details</h3>
                    </div>
                    <InfoRow label="Date" value={fmtDate(selectedBooking.date)} />
                    <InfoRow label="Start Time" value={formatSessionClock12hIST(selectedBooking.start_time || selectedBooking.date)} />
                    <InfoRow label="End Time" value={formatSessionClock12hIST(selectedBooking.end_time || selectedBooking.endDate || selectedBooking.date)} />
                    <InfoRow label="Duration" value={`${selectedBooking.duration} hour${selectedBooking.duration !== 1 ? "s" : ""}`} />
                    {selectedBooking.participants && (
                      <InfoRow label="Participants" value={`${selectedBooking.participants} people`} />
                    )}
                  </div>

                  {/* Package & Add-ons */}
                  <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="text-white font-semibold text-sm">Package & Add-ons</h3>
                    </div>
                    {selectedBooking.package ? (
                      <div className="mb-3 p-2.5 rounded-lg bg-[#D9FC67]/5 border border-[#D9FC67]/10">
                        <p className="text-[#D9FC67] text-sm font-medium">{selectedBooking.package.name}</p>
                        {selectedBooking.package.pricePerHour > 0 && (
                          <p className="text-white/40 text-xs mt-0.5">₹{selectedBooking.package.pricePerHour.toLocaleString("en-IN")}/hr</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-white/30 text-sm mb-3">No package selected</p>
                    )}
                    {selectedBooking.addOns.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" /> Add-ons
                        </p>
                        {selectedBooking.addOns.map((addon, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{addon.name}</span>
                            <span className="text-white/50">₹{addon.price.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-xs">No add-ons</p>
                    )}
                  </div>
                </div>

                {selectedBooking && (
                  <div className="px-6 pb-2">
                    <BookingActivityTimeline
                      createdAt={selectedBooking.createdAt}
                      updatedAt={selectedBooking.updatedAt}
                      startTime={selectedBooking.start_time || selectedBooking.date}
                      endTime={selectedBooking.end_time || selectedBooking.endDate}
                      status={selectedBooking.status}
                      cancelledAt={selectedBooking.cancelledAt}
                      cancellationReason={selectedBooking.cancellationReason}
                      paymentRecorded={Boolean(selectedBooking.paymentId)}
                    />
                  </div>
                )}

                {selectedBooking && (
                  <div className="px-6 pb-2">
                    <StudioBookingInventoryPanel
                      inventory={studioInventory}
                      selectedAddOns={
                        selectedBooking.addOns.map(
                          (a, i): AddOnService => ({
                            id: `addon-${i}-${a.name}`,
                            name: a.name,
                            price: a.price,
                            description: "",
                          })
                        )
                      }
                      title="Equipment, services & add-ons"
                    />
                  </div>
                )}

                {selectedBooking && (
                  <div className="px-6 pb-2">
                    <BookingActivityTimeline
                      createdAt={selectedBooking.createdAt}
                      updatedAt={selectedBooking.updatedAt}
                      startTime={selectedBooking.start_time || selectedBooking.date}
                      endTime={selectedBooking.end_time || selectedBooking.endDate}
                      status={selectedBooking.status}
                      cancelledAt={selectedBooking.cancelledAt}
                      cancellationReason={selectedBooking.cancellationReason}
                      paymentRecorded={Boolean(selectedBooking.paymentId)}
                    />
                  </div>
                )}

                {/* Payment Summary */}
                <div className="mx-6 mb-6 bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold text-sm">Payment Summary</h3>
                  </div>
                  <div className="space-y-0.5">
                    {selectedBooking.pricing.subtotalBeforeDiscount > 0 && (
                      <PriceRow
                        label="Subtotal (before discount)"
                        value={selectedBooking.pricing.subtotalBeforeDiscount}
                      />
                    )}
                    {selectedBooking.pricing.discountAmount > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-white/50">
                          Coupon discount
                          {selectedBooking.pricing.couponCode
                            ? ` (${selectedBooking.pricing.couponCode})`
                            : ""}
                        </span>
                        <span className="text-sm font-semibold text-[#D9FC67]">
                          −₹{selectedBooking.pricing.discountAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    {selectedBooking.pricing.preTaxAfterDiscount >= 0 && selectedBooking.pricing.discountAmount > 0 && (
                      <PriceRow
                        label="Net (after discount, excl. GST)"
                        value={selectedBooking.pricing.preTaxAfterDiscount}
                      />
                    )}
                    {selectedBooking.pricing.gst > 0 && (
                      <PriceRow label="GST (18%)" value={selectedBooking.pricing.gst} />
                    )}
                    {selectedBooking.pricing.convenienceFee > 0 && (
                      <PriceRow
                        label="Processing fee"
                        value={selectedBooking.pricing.convenienceFee}
                      />
                    )}
                    <PriceRow
                      label="Total paid"
                      value={selectedBooking.pricing.total}
                      highlight
                    />
                  </div>
                </div>

                {/* Action footer */}
                {(selectedBooking.status === "confirmed" || selectedBooking.status === "pending" || selectedBooking.status === "rescheduled") && (
                  <div className="flex gap-3 px-6 pb-6">
                    <Button
                      onClick={() => { setShowDetailModal(false); openReschedule(selectedBooking); }}
                      variant="outline"
                      className="flex-1 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <CalendarPlus className="w-4 h-4 mr-2" /> Reschedule
                    </Button>
                    <Button
                      onClick={() => { setShowDetailModal(false); openCancel(selectedBooking); }}
                      variant="outline"
                      className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Cancel Modal ── */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="bg-[#141414] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Cancel Booking</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">Are you sure you want to cancel this booking? The customer will be notified.</p>
                <div className="p-4 bg-white/5 rounded-xl space-y-2 text-sm">
                  <InfoRow label="Booking ID" value={selectedBooking.id} mono />
                  <InfoRow label="Customer" value={selectedBooking.customer.name} />
                  <InfoRow label="Studio" value={selectedBooking.studio.name} />
                  <InfoRow
                    label="Session"
                    value={`${fmtDate(selectedBooking.date)} · ${formatSessionTimeRangeIST(selectedBooking.start_time || selectedBooking.date, selectedBooking.end_time || selectedBooking.endDate || selectedBooking.date)}`}
                  />
                  <InfoRow label="Amount" value={`₹${selectedBooking.totalPrice.toLocaleString("en-IN")}`} />
                </div>
                <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <p className="text-yellow-400 text-sm">Cancellation may be subject to your refund policy.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelModal(false)} className="border-white/10 text-white hover:bg-white/5">Close</Button>
              <Button onClick={handleCancel} className="bg-red-500 hover:bg-red-600 text-white">Cancel Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reschedule Modal ── */}
        <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
          <DialogContent className="bg-[#141414] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Reschedule Booking</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl space-y-2 text-sm">
                  <InfoRow label="Booking" value={selectedBooking.id} mono />
                  <InfoRow label="Customer" value={selectedBooking.customer.name} />
                  <InfoRow label="Current Date" value={fmtDate(selectedBooking.date)} />
                  <InfoRow
                    label="Current Time"
                    value={formatSessionTimeRangeIST(selectedBooking.start_time || selectedBooking.date, selectedBooking.end_time || selectedBooking.endDate || selectedBooking.date)}
                  />
                  <InfoRow label="Duration" value={`${selectedBooking.duration}h`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">New Date</label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">New Start Time</label>
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
                <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <p className="text-yellow-400 text-sm">The customer will be notified of the updated schedule.</p>
                </div>
                {rescheduleError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{rescheduleError}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="border-white/10 text-white hover:bg-white/5" disabled={isRescheduling}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={!newDate || !newTime || isRescheduling} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                {isRescheduling ? "Rescheduling…" : "Confirm Reschedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
