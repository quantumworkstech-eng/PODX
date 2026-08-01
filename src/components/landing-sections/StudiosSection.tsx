"use client";

import { useState } from "react";
import { ArrowRight, MapPin, Star, Users, Calendar, Info } from "lucide-react";
import type { StudiosContent, SectionBranding } from "@/types/landing";
import { StudioCardMedia } from "@/components/StudioCardMedia";

interface Room {
  id: string;
  name: string;
  capacity: number;
  price_per_hour: number;
  min_booking_hours: number;
  max_booking_hours: number;
  is_active: boolean;
}

interface Studio {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  city: string;
  address: string;
  featured_image_url: string;
  video_url?: string;
  studio_images?: { image_url: string; display_order?: number }[];
  is_verified: boolean;
  rooms: Room[];
  price_per_hour?: number;
  original_price_per_hour?: number | null;
}

interface Props {
  content: StudiosContent;
  branding: SectionBranding;
  studios: Studio[];
  onBookNow?: (studio: Studio) => void;
  onViewDetails?: (studio: Studio) => void;
}

export function StudiosSection({ content, branding, studios, onBookNow, onViewDetails }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const btnText = branding.button_text_color || "#000000";
  const cols = content.columns ?? 3;
  const [hovered, setHovered] = useState<string | null>(null);

  const colsClass =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="studios" className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {(content.heading || content.subheading) && (
          <div className="text-center mb-14">
            {content.heading && (
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{content.heading}</h2>
            )}
            {content.subheading && (
              <p className="max-w-xl mx-auto" style={{ opacity: 0.5 }}>
                {content.subheading}
              </p>
            )}
          </div>
        )}

        {studios.length === 0 ? (
          <div className="text-center py-24" style={{ opacity: 0.4 }}>
            <Calendar className="w-14 h-14 mx-auto mb-5" />
            <p className="text-xl font-semibold mb-2">No Studios Available Yet</p>
            <p className="text-sm">Check back soon or contact us for custom arrangements.</p>
          </div>
        ) : (
          <div className={`grid ${colsClass} gap-6`}>
            {studios.map((studio) => {
              const activeRooms = studio.rooms?.filter((r) => r.is_active) || [];
              const maxCap = activeRooms.length > 0 ? Math.max(...activeRooms.map((r) => r.capacity)) : null;
              const roomPrices = activeRooms.map((r) => r.price_per_hour).filter((n) => n > 0);
              const minPrice = studio.price_per_hour ?? (roomPrices.length > 0 ? Math.min(...roomPrices) : null);
              const originalPrice = studio.original_price_per_hour ?? null;

              return (
                <div
                  key={studio.id}
                  onMouseEnter={() => setHovered(studio.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onViewDetails?.(studio)}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${hovered === studio.id ? primary + "40" : "rgba(255,255,255,0.08)"}`,
                    transform: hovered === studio.id ? "scale(1.02)" : "scale(1)",
                    boxShadow: hovered === studio.id ? `0 8px 40px ${primary}15` : "none",
                  }}
                >
                  <div className="relative h-52 overflow-hidden">
                    {studio.featured_image_url ? (
                      <StudioCardMedia
                        alt={studio.name}
                        coverImage={studio.featured_image_url}
                        imageUrls={(studio.studio_images || []).map((img) => img.image_url)}
                        videoUrl={studio.video_url}
                        className="absolute inset-0"
                        imageClassName="object-cover"
                        hoverScaleClassName="transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-5xl font-black"
                        style={{ background: `${primary}10`, color: `${primary}30` }}
                      >
                        {studio.name[0]}
                      </div>
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}
                    />
                    {studio.is_verified && (
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: primary, color: btnText }}
                      >
                        <Star className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                    {studio.city && (
                      <div
                        className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)" }}
                      >
                        <MapPin className="w-3 h-3" />
                        {studio.city}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-1">{studio.name}</h3>
                    {(studio.address || studio.city) && (
                      <p className="flex items-start gap-1.5 text-sm mb-4" style={{ opacity: 0.5 }}>
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ opacity: 0.7 }} />
                        <span className="line-clamp-2">{studio.address || studio.city}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {minPrice !== null && (
                          <p className="flex items-baseline gap-1.5">
                            {originalPrice !== null && originalPrice > minPrice && (
                              <span className="text-sm line-through" style={{ opacity: 0.35 }}>
                                ₹{originalPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="font-bold text-lg" style={{ color: primary }}>
                              from ₹{minPrice.toLocaleString()}
                            </span>
                            <span className="text-xs" style={{ opacity: 0.5 }}>/hr</span>
                          </p>
                        )}
                        {content.show_capacity !== false && maxCap !== null && maxCap > 0 && (
                          <p className="text-xs mt-0.5" style={{ opacity: 0.35 }}>Up to {maxCap} people</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewDetails?.(studio); }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                        >
                          <Info className="w-4 h-4" style={{ opacity: 0.6 }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onBookNow?.(studio); }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:shadow-lg"
                          style={{ background: primary, color: btnText, boxShadow: `0 4px 20px ${primary}20` }}
                        >
                          Book Now
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
