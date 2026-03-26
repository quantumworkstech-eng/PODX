"use client";

import { useMemo } from "react";
import { Calendar, Clock, ArrowRight, TrendingUp, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContinueBookingCard } from "./ContinueBookingCard";
import {
  PartnerBookingsCalendar,
  type PartnerCalendarBooking,
} from "@/components/partner/PartnerBookingsCalendar";

export interface BookingData {
  id: string;
  dbId?: string;
  studioId?: string;
  date: string;
  /** ISO end time from API (for calendar) */
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
  addOns: { id: string; name: string; price: number }[];
  totalPrice: number;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  paymentId: string;
  createdAt: string;
}

interface DashboardOverviewProps {
  upcomingBookings: BookingData[];
  pastBookings: BookingData[];
  onNavigate: (section: string) => void;
  unreviewedCount?: number;
}

function toCalendarBooking(b: BookingData): PartnerCalendarBooking {
  const end =
    b.endDate ||
    new Date(new Date(b.date).getTime() + (b.duration || 1) * 3600000).toISOString();
  return {
    id: b.id,
    dbId: b.dbId,
    date: b.date,
    endDate: end,
    studioId: b.studioId || b.studio.id,
    studio: {
      id: b.studio.id,
      name: b.studio.name,
      city: b.studio.location.city,
    },
    customer: { name: "You" },
    status: b.status,
    package: b.package ? { name: b.package.name } : null,
    totalPrice: b.totalPrice,
  };
}

export function DashboardOverview({ upcomingBookings, pastBookings, onNavigate, unreviewedCount = 0 }: DashboardOverviewProps) {
  const totalSpent = pastBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const confirmedBookings = upcomingBookings.filter((b) => b.status === "confirmed").length;

  const calendarBookings = useMemo(() => {
    const map = new Map<string, BookingData>();
    for (const b of upcomingBookings) map.set(b.id, b);
    for (const b of pastBookings) map.set(b.id, b);
    return [...map.values()].map(toCalendarBooking);
  }, [upcomingBookings, pastBookings]);

  return (
    <div className="space-y-8">
      <ContinueBookingCard />

      <PartnerBookingsCalendar
        bookings={calendarBookings}
        audience="client"
        onNavigateUpcoming={() => onNavigate("upcoming")}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#D9FC67]" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-white/50 text-sm mb-1">Upcoming Sessions</p>
          <p className="text-3xl font-bold text-white">{upcomingBookings.length}</p>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Completed Sessions</p>
          <p className="text-3xl font-bold text-white">{pastBookings.length}</p>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-white">₹{totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Confirmed Bookings</p>
          <p className="text-3xl font-bold text-white">{confirmedBookings}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Upcoming Sessions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("upcoming")}
              className="text-[#D9FC67] hover:text-[#D9FC67] hover:bg-[#D9FC67]/10"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No upcoming sessions</p>
              <Button
                onClick={() => (window.location.href = "/book")}
                className="mt-4 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black"
              >
                Book a Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{booking.studio.name}</p>
                    <p className="text-white/40 text-sm">
                      {new Date(booking.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • {booking.timeSlot}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>

          {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.slice(0, 2).map((b) => (
                <div key={b.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Booking confirmed</p>
                    <p className="text-white/40 text-xs mt-1">
                      {b.studio.name} • {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))}
              {pastBookings.slice(0, 2).map((b) => (
                <div key={b.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Session completed</p>
                    <p className="text-white/40 text-xs mt-1">
                      {b.studio.name} • ₹{b.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#D9FC67]/10 to-[#B8E050]/10 rounded-2xl border border-[#D9FC67]/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Ready to record?</h3>
            <p className="text-white/60">Book your next podcast session at a premium studio near you.</p>
          </div>
          <Button
            onClick={() => (window.location.href = "/book")}
            className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book New Session
          </Button>
        </div>
      </div>
    </div>
  );
}
