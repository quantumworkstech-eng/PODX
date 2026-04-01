"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { ReviewsContent, ReviewItem, SectionBranding } from "@/types/landing";

interface Props {
  content: ReviewsContent;
  branding: SectionBranding;
  isPreview?: boolean;
}

interface DBReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
  studio?: { name: string };
}

export function ReviewsSection({ content, branding, isPreview = false }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const secondary = branding.secondary_color || "#0a0a0a";
  const { heading, subheading, show_dynamic = true, items = [] } = content;

  const [dynamicReviews, setDynamicReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (!show_dynamic || isPreview || !branding.partner_id) return;
    fetch(`/api/partner/reviews?partnerId=${branding.partner_id}&public=true`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.reviews) {
          setDynamicReviews(
            (data.reviews as DBReview[]).slice(0, 6).map((r) => ({
              name: r.reviewer_name || "Verified Client",
              role: r.studio?.name ? `Recorded at ${r.studio.name}` : undefined,
              quote: r.comment,
              rating: r.rating,
            }))
          );
        }
      })
      .catch(() => {});
  }, [show_dynamic, isPreview, branding.partner_id]);

  const displayReviews: ReviewItem[] = show_dynamic && dynamicReviews.length > 0 ? dynamicReviews : items;

  if (displayReviews.length === 0 && !isPreview) return null;

  const placeholderReviews: ReviewItem[] = isPreview
    ? [
        { name: "Rahul Sharma", role: "Podcast Creator", quote: "Amazing studio experience. The quality is unmatched!", rating: 5 },
        { name: "Priya Mehta", role: "Content Creator", quote: "Booking was seamless and the studio was incredible.", rating: 5 },
        { name: "Arjun Kapoor", role: "YouTuber", quote: "Best recording studio I've ever used. Highly recommend.", rating: 5 },
      ]
    : [];

  const reviews = displayReviews.length > 0 ? displayReviews : placeholderReviews;

  return (
    <section
      className="px-6 py-20"
      style={{ background: secondary, borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-6xl mx-auto">
        {(heading || subheading) && (
          <div className="text-center mb-14">
            {heading && <h2 className="text-3xl sm:text-4xl font-bold mb-4">{heading}</h2>}
            {subheading && (
              <p className="max-w-xl mx-auto" style={{ opacity: 0.5 }}>{subheading}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {review.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4"
                      style={{
                        color: j < review.rating! ? primary : "rgba(255,255,255,0.2)",
                        fill: j < review.rating! ? primary : "transparent",
                      }}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm leading-relaxed mb-5" style={{ opacity: 0.75 }}>
                &ldquo;{review.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${primary}20`, color: primary }}
                >
                  {review.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{review.name}</p>
                  {review.role && (
                    <p className="text-xs" style={{ opacity: 0.45 }}>{review.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
