"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import { getAllStudios } from "@/lib/data";
import type { Studio } from "@/lib/types";
import { enrichStudioForBooking } from "@/lib/enrich-studio";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Check, Star, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudioCardMedia } from "@/components/StudioCardMedia";
import { StudioDetailModal } from "@/components/StudioDetailModal";

const ALL_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30",
];
const fmt = (slot: string) => {
  const [hStr, mStr] = slot.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = (h % 12) || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

function StudioCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-5 bg-[#0a0a0a] space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-7 bg-white/10 rounded-full w-20" />
          <div className="h-7 bg-white/10 rounded-full w-16" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-white/5 rounded-full w-14" />
          ))}
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 bg-white/10 rounded w-24" />
          <div className="h-9 bg-white/10 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

export function StudioStep() {
  const {
    selectedStudio,
    setSelectedStudio,
    participants,
    nextStep,
    selectedCity,
    partnerSlug,
    partnerBranding,
  } = useBooking();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailStudioId, setDetailStudioId] = useState<string | null>(null);
  const [detailStudio, setDetailStudio] = useState<Studio | null>(null);
  // studioId → array of already-booked hour slots for today
  const [bookedByStudio, setBookedByStudio] = useState<Record<string, string[]>>({});

  const wlPrimary = partnerBranding?.primary_color || "#D9FC67";

  const loadStudios = () => {
    setLoading(true);
    setError(null);

    // When in partner/white-label mode, only show partner's studios
    if (partnerSlug) {
      fetch(`/api/whitelabel/${partnerSlug}`)
        .then((r) => r.ok ? r.json() : Promise.reject("Not found"))
        .then(({ studios: wlStudios }) => {
          // Convert white-label studio format to Studio type
          const converted: Studio[] = (wlStudios || []).map((s: any) => {
            const activeRooms = (s.rooms || []).filter((r: any) => r.is_active !== false);
            const minPrice = activeRooms.length > 0 ? Math.min(...activeRooms.map((r: any) => r.price_per_hour || 0)) : 0;
            const maxCap = activeRooms.length > 0 ? Math.max(...activeRooms.map((r: any) => r.capacity || 0)) : 2;
            return {
              id: s.id,
              name: s.name,
              slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
              cover_image: s.featured_image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90',
              image_urls: (s.studio_images || [])
                .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
                .map((img: any) => img.image_url)
                .filter(Boolean),
              video_url: s.video_url || undefined,
              location: { city: s.city || '', area: s.city || '', address: s.address || '' },
              price_per_hour: minPrice,
              currency: '₹',
              capacity: maxCap,
              equipment: [],
              rating: 0,
              review_count: 0,
              is_instant_bookable: true,
              description: s.short_description || s.description || '',
              amenities: ['WiFi', 'AC', 'Parking'],
            };
          });
          setStudios(converted);
          setLoading(false);
          fetchAvailability(converted);
        })
        .catch(() => {
          setError("Failed to load studios. Please try again.");
          setLoading(false);
        });
      return;
    }

    getAllStudios()
      .then((data) => {
        // Filter by selected city (case-insensitive match on city slug or name)
        const filtered = selectedCity
          ? data.filter((s) => {
              const cityField = s.location.city.toLowerCase();
              const slug = selectedCity.toLowerCase();
              return cityField === slug || cityField.startsWith(slug);
            })
          : data;
        setStudios(filtered);
        setLoading(false);
        fetchAvailability(filtered);
      })
      .catch(() => {
        setError("Failed to load studios. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => { loadStudios(); }, [selectedCity, partnerSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAvailability = async (studioList: Studio[]) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const results = await Promise.allSettled(
      studioList.map((s) =>
        fetch(`/api/studios/${s.id}/slots?date=${today}`)
          .then((r) => r.json())
          .then((d) => ({ id: s.id, booked: d.bookedSlots || [] }))
          .catch(() => ({ id: s.id, booked: [] }))
      )
    );
    const map: Record<string, string[]> = {};
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        map[r.value.id] = r.value.booked;
      }
    });
    setBookedByStudio(map);
  };

  const canAccommodate = (capacity: number) => capacity >= participants;

  const selectStudioAndAdvance = (studio: Studio) => {
    void enrichStudioForBooking(studio).then((s) => {
      setSelectedStudio(s);
      nextStep();
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Partner mode banner */}
      {partnerSlug && partnerBranding && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: `${wlPrimary}15`, border: `1px solid ${wlPrimary}30`, color: wlPrimary }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: wlPrimary }} />
          Showing studios available through {partnerBranding.brand_name}
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          {partnerSlug && partnerBranding
            ? `${partnerBranding.brand_name} Studios`
            : selectedCity
            ? `Studios in ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`
            : "Choose Your Studio"}
        </h1>
        <p className="text-white/60 text-lg">Select a studio that fits your needs</p>
      </div>

      {error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={loadStudios}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StudioCardSkeleton key={i} />)
            : studios.slice(0, 6).map((studio) => {
                const canFit = canAccommodate(studio.capacity);
                const isSelected = selectedStudio?.id === studio.id;
                const disabled = !canFit;
                const booked = bookedByStudio[studio.id] || [];
                const now = new Date();
                const currentHour = now.getHours();
                const futureSlots = ALL_SLOTS.filter((s) => parseInt(s) > currentHour);
                const availableSlots = futureSlots.filter((s) => !booked.includes(s));
                const count = availableSlots.length;
                // Show up to 6 time pills
                const previewSlots = futureSlots.slice(0, 6);

                return (
                  <div
                    key={studio.id}
                    onClick={() => {
                      setDetailStudio(studio);
                      setDetailStudioId(studio.id);
                    }}
                    className={cn(
                      "relative group rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer",
                      isSelected
                        ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30 shadow-lg shadow-[#D9FC67]/10"
                        : disabled
                        ? "border-white/10 opacity-50 cursor-not-allowed"
                        : "border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-black/30"
                    )}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <StudioCardMedia
                        alt={studio.name}
                        coverImage={studio.cover_image}
                        imageUrls={studio.image_urls}
                        videoUrl={studio.video_url}
                        className="absolute inset-0"
                        imageClassName="object-cover"
                        hoverScaleClassName="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#D9FC67] flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}

                      {/* Availability badge */}
                      {!disabled && !loading && Object.keys(bookedByStudio).length > 0 && (
                        <div className={cn(
                          "absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold",
                          isSelected ? "hidden" : "",
                          count > 3
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : count > 0
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        )}>
                          {count > 0 ? `${count} slots today` : "Full today"}
                        </div>
                      )}

                      {!canFit && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                            Capacity too small
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-xl font-bold text-white drop-shadow">{studio.name}</h3>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 bg-[#0a0a0a]">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {studio.location.area}, {studio.location.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                            canFit ? "bg-white/10 text-white/70" : "bg-red-500/10 text-red-400"
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Up to {studio.capacity}
                        </div>
                        {studio.review_count > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            <span className="text-white text-sm font-medium">{studio.rating}</span>
                            <span className="text-white/40 text-xs">({studio.review_count})</span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">No reviews yet</span>
                        )}
                      </div>

                      <p className="flex items-start gap-1.5 text-white/40 text-sm mb-4">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                        <span className="line-clamp-2">{studio.location.address || studio.location.city}</span>
                      </p>

                      {/* ── Availability time pills ─────────────────────────────── */}
                      {!disabled && previewSlots.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Clock className="w-3 h-3 text-white/30" />
                            <span className="text-white/30 text-xs">Today's slots</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {previewSlots.map((slot) => {
                              const isBooked = booked.includes(slot);
                              return (
                                <span
                                  key={slot}
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                                    isBooked
                                      ? "bg-white/3 border-white/5 text-white/20 line-through"
                                      : "bg-[#D9FC67]/10 border-[#D9FC67]/20 text-[#D9FC67]/80"
                                  )}
                                >
                                  {fmt(slot)}
                                </span>
                              );
                            })}
                            {futureSlots.length > 6 && (
                              <span className="px-2 py-0.5 rounded-full text-xs border border-white/10 text-white/30">
                                +{futureSlots.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          {studio.price_per_hour > 0 &&
                            (studio.original_price_per_hour ?? 0) > studio.price_per_hour && (
                              <span className="text-white/30 text-sm line-through mr-1.5">
                                ₹{studio.original_price_per_hour?.toLocaleString()}
                              </span>
                            )}
                          <span className="text-xl font-bold text-white">
                            {studio.price_per_hour > 0 ? `from ₹${studio.price_per_hour.toLocaleString()}` : "See packages"}
                          </span>
                          {studio.price_per_hour > 0 && <span className="text-white/40 text-sm">/hr</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailStudio(studio);
                              setDetailStudioId(studio.id);
                            }}
                            title="View studio details"
                            className="w-9 h-9 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabled) return;
                              if (isSelected) {
                                setSelectedStudio(null);
                                return;
                              }
                              selectStudioAndAdvance(studio);
                            }}
                            disabled={disabled}
                            className={cn(
                              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                              isSelected
                                ? "bg-[#D9FC67] text-black"
                                : "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      <StudioDetailModal
        studioId={detailStudioId}
        studioName={detailStudio?.name}
        coverImage={detailStudio?.cover_image}
        onClose={() => {
          setDetailStudioId(null);
          setDetailStudio(null);
        }}
        onBookNow={() => {
          if (!detailStudio) return;
          void enrichStudioForBooking(detailStudio).then((s) => {
            setSelectedStudio(s);
            setDetailStudioId(null);
            setDetailStudio(null);
            nextStep();
          });
        }}
      />
    </div>
  );
}
