"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MapPin, Clock, Users, Star, ArrowRight, Phone, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
  rooms: {
    id: string;
    name: string;
    capacity: number;
    price_per_hour: number;
    min_booking_hours: number;
    is_active: boolean;
  }[];
}

interface Branding {
  brand_name: string;
  partner_slug: string;
  logo_url: string;
  tagline: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  button_text_color: string;
  booking_page_title: string;
  booking_page_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  partner_id: string;
}

export default function WhiteLabelBookingPage() {
  const { partner_slug } = useParams<{ partner_slug: string }>();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
      </div>
    );
  }

  if (error || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold opacity-60">Partner not found</p>
          <p className="text-sm opacity-40 mt-2">This booking page is not available.</p>
        </div>
      </div>
    );
  }

  const primary = branding.primary_color || "#D9FC67";
  const btnText = branding.button_text_color || "#000000";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${primary} 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {branding.booking_page_title || `Book with ${branding.brand_name}`}
          </h1>
          {(branding.booking_page_description || branding.tagline) && (
            <p className="text-lg opacity-60 mb-8 max-w-xl mx-auto">
              {branding.booking_page_description || branding.tagline}
            </p>
          )}
          <div
            className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
            style={{ background: `${primary}20`, color: primary, border: `1px solid ${primary}30` }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
            {studios.length} Studio{studios.length !== 1 ? "s" : ""} Available
          </div>
        </div>
      </section>

      {/* Studios Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {studios.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl font-medium">No studios available yet</p>
              <p className="text-sm mt-2">Check back soon or contact us directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studios.map((studio) => {
                const minPrice = studio.rooms?.length > 0
                  ? Math.min(...studio.rooms.filter((r) => r.is_active).map((r) => r.price_per_hour))
                  : null;

                return (
                  <div
                    key={studio.id}
                    className="rounded-2xl overflow-hidden border transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Studio image */}
                    <div className="relative h-48 overflow-hidden">
                      {studio.featured_image_url ? (
                        <img
                          src={studio.featured_image_url}
                          alt={studio.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-20"
                          style={{ background: `${primary}15` }}
                        >
                          {studio.name[0]}
                        </div>
                      )}
                      {studio.is_verified && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${primary}`, color: btnText }}
                        >
                          <Star className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Studio info */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-1">{studio.name}</h3>
                      {studio.short_description && (
                        <p className="text-sm opacity-50 mb-3 line-clamp-2">{studio.short_description}</p>
                      )}
                      <div className="flex items-center gap-1 text-sm opacity-40 mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{studio.city}{studio.address ? `, ${studio.address}` : ""}</span>
                      </div>

                      {/* Rooms preview */}
                      {studio.rooms && studio.rooms.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {studio.rooms.filter((r) => r.is_active).slice(0, 2).map((room) => (
                            <div
                              key={room.id}
                              className="flex items-center justify-between text-sm p-2 rounded-lg"
                              style={{ background: "rgba(255,255,255,0.05)" }}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 opacity-40" />
                                <span className="opacity-70">{room.name}</span>
                              </div>
                              <span className="font-semibold" style={{ color: primary }}>
                                ₹{room.price_per_hour.toLocaleString()}/hr
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {minPrice !== null && (
                          <div>
                            <span className="text-xs opacity-40">Starting from</span>
                            <p className="font-bold" style={{ color: primary }}>₹{minPrice.toLocaleString()}/hr</p>
                          </div>
                        )}
                        <a
                          href={`/book?studio=${studio.slug}&partner=${partner_slug}&source=whitelabel`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                          style={{ background: primary, color: btnText }}
                        >
                          Book Now
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      {(branding.contact_email || branding.contact_phone || branding.contact_address) && (
        <section
          className="px-6 py-12"
          style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {branding.contact_phone && (
                <a
                  href={`tel:${branding.contact_phone}`}
                  className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `${primary}20` }}
                  >
                    <Phone className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  {branding.contact_phone}
                </a>
              )}
              {branding.contact_email && (
                <a
                  href={`mailto:${branding.contact_email}`}
                  className="flex items-center gap-3 text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `${primary}20` }}
                  >
                    <Mail className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  {branding.contact_email}
                </a>
              )}
              {branding.contact_address && (
                <div className="flex items-center gap-3 text-sm opacity-70">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `${primary}20` }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  {branding.contact_address}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
