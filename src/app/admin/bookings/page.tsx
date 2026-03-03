"use client";

import { useEffect, useState } from "react";
import { Search, XCircle, RefreshCw, DollarSign } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled", "completed", "no_show"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  no_show: "bg-white/10 text-white/40 border-white/10",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => { setBookings(d.bookings || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const handleAction = async (bookingId: string, action: string) => {
    setActionLoading(`${bookingId}-${action}`);
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Booking Control</h2>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                statusFilter === f
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/50 hover:text-white border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchBookings(); }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking number..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors">
          Search
        </button>
      </form>

      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Booking</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Studio</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-white/40">No bookings found</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-mono">{booking.booking_number || "—"}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {new Date(booking.created_at).toLocaleDateString("en-IN")}
                      </p>
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
                      <span className="text-white font-medium text-sm">
                        ₹{Number(booking.total_price).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${statusColors[booking.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => handleAction(booking.id, "force_cancel")}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                            title="Force Cancel"
                          >
                            {actionLoading === `${booking.id}-force_cancel` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(booking.id, "force_refund")}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
                          title="Force Refund"
                        >
                          {actionLoading === `${booking.id}-force_refund` ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/40 text-sm">Page {page} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
