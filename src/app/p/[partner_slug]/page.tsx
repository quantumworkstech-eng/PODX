"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudioDetailModal } from "@/components/StudioDetailModal";
import {
  MapPin,
  Users,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Mic,
  Camera,
  Headphones,
  Wifi,
  Shield,
  Zap,
  Globe,
  Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

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
  is_verified: boolean;
  rooms: Room[];
}

interface Branding {
  brand_name: string;
  partner_slug: string;
  logo_url: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_text_color: string;
  booking_page_title: string;
  booking_page_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  website_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  partner_id: string;
}

// ── Feature list ───────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Mic, label: "Professional Equipment", desc: "Studio-grade microphones, mixers, and monitors" },
  { icon: Headphones, label: "Acoustic Treatment", desc: "Soundproofed rooms for crystal-clear recordings" },
  { icon: Camera, label: "Video-Ready Setup", desc: "4K cameras and lighting for video podcasts" },
  { icon: Wifi, label: "High-Speed Internet", desc: "Reliable connection for remote interviews" },
  { icon: Shield, label: "Secure Booking", desc: "Razorpay-secured payments & instant confirmation" },
  { icon: Zap, label: "Instant Availability", desc: "Real-time slot availability and instant booking" },
];

// ── Main component ─────────────────────────────────────────────────────────

export default function WhiteLabelLandingPage() {
  const { partner_slug } = useParams<{ partner_slug: string }>();
  const router = useRouter();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const studiosRef = useRef<HTMLElement>(null);
  const [detailStudioId, setDetailStudioId] = useState<string | null>(null);
  const [detailStudio, setDetailStudio] = useState<Studio | null>(null);

  useEffect(() => {
    fetch(`/api/whitelabel/${partner_slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Partner not found");
        return r.json();
      })
      .then(({ branding, studios }) => {
        setBranding(branding);
        setStudios(studios);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [partner_slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--wl-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <Globe className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-2xl font-bold mb-2" style={{ opacity: 0.6 }}>
            Page Not Found
          </p>
          <p className="text-sm" style={{ opacity: 0.4 }}>
            This booking page is not available or has been taken offline.
          </p>
        </div>
      </div>
    );
  }

  const primary = branding.primary_color || "#D9FC67";
  const btnText = branding.button_text_color || "#000000";
  const secondary = branding.secondary_color || "#0a0a0a";

  const handleBookNow = (studio: Studio) => {
    // Store the studio in sessionStorage in the format expected by book page
    const activeRooms = studio.rooms?.filter((r) => r.is_active) || [];
    const minPrice = activeRooms.length > 0 ? Math.min(...activeRooms.map((r) => r.price_per_hour)) : 0;
    const maxCap = activeRooms.length > 0 ? Math.max(...activeRooms.map((r) => r.capacity)) : 2;
    const studioForSession = {
      id: studio.id,
      name: studio.name,
      slug: studio.slug,
      cover_image: studio.featured_image_url || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&q=90",
      location: { city: studio.city || "", area: studio.city || "", address: studio.address || "" },
      price_per_hour: minPrice,
      currency: "₹",
      capacity: maxCap,
      equipment: [],
      rating: 0,
      review_count: 0,
      is_instant_bookable: true,
      description: studio.short_description || studio.description || "",
      amenities: ["WiFi", "AC", "Parking"],
    };
    sessionStorage.setItem("yanisa_preselected_studio", JSON.stringify(studioForSession));
    router.push(`/book?preselect=1&partner=${branding.partner_slug}&source=whitelabel`);
  };

  const scrollToStudios = () => {
    studiosRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}25 0%, transparent 70%)`,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${primary} 1px, transparent 1px), linear-gradient(90deg, ${primary} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: `${primary}15`, color: primary, border: `1px solid ${primary}25` }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
            {studios.length} Studio{studios.length !== 1 ? "s" : ""} Available · Book Instantly
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ letterSpacing: "-0.02em" }}
          >
            {branding.booking_page_title || `Book with ${branding.brand_name}`}
          </h1>

          {/* Subheading */}
          {(branding.booking_page_description || branding.tagline) && (
            <p
              className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ opacity: 0.6 }}
            >
              {branding.booking_page_description || branding.tagline}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToStudios}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105 hover:shadow-lg"
              style={{
                background: primary,
                color: btnText,
                boxShadow: `0 0 40px ${primary}30`,
              }}
            >
              Browse Studios
              <ArrowRight className="w-5 h-5" />
            </button>
            {branding.contact_email && (
              <a
                href={`mailto:${branding.contact_email}`}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Mail className="w-5 h-5" style={{ opacity: 0.6 }} />
                Get in Touch
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={scrollToStudios}
          style={{ opacity: 0.3 }}
        >
          <div className="w-px h-10" style={{ background: `linear-gradient(to bottom, transparent, currentColor)` }} />
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div
        className="px-6 py-8"
        style={{ background: `${secondary}`, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: `${studios.length}+`, label: "Studios" },
            { value: "100%", label: "Verified" },
            { value: "24/7", label: "Support" },
            { value: "Instant", label: "Booking" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: primary }}>
                {value}
              </p>
              <p className="text-sm" style={{ opacity: 0.5 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Studios Section ──────────────────────────────────────── */}
      <section ref={studiosRef} className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
              Our Spaces
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Studio
            </h2>
            <p className="max-w-xl mx-auto" style={{ opacity: 0.5 }}>
              Professional recording environments designed for creators, podcasters, and content teams.
            </p>
          </div>

          {studios.length === 0 ? (
            <div className="text-center py-24" style={{ opacity: 0.4 }}>
              <Calendar className="w-14 h-14 mx-auto mb-5" />
              <p className="text-xl font-semibold mb-2">No Studios Available Yet</p>
              <p className="text-sm">Check back soon or contact us for custom arrangements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((studio) => {
                const activeRooms = studio.rooms?.filter((r) => r.is_active) || [];
                const minPrice =
                  activeRooms.length > 0
                    ? Math.min(...activeRooms.map((r) => r.price_per_hour))
                    : null;
                const maxCap =
                  activeRooms.length > 0
                    ? Math.max(...activeRooms.map((r) => r.capacity))
                    : null;

                return (
                  <div
                    key={studio.id}
                    className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Studio image */}
                    <div className="relative h-52 overflow-hidden">
                      {studio.featured_image_url ? (
                        <img
                          src={studio.featured_image_url}
                          alt={studio.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-5xl font-black"
                          style={{ background: `${primary}10`, color: `${primary}30` }}
                        >
                          {studio.name[0]}
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div
                        className="absolute inset-0"
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
                      {/* City tag on image */}
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

                    {/* Studio info */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-1">{studio.name}</h3>

                      {studio.short_description && (
                        <p className="text-sm mb-4 line-clamp-2" style={{ opacity: 0.5 }}>
                          {studio.short_description}
                        </p>
                      )}

                      {/* Room previews */}
                      {activeRooms.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          {activeRooms.slice(0, 2).map((room) => (
                            <div
                              key={room.id}
                              className="flex items-center justify-between text-sm px-3 py-2 rounded-xl"
                              style={{ background: "rgba(255,255,255,0.04)" }}
                            >
                              <div className="flex items-center gap-2" style={{ opacity: 0.7 }}>
                                <Users className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />
                                <span>{room.name}</span>
                                {room.capacity > 0 && (
                                  <span className="text-xs" style={{ opacity: 0.4 }}>
                                    · up to {room.capacity}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-sm" style={{ color: primary }}>
                                ₹{room.price_per_hour.toLocaleString()}/hr
                              </span>
                            </div>
                          ))}
                          {activeRooms.length > 2 && (
                            <p className="text-xs pl-1" style={{ opacity: 0.35 }}>
                              +{activeRooms.length - 2} more room{activeRooms.length - 2 !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          {minPrice !== null && (
                            <>
                              <p className="text-xs" style={{ opacity: 0.35 }}>
                                Starting from
                              </p>
                              <p className="font-bold text-lg" style={{ color: primary }}>
                                ₹{minPrice.toLocaleString()}
                                <span className="text-sm font-normal" style={{ opacity: 0.6 }}>
                                  /hr
                                </span>
                              </p>
                            </>
                          )}
                          {maxCap !== null && maxCap > 0 && (
                            <p className="text-xs mt-0.5" style={{ opacity: 0.35 }}>
                              Up to {maxCap} people
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* View Details icon button */}
                          <button
                            onClick={() => {
                              setDetailStudio(studio);
                              setDetailStudioId(studio.id);
                            }}
                            title="View studio details"
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          >
                            <Info className="w-4 h-4" style={{ opacity: 0.6 }} />
                          </button>
                          <button
                            onClick={() => handleBookNow(studio)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:shadow-lg"
                            style={{
                              background: primary,
                              color: btnText,
                              boxShadow: `0 4px 20px ${primary}20`,
                            }}
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

      {/* ── Features Section ─────────────────────────────────────── */}
      <section
        className="px-6 py-20"
        style={{ background: `${secondary}`, borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
              Why Choose Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Create
            </h2>
            <p className="max-w-xl mx-auto" style={{ opacity: 0.5 }}>
              From intimate podcast recordings to full-scale video productions — we have the gear, space, and expertise.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${primary}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: primary }} />
                </div>
                <h3 className="font-semibold mb-1.5">{label}</h3>
                <p className="text-sm" style={{ opacity: 0.5 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">Book in 3 Easy Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choose Your Studio", desc: "Browse our curated spaces and pick the one that fits your vibe and budget." },
              { step: "02", title: "Select Date & Time", desc: "Pick your preferred slot from real-time availability. No waiting, no back-and-forth." },
              { step: "03", title: "Pay & Create", desc: "Secure payment via Razorpay. Get instant confirmation and show up ready to record." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div
                  className="text-6xl font-black mb-4 leading-none"
                  style={{ color: `${primary}15` }}
                >
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm" style={{ opacity: 0.5 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary}20 0%, ${primary}05 100%)`,
              border: `1px solid ${primary}20`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 100%, ${primary}15 0%, transparent 70%)`,
              }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Record Your Next Episode?
              </h2>
              <p className="text-lg mb-8 max-w-xl mx-auto" style={{ opacity: 0.6 }}>
                Join hundreds of creators who trust {branding.brand_name} for their recording needs.
              </p>
              <button
                onClick={scrollToStudios}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
                style={{
                  background: primary,
                  color: btnText,
                  boxShadow: `0 8px 40px ${primary}30`,
                }}
              >
                <Calendar className="w-5 h-5" />
                Book a Studio Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio Detail Modal ──────────────────────────────────── */}
      <StudioDetailModal
        studioId={detailStudioId}
        studioName={detailStudio?.name}
        coverImage={detailStudio?.featured_image_url}
        onClose={() => { setDetailStudioId(null); setDetailStudio(null); }}
        onBookNow={() => {
          if (detailStudio) handleBookNow(detailStudio);
          setDetailStudioId(null);
          setDetailStudio(null);
        }}
        primaryColor={primary}
        buttonTextColor={btnText}
      />

      {/* ── Contact Section ──────────────────────────────────────── */}
      {(branding.contact_email || branding.contact_phone || branding.contact_address) && (
        <section
          className="px-6 py-16"
          style={{
            background: `${secondary}`,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
                Get in Touch
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Have Questions?</h2>
              <p style={{ opacity: 0.5 }}>
                We&rsquo;re happy to help you find the perfect studio for your needs.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {branding.contact_phone && (
                <a
                  href={`tel:${branding.contact_phone}`}
                  className="flex items-center gap-3 text-sm transition-all hover:scale-105"
                  style={{ opacity: 0.7 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${primary}15` }}
                  >
                    <Phone className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>
                      Call Us
                    </p>
                    <p className="font-semibold">{branding.contact_phone}</p>
                  </div>
                </a>
              )}
              {branding.contact_email && (
                <a
                  href={`mailto:${branding.contact_email}`}
                  className="flex items-center gap-3 text-sm transition-all hover:scale-105"
                  style={{ opacity: 0.7 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${primary}15` }}
                  >
                    <Mail className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>
                      Email Us
                    </p>
                    <p className="font-semibold">{branding.contact_email}</p>
                  </div>
                </a>
              )}
              {branding.contact_address && (
                <div
                  className="flex items-center gap-3 text-sm"
                  style={{ opacity: 0.7 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${primary}15` }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>
                      Visit Us
                    </p>
                    <p className="font-semibold">{branding.contact_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
