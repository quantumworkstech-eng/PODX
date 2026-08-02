"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  X, MapPin, Users, Clock, Phone, Mail, Globe, BadgeCheck, Building2,
  Star, Package, CalendarClock, RefreshCw, Wallet, ImageIcon, Video as VideoIcon,
  ChevronLeft, ChevronRight, ShieldCheck, ListChecks, Sparkles, Tag,
} from "lucide-react";
import { getVideoInfo } from "@/components/StudioCardMedia";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NUM_TO_NAME: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

interface RoomSetup {
  name: string;
  description?: string;
  capacity?: number;
  price_per_hour?: number;
  image?: string | null;
  is_active?: boolean;
  min_booking_hours?: number;
  max_booking_hours?: number;
}
interface PackageItem {
  name: string;
  description?: string;
  price_per_hour?: number;
  discount_percentage?: number;
  features?: Array<{ text: string; included: boolean } | string>;
  is_popular?: boolean;
}
interface AddonItem { name: string; description?: string; price?: number; category?: string }
interface PolicyItem { hours_before?: number; refund_percentage?: number; description?: string }

interface NormalizedStudio {
  name: string;
  shortDescription: string;
  fullDescription: string;
  status: string;
  reviewStatus: string;
  isVerified?: boolean;
  slug?: string;
  ownerName?: string;
  ownerEmail?: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  website?: string;
  images: string[];
  videoUrl?: string;
  capacity?: number;
  pricePerHour?: number;
  originalPricePerHour?: number | null;
  bufferMinutes?: number;
  rescheduleCutoffHours?: number;
  availableDays: string[];
  workingHours?: { start: string; end: string };
  rooms: RoomSetup[];
  packages: PackageItem[];
  amenities: Array<{ name: string; category?: string }>;
  equipment: string[];
  addons: AddonItem[];
  policies: PolicyItem[];
}

export interface StudioFullDetailModalProps {
  studioId: string | null | undefined;
  source: "admin" | "partner";
  onClose: () => void;
}

const money = (n?: number | null) =>
  n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;

function normalizeAdmin(data: any, pub: any): NormalizedStudio {
  const s = data.studio || {};
  const openHours = (data.hours || []).filter((h: any) => h.is_closed !== true);
  const availableDays = openHours
    .map((h: any) => DAY_NUM_TO_NAME[Number(h.day_of_week)])
    .filter(Boolean);
  const first = openHours[0];
  const addons: AddonItem[] = (data.allAddons || [])
    .filter((a: any) => (data.studioAddonIds || []).includes(a.id))
    .map((a: any) => ({ name: a.name, description: a.description, price: a.price, category: a.category }));
  return {
    name: s.name || "",
    shortDescription: s.short_description || "",
    fullDescription: s.description || "",
    status: s.is_active ? "active" : "inactive",
    reviewStatus: s.review_status || "",
    isVerified: s.is_verified,
    slug: s.slug,
    ownerName: s.owner_name,
    ownerEmail: s.owner_email,
    address: s.address || "",
    city: s.city || "",
    state: s.state || "",
    country: s.country || "",
    postalCode: s.postal_code || "",
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    phone: s.phone || "",
    email: s.email || "",
    website: s.website || "",
    images: (data.images || []).map((i: any) => i.image_url).filter(Boolean),
    videoUrl: s.video_url || pub?.video_url || "",
    capacity: s.capacity,
    pricePerHour: pub?.price_per_hour ?? s.price_per_hour,
    originalPricePerHour: pub?.original_price_per_hour ?? null,
    bufferMinutes: s.buffer_minutes ?? 0,
    rescheduleCutoffHours: s.reschedule_cutoff_hours ?? 48,
    availableDays,
    workingHours: first
      ? { start: (first.open_time || "").slice(0, 5) || "09:00", end: (first.close_time || "").slice(0, 5) || "21:00" }
      : undefined,
    rooms: (data.rooms || []).map((r: any) => ({
      name: r.name || "Room", description: r.description, capacity: r.capacity,
      price_per_hour: r.price_per_hour, is_active: r.is_active !== false,
    })),
    packages: data.packages || [],
    amenities: (data.studioAmenities || []).map((a: any) => ({ name: a.name, category: a.category })),
    equipment: (pub?.equipment && pub.equipment.length ? pub.equipment : s.equipment) || [],
    addons: addons.length ? addons : (pub?.addons || []).map((a: any) => ({ name: a.name, description: a.description, price: a.price, category: a.category })),
    policies: data.policies || [],
  };
}

function normalizePartner(data: any, pub: any, policies: any[]): NormalizedStudio {
  const s = data.studio || {};
  return {
    name: s.name || "",
    shortDescription: s.short_description || "",
    fullDescription: s.full_description || "",
    status: s.status || (s.is_active ? "active" : "inactive"),
    reviewStatus: s.review_status || "",
    isVerified: pub?.is_verified,
    slug: pub?.slug,
    address: s.address || "",
    city: s.city || "",
    state: s.state || "",
    country: s.country || "",
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    phone: pub?.phone || "",
    email: pub?.email || "",
    website: pub?.website || "",
    images: s.images || [],
    videoUrl: s.video_url || pub?.video_url || "",
    capacity: s.capacity,
    pricePerHour: pub?.price_per_hour ?? s.price_per_hour,
    originalPricePerHour: pub?.original_price_per_hour ?? null,
    bufferMinutes: s.buffer_minutes ?? 0,
    rescheduleCutoffHours: s.reschedule_cutoff_hours ?? 48,
    availableDays: s.availableDays || [],
    workingHours: s.workingHours,
    rooms: (s.setups || []).map((r: any) => ({
      name: r.name || "Setup", description: r.description, capacity: r.capacity,
      price_per_hour: r.price_per_hour, image: r.featured_image_url, is_active: r.is_active !== false,
    })),
    packages: s.packages || [],
    amenities: (pub?.amenities || []).map((a: any) => ({ name: a.name, category: a.category })),
    equipment: (pub?.equipment && pub.equipment.length ? pub.equipment : s.equipment) || [],
    addons: (pub?.addons || []).map((a: any) => ({ name: a.name, description: a.description, price: a.price, category: a.category })),
    policies: (policies || []).map((p: any) => ({
      hours_before: p.hours_before, refund_percentage: p.refund_percentage, description: p.description,
    })),
  };
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-b border-white/5">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        <Icon className="w-4 h-4" /> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === "" ) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
      <p className="text-white/35 text-xs mb-0.5">{label}</p>
      <p className="text-white/80 text-sm break-words">{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-white/5 text-white/40 border-white/10",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  pending_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paused: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  deleted: "bg-white/5 text-white/30 border-white/10",
};

export function StudioFullDetailModal({ studioId, source, onClose }: StudioFullDetailModalProps) {
  const [data, setData] = useState<NormalizedStudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!studioId) { setData(null); setErr(null); return; }
    let cancelled = false;
    setLoading(true); setErr(null); setData(null); setGalleryIdx(0);
    (async () => {
      try {
        const editUrl = source === "admin" ? `/api/admin/studios/${studioId}` : `/api/partner/studios/${studioId}`;
        const [editRes, pubRes, polRes] = await Promise.all([
          fetch(editUrl),
          fetch(`/api/studios/${studioId}`).catch(() => null),
          source === "partner" ? fetch(`/api/studios/${studioId}/policy`).catch(() => null) : Promise.resolve(null),
        ]);
        if (!editRes.ok) throw new Error("Could not load studio details.");
        const edit = await editRes.json();
        const pub = pubRes && pubRes.ok ? await pubRes.json() : null;
        const pol = polRes && (polRes as Response).ok ? await (polRes as Response).json() : null;
        const policies = Array.isArray(pol) ? pol : pol?.policies || pol?.rules || [];
        const normalized = source === "admin" ? normalizeAdmin(edit, pub) : normalizePartner(edit, pub, policies);
        if (!cancelled) setData(normalized);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studioId, source]);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (!studioId) return;
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        const n = data?.images.length || 0;
        if (e.key === "Escape") setLightbox(null);
        else if (e.key === "ArrowLeft") setLightbox((i) => (i === null || n === 0 ? i : (i - 1 + n) % n));
        else if (e.key === "ArrowRight") setLightbox((i) => (i === null || n === 0 ? i : (i + 1) % n));
        return;
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [studioId, lightbox, data?.images.length, onClose]);

  useEffect(() => {
    if (studioId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [studioId]);

  if (!studioId) return null;

  const tourVideo = data?.videoUrl
    ? getVideoInfo(data.videoUrl, { controls: true, muted: false, loop: false })
    : null;
  const sortedDays = data ? [...data.availableDays].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)) : [];

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full sm:w-[92vw] sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] bg-[#111111] rounded-t-3xl sm:rounded-3xl overflow-y-auto border border-white/10 shadow-2xl">
          {/* Gallery */}
          <div className="relative w-full aspect-video bg-black">
            {data && data.images.length > 0 ? (
              <button type="button" onClick={() => setLightbox(galleryIdx)} className="group/g absolute inset-0 w-full h-full cursor-zoom-in" aria-label="Open image">
                <Image key={data.images[galleryIdx]} src={data.images[galleryIdx]} alt={data.name} fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                {loading ? (
                  <div className="w-8 h-8 rounded-full border-2 border-[#D9FC67] border-t-transparent animate-spin" />
                ) : (
                  <Building2 className="w-12 h-12 text-white/15" />
                )}
              </div>
            )}
            {data && data.images.length > 1 && (
              <>
                <button onClick={() => setGalleryIdx((i) => (i - 1 + data.images.length) % data.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 text-white"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setGalleryIdx((i) => (i + 1) % data.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 text-white"><ChevronRight className="w-5 h-5" /></button>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white/70 text-xs">{galleryIdx + 1} / {data.images.length}</div>
              </>
            )}
            <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white">{data?.name || "Studio"}</h2>
                <p className="flex items-center gap-1.5 text-white/50 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{[data?.address, data?.city].filter(Boolean).join(", ") || "—"}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end flex-shrink-0">
                {data?.status && <span className={`px-2.5 py-1 rounded-full text-xs border ${STATUS_COLORS[data.status] || STATUS_COLORS.inactive}`}>{data.status}</span>}
                {data?.reviewStatus && <span className={`px-2.5 py-1 rounded-full text-xs border ${STATUS_COLORS[data.reviewStatus] || "bg-white/5 text-white/50 border-white/10"}`}>{data.reviewStatus.replace(/_/g, " ")}</span>}
                {data?.isVerified && <span className="px-2.5 py-1 rounded-full text-xs border bg-[#D9FC67]/10 text-[#D9FC67] border-[#D9FC67]/20 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Up to {data?.capacity ?? "—"}</span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                {data?.originalPricePerHour && data.pricePerHour != null && data.originalPricePerHour > data.pricePerHour && (
                  <span className="text-white/30 line-through mr-1">{money(data.originalPricePerHour)}</span>
                )}
                <span className="text-[#D9FC67] font-semibold">{money(data?.pricePerHour)}</span>/hr
              </span>
            </div>
          </div>

          {loading && !data && (
            <div className="px-5 py-10 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-[#D9FC67] border-t-transparent animate-spin" /></div>
          )}
          {err && <div className="px-5 py-6 text-red-400 text-sm">{err}</div>}

          {data && (
            <>
              {/* About */}
              {(data.shortDescription || data.fullDescription) && (
                <Section icon={ListChecks} title="About">
                  {data.shortDescription && <p className="text-white/70 text-sm mb-2">{data.shortDescription}</p>}
                  {data.fullDescription && data.fullDescription !== data.shortDescription && (
                    <p className="text-white/50 text-sm whitespace-pre-line">{data.fullDescription}</p>
                  )}
                </Section>
              )}

              {/* Location */}
              <Section icon={MapPin} title="Location">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoRow label="Address" value={data.address} />
                  <InfoRow label="City" value={data.city} />
                  <InfoRow label="State" value={data.state} />
                  <InfoRow label="Country" value={data.country} />
                  <InfoRow label="Postal Code" value={data.postalCode} />
                  {(data.latitude != null && data.longitude != null) && (
                    <InfoRow label="Coordinates" value={`${data.latitude}, ${data.longitude}`} />
                  )}
                </div>
              </Section>

              {/* Contact */}
              {(data.phone || data.email || data.website) && (
                <Section icon={Phone} title="Contact">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.phone && <InfoRow label="Phone" value={<span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-white/40" />{data.phone}</span>} />}
                    {data.email && <InfoRow label="Email" value={<span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-white/40" />{data.email}</span>} />}
                    {data.website && <InfoRow label="Website" value={<span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-white/40" />{data.website}</span>} />}
                  </div>
                </Section>
              )}

              {/* Video */}
              {tourVideo && (
                <Section icon={VideoIcon} title="Studio Video">
                  {tourVideo.isEmbedded ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden">
                      <iframe src={tourVideo.embedUrl} title="Studio tour" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full border-0" />
                    </div>
                  ) : (
                    <video src={tourVideo.embedUrl} controls playsInline className="w-full max-h-72 rounded-xl bg-black" />
                  )}
                </Section>
              )}

              {/* Pricing & Packages */}
              {data.packages.length > 0 && (
                <Section icon={Package} title={`Packages (${data.packages.length})`}>
                  <div className="space-y-2.5">
                    {data.packages.map((p, i) => {
                      const disc = Number(p.discount_percentage) || 0;
                      const base = Number(p.price_per_hour) || 0;
                      const discounted = disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
                      return (
                        <div key={i} className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{p.name}</p>
                              {p.is_popular && <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#D9FC67]/15 text-[#D9FC67]"><Star className="w-3 h-3" /> Best deal</span>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              {disc > 0 && <span className="text-white/30 text-xs line-through mr-1.5">{money(base)}</span>}
                              <span className="text-[#D9FC67] font-semibold text-sm">{money(discounted)}</span>
                              <span className="text-white/40 text-xs">/hr</span>
                              {disc > 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">{disc}% off</span>}
                            </div>
                          </div>
                          {p.description && <p className="text-white/40 text-xs mt-1">{p.description}</p>}
                          {Array.isArray(p.features) && p.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.features.map((f, fi) => {
                                const text = typeof f === "string" ? f : f.text;
                                const included = typeof f === "string" ? true : f.included;
                                return (
                                  <span key={fi} className={`text-[11px] px-2 py-0.5 rounded-full border ${included ? "bg-white/[0.06] border-white/10 text-white/60" : "bg-white/[0.02] border-white/5 text-white/25 line-through"}`}>{text}</span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Rooms / Setups */}
              {data.rooms.length > 0 && (
                <Section icon={Building2} title={`Rooms / Setups (${data.rooms.length})`}>
                  <div className="space-y-2">
                    {data.rooms.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/5 p-3">
                        {r.image ? (
                          <img src={r.image} alt={r.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><ImageIcon className="w-5 h-5 text-white/20" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium truncate">{r.name}</p>
                            {r.is_active === false && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">inactive</span>}
                          </div>
                          <p className="text-white/40 text-xs">
                            {r.capacity != null && <>Up to {r.capacity}</>}
                            {(r.min_booking_hours || r.max_booking_hours) && <> · {r.min_booking_hours ?? 1}–{r.max_booking_hours ?? 8} hrs</>}
                            {r.description ? ` · ${r.description}` : ""}
                          </p>
                        </div>
                        <span className="text-[#D9FC67] text-sm font-semibold flex-shrink-0">{money(r.price_per_hour)}<span className="text-white/40 text-xs">/hr</span></span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Amenities */}
              {data.amenities.length > 0 && (
                <Section icon={ShieldCheck} title={`Amenities (${data.amenities.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {data.amenities.map((a, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70">{a.name}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Equipment */}
              {data.equipment.length > 0 && (
                <Section icon={Sparkles} title={`Equipment (${data.equipment.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {data.equipment.map((e, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/70">{e}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Add-ons */}
              {data.addons.length > 0 && (
                <Section icon={Tag} title={`Add-ons (${data.addons.length})`}>
                  <div className="space-y-2">
                    {data.addons.map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{a.name}</p>
                          {a.description && <p className="text-white/40 text-xs truncate">{a.description}</p>}
                        </div>
                        {a.price != null && <span className="text-white/70 text-sm flex-shrink-0">+{money(a.price)}</span>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Availability */}
              {(sortedDays.length > 0 || data.workingHours) && (
                <Section icon={Clock} title="Availability">
                  {data.workingHours && (
                    <p className="text-white/70 text-sm mb-2">Working hours: <span className="text-white">{data.workingHours.start} – {data.workingHours.end}</span></p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_ORDER.map((d) => {
                      const open = sortedDays.includes(d);
                      return (
                        <span key={d} className={`text-xs px-2.5 py-1 rounded-full border ${open ? "bg-[#D9FC67]/10 border-[#D9FC67]/20 text-[#D9FC67]" : "bg-white/[0.02] border-white/5 text-white/25"}`}>{d}</span>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Booking settings */}
              <Section icon={CalendarClock} title="Booking Settings">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <InfoRow label="Max capacity" value={data.capacity != null ? `${data.capacity} people` : undefined} />
                  <InfoRow label="Buffer between bookings" value={`${data.bufferMinutes ?? 0} min`} />
                  <InfoRow label="Reschedule cutoff" value={`${data.rescheduleCutoffHours ?? 48} hrs`} />
                </div>
              </Section>

              {/* Cancellation policies */}
              {data.policies.length > 0 && (
                <Section icon={RefreshCw} title="Cancellation Policy">
                  <div className="space-y-1.5">
                    {data.policies.map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2 text-sm">
                        <span className="text-white/60">{p.description || `${p.hours_before ?? 0}+ hrs before`}</span>
                        <span className="text-white/80 font-medium">{p.refund_percentage ?? 0}% refund</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Ownership / meta */}
              {(data.ownerEmail || data.slug) && (
                <Section icon={Users} title="Ownership & Meta">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoRow label="Owner" value={data.ownerName || data.ownerEmail} />
                    <InfoRow label="Owner email" value={data.ownerEmail} />
                    <InfoRow label="Slug" value={data.slug} />
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {data && lightbox !== null && data.images[lightbox] && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X className="w-5 h-5" /></button>
          {data.images.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">{lightbox + 1} / {data.images.length}</div>
          )}
          {data.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? i : (i - 1 + data.images.length) % data.images.length)); }} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? i : (i + 1) % data.images.length)); }} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
          <div className="relative w-full max-w-6xl h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <Image key={data.images[lightbox]} src={data.images[lightbox]} alt={data.name} fill className="object-contain" sizes="100vw" priority />
          </div>
        </div>
      )}
    </>
  );
}
