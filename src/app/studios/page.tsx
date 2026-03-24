"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  MapPin, Clock, Users, Star, ChevronLeft, ChevronRight,
  Mic2, Video, Headphones, Wifi, Car, Coffee, Search, Wind, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllStudios } from "@/lib/data";
import type { Studio } from "@/lib/types";
import { StudioDetailModal } from "@/components/StudioDetailModal";
import { StudioCardMedia } from "@/components/StudioCardMedia";

const CITIES = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad"];

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  ac: Wind,
  parking: Car,
  refreshments: Coffee,
  microphones: Mic2,
  cameras: Video,
  headphones: Headphones,
};

export default function StudiosPage() {
  const router = useRouter();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState("All Cities");
  const [search, setSearch] = useState("");
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const [detailStudioId, setDetailStudioId] = useState<string | null>(null);
  const [detailStudio, setDetailStudio] = useState<Studio | null>(null);

  const handleBookNow = (studio: Studio) => {
    sessionStorage.setItem("yanisa_preselected_studio", JSON.stringify(studio));
    router.push("/book?preselect=1");
  };

  useEffect(() => {
    getAllStudios().then((data) => { setStudios(data); setLoading(false); });
  }, []);

  // Auto-advance featured carousel
  useEffect(() => {
    if (studios.length === 0) return;
    autoRef.current = setInterval(() => {
      setFeaturedIdx((i) => (i + 1) % studios.length);
    }, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [studios]);

  const filtered = studios.filter((s) => {
    const matchCity = activeCity === "All Cities" || s.location?.city === activeCity;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  const featured = studios[featuredIdx];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-20 pb-0 overflow-hidden min-h-[60vh] flex items-center">
        {featured && (
          <>
            <div className="absolute inset-0">
              <Image
                src={featured.cover_image || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920"}
                alt={featured.name}
                fill
                className="object-cover transition-opacity duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <div className="max-w-2xl">
                {/* Featured badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9FC67]/20 border border-[#D9FC67]/30 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67] animate-pulse" />
                  <span className="text-[#D9FC67] text-xs font-medium">Featured Studio</span>
                </div>

                <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
                  {featured.name}
                </h1>

                <div className="flex items-center gap-4 mb-6 text-white/70 text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D9FC67]" />
                    {featured.location?.area}, {featured.location?.city || "Mumbai"}
                  </span>
                  {featured.review_count > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {featured.rating} ({featured.review_count} reviews)
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Up to {featured.capacity || 6} people
                  </span>
                </div>

                <p className="text-white/70 mb-8 text-base leading-relaxed max-w-lg">
                  {featured.description || "Professional podcast studio with premium equipment for content creators."}
                </p>

                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    onClick={() => featured && handleBookNow(featured)}
                    className="px-8 py-6 text-base font-semibold bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-full border-0"
                  >
                    Book This Studio
                  </Button>
                  <button
                    onClick={() => {
                      if (featured) {
                        setDetailStudio(featured);
                        setDetailStudioId(featured.id);
                      }
                    }}
                    title="View studio details"
                    className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/40 transition-all"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <span className="text-white font-bold text-xl">
                    ₹{featured.price_per_hour?.toLocaleString("en-IN")}<span className="text-white/50 text-sm font-normal">/hr</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {studios.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFeaturedIdx(i)}
                  className={`rounded-full transition-all ${i === featuredIdx ? "w-6 h-2 bg-[#D9FC67]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
                />
              ))}
            </div>

            {/* Featured carousel nav */}
            <button
              onClick={() => setFeaturedIdx((i) => (i - 1 + studios.length) % studios.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setFeaturedIdx((i) => (i + 1) % studios.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div className="relative z-10 w-full flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No studios at all — launching soon hero */}
        {!loading && studios.length === 0 && (
          <div className="relative z-10 w-full flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9FC67]/10 border border-[#D9FC67]/30 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67] animate-pulse" />
                <span className="text-[#D9FC67] text-sm font-medium">Launching Soon</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Studios Coming Soon</h1>
              <p className="text-white/60 text-lg max-w-md mx-auto">
                We&apos;re setting up premium podcast studios near you. Stay tuned!
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Search + Filter Bar */}
      <div className="sticky top-16 lg:top-20 z-30 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search studios..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* City filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                    activeCity === city
                      ? "bg-[#D9FC67] text-black border-[#D9FC67]"
                      : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Studio Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeCity === "All Cities" ? "All Studios" : `Studios in ${activeCity}`}
            </h2>
            <p className="text-white/40 text-sm mt-1">{filtered.length} studio{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/[0.03] rounded-3xl overflow-hidden border border-white/5 animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-white/5 rounded-lg w-2/3" />
                  <div className="h-4 bg-white/5 rounded-lg w-1/2" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            {search || activeCity !== "All Cities" ? (
              <>
                <p className="text-white/40 text-lg">No studios found</p>
                <p className="text-white/30 text-sm mt-2">Try a different city or search term</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9FC67]/10 border border-[#D9FC67]/30 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67] animate-pulse" />
                  <span className="text-[#D9FC67] text-sm font-medium">Launching Soon</span>
                </div>
                <p className="text-white/60 text-lg">Studios coming to your city</p>
                <p className="text-white/30 text-sm mt-2">We&apos;re setting up soon. Get notified when we launch!</p>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-[#D9FC67] text-black font-semibold text-sm hover:bg-[#E8FF8A] transition-colors"
                >
                  Notify Me
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((studio) => {
              return (
                <div
                  key={studio.id}
                  onClick={() => {
                    setDetailStudio(studio);
                    setDetailStudioId(studio.id);
                  }}
                  className="group bg-[#111111] rounded-3xl overflow-hidden border border-white/5 hover:border-[#D9FC67]/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#D9FC67]/5 cursor-pointer"
                >
                  {/* Image Carousel */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <StudioCardMedia
                      alt={studio.name}
                      coverImage={studio.cover_image}
                      imageUrls={studio.image_urls}
                      videoUrl={studio.video_url}
                      className="absolute inset-0"
                      imageClassName="object-cover"
                      hoverScaleClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating badge */}
                    {studio.review_count > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-medium">{studio.rating}</span>
                      </div>
                    )}

                    {/* Location overlay */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D9FC67]" />
                      <span className="text-white text-xs font-medium">
                        {studio.location?.area || "Mumbai"}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg leading-tight">{studio.name}</h3>
                        <p className="text-white/40 text-xs mt-0.5">
                          {studio.location?.city || "Mumbai"} · Up to {studio.capacity || 6} people
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-[#D9FC67] font-bold text-lg">
                          ₹{studio.price_per_hour?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-white/40 text-xs">/hr</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
                      {studio.description || "Professional podcast studio with premium equipment."}
                    </p>

                    {/* Amenities */}
                    {studio.amenities && studio.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {studio.amenities.slice(0, 3).map((amenity: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-white/[0.04] border border-white/5 rounded-full text-white/50 text-xs">
                            {amenity}
                          </span>
                        ))}
                        {studio.amenities.length > 3 && (
                          <span className="px-2.5 py-1 bg-white/[0.04] border border-white/5 rounded-full text-white/30 text-xs">
                            +{studio.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Booking info + CTA */}
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Min 1 hr · Available Today</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailStudio(studio);
                          setDetailStudioId(studio.id);
                        }}
                        title="View studio details"
                        className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(studio);
                        }}
                        className="flex-1 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-2xl py-6 transition-all group-hover:shadow-lg group-hover:shadow-[#D9FC67]/20"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      <Footer />

      {/* Studio Detail Modal */}
      <StudioDetailModal
        studioId={detailStudioId}
        studioName={detailStudio?.name}
        coverImage={detailStudio?.cover_image}
        onClose={() => { setDetailStudioId(null); setDetailStudio(null); }}
        onBookNow={() => {
          if (detailStudio) handleBookNow(detailStudio);
          setDetailStudioId(null);
          setDetailStudio(null);
        }}
      />
    </div>
  );
}
