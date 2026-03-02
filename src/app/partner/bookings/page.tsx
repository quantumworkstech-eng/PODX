"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Eye,
  CalendarPlus,
  X,
  DollarSign,
  User,
  Building2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  dbId?: string;
  studio: { name: string };
  customer: { name: string; email: string; phone?: string };
  date: string;
  timeSlot: string;
  duration: number;
  packageName?: string;
  addOns?: string[];
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "completed" | "cancelled">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    fetch("/api/partner/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, []);

  const updateBookingStatus = async (dbId: string | undefined, status: Booking["status"], localId: string) => {
    if (dbId) {
      await fetch("/api/partner/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingDbId: dbId, status }),
      }).catch(console.error);
    }
    setBookings((prev) => prev.map((b) => (b.id === localId ? { ...b, status } : b)));
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case "pending":
        return <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Pending</span>;
      case "cancelled":
        return <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case "completed":
        return <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Completed</span>;
    }
  };

  const handleApprove = (booking: Booking) => {
    updateBookingStatus(booking.dbId, "confirmed", booking.id);
  };

  const handleReject = (booking: Booking) => {
    updateBookingStatus(booking.dbId, "cancelled", booking.id);
  };

  const handleCancel = () => {
    if (!selectedBooking) return;
    updateBookingStatus(selectedBooking.dbId, "cancelled", selectedBooking.id);
    setShowCancelModal(false);
    setSelectedBooking(null);
  };

  const handleReschedule = () => {
    if (!selectedBooking || !newDate || !newTime) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, date: new Date(newDate).toISOString(), timeSlot: newTime } : b
      )
    );
    setShowRescheduleModal(false);
    setSelectedBooking(null);
    setNewDate("");
    setNewTime("");
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const openRescheduleModal = (booking: Booking) => {
    setSelectedBooking(booking);
    const bookingDate = new Date(booking.date);
    setNewDate(bookingDate.toISOString().split("T")[0]);
    setNewTime(bookingDate.toTimeString().slice(0, 5));
    setShowRescheduleModal(true);
  };

  const openDetailModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Bookings</h2>
          <p className="text-white/40">Manage customer bookings for your studios</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["all", "confirmed", "pending", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === f
                ? "bg-[#D9FC67] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isFetching && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-white/40 text-sm font-medium">Booking ID</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Studio</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Customer</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Date & Time</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Duration</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Total</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Status</th>
                <th className="text-left p-4 text-white/40 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <span className="text-white font-medium text-sm">{booking.id}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#D9FC67]" />
                      <span className="text-white text-sm">{booking.studio.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white text-sm">{booking.customer.name}</p>
                      <p className="text-white/40 text-xs">{booking.customer.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white text-sm">{new Date(booking.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="text-white/40 text-xs">{booking.timeSlot}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Clock className="w-4 h-4" />
                      {booking.duration}h
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[#D9FC67] font-semibold">₹{booking.totalPrice.toLocaleString()}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(booking.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDetailModal(booking)} className="text-white/60 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {booking.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(booking)} className="text-green-400 hover:text-green-300">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(booking)} className="text-red-400 hover:text-red-300">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openRescheduleModal(booking)} className="text-yellow-400 hover:text-yellow-300">
                            <CalendarPlus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openCancelModal(booking)} className="text-red-400 hover:text-red-300">
                            <XCircle className="w-4 h-4" />
                          </Button>
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
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No bookings found</p>
          </div>
        )}
      </div>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-[#141414] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Booking ID</span>
                <span className="text-white font-medium">{selectedBooking.id}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Studio</span>
                <span className="text-white">{selectedBooking.studio.name}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Customer</span>
                <div className="text-right">
                  <p className="text-white">{selectedBooking.customer.name}</p>
                  <p className="text-white/40 text-xs">{selectedBooking.customer.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Date & Time</span>
                <span className="text-white">
                  {new Date(selectedBooking.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at {selectedBooking.timeSlot}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Duration</span>
                <span className="text-white">{selectedBooking.duration} hours</span>
              </div>
              {selectedBooking.packageName && (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <span className="text-white/60">Package</span>
                  <span className="text-white">{selectedBooking.packageName}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-[#D9FC67]/10 rounded-xl">
                <span className="text-white/60">Total Amount</span>
                <span className="text-[#D9FC67] font-bold text-lg">₹{selectedBooking.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-white/60">Status</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <p className="text-white/60">Are you sure you want to cancel this booking?</p>
              <div className="p-4 bg-white/5 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Booking</span>
                  <span className="text-white">{selectedBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Customer</span>
                  <span className="text-white">{selectedBooking.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Studio</span>
                  <span className="text-white">{selectedBooking.studio.name}</span>
                </div>
              </div>
              <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  Cancellation notice: booking will be marked as cancelled.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="border-white/10 text-white hover:bg-white/5">Close</Button>
            <Button onClick={handleCancel} className="bg-red-500 hover:bg-red-600 text-white">Cancel Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Reschedule Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Current Date</span>
                  <span className="text-white">{new Date(selectedBooking.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Current Time</span>
                  <span className="text-white">{selectedBooking.timeSlot}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">New Date</label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">New Time</label>
                  <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  The customer will be notified of the updated schedule.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="border-white/10 text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleReschedule} disabled={!newDate || !newTime} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
