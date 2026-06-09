"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PartnerBookingsCalendar } from "@/components/partner/PartnerBookingsCalendar";
import { isPartnerStudioVisibleActive } from "@/lib/partner-studio-status";

interface Studio {
  id: string;
  name: string;
  images: string[];
  city: string;
  price_per_hour: number;
  status: "active" | "inactive";
  review_status?: string;
}

interface Booking {
  id: string;
  dbId: string;
  studioId?: string;
  studio: { id?: string; name: string; city?: string; address?: string };
  customer: { name: string; email: string; phone?: string };
  date: string;
  endDate: string;
  createdAt?: string;
  timeSlot: string;
  duration: number;
  participants?: number | null;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "rescheduled";
  package: { name: string; pricePerHour?: number } | null;
  addOns?: { name: string; price: number; qty?: number }[];
  bookingNote?: string | null;
  paymentId?: string;
  pricing?: {
    subtotalBeforeDiscount?: number;
    discountAmount?: number;
    couponCode?: string | null;
    gst?: number;
    convenienceFee?: number;
    total?: number;
  };
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  switch (status) {
    case "confirmed":
      return (
        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" /> Confirmed
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
          <AlertCircle className="w-3 h-3" /> Pending
        </span>
      );
    case "cancelled":
      return (
        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    case "rescheduled":
      return (
        <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">
          <Calendar className="w-3 h-3" /> Rescheduled
        </span>
      );
  }
}

export default function PartnerDashboardOverview() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/studios").then((r) => r.json()),
      fetch("/api/partner/bookings").then((r) => r.json()),
    ])
      .then(([sd, bd]) => {
        setStudios(sd.studios || []);
        setBookings(bd.bookings || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.date) >= now && (b.status === "confirmed" || b.status === "pending")
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const activeStudios = studios.filter(isPartnerStudioVisibleActive).length;

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
      change: `${upcomingBookings.length} upcoming`,
      changeType: "neutral" as const,
      color: "text-[#D9FC67]",
      bgColor: "bg-[#D9FC67]/10",
    },
    {
      label: "Active Studios",
      value: activeStudios,
      icon: Building2,
      change: `${studios.length} total`,
      changeType: "neutral" as const,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: `${completedBookings.length} sessions`,
      changeType: "positive" as const,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Pending Earnings",
      value: `₹${pendingRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: `${upcomingBookings.length} bookings`,
      changeType: "neutral" as const,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar — full width, IST time grid */}
      <PartnerBookingsCalendar
        bookings={bookings.map((b) => ({
          id: b.id,
          dbId: b.dbId,
          date: b.date,
          endDate: b.endDate,
          studioId: b.studioId,
          studio: b.studio,
          customer: b.customer,
          status: b.status,
          package: b.package ? { name: b.package.name, pricePerHour: b.package.pricePerHour } : null,
          addOns: b.addOns || [],
          participants: b.participants,
          duration: b.duration,
          createdAt: b.createdAt,
          bookingNote: b.bookingNote,
          paymentId: b.paymentId,
          pricing: b.pricing,
          totalPrice: b.totalPrice,
        }))}
        studios={studios.map((s) => ({ id: s.id, name: s.name }))}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span
                className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  stat.changeType === "positive" ? "text-green-400" : "text-white/40"
                )}
              >
                {stat.changeType === "positive" && <ArrowUpRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-white/40 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming sessions */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Upcoming Sessions</h2>
            <Link href="/partner/bookings" className="flex items-center gap-1 text-sm font-medium text-[#D9FC67] hover:text-[#E8FF8A] hover:bg-[#D9FC67]/10 px-3 py-1.5 rounded-lg transition-colors">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D9FC67]/20 to-[#B8E050]/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[#D9FC67]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{booking.studio.name}</p>
                    <p className="text-white/40 text-sm">{booking.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">
                      {new Date(booking.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-white/40 text-xs">
                      {booking.timeSlot} • {booking.duration}h
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No upcoming sessions</p>
              <Link href="/partner/studios/create">
                <Button variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">
                  Add a Studio
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/partner/studios/create" className="w-full flex items-center gap-3 p-4 bg-[#D9FC67]/10 hover:bg-[#D9FC67]/20 rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-[#D9FC67]/20">
                <Building2 className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white font-medium">Add New Studio</p>
                <p className="text-white/40 text-xs">List your podcast space</p>
              </div>
            </Link>
            <Link href="/partner/policies" className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/[0.07] rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-white/10">
                <Clock className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="text-white font-medium">Set Policies</p>
                <p className="text-white/40 text-xs">Configure cancellation rules</p>
              </div>
            </Link>
            <Link href="/partner/earnings" className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/[0.07] rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-white/10">
                <DollarSign className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="text-white font-medium">View Earnings</p>
                <p className="text-white/40 text-xs">Track your revenue</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Studios */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Your Studios</h2>
            <Link href="/partner/studios" className="flex items-center gap-1 text-sm font-medium text-[#D9FC67] hover:text-[#E8FF8A] hover:bg-[#D9FC67]/10 px-3 py-1.5 rounded-lg transition-colors">
              Manage <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {studios.length > 0 ? (
            <div className="space-y-3">
              {studios.slice(0, 4).map((studio) => (
                <div key={studio.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  {studio.images?.[0] ? (
                    <img
                      src={studio.images[0]}
                      alt={studio.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{studio.name}</p>
                    <p className="text-white/40 text-sm">{studio.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D9FC67] font-semibold">₹{studio.price_per_hour}/hr</p>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        studio.status === "active"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-white/10 text-white/40"
                      )}
                    >
                      {studio.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No studios yet</p>
              <Link href="/partner/studios/create">
                <Button className="mt-4 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">
                  Add Your First Studio
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      booking.status === "completed"
                        ? "bg-green-400/10"
                        : booking.status === "confirmed"
                        ? "bg-[#D9FC67]/10"
                        : "bg-white/5"
                    )}
                  >
                    {booking.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : booking.status === "confirmed" ? (
                      <Calendar className="w-4 h-4 text-[#D9FC67]" />
                    ) : (
                      <Clock className="w-4 h-4 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{booking.customer.name}</span>{" "}
                      {booking.status === "completed"
                        ? "completed"
                        : booking.status === "confirmed"
                        ? "booked"
                        : booking.status === "cancelled"
                        ? "cancelled"
                        : "requested"}{" "}
                      <span className="text-[#D9FC67]">{booking.studio.name}</span>
                    </p>
                    <p className="text-white/30 text-xs">
                      {new Date(booking.date).toLocaleDateString()} • ₹
                      {booking.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No bookings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
