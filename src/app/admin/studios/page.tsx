"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, PauseCircle, RefreshCw, Building2 } from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All Studios" },
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pending", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  suspended: { label: "Suspended", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStudios = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/studios?${params}`)
      .then((r) => r.json())
      .then((d) => { setStudios(d.studios || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStudios(); }, [page, statusFilter]);

  const handleAction = async (studioId: string, action: string) => {
    setActionLoading(`${studioId}-${action}`);
    await fetch(`/api/admin/studios/${studioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    fetchStudios();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Studio Management</h2>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total studios</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/50 hover:text-white border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); fetchStudios(); }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studios..."
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
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Studio</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Owner</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : studios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-white/40">No studios found</td>
                </tr>
              ) : (
                studios.map((studio) => {
                  const cfg = statusConfig[studio.review_status] || statusConfig.pending_review;
                  return (
                    <tr key={studio.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {studio.image ? (
                            <img src={studio.image} alt={studio.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white/20" />
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">{studio.name}</p>
                            <p className="text-white/40 text-xs">₹{studio.price_per_hour}/hr</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white/60 text-sm">{studio.owner_name || studio.owner_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/50 text-sm">{studio.city}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {studio.review_status !== "approved" && (
                            <button
                              onClick={() => handleAction(studio.id, "approve")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
                              title="Approve"
                            >
                              {actionLoading === `${studio.id}-approve` ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {studio.review_status !== "rejected" && (
                            <button
                              onClick={() => handleAction(studio.id, "reject")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                              title="Reject"
                            >
                              {actionLoading === `${studio.id}-reject` ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {studio.review_status !== "suspended" && (
                            <button
                              onClick={() => handleAction(studio.id, "suspend")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-white/40 hover:text-yellow-400 transition-colors"
                              title="Suspend"
                            >
                              {actionLoading === `${studio.id}-suspend` ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <PauseCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
