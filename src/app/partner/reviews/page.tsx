"use client";

import { useEffect, useState } from "react";
import { Star, Building2 } from "lucide-react";
import { ReviewList } from "@/components/reviews/ReviewList";
import { FeatureGate } from "@/components/partner/FeatureGate";

export default function PartnerReviewsPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partner/studios")
      .then((r) => r.json())
      .then((d) => {
        const s = d.studios || [];
        setStudios(s);
        if (s.length > 0) setSelectedStudio(s[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGate featureKey="reviews_management">
    <div className="space-y-6">
      <div>
        <p className="text-white/40 text-sm">Manage and respond to customer reviews</p>
      </div>

      {studios.length === 0 ? (
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-16 text-center">
          <Building2 className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40">No studios found</p>
          <p className="text-white/20 text-sm mt-1">Create a studio to start receiving reviews</p>
        </div>
      ) : (
        <>
          {/* Studio Selector */}
          {studios.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {studios.map((studio) => (
                <button
                  key={studio.id}
                  onClick={() => setSelectedStudio(studio)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedStudio?.id === studio.id
                      ? "bg-[#D9FC67]/10 text-[#D9FC67] border border-[#D9FC67]/20"
                      : "bg-white/5 text-white/50 hover:text-white border border-transparent"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {studio.name}
                </button>
              ))}
            </div>
          )}

          {selectedStudio && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#D9FC67]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedStudio.name}</h3>
                  <p className="text-white/40 text-sm">{selectedStudio.city}</p>
                </div>
              </div>
              <ReviewList
                studioId={selectedStudio.id}
                partnerMode={true}
              />
            </div>
          )}
        </>
      )}
    </div>
    </FeatureGate>
  );
}
