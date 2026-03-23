"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle,
  Clock,
  Wallet,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  studio: { name: string };
  customer: { name: string };
  date: string;
  duration: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
}

interface Studio {
  id: string;
  name: string;
}

export default function PartnerEarningsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/bookings").then((r) => r.json()),
      fetch("/api/partner/studios").then((r) => r.json()),
    ])
      .then(([bd, sd]) => {
        setBookings(bd.bookings || []);
        setStudios(sd.studios || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filterDate = new Date();
  if (timeFilter === "week") filterDate.setDate(now.getDate() - 7);
  else if (timeFilter === "month") filterDate.setMonth(now.getMonth() - 1);
  else filterDate.setFullYear(now.getFullYear() - 1);

  const filteredBookings = bookings.filter((b) => new Date(b.date) >= filterDate);
  // Count both confirmed (paid, running) and completed bookings as earned revenue
  const earnedBookings = filteredBookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const completedBookings = filteredBookings.filter((b) => b.status === "completed");
  const confirmedBookings = filteredBookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled");

  const totalRevenue = earnedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  // Pending earnings = confirmed sessions not yet marked complete
  const pendingEarnings = confirmedBookings.reduce((sum, b) => {
    const endTime = new Date(b.date).getTime() + (b.duration || 1) * 3600000;
    return endTime > Date.now() ? sum + b.totalPrice : sum;
  }, 0);
  const platformFee = totalRevenue * 0.1;
  const netEarnings = totalRevenue - platformFee;

  const stats: { label: string; value: string; icon: typeof DollarSign; change: string; changeType: "positive" | "neutral"; color: string; bgColor: string }[] = [
    {
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+12%",
      changeType: "positive",
      color: "text-[#D9FC67]",
      bgColor: "bg-[#D9FC67]/10",
    },
    {
      label: "Pending Earnings",
      value: `₹${pendingEarnings.toLocaleString()}`,
      icon: Clock,
      change: `${confirmedBookings.length} bookings`,
      changeType: "neutral",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      label: "Net Earnings",
      value: `₹${netEarnings.toLocaleString()}`,
      icon: Wallet,
      change: "After 10% platform fee",
      changeType: "neutral",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Completed Sessions",
      value: completedBookings.length.toString(),
      icon: CheckCircle,
      change: `${cancelledBookings.length} cancelled`,
      changeType: "neutral",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
  ];

  const recentTransactions = [...completedBookings, ...confirmedBookings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const studioPerformance = studios.map((studio) => {
    const studioBookings = filteredBookings.filter((b) => b.studio.name === studio.name && b.status === "completed");
    const revenue = studioBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    return { ...studio, bookings: studioBookings.length, revenue };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Earnings</h2>
          <p className="text-white/40">Track your revenue and payments</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                timeFilter === filter
                  ? "bg-[#D9FC67] text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className={cn("text-xs font-medium", stat.changeType === "positive" ? "text-green-400" : "text-white/40")}>
                {stat.changeType === "positive" && <ArrowUpRight className="w-3 h-3 inline" />}
                {" "}{stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-white/40 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", booking.status === "completed" ? "bg-green-400/10" : "bg-yellow-400/10")}>
                      {booking.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{booking.id}</p>
                      <p className="text-white/40 text-sm">{booking.studio.name} • {booking.customer.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold", booking.status === "completed" ? "text-green-400" : "text-yellow-400")}>
                      {booking.status === "completed" ? "+" : ""}₹{booking.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-white/40 text-xs">{new Date(booking.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Studio Performance</h3>
          <div className="space-y-3">
            {studioPerformance.length > 0 ? (
              studioPerformance.map((studio) => (
                <div key={studio.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#D9FC67]/10">
                      <Building2 className="w-5 h-5 text-[#D9FC67]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{studio.name}</p>
                      <p className="text-white/40 text-sm">{studio.bookings} sessions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D9FC67] font-semibold">₹{studio.revenue.toLocaleString()}</p>
                    <p className="text-white/40 text-xs">revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No studios yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/60 text-sm mb-2">Gross Revenue</p>
            <p className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/60 text-sm mb-2">Platform Fee (10%)</p>
            <p className="text-2xl font-bold text-red-400">-₹{platformFee.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[#D9FC67]/10 rounded-xl border border-[#D9FC67]/20">
            <p className="text-[#D9FC67]/60 text-sm mb-2">Net Earnings</p>
            <p className="text-2xl font-bold text-[#D9FC67]">₹{netEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
