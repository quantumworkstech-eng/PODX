"use client";

import { useEffect, useState } from "react";
import { Star, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const STATUS_FILTERS = ["all", "published", "pending", "rejected"];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-[#D9FC67] fill-[#D9FC67]" : "text-white/20"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/reviews?${params}`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [page, statusFilter]);

  const handleAction = async (reviewId: string, status: string) => {
    setActionLoading(`${reviewId}-${status}`);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, status }),
    });
    setActionLoading(null);
    fetchReviews();
  };

  const statusColors: Record<string, string> = {
    published: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total reviews</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === f ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white/50 hover:text-white border border-transparent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : reviews.length === 0 ? (
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-16 text-center text-white/40">No reviews found</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-[#18181b] border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <StarDisplay rating={review.rating} />
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[review.status] || "bg-white/5 text-white/40 border-white/10"}`}>{review.status}</span>
                    {review.is_verified && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[#D9FC67]/10 text-[#D9FC67] border border-[#D9FC67]/20">Verified</span>
                    )}
                  </div>
                  {review.title && <p className="text-white font-medium text-sm mb-1">{review.title}</p>}
                  {review.content && <p className="text-white/60 text-sm mb-3 line-clamp-2">{review.content}</p>}
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span>{review.user_name || review.user_email}</span>
                    <span>→</span>
                    <span>{review.studio_name} · {review.studio_city}</span>
                    <span>{new Date(review.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {review.status !== "published" && (
                    <button onClick={() => handleAction(review.id, "published")} disabled={!!actionLoading} className="p-2 rounded-lg hover:bg-green-500/10 text-white/30 hover:text-green-400 transition-colors" title="Approve">
                      {actionLoading === `${review.id}-published` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button onClick={() => handleAction(review.id, "rejected")} disabled={!!actionLoading} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors" title="Reject">
                      {actionLoading === `${review.id}-rejected` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-sm">Page {page} · {total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
