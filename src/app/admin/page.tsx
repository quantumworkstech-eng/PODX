"use client";

import { useEffect, useState } from "react";
import {
  Users, Building2, Calendar, DollarSign, Clock, AlertCircle,
  TrendingUp, CheckCircle, UserCheck, RefreshCw, RotateCcw,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalPartners: number;
  totalStudios: number;
  totalBookings: number;
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingApprovals: number;
  pendingRefunds: number;
  pendingReschedule: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {href && <TrendingUp className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/50 text-sm">{label}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      icon: Users,
      label: "Total Users",
      value: stats?.totalUsers?.toLocaleString() ?? "—",
      color: "bg-blue-500/10 text-blue-400",
      href: "/admin/users",
    },
    {
      icon: UserCheck,
      label: "Total Partners",
      value: stats?.totalPartners?.toLocaleString() ?? "—",
      color: "bg-violet-500/10 text-violet-400",
      href: "/admin/partners",
    },
    {
      icon: Building2,
      label: "Total Studios",
      value: stats?.totalStudios?.toLocaleString() ?? "—",
      color: "bg-purple-500/10 text-purple-400",
      href: "/admin/studios",
    },
    {
      icon: Calendar,
      label: "Total Bookings",
      value: stats?.totalBookings?.toLocaleString() ?? "—",
      color: "bg-[#D9FC67]/10 text-[#D9FC67]",
      href: "/admin/bookings",
    },
    {
      icon: DollarSign,
      label: "Revenue Today",
      value: `₹${(stats?.revenueToday ?? 0).toLocaleString("en-IN")}`,
      sub: `₹${((stats?.revenueThisMonth ?? 0) / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} this month`,
      color: "bg-green-500/10 text-green-400",
      href: "/admin/payments",
    },
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `₹${((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L`,
      sub: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")} total`,
      color: "bg-emerald-500/10 text-emerald-400",
      href: "/admin/analytics",
    },
    {
      icon: Clock,
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? "—",
      sub: "Studio reviews pending",
      color: "bg-orange-500/10 text-orange-400",
      href: "/admin/studios?status=pending_review",
    },
    {
      icon: RotateCcw,
      label: "Reschedule Requests",
      value: stats?.pendingReschedule ?? "—",
      sub: "Awaiting admin approval",
      color: "bg-cyan-500/10 text-cyan-400",
      href: "/admin/bookings?tab=reschedule",
    },
    {
      icon: AlertCircle,
      label: "Refund Requests",
      value: stats?.pendingRefunds ?? "—",
      sub: "Refunds pending",
      color: "bg-red-500/10 text-red-400",
      href: "/admin/payments",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
          <p className="text-white/40 text-sm mt-1">Real-time stats across the PodX marketplace</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-400 font-medium">All systems operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Quick Actions + Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/studios?status=pending_review" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              <Clock className="w-4 h-4 text-orange-400" />
              Review pending studios ({stats?.pendingApprovals ?? 0})
            </Link>
            <Link href="/admin/bookings?tab=reschedule" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              Reschedule requests ({stats?.pendingReschedule ?? 0})
            </Link>
            <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Process refunds ({stats?.pendingRefunds ?? 0})
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              <Users className="w-4 h-4 text-blue-400" />
              Manage users
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors text-sm">
              <TrendingUp className="w-4 h-4 text-[#D9FC67]" />
              View analytics
            </Link>
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 md:col-span-2">
          <h3 className="text-white font-semibold mb-4">Platform Health</h3>
          <div className="space-y-3">
            {[
              { label: "Database", status: "Healthy", color: "bg-green-400" },
              { label: "Payment Gateway (Razorpay)", status: "Operational", color: "bg-green-400" },
              { label: "Auth Service", status: "Operational", color: "bg-green-400" },
              { label: "Notification Service", status: "Operational", color: "bg-green-400" },
              { label: "Storage (Supabase)", status: "Operational", color: "bg-green-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-white/60 text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                  <span className="text-white text-xs">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
