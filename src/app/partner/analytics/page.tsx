"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Users, Building2, Calendar, DollarSign,
  Clock, XCircle, BarChart3, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    netEarnings: number;
    pendingPayout: number;
    totalBookings: number;
    cancelledCount: number;
    cancellationRate: number;
    totalClients: number;
    newClients: number;
    repeatClients: number;
  };
  studioPerformance: { id: string; name: string; city: string; bookings: number; revenue: number; hours: number }[];
  dailyChart: { date: string; bookings: number; revenue: number }[];
  peakHours: { hour: number; label: string; bookings: number }[];
  topClients: { id: string; client_name: string; client_email: string; total_bookings: number; total_spent: number }[];
}

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

export default function PartnerAnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/partner/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, studioPerformance, dailyChart, peakHours, topClients } = data;

  // Find max for bar chart normalization
  const maxDailyRevenue = Math.max(...dailyChart.map((d) => d.revenue), 1);
  const maxPeakBookings = Math.max(...peakHours.map((h) => h.bookings), 1);

  const summaryCards = [
    { label: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-[#D9FC67]", bg: "bg-[#D9FC67]/10", change: "" },
    { label: "Net Earnings", value: `₹${summary.netEarnings.toLocaleString()}`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10", change: "" },
    { label: "Total Bookings", value: summary.totalBookings, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10", change: `${summary.cancelledCount} cancelled` },
    { label: "Cancellation Rate", value: `${summary.cancellationRate}%`, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", change: "" },
    { label: "Total Clients", value: summary.totalClients, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10", change: `${summary.newClients} new` },
    { label: "Repeat Clients", value: summary.repeatClients, icon: ArrowUpRight, color: "text-yellow-400", bg: "bg-yellow-400/10", change: "" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-white/40">Business performance insights</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                period === p.value ? "bg-[#D9FC67] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-[#141414] border border-white/5 rounded-xl p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", card.bg)}>
              <card.icon className={cn("w-4 h-4", card.color)} />
            </div>
            <p className="text-white/40 text-xs mb-1">{card.label}</p>
            <p className={cn("text-lg font-bold", card.color)}>{card.value}</p>
            {card.change && <p className="text-white/30 text-xs mt-0.5">{card.change}</p>}
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Daily Revenue</h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[#D9FC67]">
              <span className="w-2 h-2 rounded-full bg-[#D9FC67]" />Revenue
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-2 h-2 rounded-full bg-white/20" />Bookings
            </span>
          </div>
        </div>
        {dailyChart.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">No data for this period</p>
        ) : (
          <div className="relative h-40 flex items-end gap-0.5 overflow-x-auto">
            {dailyChart.slice(-30).map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-[12px] group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 left-1/2 -translate-x-1/2">
                  <p className="font-semibold">₹{day.revenue.toLocaleString()}</p>
                  <p className="text-white/40">{day.bookings} booking{day.bookings !== 1 ? "s" : ""}</p>
                  <p className="text-white/30">{new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(2, (day.revenue / maxDailyRevenue) * 140)}px`,
                    background: day.revenue > 0
                      ? `linear-gradient(to top, #D9FC67, #B8E050)`
                      : "rgba(255,255,255,0.05)",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Studio Performance */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Studio Performance</h3>
          {studioPerformance.length === 0 ? (
            <p className="text-white/30 text-sm">No studio data available</p>
          ) : (
            <div className="space-y-3">
              {studioPerformance.map((studio, i) => (
                <div key={studio.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs w-4">{i + 1}</span>
                      <div>
                        <p className="text-white font-medium">{studio.name}</p>
                        <p className="text-white/40 text-xs">{studio.city} · {studio.bookings} bookings · {studio.hours.toFixed(1)}h</p>
                      </div>
                    </div>
                    <span className="text-[#D9FC67] font-semibold">₹{studio.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D9FC67] to-[#B8E050] transition-all"
                      style={{ width: `${(studio.revenue / (studioPerformance[0]?.revenue || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Peak Booking Hours</h3>
          <div className="grid grid-cols-8 gap-1 h-28 items-end">
            {peakHours.map((h) => (
              <div key={h.hour} className="flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-full mb-1 bg-[#1a1a1a] border border-white/10 rounded px-1.5 py-1 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 left-1/2 -translate-x-1/2">
                  <p className="text-white font-medium">{h.label}</p>
                  <p className="text-white/40">{h.bookings}</p>
                </div>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(2, (h.bookings / maxPeakBookings) * 96)}px`,
                    background: h.bookings > 0 ? "rgba(217, 252, 103, 0.6)" : "rgba(255,255,255,0.05)",
                  }}
                />
                <span className="text-white/20 text-[9px]">{h.hour}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Top Clients by Revenue</h3>
          {topClients.length === 0 ? (
            <p className="text-white/30 text-sm">No client data yet</p>
          ) : (
            <div className="space-y-2">
              {topClients.map((client, i) => (
                <div key={client.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <span className="text-white/30 text-xs w-5 text-center font-medium">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#D9FC67] text-sm font-semibold">
                      {client.client_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{client.client_name}</p>
                    <p className="text-white/40 text-xs truncate">{client.client_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D9FC67] font-semibold text-sm">₹{(client.total_spent || 0).toLocaleString()}</p>
                    <p className="text-white/40 text-xs">{client.total_bookings} booking{client.total_bookings !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
