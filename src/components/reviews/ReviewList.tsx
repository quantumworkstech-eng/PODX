"use client";

import { useEffect, useState } from "react";
import { Star, MessageCircle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified: boolean;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  responses: { id: string; content: string; created_at: string }[];
}

interface ReviewListProps {
  studioId: string;
  partnerMode?: boolean;
  onRespond?: (reviewId: string, content: string) => Promise<void>;
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-white/40 w-4 text-right">{label}</span>
      <Star className="w-3 h-3 text-[#D9FC67] fill-[#D9FC67]" />
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-[#D9FC67] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/30 w-5">{count}</span>
    </div>
  );
}

function ReviewCard({
  review,
  partnerMode,
  onRespond,
}: {
  review: Review;
  partnerMode?: boolean;
  onRespond?: (reviewId: string, content: string) => Promise<void>;
}) {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  const handleRespond = async () => {
    if (!responseText.trim() || !onRespond) return;
    setResponding(true);
    await onRespond(review.id, responseText);
    setResponding(false);
    setShowResponse(false);
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D9FC67] to-[#B8E050] flex items-center justify-center text-black text-sm font-bold shrink-0">
            {review.author_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-medium">{review.author_name}</p>
              {review.is_verified && (
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-white/30 text-xs">
              {new Date(review.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>

      {review.title && <p className="text-white font-medium text-sm mt-3">{review.title}</p>}
      {review.content && <p className="text-white/60 text-sm mt-2 leading-relaxed">{review.content}</p>}

      {/* Partner response */}
      {review.responses.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-[#D9FC67]/20">
          <p className="text-[#D9FC67] text-xs font-medium mb-1">Studio Response</p>
          <p className="text-white/50 text-sm">{review.responses[0].content}</p>
        </div>
      )}

      {/* Partner respond button */}
      {partnerMode && review.responses.length === 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowResponse((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#D9FC67] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {showResponse ? "Cancel" : "Respond to this review"}
            {showResponse ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showResponse && (
            <div className="mt-3 space-y-2">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write a professional response..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
              />
              <button
                onClick={handleRespond}
                disabled={responding || !responseText.trim()}
                className="px-4 py-2 rounded-xl bg-[#D9FC67]/10 text-[#D9FC67] hover:bg-[#D9FC67]/20 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {responding ? "Submitting..." : "Post Response"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewList({ studioId, partnerMode = false, onRespond }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    fetch(`/api/reviews?studio_id=${studioId}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAvgRating(d.avgRating || 0);
        setDistribution(d.distribution || {});
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [studioId]);

  const handleRespond = async (reviewId: string, content: string) => {
    await fetch(`/api/reviews/${reviewId}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    fetchReviews();
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-5 h-5 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {total > 0 && (
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="text-center shrink-0">
              <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <p className="text-white/40 text-xs mt-1">{total} review{total !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  label={String(star)}
                  count={distribution[star] || 0}
                  total={total}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No reviews yet</p>
          <p className="text-white/20 text-xs mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              partnerMode={partnerMode}
              onRespond={partnerMode ? handleRespond : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
