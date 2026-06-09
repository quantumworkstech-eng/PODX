"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Clock,
  Mic2,
  Video,
  Headphones,
  Wifi,
  Car,
  Coffee,
  Wind,
  Shield,
  Zap,
  Music,
  Monitor,
  Lightbulb,
  Package,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  BadgeCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────

interface StudioImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  price_per_hour: number;
  min_booking_hours: number;
  max_booking_hours: number;
}

interface Amenity {
  id: string;
  name: string;
  icon?: string;
  category: string;
}

interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  icon?: string;
}

interface StudioPackage {
  id: string;
  name: string;
  description?: string;
  price_per_hour: number;
  features?: string[];
  is_popular?: boolean;
  display_order?: number;
}

interface StudioDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  featured_image_url?: string;
  is_verified?: boolean;
  phone?: string;
  email?: string;
  website?: string;
  video_url?: string | null;
  equipment?: string[];
  images: StudioImage[];
  rooms: Room[];
  amenities: Amenity[];
  addons: Addon[];
  packages?: StudioPackage[];
}

export interface StudioDetailModalProps {
  /** Pass the studio id to open the modal; null / undefined = closed */
  studioId: string | null | undefined;
  /** Fallback name shown while details are loading */
  studioName?: string;
  /** Fallback image shown while details are loading */
  coverImage?: string;
  onClose: () => void;
  onBookNow: () => void;
  /** Optional accent color for white-label theming (hex). Defaults to #D9FC67 */
  primaryColor?: string;
  /** Optional button text color (hex). Defaults to #000000 */
  buttonTextColor?: string;
}

// ── Amenity/icon helpers ──────────────────────────────────────────────────

const AMENITY_ICON_MAP: Record<string, React.ElementType> = {
  wifi: Wifi,
  ac: Wind,
  parking: Car,
  coffee: Coffee,
  refreshments: Coffee,
  microphone: Mic2,
  microphones: Mic2,
  camera: Video,
  cameras: Video,
  headphones: Headphones,
  soundproofing: Shield,
  monitor: Monitor,
  monitors: Monitor,
  lighting: Lightbulb,
  mixer: Music,
  teleprompter: Monitor,
  internet: Wifi,
  security: Shield,
  power: Zap,
};

function AmenityIcon({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  const Icon = AMENITY_ICON_MAP[key] ?? CheckCircle2;
  return <Icon className="w-4 h-4" />;
}

const EQUIPMENT_ICON_MAP: Record<string, React.ElementType> = {
  microphone: Mic2,
  mic: Mic2,
  camera: Video,
  headphones: Headphones,
  monitor: Monitor,
  mixer: Music,
  lighting: Lightbulb,
  teleprompter: Monitor,
  soundproofing: Shield,
};

function EquipmentIcon({ name }: { name: string }) {
  const key = name.toLowerCase().split(" ")[0];
  const Icon = EQUIPMENT_ICON_MAP[key] ?? Package;
  return <Icon className="w-4 h-4" />;
}

// ── Main component ────────────────────────────────────────────────────────

export function StudioDetailModal({
  studioId,
  studioName,
  coverImage,
  onClose,
  onBookNow,
  primaryColor = "#D9FC67",
  buttonTextColor = "#000000",
}: StudioDetailModalProps) {
  const [details, setDetails] = useState<StudioDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch details when modal opens
  useEffect(() => {
    if (!studioId) {
      setDetails(null);
      setSlideIdx(0);
      return;
    }
    setLoading(true);
    setSlideIdx(0);
    fetch(`/api/studios/${studioId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [studioId]);

  // Collect all slide media (images)
  const slides = details?.images?.length
    ? details.images.map((img) => img.image_url)
    : coverImage
    ? [coverImage]
    : [];

  // Auto-advance banner slides
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setSlideIdx((i) => (i + 1) % slides.length);
    }, 4000);
  }, [slides.length]);

  useEffect(() => {
    if (studioId) startAutoSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [studioId, startAutoSlide]);

  const goSlide = (dir: 1 | -1) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSlideIdx((i) => (i + dir + slides.length) % slides.length);
    startAutoSlide();
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isVideoMuted;
    setIsVideoMuted(!isVideoMuted);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleVideoSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  // Lock body scroll while open
  useEffect(() => {
    if (studioId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [studioId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!studioId) return null;

  const displayName = details?.name ?? studioName ?? "Studio";
  const displayCity = details?.city ?? "";
  const displayAddress = details?.address ?? "";
  const activeRooms = details?.rooms ?? [];
  const activePackages = details?.packages ?? [];
  const minPrice =
    activePackages.length > 0
      ? Math.min(...activePackages.map((pkg) => Number(pkg.price_per_hour) || 0))
      : activeRooms.length > 0
      ? Math.min(...activeRooms.map((r) => Number(r.price_per_hour) || 0))
      : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full sm:w-[90vw] sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] bg-[#111111] rounded-t-3xl sm:rounded-3xl overflow-y-auto border border-white/10 shadow-2xl">

        {/* ── Banner / Image Slider ─────────────────────────── */}
        <div className="relative w-full aspect-video bg-black">
          {slides.length > 0 ? (
            <>
              <Image
                key={slides[slideIdx]}
                src={slides[slideIdx]}
                alt={displayName}
                fill
                className="object-cover transition-opacity duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white/10 border border-white/5">
                {displayName[0]}
              </div>
            </div>
          )}

          {/* Slide navigation */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => goSlide(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => goSlide(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>

              {/* Slide dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (intervalRef.current) clearInterval(intervalRef.current);
                      setSlideIdx(i);
                      startAutoSlide();
                    }}
                    className={`rounded-full transition-all ${
                      i === slideIdx
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {/* Slide counter */}
              <div className="absolute top-3 right-12 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/70 text-xs">
                {slideIdx + 1} / {slides.length}
              </div>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Verified badge */}
          {details?.is_verified && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: primaryColor, color: buttonTextColor }}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified
            </div>
          )}

          {/* Loading shimmer overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: primaryColor, borderTopColor: "transparent" }}
              />
            </div>
          )}
        </div>

        {/* ── Studio Video ─────────────────────────────────────── */}
        {details?.video_url && (
          <div className="border-b border-white/5">
            {!showVideo ? (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${primaryColor}20` }}
                >
                  <Play className="w-5 h-5 ml-0.5" style={{ color: primaryColor }} />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">Watch Studio Tour</p>
                  <p className="text-white/40 text-xs">See the studio in action</p>
                </div>
              </button>
            ) : (
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  src={details.video_url}
                  className="w-full max-h-64 object-contain"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={() => setIsVideoPlaying(false)}
                  playsInline
                  autoPlay
                  onPlay={() => setIsVideoPlaying(true)}
                />
                {!isVideoPlaying && (
                  <button
                    onClick={toggleVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3">
                    <button onClick={toggleVideo} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                      {isVideoPlaying
                        ? <Pause className="w-4 h-4 text-white" />
                        : <Play className="w-4 h-4 text-white" />
                      }
                    </button>
                    <div
                      className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer"
                      onClick={handleVideoSeek}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${videoProgress}%`, background: primaryColor }}
                      />
                    </div>
                    <button onClick={toggleVideoMute} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                      {isVideoMuted
                        ? <VolumeX className="w-4 h-4 text-white" />
                        : <Volume2 className="w-4 h-4 text-white" />
                      }
                    </button>
                    <button
                      onClick={() => { setShowVideo(false); setIsVideoPlaying(false); setVideoProgress(0); }}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5 bg-[#111111]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {displayName}
                </h2>
                {(displayCity || displayAddress) && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-white/50 text-sm">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                    <span className="truncate">
                      {[displayAddress, displayCity].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>
              {minPrice !== null && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-white/40 mb-0.5">Starting from</p>
                  <p className="text-xl font-bold" style={{ color: primaryColor }}>
                    ₹{minPrice.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-white/40">/hr</span>
                  </p>
                </div>
              )}
            </div>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-4 mt-3 text-white/50 text-xs">
              {activeRooms.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Up to {Math.max(...activeRooms.map((r) => r.capacity))} people
                </span>
              )}
              {activeRooms.length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Min {Math.min(...activeRooms.map((r) => r.min_booking_hours || 1))} hr booking
                </span>
              )}
              {details?.is_verified && (
                <span className="flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  <span style={{ color: primaryColor }}>Verified Studio</span>
                </span>
              )}
            </div>
          </div>

        {/* Description */}
        {(details?.description || details?.short_description) && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">About Studio</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {details.description || details.short_description}
              </p>
          </div>
        )}

        {/* Rooms */}
        {activeRooms.length > 0 && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Rooms ({activeRooms.length})
            </h3>
              <div className="space-y-2">
                {activeRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{room.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {room.capacity > 0 && (
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Up to {room.capacity}
                          </span>
                        )}
                        {room.min_booking_hours > 0 && (
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Min {room.min_booking_hours} hr
                          </span>
                        )}
                        {room.description && (
                          <span className="text-white/30 text-xs truncate">{room.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="font-bold text-base" style={{ color: primaryColor }}>
                        ₹{room.price_per_hour.toLocaleString("en-IN")}
                      </span>
                      <span className="text-white/40 text-xs">/hr</span>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Amenities */}
        {details?.amenities && details.amenities.length > 0 && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Amenities ({details.amenities.length})
            </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {details.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5"
                  >
                    <span style={{ color: primaryColor }}>
                      <AmenityIcon name={amenity.name} />
                    </span>
                    <span className="text-white/70 text-sm capitalize">{amenity.name}</span>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Equipment */}
        {details?.equipment && details.equipment.length > 0 && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Equipment ({details.equipment.length})
            </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {details.equipment.map((item: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5"
                  >
                    <span style={{ color: primaryColor }}>
                      <EquipmentIcon name={item} />
                    </span>
                    <span className="text-white/70 text-sm capitalize">{item}</span>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Add-ons */}
        {details?.addons && details.addons.length > 0 && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Add-ons ({details.addons.length})
            </h3>
              <div className="space-y-2">
                {details.addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{addon.name}</p>
                      {addon.description && (
                        <p className="text-white/40 text-xs mt-0.5 truncate">{addon.description}</p>
                      )}
                    </div>
                    {addon.price > 0 && (
                      <span className="flex-shrink-0 font-semibold text-sm" style={{ color: primaryColor }}>
                        +₹{addon.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* Other details */}
        {(details?.address || details?.city || details?.state || details?.country) && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Other Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.address && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <p className="text-white/35 text-xs mb-0.5">Address</p>
                  <p className="text-white/75 text-sm">{details.address}</p>
                </div>
              )}
              {details.city && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <p className="text-white/35 text-xs mb-0.5">City</p>
                  <p className="text-white/75 text-sm">{details.city}</p>
                </div>
              )}
              {details.state && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <p className="text-white/35 text-xs mb-0.5">State</p>
                  <p className="text-white/75 text-sm">{details.state}</p>
                </div>
              )}
              {details.country && (
                <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <p className="text-white/35 text-xs mb-0.5">Country</p>
                  <p className="text-white/75 text-sm">{details.country}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact info */}
        {(details?.phone || details?.email || details?.website) && (
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Contact
            </h3>
              <div className="flex flex-wrap gap-3">
                {details.phone && (
                  <a
                    href={`tel:${details.phone}`}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    {details.phone}
                  </a>
                )}
                {details.email && (
                  <a
                    href={`mailto:${details.email}`}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    {details.email}
                  </a>
                )}
                {details.website && (
                  <a
                    href={details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    Website
                  </a>
                )}
              </div>
          </div>
        )}

        {/* Bottom padding so sticky bar doesn't cover last content */}
        <div className="h-4" />

        {/* ── Sticky Book Now Bar ───────────────────────────── */}
        <div className="sticky bottom-0 px-5 py-4 bg-[#111111]/95 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center gap-3">
            {minPrice !== null && (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40">Starting from</p>
                <p className="text-lg font-bold" style={{ color: primaryColor }}>
                  ₹{minPrice.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-white/40">/hr</span>
                </p>
              </div>
            )}
            <Button
              onClick={onBookNow}
              className="flex-1 sm:flex-none sm:px-10 py-6 text-base font-bold rounded-2xl border-0 transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                color: buttonTextColor,
                boxShadow: `0 4px 20px ${primaryColor}30`,
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
