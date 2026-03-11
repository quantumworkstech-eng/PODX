"use client";

import { useState, useEffect } from "react";
import {
  X, ChevronRight, ChevronLeft, Check, MapPin, Plus, Trash2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Location" },
  { id: 3, label: "Pricing & Hours" },
  { id: 4, label: "Amenities" },
  { id: 5, label: "Add-ons" },
  { id: 6, label: "Photos" },
  { id: 7, label: "Policies & Review" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

interface CancellationRule {
  id: string;
  type: "hours" | "days";
  value: number;
  refundPercent: number;
}

interface WizardData {
  name: string;
  owner_email: string;
  short_description: string;
  description: string;
  capacity: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  price_per_hour: string;
  workingDays: string[];
  openTime: string;
  closeTime: string;
  amenityIds: string[];
  imageUrls: string[];
  useCustomPolicies: boolean;
  cancellationRules: CancellationRule[];
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/20";
const labelCls = "text-white/40 text-xs uppercase tracking-wider block mb-1.5";

export function AdminAddStudioWizard({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: "", owner_email: "", short_description: "", description: "", capacity: "4",
    address: "", city: "", state: "", country: "India", latitude: "", longitude: "",
    price_per_hour: "1000",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openTime: "09:00", closeTime: "21:00",
    amenityIds: [], imageUrls: [],
    useCustomPolicies: false,
    cancellationRules: [
      { id: crypto.randomUUID(), type: "hours", value: 48, refundPercent: 100 },
      { id: crypto.randomUUID(), type: "hours", value: 24, refundPercent: 50 },
    ],
  });

  const [amenities, setAmenities] = useState<any[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);
  const [addons, setAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (step === 4) {
      setAmenitiesLoading(true);
      fetch("/api/admin/amenities")
        .then((r) => r.json())
        .then((d) => setAmenities(d.amenities || []))
        .catch(() => setAmenities([]))
        .finally(() => setAmenitiesLoading(false));
    }
    if (step === 5 && addons.length === 0) {
      setAddonsLoading(true);
      fetch("/api/admin/addons?active=true")
        .then((r) => r.json())
        .then((d) => setAddons(d.addons || []))
        .catch(() => setAddons([]))
        .finally(() => setAddonsLoading(false));
    }
  }, [step]);

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const geocode = async () => {
    if (!data.address && !data.city) return;
    setGeocoding(true);
    try {
      const q = [data.address, data.city, data.state, data.country].filter(Boolean).join(", ");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { "User-Agent": "YanisaStudio-Admin/1.0" } }
      );
      const results = await res.json();
      if (results[0]) {
        set("latitude", results[0].lat);
        set("longitude", results[0].lon);
      }
    } catch {}
    setGeocoding(false);
  };

  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!data.name.trim()) return "Studio name is required";
      if (!data.owner_email.trim()) return "Owner email is required";
    }
    if (s === 2) {
      if (!data.city.trim()) return "City is required";
    }
    if (s === 3) {
      if (!data.price_per_hour || Number(data.price_per_hour) <= 0) return "Valid price per hour is required";
      if (data.workingDays.length === 0) return "Select at least one working day";
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const back = () => { setError(null); setStep((s) => s - 1); };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create studio with basic info
      const res = await fetch("/api/admin/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          owner_email: data.owner_email,
          short_description: data.short_description || null,
          description: data.description || null,
          capacity: Number(data.capacity) || 4,
          address: data.address || null,
          city: data.city,
          state: data.state || null,
          country: data.country || "India",
          price_per_hour: Number(data.price_per_hour) || 1000,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to create studio");
        setSubmitting(false);
        return;
      }

      const studioId = result.studio.id;

      // 2. PATCH with hours, amenities, policies, images
      const dayNameToNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const hoursData = Object.entries(dayNameToNum).map(([name, num]) => ({
        day_of_week: num,
        open_time: data.openTime,
        close_time: data.closeTime,
        is_closed: !data.workingDays.includes(name),
      }));

      const policyUpdates = data.useCustomPolicies
        ? data.cancellationRules.map((r) => ({
            hours_before: r.type === "days" ? r.value * 24 : r.value,
            refund_percentage: r.refundPercent,
            description: `${r.refundPercent}% refund if cancelled ${r.value}+ ${r.type} before`,
          }))
        : [];

      const patchBody: Record<string, unknown> = {
        studioFields: {
          latitude: data.latitude ? Number(data.latitude) : null,
          longitude: data.longitude ? Number(data.longitude) : null,
        },
        amenityIds: data.amenityIds,
        hoursData,
        policyUpdates,
      };

      if (data.imageUrls.length > 0) {
        patchBody.imageUrls = data.imageUrls;
      }

      await fetch(`/api/admin/studios/${studioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create studio");
      setSubmitting(false);
    }
  };

  const toggleDay = (day: string) =>
    set("workingDays", data.workingDays.includes(day)
      ? data.workingDays.filter((d) => d !== day)
      : [...data.workingDays, day]);

  const toggleAmenity = (id: string) =>
    set("amenityIds", data.amenityIds.includes(id)
      ? data.amenityIds.filter((a) => a !== id)
      : [...data.amenityIds, id]);

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    set("imageUrls", [...data.imageUrls, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const removeImageUrl = (idx: number) =>
    set("imageUrls", data.imageUrls.filter((_, i) => i !== idx));

  const updateRule = (idx: number, patch: Partial<CancellationRule>) => {
    const rules = [...data.cancellationRules];
    rules[idx] = { ...rules[idx], ...patch };
    set("cancellationRules", rules);
  };

  // Group amenities by category
  const categories = Array.from(new Set(amenities.map((a: any) => a.category || "Other")));

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold text-lg">Add New Studio</h3>
            <p className="text-white/40 text-xs">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 py-3 border-b border-white/5 flex gap-1 overflow-x-auto flex-shrink-0">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                s.id === step ? "bg-white/10 text-white" :
                s.id < step ? "text-[#D9FC67]" : "text-white/30"
              )}
            >
              {s.id < step ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{s.id}</span>
              )}
              {s.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Studio Name *</label>
                <input
                  value={data.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Studio Alpha"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Owner Email *</label>
                <input
                  type="email"
                  value={data.owner_email}
                  onChange={(e) => set("owner_email", e.target.value)}
                  placeholder="owner@example.com"
                  className={inputCls}
                />
                <p className="text-white/30 text-xs mt-1">The owner must already have an account in the system</p>
              </div>
              <div>
                <label className={labelCls}>Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={data.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <input
                  value={data.short_description}
                  onChange={(e) => set("short_description", e.target.value)}
                  placeholder="One-line summary of the studio"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea
                  rows={4}
                  value={data.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Detailed description of the studio, equipment, and what makes it special..."
                  className={cn(inputCls, "resize-none")}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Full Address</label>
                <input
                  value={data.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main Street, Andheri West"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input
                    value={data.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Mumbai"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input
                    value={data.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="Maharashtra"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input
                  value={data.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="India"
                  className={inputCls}
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className={labelCls.replace("mb-1.5", "mb-0")}>GPS Coordinates</label>
                  <button
                    type="button"
                    onClick={geocode}
                    disabled={geocoding}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    {geocoding ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    Auto-detect from address
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/30 text-xs block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={data.latitude}
                      onChange={(e) => set("latitude", e.target.value)}
                      placeholder="19.0760"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-white/30 text-xs block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={data.longitude}
                      onChange={(e) => set("longitude", e.target.value)}
                      placeholder="72.8777"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Pricing & Hours ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className={labelCls}>Price per Hour (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={data.price_per_hour}
                    onChange={(e) => set("price_per_hour", e.target.value)}
                    className={cn(inputCls, "pl-7")}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Available Days *</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                        data.workingDays.includes(day)
                          ? "bg-[#D9FC67]/10 border-[#D9FC67]/30 text-[#D9FC67]"
                          : "bg-white/[0.02] border-white/5 text-white/30 hover:border-white/10 hover:text-white/50"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Working Hours</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/30 text-xs block mb-1">Opens at</label>
                    <select
                      value={data.openTime}
                      onChange={(e) => set("openTime", e.target.value)}
                      className={inputCls}
                    >
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/30 text-xs block mb-1">Closes at</label>
                    <select
                      value={data.closeTime}
                      onChange={(e) => set("closeTime", e.target.value)}
                      className={inputCls}
                    >
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Equipment & Amenities ── */}
          {step === 4 && (
            <div className="space-y-4">
              {amenitiesLoading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-6 h-6 text-white/30 animate-spin mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Loading amenities...</p>
                </div>
              ) : amenities.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/40 text-sm">No amenities configured in the system</p>
                  <p className="text-white/30 text-xs mt-1">Add amenities to the amenities table first, or skip this step</p>
                </div>
              ) : (
                <>
                  <p className="text-white/40 text-sm">Select all equipment and amenities available at this studio</p>
                  {categories.map((category) => (
                    <div key={category}>
                      <h4 className="text-white/30 text-xs uppercase tracking-wider font-medium mb-2 capitalize">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {amenities
                          .filter((a: any) => (a.category || "Other") === category)
                          .map((a: any) => {
                            const selected = data.amenityIds.includes(a.id);
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => toggleAmenity(a.id)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left",
                                  selected
                                    ? "bg-[#D9FC67]/10 border-[#D9FC67]/30"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0",
                                  selected ? "bg-[#D9FC67] border-[#D9FC67]" : "border-white/20"
                                )}>
                                  {selected && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <p className={cn("text-sm font-medium", selected ? "text-[#D9FC67]" : "text-white/50")}>
                                  {a.name}
                                </p>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Step 5: Add-ons ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <p className="text-white/60 text-sm font-medium">Platform Booking Add-ons</p>
                <p className="text-white/30 text-xs mt-1">These add-ons are available platform-wide — customers can select them during checkout for any studio booking.</p>
              </div>

              {addonsLoading ? (
                <div className="py-16 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
                </div>
              ) : addons.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/30 text-sm">No add-ons configured in the system</p>
                  <p className="text-white/20 text-xs mt-1">Add platform add-ons from the Add-ons management page</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {addons.map((addon: any) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-white/40 text-xs mt-0.5">{addon.description}</p>
                        )}
                        {addon.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px] capitalize">
                            {addon.category}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-[#D9FC67] font-semibold text-sm">₹{Number(addon.price).toLocaleString()}</p>
                        <p className="text-white/30 text-[10px]">flat fee</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Photos ── */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">Add image URLs for this studio. The first image will be the featured image.</p>
              <div className="flex gap-2">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                  placeholder="https://example.com/studio-image.jpg"
                  className={cn(inputCls, "flex-1")}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {data.imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {data.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-white/5 group">
                      <img
                        src={url}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-36 object-cover bg-white/5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImageUrl(idx)}
                          className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs truncate">{idx === 0 ? "Featured Image" : `Image ${idx + 1}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/30 text-sm">No images added yet</p>
                  <p className="text-white/20 text-xs mt-1">Optional — images can be added later via the edit drawer</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 7: Policies & Review ── */}
          {step === 7 && (
            <div className="space-y-6">
              {/* Cancellation Policies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={labelCls.replace("mb-1.5", "mb-0")}>Cancellation Policies</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => set("useCustomPolicies", !data.useCustomPolicies)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        data.useCustomPolicies ? "bg-[#D9FC67]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow",
                        data.useCustomPolicies ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </div>
                    <span className="text-white/40 text-xs">Custom rules</span>
                  </label>
                </div>

                {data.useCustomPolicies ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => set("cancellationRules", [
                          ...data.cancellationRules,
                          { id: crypto.randomUUID(), type: "hours", value: 24, refundPercent: 50 }
                        ])}
                        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Rule
                      </button>
                    </div>
                    {data.cancellationRules.map((rule, idx) => (
                      <div key={rule.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                        <div className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="text-white/40 text-xs block mb-1">Unit</label>
                            <select
                              value={rule.type}
                              onChange={(e) => updateRule(idx, { type: e.target.value as "hours" | "days" })}
                              className={inputCls}
                            >
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-white/40 text-xs block mb-1">Before booking</label>
                            <input
                              type="number"
                              min="0"
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: Number(e.target.value) })}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs block mb-1">Refund %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.refundPercent}
                              onChange={(e) => updateRule(idx, { refundPercent: Number(e.target.value) })}
                              className={inputCls}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => set("cancellationRules", data.cancellationRules.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors self-end"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <p className="text-white/40 text-sm">Using platform default policies:</p>
                    <ul className="mt-2 space-y-1 text-white/50 text-xs">
                      <li>• 48+ hours before: Full refund</li>
                      <li>• 24–48 hours before: 50% refund</li>
                      <li>• Less than 24 hours: No refund</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Review Summary */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                <h4 className="text-white font-medium text-sm">Review & Confirm</h4>
                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 space-y-3">
                  {[
                    { label: "Studio Name", value: data.name },
                    { label: "Owner", value: data.owner_email },
                    { label: "Location", value: [data.city, data.state].filter(Boolean).join(", ") || "—" },
                    { label: "Address", value: data.address || "—" },
                    { label: "Price", value: `₹${Number(data.price_per_hour).toLocaleString()}/hr` },
                    { label: "Capacity", value: `${data.capacity} persons` },
                    { label: "Working Days", value: data.workingDays.join(", ") || "—" },
                    { label: "Hours", value: `${data.openTime} – ${data.closeTime}` },
                    { label: "Amenities", value: `${data.amenityIds.length} selected` },
                    { label: "Images", value: `${data.imageUrls.length} added` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white text-right max-w-[60%] break-words">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-1 border-t border-white/5">
                    <span className="text-white/40">Status after creation</span>
                    <span className="text-yellow-400 text-xs px-2 py-0.5 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : back}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={next}
              className="px-6 py-2 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
