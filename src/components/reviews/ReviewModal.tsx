"use client";

import { useState } from "react";
import { X, Star, Loader2, CheckCircle } from "lucide-react";
import { StarRating } from "./StarRating";

interface ReviewModalProps {
  bookingId: string;
  studioId: string;
  studioName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewModal({ bookingId, studioId, studioName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, studio_id: studioId, rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Leave a Review</h2>
            <p className="text-white/40 text-sm">{studioName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Review submitted!</p>
            <p className="text-white/40 text-sm mt-1">Thank you for your feedback</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Stars */}
            <div className="text-center">
              <p className="text-white/60 text-sm mb-3">How was your experience?</p>
              <div className="flex justify-center mb-2">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              {rating > 0 && (
                <p className="text-[#D9FC67] text-sm font-medium">{ratingLabels[rating]}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-white/60 text-sm block mb-1.5">Title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience..."
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-white/60 text-sm block mb-1.5">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the studio, equipment, team, and overall vibe..."
                rows={4}
                maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
              />
              <p className="text-white/20 text-xs mt-1 text-right">{comment.length}/1000</p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D9FC67] to-[#B8E050] text-black font-semibold text-sm transition-all hover:from-[#E8FF8A] hover:to-[#D9FC67] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
