"use client";

import { useEffect, useState } from "react";
import {
  Search, XCircle, RefreshCw, RotateCcw, Check, X,
  ChevronLeft, ChevronRight, Eye, Save, User, Building2, Clock,
  CreditCard, Package, Users, Calendar, FileText, Pencil, Plus,
  Ban, AlertTriangle, CalendarClock,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";
import type { StudioBookingInventory } from "@/lib/studio-booking-inventory";
import type { AddOnService } from "@/lib/booking-types";
import { isoToISTSlot } from "@/lib/bookingDisplay";
import { formatSessionDateCalendarIST } from "@/lib/bookingTime";
import { BookingActivityTimeline } from "@/components/booking/BookingActivityTimeline";

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled", "completed", "rescheduled", "no_show"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rescheduled: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  no_show: "bg-white/10 text-white/40 border-white/10",
  reschedule_requested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const rescheduleStatusColors: Record<string, string> = {
  pending: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "rescheduled", "no_show"];

interface RescheduleRequest {
  id: string;
  booking_number: string;
  studio_name: string;
  studio_city: string;
  requested_by_email: string;
  requested_by_role: string;
  old_date: string;
  old_start_time: string;
  old_end_time: string;
  new_date: string;
  new_start_time: string;
  new_end_time: string;
  reason: string;
  status: string;
  admin_note: string;
  created_at: string;
}

interface BookingDetail {
  booking: any;
  payments: any[];
  addons: any[];
  guests: any[];
  refunds: any[];
}

function fmt12h(t: string) {
  if (!t) return "—";
  // Handle ISO timestamp strings (e.g. from start_time/end_time)
  if (t.includes("T") || t.includes("+") || t.endsWith("Z")) {
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      const h = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
      return h;
    }
  }
  // Plain HH:MM
  const parts = t.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDateIST(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InfoRow({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-sm">{label}</span>
      <span className={`text-white text-sm ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function parseAdminBookingNotes(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw !== "string") return {};
  try {
    const o = JSON.parse(raw);
    return o !== null && typeof o === "object" && !Array.isArray(o)
      ? (o as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "reschedule" ? "reschedule" : "bookings";

  const [activeTab, setActiveTab] = useState<"bookings" | "reschedule">(initialTab as any);

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Booking detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailData, setDetailData] = useState<BookingDetail | null>(null);
  const [detailSection, setDetailSection] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [bookingFlash, setBookingFlash] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ bookingId: string; action: "force_cancel" | "force_refund"; label: string; description: string } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Admin reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleLoading2, setRescheduleLoading2] = useState(false);
  const [rescheduleError2, setRescheduleError2] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [rescheduleTotal, setRescheduleTotal] = useState(0);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleStatusFilter, setRescheduleStatusFilter] = useState("pending");
  const [reschedulePage, setReschedulePage] = useState(1);

  // Reschedule action modal
  const [reviewModal, setReviewModal] = useState<RescheduleRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Add booking modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addFields, setAddFields] = useState({
    user_email: "", studio_id: "", date: "", start_time: "10:00", end_time: "12:00",
    status: "confirmed", total_price: "", notes: "",
  });
  const [studioList, setStudioList] = useState<any[]>([]);
  const [studioBookingInventory, setStudioBookingInventory] = useState<StudioBookingInventory | null>(null);
  const [studioSearch, setStudioSearch] = useState("");

  const loadStudiosForDropdown = () => {
    fetch("/api/admin/studios?page=1&limit=200")
      .then(r => r.json())
      .then(d => setStudioList(d.studios || []));
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addFields),
    });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddError(data.error || "Failed to create booking"); return; }
    setAddOpen(false);
    setAddFields({ user_email: "", studio_id: "", date: "", start_time: "10:00", end_time: "12:00", status: "confirmed", total_price: "", notes: "" });
    fetchBookings();
  };

  const fetchBookings = () => {
    setBookingLoading(true);
    const params = new URLSearchParams({ page: String(bookingPage) });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings || []); setBookingTotal(d.total || 0); setBookingLoading(false); })
      .catch(() => setBookingLoading(false));
  };

  const fetchReschedule = () => {
    setRescheduleLoading(true);
    const params = new URLSearchParams({ page: String(reschedulePage), status: rescheduleStatusFilter });
    fetch(`/api/admin/reschedule?${params}`)
      .then((r) => r.json())
      .then((d) => { setRescheduleRequests(d.requests || []); setRescheduleTotal(d.total || 0); setRescheduleLoading(false); })
      .catch(() => setRescheduleLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [bookingPage, statusFilter]);

  useEffect(() => {
    if (!bookingFlash) return;
    const t = setTimeout(() => setBookingFlash(null), 4500);
    return () => clearTimeout(t);
  }, [bookingFlash]);
  useEffect(() => { if (activeTab === "reschedule") fetchReschedule(); }, [activeTab, reschedulePage, rescheduleStatusFilter]);

  useEffect(() => {
    const sid = detailData?.booking?.studio_id;
    if (!detailOpen || !sid) {
      setStudioBookingInventory(null);
      return;
    }
    fetch(`/api/studios/${sid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStudioBookingInventory(d?.booking_inventory ?? null))
      .catch(() => setStudioBookingInventory(null));
  }, [detailOpen, detailData?.booking?.studio_id]);

  const requestBookingAction = (bookingId: string, action: "force_cancel" | "force_refund", bookingNumber: string) => {
    if (action === "force_cancel") {
      setConfirmAction({
        bookingId,
        action,
        label: "Cancel Booking",
        description: `Are you sure you want to force-cancel booking ${bookingNumber}? This will notify the customer and cannot be undone.`,
      });
    } else {
      setConfirmAction({
        bookingId,
        action,
        label: "Issue Refund & Cancel",
        description: `Are you sure you want to refund and cancel booking ${bookingNumber}? A refund record will be created and the booking will be cancelled.`,
      });
    }
  };

  const handleBookingAction = async (bookingId: string, action: string) => {
    setConfirmAction(null);
    setActionLoading(`${bookingId}-${action}`);
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setActionLoading(null);
    if (!res.ok) {
      setBookingFlash({ type: "error", message: (data as any).error || "Action failed" });
    } else {
      setBookingFlash({ type: "success", message: action === "force_cancel" ? "Booking cancelled" : "Refund initiated" });
    }
    fetchBookings();
    if (detailOpen && detailData?.booking?.id === bookingId) {
      openDetail(bookingId);
    }
  };

  const handleRescheduleAction = async (requestId: string, action: "approve" | "reject") => {
    setReviewLoading(true);
    await fetch(`/api/admin/reschedule/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote }),
    });
    setReviewLoading(false);
    setReviewModal(null);
    setAdminNote("");
    fetchReschedule();
  };

  const openDetail = async (bookingId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailSection("overview");
    setEditMode(false);
    setDetailData(null);
    setDetailError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`);
      const data = await res.json();
      if (!res.ok || !data.booking) {
        setDetailError(data.error || "Failed to load booking details.");
        setDetailLoading(false);
        return;
      }
      setDetailData(data as BookingDetail);
      setEditFields({
        status: data.booking.status || "",
        start_time: data.booking.start_time || "",
        end_time: data.booking.end_time || "",
        booking_date: data.booking.booking_date || "",
        notes: data.booking.notes || "",
        total_price: data.booking.total_price || "",
      });
    } catch (err) {
      setDetailError("Network error — could not load booking.");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveBookingEdit = async () => {
    if (!detailData) return;
    setDetailSaving(true);
    try {
      const res = await fetch(`/api/admin/bookings/${detailData.booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingFields: editFields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookingFlash({ type: "error", message: (data as { error?: string }).error || "Failed to save booking" });
        return;
      }
      setBookingFlash({ type: "success", message: "Booking updated successfully" });
      setEditMode(false);
      await openDetail(detailData.booking.id);
      fetchBookings();
    } finally {
      setDetailSaving(false);
    }
  };

  const openRescheduleModal = () => {
    if (!detailData) return;
    // Pre-fill with current booking date/time in IST.
    // Use formatSessionDateCalendarIST + isoToISTSlot (formatToParts-based) to avoid
    // the toLocaleString hour12:false bug that can produce "09:30 AM" or "24:00".
    const istDate = formatSessionDateCalendarIST(detailData.booking.start_time);
    const istTime = isoToISTSlot(detailData.booking.start_time); // always "HH:MM" (24h)
    setRescheduleDate(istDate);
    setRescheduleTime(istTime);
    setRescheduleError2(null);
    setRescheduleOpen(true);
  };

  const handleAdminReschedule = async () => {
    if (!detailData || !rescheduleDate || !rescheduleTime) return;
    setRescheduleLoading2(true);
    setRescheduleError2(null);
    try {
      const res = await fetch(`/api/admin/bookings/${detailData.booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", newDate: rescheduleDate, newTimeSlot: rescheduleTime }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRescheduleError2((data as any).error || "Failed to reschedule");
        return;
      }
      setRescheduleOpen(false);
      setBookingFlash({ type: "success", message: "Booking rescheduled successfully" });
      await openDetail(detailData.booking.id);
      fetchBookings();
    } catch {
      setRescheduleError2("Network error. Please try again.");
    } finally {
      setRescheduleLoading2(false);
    }
  };

  const DETAIL_SECTIONS = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "customer", label: "Customer", icon: User },
    { id: "studio", label: "Studio", icon: Building2 },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "addons", label: "Add-ons", icon: Package },
    { id: "guests", label: "Guests", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "bookings" ? "bg-[#18181b] text-white shadow" : "text-white/50 hover:text-white"}`}
        >
          Booking Control
        </button>
        <button
          onClick={() => setActiveTab("reschedule")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "reschedule" ? "bg-[#18181b] text-white shadow" : "text-white/50 hover:text-white"}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reschedule Requests
          {rescheduleTotal > 0 && rescheduleStatusFilter === "pending" && (
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">{rescheduleTotal}</span>
          )}
        </button>
      </div>

      {/* ── BOOKINGS TAB ── */}
      {activeTab === "bookings" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Booking Control</h2>
              <p className="text-white/40 text-sm">{bookingTotal.toLocaleString()} total bookings</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setStatusFilter(f); setBookingPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === f
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/50 hover:text-white border border-transparent"
                    }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => { setAddOpen(true); setAddError(null); loadStudiosForDropdown(); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D9FC67] text-black hover:bg-[#E8FF8A] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Booking
              </button>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setBookingPage(1); fetchBookings(); }} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking number..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors">Search</button>
          </form>

          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Booking</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Studio</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Session</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingLoading ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-white/40">No bookings found</td></tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white text-sm font-mono">{booking.booking_number || "—"}</p>
                          <p className="text-white/30 text-xs mt-0.5">{new Date(booking.created_at).toLocaleDateString("en-IN")}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/70 text-sm">{booking.user_name || booking.user_email}</p>
                          <p className="text-white/30 text-xs">{booking.user_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/70 text-sm">{booking.studio_name}</p>
                          <p className="text-white/30 text-xs">{booking.studio_city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/60 text-xs">
                            {booking.start_time ? fmt12h(booking.start_time) : "—"} – {booking.end_time ? fmt12h(booking.end_time) : "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium text-sm">₹{Number(booking.total_price).toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${statusColors[booking.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* View */}
                            <button
                              onClick={() => openDetail(booking.id)}
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Force Cancel */}
                            {booking.status !== "cancelled" && (
                              <button
                                onClick={() => requestBookingAction(booking.id, "force_cancel", booking.booking_number)}
                                disabled={!!actionLoading}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                                title="Cancel Booking"
                              >
                                {actionLoading === `${booking.id}-force_cancel`
                                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                                  : <Ban className="w-4 h-4" />}
                              </button>
                            )}
                            {/* Force Refund */}
                            {booking.status !== "cancelled" && (
                              <button
                                onClick={() => requestBookingAction(booking.id, "force_refund", booking.booking_number)}
                                disabled={!!actionLoading}
                                className="p-1.5 rounded-lg hover:bg-amber-500/10 text-white/40 hover:text-amber-400 transition-colors"
                                title="Refund & Cancel"
                              >
                                {actionLoading === `${booking.id}-force_refund`
                                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                                  : <RotateCcw className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {bookingTotal > 20 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-white/40 text-sm">Page {bookingPage} · {bookingTotal} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setBookingPage((p) => Math.max(1, p - 1))} disabled={bookingPage === 1} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
                  <button onClick={() => setBookingPage((p) => p + 1)} disabled={bookingPage * 20 >= bookingTotal} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── RESCHEDULE TAB ── */}
      {activeTab === "reschedule" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Reschedule Requests</h2>
              <p className="text-white/40 text-sm">{rescheduleTotal} requests</p>
            </div>
            <div className="flex gap-2">
              {["pending", "approved", "rejected", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setRescheduleStatusFilter(s); setReschedulePage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${rescheduleStatusFilter === s
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/50 hover:text-white border border-transparent"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Booking</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Requested By</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Old Time</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">New Time</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rescheduleLoading ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  ) : rescheduleRequests.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-white/40">No reschedule requests</td></tr>
                  ) : (
                    rescheduleRequests.map((req) => (
                      <tr key={req.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white text-sm font-mono">{req.booking_number}</p>
                          <p className="text-white/40 text-xs">{req.studio_name} · {req.studio_city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/70 text-xs truncate max-w-[140px]">{req.requested_by_email}</p>
                          <span className="px-1.5 py-0.5 bg-white/5 rounded text-white/30 text-xs capitalize">{req.requested_by_role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white/60 text-xs">{req.old_date || "—"}</p>
                          <p className="text-white/40 text-xs">{req.old_start_time ? `${fmt12h(req.old_start_time)} – ${fmt12h(req.old_end_time)}` : "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white text-xs font-medium">{req.new_date || "—"}</p>
                          <p className="text-white/60 text-xs">{req.new_start_time ? `${fmt12h(req.new_start_time)} – ${fmt12h(req.new_end_time)}` : "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border capitalize ${rescheduleStatusColors[req.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === "pending" && (
                            <button
                              onClick={() => { setReviewModal(req); setAdminNote(""); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Review
                            </button>
                          )}
                          {req.status !== "pending" && req.admin_note && (
                            <p className="text-white/30 text-xs max-w-[120px] truncate" title={req.admin_note}>Note: {req.admin_note}</p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {rescheduleTotal > 20 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-white/40 text-sm">Page {reschedulePage} · {rescheduleTotal} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setReschedulePage((p) => Math.max(1, p - 1))} disabled={reschedulePage === 1} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setReschedulePage((p) => p + 1)} disabled={reschedulePage * 20 >= rescheduleTotal} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CONFIRMATION DIALOG ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">{confirmAction.label}</h3>
            </div>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">{confirmAction.description}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBookingAction(confirmAction.bookingId, confirmAction.action)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING DETAIL DRAWER ── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDetailOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border-l border-white/5 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detailError ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-white/60 text-sm">{detailError}</p>
                <button onClick={() => setDetailOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors">
                  Close
                </button>
              </div>
            ) : detailData && (
              <>
                {bookingFlash && (
                  <div
                    className={`mx-6 mt-4 px-4 py-2 rounded-xl text-sm border ${bookingFlash.type === "success"
                        ? "border-[#D9FC67]/30 bg-[#D9FC67]/10 text-[#D9FC67]"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                      }`}
                  >
                    {bookingFlash.message}
                  </div>
                )}
                {/* Drawer header */}
                <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg font-mono">{detailData.booking.booking_number || "Booking Details"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[detailData.booking.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                        {detailData.booking.status}
                      </span>
                      <span className="text-white/30 text-xs">
                        Created {new Date(detailData.booking.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={saveBookingEdit}
                          disabled={detailSaving}
                          className="flex items-center gap-2 px-4 py-2 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-50"
                        >
                          {detailSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {detailData.booking.status !== "cancelled" && (
                          <button
                            onClick={openRescheduleModal}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-sm transition-colors"
                          >
                            <CalendarClock className="w-4 h-4" />
                            Reschedule
                          </button>
                        )}
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                      </>
                    )}
                    <button onClick={() => setDetailOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Section tabs */}
                <div className="px-6 py-3 border-b border-white/5 flex gap-1 overflow-x-auto">
                  {DETAIL_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDetailSection(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${detailSection === s.id
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Section content */}
                <div className="p-6 space-y-4">
                  {/* ── OVERVIEW ── */}
                  {detailSection === "overview" && (
                    <>
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium mb-3">Booking Information</h4>
                        <InfoRow label="Booking Number" value={detailData.booking.booking_number} mono />
                        {editMode ? (
                          <div className="py-2 border-b border-white/5">
                            <label className="text-white/40 text-sm block mb-1">Status</label>
                            <select
                              value={editFields.status}
                              onChange={(e) => setEditFields((f) => ({ ...f, status: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                            >
                              {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        ) : (
                          <InfoRow label="Status" value={
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[detailData.booking.status] || ""}`}>
                              {detailData.booking.status}
                            </span>
                          } />
                        )}
                        {editMode ? (
                          <InfoRow
                            label="Total Price"
                            value={
                              <input
                                type="number"
                                value={editFields.total_price}
                                onChange={(e) => setEditFields((f) => ({ ...f, total_price: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm w-32 text-right focus:outline-none"
                              />
                            }
                          />
                        ) : (
                          <>
                            {(() => {
                              const bn = parseAdminBookingNotes(detailData.booking.notes);
                              const sub = bn.subtotal != null ? Number(bn.subtotal) : NaN;
                              const disc =
                                Number(bn.discountAmount ?? bn.discount_amount ?? 0) ||
                                0;
                              const gst = bn.tax != null ? Number(bn.tax) : NaN;
                              const conv =
                                Number(bn.convenienceFee ?? bn.convenience_fee ?? 0) ||
                                0;
                              const coupon =
                                typeof bn.couponCode === "string"
                                  ? bn.couponCode
                                  : typeof bn.coupon_code === "string"
                                    ? bn.coupon_code
                                    : null;
                              const rows = [];
                              if (!isNaN(sub) && sub > 0) {
                                rows.push(
                                  <InfoRow
                                    key="subtotal"
                                    label="Subtotal (before discount)"
                                    value={`₹${sub.toLocaleString("en-IN")}`}
                                  />
                                );
                              }
                              if (disc > 0) {
                                rows.push(
                                  <InfoRow
                                    key="disc"
                                    label={`Coupon discount${coupon ? ` (${coupon})` : ""}`}
                                    value={`−₹${disc.toLocaleString("en-IN")}`}
                                  />
                                );
                              }
                              if (!isNaN(gst) && gst > 0) {
                                rows.push(
                                  <InfoRow
                                    key="gst"
                                    label="GST"
                                    value={`₹${gst.toLocaleString("en-IN")}`}
                                  />
                                );
                              }
                              if (conv > 0) {
                                rows.push(
                                  <InfoRow
                                    key="fee"
                                    label="Processing fee"
                                    value={`₹${conv.toLocaleString("en-IN")}`}
                                  />
                                );
                              }
                              return <>{rows}</>;
                            })()}
                            <InfoRow
                              label="Total charged"
                              value={`₹${Number(detailData.booking.total_price).toLocaleString("en-IN")}`}
                            />
                          </>
                        )}
                      </div>

                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Session Time
                        </h4>
                        {editMode ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-white/40 text-sm block mb-1">Date</label>
                              <input
                                type="date"
                                value={editFields.booking_date}
                                onChange={(e) => setEditFields((f) => ({ ...f, booking_date: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-white/40 text-sm block mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={editFields.start_time}
                                  onChange={(e) => setEditFields((f) => ({ ...f, start_time: e.target.value }))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                                />
                              </div>
                              <div>
                                <label className="text-white/40 text-sm block mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={editFields.end_time}
                                  onChange={(e) => setEditFields((f) => ({ ...f, end_time: e.target.value }))}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <InfoRow label="Date" value={fmtDateIST(detailData.booking.start_time || detailData.booking.created_at)} />
                            <InfoRow label="Time" value={`${fmt12h(detailData.booking.start_time)} – ${fmt12h(detailData.booking.end_time)}`} />
                            <InfoRow label="Duration" value={(() => {
                              if (!detailData.booking.start_time || !detailData.booking.end_time) return "—";
                              const hours = (new Date(detailData.booking.end_time).getTime() - new Date(detailData.booking.start_time).getTime()) / 3600000;
                              return `${hours} hour${hours !== 1 ? "s" : ""}`;
                            })()} />
                          </>
                        )}
                      </div>

                      {!editMode && (
                        <BookingActivityTimeline
                          createdAt={detailData.booking.created_at}
                          updatedAt={detailData.booking.updated_at}
                          startTime={detailData.booking.start_time}
                          endTime={detailData.booking.end_time}
                          status={detailData.booking.status}
                          cancelledAt={detailData.booking.cancelled_at}
                          cancellationReason={detailData.booking.cancellation_reason}
                          paymentRecorded={(() => {
                            const bn = parseAdminBookingNotes(detailData.booking.notes);
                            const pid = bn.paymentId;
                            const hasPid = Boolean(pid && String(pid).length > 0);
                            return hasPid || (detailData.payments?.length ?? 0) > 0;
                          })()}
                        />
                      )}

                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium mb-3">Notes</h4>
                        {editMode ? (
                          <textarea
                            value={editFields.notes}
                            onChange={(e) => setEditFields((f) => ({ ...f, notes: e.target.value }))}
                            rows={3}
                            placeholder="Add admin notes..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
                          />
                        ) : (
                          <p className="text-white/60 text-sm">{detailData.booking.notes || "No notes"}</p>
                        )}
                      </div>

                      {detailData.booking.cancellation_reason && (
                        <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                          <h4 className="text-red-400 text-xs uppercase tracking-wider font-medium mb-2">Cancellation</h4>
                          <p className="text-white/60 text-sm">{detailData.booking.cancellation_reason}</p>
                          {detailData.booking.cancelled_at && (
                            <p className="text-white/30 text-xs mt-1">
                              Cancelled on {new Date(detailData.booking.cancelled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── CUSTOMER ── */}
                  {detailSection === "customer" && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-4 mb-4">
                        {detailData.booking.user_avatar ? (
                          <img src={detailData.booking.user_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <User className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{detailData.booking.user_name || "Unknown"}</p>
                          <p className="text-white/40 text-sm">{detailData.booking.user_email}</p>
                        </div>
                      </div>
                      <InfoRow label="Email" value={detailData.booking.user_email} />
                      <InfoRow label="Phone" value={detailData.booking.user_phone} />
                      <InfoRow label="User ID" value={detailData.booking.user_id} mono />
                    </div>
                  )}

                  {/* ── STUDIO ── */}
                  {detailSection === "studio" && (
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white/20" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{detailData.booking.studio_name}</p>
                          <p className="text-white/40 text-xs">{detailData.booking.studio_city}</p>
                        </div>
                      </div>
                      <InfoRow label="Studio Name" value={detailData.booking.studio_name} />
                      <InfoRow label="Address" value={detailData.booking.studio_address} />
                      <InfoRow label="City" value={detailData.booking.studio_city} />
                      <InfoRow label="Rate" value={`₹${detailData.booking.studio_price_per_hour}/hr`} />
                      <InfoRow label="Studio ID" value={detailData.booking.studio_id} mono />
                      <div className="border-t border-white/5 mt-3 pt-3">
                        <h4 className="text-white/40 text-xs uppercase tracking-wider mb-2">Owner</h4>
                        <InfoRow label="Name" value={detailData.booking.studio_owner_name} />
                        <InfoRow label="Email" value={detailData.booking.studio_owner_email} />
                      </div>
                      <StudioBookingInventoryPanel
                        className="mt-4 pt-4 border-t border-white/5"
                        inventory={studioBookingInventory}
                        selectedAddOns={
                          (detailData.addons || []).map(
                            (a: any, idx: number): AddOnService => ({
                              id: String(a.id ?? a.platform_addon_id ?? `addon-${idx}`),
                              name: a.addon_name || "Add-on",
                              description: "",
                              price:
                                Number(a.addon_price || 0) * Number(a.quantity ?? 1),
                              category: a.category,
                            })
                          )
                        }
                        title="Equipment, services & add-ons"
                      />
                    </div>
                  )}

                  {/* ── PAYMENT ── */}
                  {detailSection === "payment" && (
                    <>
                      {detailData.payments.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">No payment records</p>
                        </div>
                      ) : (
                        detailData.payments.map((payment: any) => (
                          <div key={payment.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium">Payment</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${payment.status === "succeeded" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                  payment.status === "refunded" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    "bg-white/5 text-white/40 border-white/10"
                                }`}>
                                {payment.status}
                              </span>
                            </div>
                            <InfoRow label="Amount" value={`₹${Number(payment.amount).toLocaleString("en-IN")}`} />
                            <InfoRow label="Provider" value={payment.provider || "razorpay"} />
                            <InfoRow label="Payment ID" value={payment.provider_payment_id} mono />
                            <InfoRow label="Order ID" value={payment.provider_order_id} mono />
                            <InfoRow label="Date" value={new Date(payment.created_at).toLocaleString("en-IN")} />
                          </div>
                        ))
                      )}

                      {/* Refunds */}
                      {detailData.refunds.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium">Refunds</h4>
                          {detailData.refunds.map((refund: any) => (
                            <div key={refund.id} className="bg-orange-500/5 rounded-xl p-4 border border-orange-500/10">
                              <InfoRow label="Amount" value={`₹${Number(refund.amount).toLocaleString("en-IN")}`} />
                              <InfoRow label="Status" value={refund.status} />
                              <InfoRow label="Reason" value={refund.reason} />
                              <InfoRow label="Date" value={new Date(refund.created_at).toLocaleString("en-IN")} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── ADD-ONS ── */}
                  {detailSection === "addons" && (
                    <>
                      {detailData.addons.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">No add-ons for this booking</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {detailData.addons.map((addon: any, idx: number) => (
                            <div key={addon.id || idx} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                              <div>
                                <p className="text-white text-sm font-medium">{addon.addon_name}</p>
                                {addon.quantity > 1 && <p className="text-white/40 text-xs">Qty: {addon.quantity}</p>}
                              </div>
                              <span className="text-white font-medium text-sm">₹{Number(addon.addon_price * (addon.quantity || 1)).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                          <div className="flex justify-between px-4 py-2 border-t border-white/5">
                            <span className="text-white/40 text-sm">Total Add-ons</span>
                            <span className="text-white font-medium text-sm">
                              ₹{detailData.addons.reduce((sum: number, a: any) => sum + Number(a.addon_price) * (a.quantity || 1), 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── GUESTS ── */}
                  {detailSection === "guests" && (
                    <>
                      {detailData.guests.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">No guests added for this booking</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {detailData.guests.map((guest: any, idx: number) => (
                            <div key={guest.id || idx} className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                              <p className="text-white text-sm font-medium">{guest.name || `Guest ${idx + 1}`}</p>
                              {guest.email && <p className="text-white/40 text-xs">{guest.email}</p>}
                              {guest.phone && <p className="text-white/30 text-xs">{guest.phone}</p>}
                            </div>
                          ))}
                          <p className="text-white/40 text-xs px-4">{detailData.guests.length} guest{detailData.guests.length !== 1 ? "s" : ""} total</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Admin Reschedule Modal ── */}
      {rescheduleOpen && detailData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRescheduleOpen(false)} />
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarClock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Reschedule Booking</h3>
                <p className="text-white/40 text-xs font-mono">{detailData.booking.booking_number}</p>
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-xl p-3 mb-4 text-sm">
              <p className="text-white/40 text-xs mb-1">Current session</p>
              <p className="text-white">{fmtDateIST(detailData.booking.start_time)}</p>
              <p className="text-white/60">{fmt12h(detailData.booking.start_time)} – {fmt12h(detailData.booking.end_time)}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">New Start Time (IST)</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {rescheduleError2 && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                {rescheduleError2}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRescheduleOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminReschedule}
                disabled={rescheduleLoading2 || !rescheduleDate || !rescheduleTime}
                className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduleLoading2 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Reschedule Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-white font-semibold">Review Reschedule Request</h3>
              <button onClick={() => setReviewModal(null)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Booking</span>
                  <span className="text-white font-mono">{reviewModal.booking_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Studio</span>
                  <span className="text-white">{reviewModal.studio_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Requested by</span>
                  <span className="text-white/70 text-xs">{reviewModal.requested_by_email}</span>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/40">From</span>
                    <span className="text-white/60">{reviewModal.old_date} · {fmt12h(reviewModal.old_start_time)}–{fmt12h(reviewModal.old_end_time)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">To</span>
                    <span className="text-[#D9FC67]">{reviewModal.new_date} · {fmt12h(reviewModal.new_start_time)}–{fmt12h(reviewModal.new_end_time)}</span>
                  </div>
                </div>
                {reviewModal.reason && (
                  <div className="border-t border-white/5 pt-2">
                    <p className="text-white/40 text-xs">Reason: <span className="text-white/60">{reviewModal.reason}</span></p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Admin Note (optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
                  placeholder="Add a note for the user..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRescheduleAction(reviewModal.id, "reject")}
                  disabled={reviewLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {reviewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  onClick={() => handleRescheduleAction(reviewModal.id, "approve")}
                  disabled={reviewLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {reviewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h3 className="text-white font-semibold text-lg">Add New Booking</h3>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBooking} className="p-6 space-y-4">
              {addError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{addError}</div>
              )}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">User Email *</label>
                <input required type="email" value={addFields.user_email} onChange={(e) => setAddFields(f => ({ ...f, user_email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Studio *</label>
                <input
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  placeholder="Search studio by name/city..."
                  className="w-full mb-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                />
                <select required value={addFields.studio_id} onChange={(e) => setAddFields(f => ({ ...f, studio_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 appearance-none">
                  <option value="" className="bg-[#18181b]">Select a studio...</option>
                  {studioList
                    .filter((s: any) => {
                      const q = studioSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${s.name || ""} ${s.city || ""}`.toLowerCase().includes(q);
                    })
                    .map((s: any) => (
                      <option key={s.id} value={s.id} className="bg-[#18181b]">
                        {s.name} — {s.city}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Date *</label>
                <input required type="date" value={addFields.date} onChange={(e) => setAddFields(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Start Time *</label>
                  <input required type="time" value={addFields.start_time} onChange={(e) => setAddFields(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">End Time *</label>
                  <input required type="time" value={addFields.end_time} onChange={(e) => setAddFields(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Status</label>
                  <select value={addFields.status} onChange={(e) => setAddFields(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 appearance-none">
                    {["confirmed", "pending", "completed", "cancelled"].map(s => (
                      <option key={s} value={s} className="bg-[#18181b] capitalize">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Total Price (₹)</label>
                  <input type="number" min="0" value={addFields.total_price} onChange={(e) => setAddFields(f => ({ ...f, total_price: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" placeholder="Auto-calculated" />
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Notes</label>
                <textarea rows={2} value={addFields.notes} onChange={(e) => setAddFields(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 resize-none" placeholder="Admin note (optional)" />
              </div>
              <p className="text-white/30 text-xs">Price is auto-calculated from studio rate × hours if left blank. Booking number will be prefixed with ADM-.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={addSaving}
                  className="flex-1 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                  {addSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
