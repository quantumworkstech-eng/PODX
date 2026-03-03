"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Building2, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-white text-sm font-medium">
          {p.dataKey === "revenue" ? `₹${p.value.toLocaleString("en-IN")}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Platform Analytics</h2>
        <p className="text-white/40 text-sm">Last 12 months performance overview</p>
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Revenue Chart</h3>
            <p className="text-white/40 text-xs">Monthly revenue (₹)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data?.revenueChart || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Trends */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#D9FC67]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Booking Trends</h3>
            <p className="text-white/40 text-xs">Monthly bookings count</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data?.bookingChart || []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bookings" fill="#D9FC67" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Studios */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold">Top Studios</h3>
          </div>
          <div className="space-y-3">
            {(data?.topStudios || []).map((studio: any, i: number) => (
              <div key={studio.id} className="flex items-center gap-3">
                <span className="text-white/20 text-sm w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{studio.name}</p>
                  <p className="text-white/30 text-xs">{studio.city} · {studio.bookings} bookings</p>
                </div>
                <span className="text-[#D9FC67] text-sm font-medium shrink-0">
                  ₹{(studio.revenue / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
            {(!data?.topStudios || data.topStudios.length === 0) && (
              <p className="text-white/30 text-sm text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Partner Leaderboard */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-white font-semibold">Partner Earnings</h3>
          </div>
          <div className="space-y-3">
            {(data?.partnerLeaderboard || []).map((partner: any, i: number) => (
              <div key={partner.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-white/20 text-white" : i === 2 ? "bg-orange-600 text-white" : "bg-white/5 text-white/30"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{partner.name || partner.email}</p>
                  <p className="text-white/30 text-xs">{partner.studios} studio{partner.studios !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-green-400 text-sm font-medium shrink-0">
                  ₹{(partner.revenue / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
            {(!data?.partnerLeaderboard || data.partnerLeaderboard.length === 0) && (
              <p className="text-white/30 text-sm text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
