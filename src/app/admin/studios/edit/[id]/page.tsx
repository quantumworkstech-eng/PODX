"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ChevronLeft, Upload, X,
  Users, Plus, Loader2, AlertCircle, CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCities, City } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PkgFeature {
  text: string;
  included: boolean;
}

interface StudioPackage {
  name: string;
  description: string;
  price_per_hour: number;
  discount_percentage: number;
  features: PkgFeature[];
  is_popular: boolean;
}

interface CancellationRule {
  id: string;
  type: "days" | "hours";
  value: number;
  refundPercent: number;
  deductionPercent: number;
}

interface AdminStudioFormData {
  ownerEmail: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  capacity: number;
  address: string;
  city: string;
  state: string;
  country: string;
  pricePerHour: number;
  workingHours: { start: string; end: string };
  availableDays: string[];
  images: string[];
  videoUrl: string;
  useCustomPolicies: boolean;
  cancellationRules: CancellationRule[];
  packages: StudioPackage[];
  addonIds: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Chandigarh", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

const CITY_STATE_MAP: Record<string, string> = {
  "Mumbai": "Maharashtra", "Pune": "Maharashtra", "Nashik": "Maharashtra",
  "Nagpur": "Maharashtra", "Thane": "Maharashtra", "Navi Mumbai": "Maharashtra",
  "Aurangabad": "Maharashtra", "Solapur": "Maharashtra",
  "Delhi": "Delhi", "New Delhi": "Delhi", "Noida": "Uttar Pradesh",
  "Gurgaon": "Haryana", "Gurugram": "Haryana", "Faridabad": "Haryana",
  "Bengaluru": "Karnataka", "Bangalore": "Karnataka", "Mysuru": "Karnataka",
  "Mysore": "Karnataka", "Hubli": "Karnataka", "Mangalore": "Karnataka",
  "Chennai": "Tamil Nadu", "Coimbatore": "Tamil Nadu", "Madurai": "Tamil Nadu",
  "Hyderabad": "Telangana", "Secunderabad": "Telangana", "Warangal": "Telangana",
  "Kolkata": "West Bengal", "Howrah": "West Bengal", "Durgapur": "West Bengal",
  "Ahmedabad": "Gujarat", "Surat": "Gujarat", "Vadodara": "Gujarat",
  "Rajkot": "Gujarat", "Gandhinagar": "Gujarat",
  "Jaipur": "Rajasthan", "Jodhpur": "Rajasthan", "Udaipur": "Rajasthan",
  "Kota": "Rajasthan", "Ajmer": "Rajasthan",
  "Lucknow": "Uttar Pradesh", "Kanpur": "Uttar Pradesh", "Agra": "Uttar Pradesh",
  "Varanasi": "Uttar Pradesh", "Allahabad": "Uttar Pradesh",
  "Patna": "Bihar", "Gaya": "Bihar",
  "Bhopal": "Madhya Pradesh", "Indore": "Madhya Pradesh", "Gwalior": "Madhya Pradesh",
  "Raipur": "Chhattisgarh", "Bhilai": "Chhattisgarh",
  "Ranchi": "Jharkhand", "Jamshedpur": "Jharkhand",
  "Bhubaneswar": "Odisha", "Cuttack": "Odisha",
  "Visakhapatnam": "Andhra Pradesh", "Vijayawada": "Andhra Pradesh",
  "Kochi": "Kerala", "Thiruvananthapuram": "Kerala", "Kozhikode": "Kerala",
  "Chandigarh": "Chandigarh", "Amritsar": "Punjab", "Ludhiana": "Punjab",
  "Dehradun": "Uttarakhand", "Haridwar": "Uttarakhand",
  "Guwahati": "Assam", "Silchar": "Assam",
  "Srinagar": "Jammu & Kashmir", "Jammu": "Jammu & Kashmir",
  "Goa": "Goa", "Panaji": "Goa",
};

const STEPS = [
  { id: 1, name: "Partner & Info", short: "Info" },
  { id: 2, name: "Location", short: "Location" },
  { id: 3, name: "Pricing", short: "Pricing" },
  { id: 4, name: "Packages", short: "Packages" },
  { id: 5, name: "Photos", short: "Photos" },
  { id: 6, name: "Policies", short: "Policies" },
  { id: 7, name: "Review", short: "Review" },
];

const DEFAULT_PKG_FEATURES: PkgFeature[][] = [
  [
    { text: "Professional studio access", included: true },
    { text: "High-quality equipment", included: true },
    { text: "On-site technical support", included: true },
    { text: "Raw audio/video files", included: true },
    { text: "Live mix monitoring", included: false },
    { text: "Professional editing", included: false },
  ],
  [
    { text: "Professional studio access", included: true },
    { text: "High-quality equipment", included: true },
    { text: "On-site technical support", included: true },
    { text: "Raw audio/video files", included: true },
    { text: "Live mix monitoring", included: true },
    { text: "Professional editing", included: false },
  ],
  [
    { text: "Professional studio access", included: true },
    { text: "High-quality equipment", included: true },
    { text: "On-site technical support", included: true },
    { text: "Raw audio/video files", included: true },
    { text: "Live mix monitoring", included: true },
    { text: "Professional editing", included: true },
  ],
];

const EMPTY_PKG: StudioPackage = { name: "", description: "", price_per_hour: 0, discount_percentage: 0, features: [], is_popular: false };

const DEFAULT_CANCELLATION_RULES: CancellationRule[] = [
  { id: "1", type: "days", value: 7, refundPercent: 100, deductionPercent: 0 },
  { id: "2", type: "days", value: 3, refundPercent: 80, deductionPercent: 20 },
  { id: "3", type: "hours", value: 24, refundPercent: 50, deductionPercent: 50 },
  { id: "4", type: "hours", value: 0, refundPercent: 0, deductionPercent: 100 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminEditStudioPageInner() {
  const router = useRouter();
  const params = useParams();
  const studioId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AdminStudioFormData>({
    ownerEmail: "",
    name: "",
    shortDescription: "",
    fullDescription: "",
    capacity: 4,
    address: "",
    city: "",
    state: "",
    country: "India",
    pricePerHour: 1500,
    workingHours: { start: "09:00", end: "21:00" },
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    images: [],
    videoUrl: "",
    useCustomPolicies: false,
    cancellationRules: DEFAULT_CANCELLATION_RULES,
    packages: [EMPTY_PKG, EMPTY_PKG, EMPTY_PKG],
    addonIds: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [partners, setPartners] = useState<{ id: string; email: string; name: string }[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cities and partners
  useEffect(() => {
    getCities().then(setCities).catch(console.error);
    fetch("/api/admin/partners")
      .then((r) => r.json())
      .then((d) => setPartners(d.partners || []))
      .catch(() => {})
      .finally(() => setPartnersLoading(false));
  }, []);

  // Load existing studio data
  useEffect(() => {
    if (!studioId) return;
    setIsDataLoading(true);
    fetch(`/api/admin/studios/${studioId}`)
      .then((r) => r.json())
      .then((data) => {
        const s = data.studio;
        if (!s) { setDataError("Studio not found."); return; }

        // Map DB hours to working hours + available days
        const hoursArr: { day_of_week: string; open_time: string; close_time: string; is_closed: boolean }[] = data.hours || [];
        const openDays = hoursArr.filter((h) => !h.is_closed).map((h) => h.day_of_week);
        const firstOpenDay = hoursArr.find((h) => !h.is_closed);
        const workingHours = firstOpenDay
          ? { start: firstOpenDay.open_time?.slice(0, 5) ?? "09:00", end: firstOpenDay.close_time?.slice(0, 5) ?? "21:00" }
          : { start: "09:00", end: "21:00" };

        // Map cancellation policies
        const policies: { hours_before: number; refund_percentage: number }[] = data.policies || [];
        let cancellationRules: CancellationRule[] = DEFAULT_CANCELLATION_RULES;
        if (policies.length > 0) {
          cancellationRules = policies.map((p, idx) => {
            const hb = Number(p.hours_before);
            const isDays = hb > 0 && hb % 24 === 0;
            return {
              id: String(idx + 1),
              type: isDays ? "days" : "hours",
              value: isDays ? hb / 24 : hb,
              refundPercent: Number(p.refund_percentage),
              deductionPercent: 100 - Number(p.refund_percentage),
            };
          });
        }

        // Map packages — fill up to 3 with empties
        const dbPackages: StudioPackage[] = (data.packages || []).slice(0, 3);
        const pkgCount = dbPackages.length;
        const packages: StudioPackage[] = [
          ...dbPackages,
          ...Array.from({ length: Math.max(0, 3 - pkgCount) }, () => ({ ...EMPTY_PKG })),
        ];

        setFormData({
          ownerEmail: s.owner_email || "",
          name: s.name || "",
          shortDescription: s.short_description || "",
          fullDescription: s.description || "",
          capacity: s.capacity || 4,
          address: s.address || "",
          city: s.city || "",
          state: s.state || "",
          country: s.country || "India",
          pricePerHour: s.price_per_hour || 1500,
          workingHours,
          availableDays: openDays.length > 0 ? openDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
          images: (data.images || []).map((img: { image_url: string }) => img.image_url),
          videoUrl: s.video_url || "",
          useCustomPolicies: policies.length > 0,
          cancellationRules,
          packages,
          addonIds: data.studioAddonIds || [],
        });
      })
      .catch(() => setDataError("Failed to load studio data."))
      .finally(() => setIsDataLoading(false));
  }, [studioId]);

  const updateFormData = (updates: Partial<AdminStudioFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setStepError("");
  };

  // ─── Package helpers ─────────────────────────────────────────────────────

  const updatePackage = (index: number, updates: Partial<StudioPackage>) => {
    const next = [...formData.packages];
    next[index] = { ...EMPTY_PKG, ...next[index], ...updates };
    updateFormData({ packages: next });
  };

  const addPkgFeature = (i: number) => {
    const next = [...formData.packages];
    next[i] = { ...EMPTY_PKG, ...next[i], features: [...(next[i].features || []), { text: "", included: true }] };
    updateFormData({ packages: next });
  };

  const removePkgFeature = (i: number, fi: number) => {
    const next = [...formData.packages];
    next[i] = { ...next[i], features: next[i].features.filter((_, idx) => idx !== fi) };
    updateFormData({ packages: next });
  };

  const updatePkgFeatureText = (i: number, fi: number, text: string) => {
    const next = [...formData.packages];
    next[i] = { ...next[i], features: next[i].features.map((f, idx) => idx === fi ? { ...f, text } : f) };
    updateFormData({ packages: next });
  };

  const togglePkgFeatureIncluded = (i: number, fi: number) => {
    const next = [...formData.packages];
    next[i] = { ...next[i], features: next[i].features.map((f, idx) => idx === fi ? { ...f, included: !f.included } : f) };
    updateFormData({ packages: next });
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const validateStep = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.ownerEmail.trim()) return "Please select or enter a partner email.";
        if (!formData.name.trim()) return "Studio name is required.";
        if (!formData.shortDescription.trim() || formData.shortDescription.trim().length < 20)
          return "Short description must be at least 20 characters.";
        return "";
      case 2:
        if (!formData.city) return "Please select a city.";
        if (!formData.address.trim()) return "Full address is required.";
        if (!formData.state) return "Please enter a state.";
        return "";
      case 3:
        if (formData.availableDays.length === 0) return "Please select at least one available day.";
        return "";
      case 4:
        return "";
      case 5:
        if (formData.images.length < 2) return "Please upload at least 2 photos.";
        return "";
      default:
        return "";
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) { setStepError(error); return; }
    setStepError("");
    if (currentStep < 7) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStepError("");
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ─── Image Upload ────────────────────────────────────────────────────────

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - formData.images.length;
    if (remaining <= 0) { setStepError("Maximum 10 photos allowed."); return; }
    const validFiles = Array.from(files)
      .filter((f) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type))
      .slice(0, remaining);
    if (validFiles.length === 0) { setStepError("Only JPG, PNG, and WebP images are allowed."); return; }

    setUploadingImages(true);
    setStepError("");
    const uploadedUrls: string[] = [];
    for (const file of validFiles) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setStepError(data.error || "Failed to upload image."); setUploadingImages(false); return; }
        uploadedUrls.push(data.url);
      } catch { setStepError("Network error uploading image."); setUploadingImages(false); return; }
    }
    updateFormData({ images: [...formData.images, ...uploadedUrls] });
    setUploadingImages(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleImageUpload(e.dataTransfer.files);
  }, [formData.images]);

  const removeImage = (index: number) => {
    updateFormData({ images: formData.images.filter((_, i) => i !== index) });
  };

  const setCoverImage = (index: number) => {
    if (index === 0 || index < 0 || index >= formData.images.length) return;
    const next = [...formData.images];
    const [picked] = next.splice(index, 1);
    updateFormData({ images: [picked, ...next] });
  };

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/admin/studios/${studioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          short_description: formData.shortDescription,
          description: formData.fullDescription || formData.shortDescription,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || "India",
          owner_email: formData.ownerEmail,
          capacity: formData.capacity,
          images: formData.images,
          video_url: formData.videoUrl || null,
          available_days: formData.availableDays,
          working_hours: formData.workingHours,
          cancellation_rules: formData.useCustomPolicies ? formData.cancellationRules : [],
          packages: formData.packages.filter((p) => p.name.trim()),
          addon_ids: formData.addonIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Failed to save studio.");
        setIsLoading(false);
        return;
      }
      router.push("/admin/studios");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  // ─── Step Indicator ──────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, idx) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isComplete ? "bg-[#D9FC67] text-black" : isCurrent ? "border-2 border-[#D9FC67] text-[#D9FC67] bg-transparent" : "bg-white/10 text-white/40"
                  )}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className={cn("text-[10px] mt-1 hidden sm:block", isCurrent ? "text-[#D9FC67]" : "text-white/30")}>
                  {step.short}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("h-px w-4 sm:w-8 mx-1 transition-all", currentStep > step.id ? "bg-[#D9FC67]" : "bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Step 1: Partner & Basic Info ────────────────────────────────────────

  const renderStep1 = () => {
    const descLen = formData.shortDescription.trim().length;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Partner & Studio Info</h2>
          <p className="text-white/60">Update the partner and basic studio details</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Partner *</label>
            {partnersLoading ? (
              <div className="flex items-center gap-2 h-14 px-5 bg-white/5 border border-white/10 rounded-xl">
                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                <span className="text-white/40 text-sm">Loading partners…</span>
              </div>
            ) : (
              <select
                value={formData.ownerEmail}
                onChange={(e) => updateFormData({ ownerEmail: e.target.value })}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
              >
                <option value="" className="bg-[#141414]">Select partner…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.email} className="bg-[#141414]">
                    {p.name || p.email} ({p.email})
                  </option>
                ))}
              </select>
            )}
            {partners.length === 0 && !partnersLoading && (
              <p className="text-yellow-400 text-xs mt-1.5">No partners found. You can type an email directly below.</p>
            )}
            {(partners.length === 0 && !partnersLoading) && (
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => updateFormData({ ownerEmail: e.target.value })}
                placeholder="partner@email.com"
                className="w-full mt-2 h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none text-sm"
              />
            )}
            {formData.ownerEmail && partners.length > 0 && !partners.find((p) => p.email === formData.ownerEmail) && (
              <p className="text-amber-400 text-xs mt-1.5">Current owner email: {formData.ownerEmail}</p>
            )}
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Studio Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="e.g., Nest Studio, Apex Studio"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors text-lg"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              Short Description *
              <span className="text-white/40 font-normal ml-2">(shown in listings)</span>
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => { if (e.target.value.length <= 150) updateFormData({ shortDescription: e.target.value }); }}
              placeholder="e.g., Professional podcast studio with acoustic treatment"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
            />
            <p className={cn("text-xs mt-1.5 text-right", descLen >= 20 ? "text-green-400" : "text-white/40")}>{descLen}/150</p>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Full Description</label>
            <textarea
              value={formData.fullDescription}
              onChange={(e) => updateFormData({ fullDescription: e.target.value })}
              placeholder="Describe the studio in detail..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-3 block">Seating Capacity</label>
            <div className="flex items-center gap-6">
              <button type="button" onClick={() => updateFormData({ capacity: Math.max(1, formData.capacity - 1) })}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:border-[#D9FC67] hover:text-[#D9FC67] transition-colors">−</button>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#D9FC67]" />
                <span className="text-3xl font-bold text-white w-12 text-center">{formData.capacity}</span>
                <span className="text-white/60 text-sm">seats</span>
              </div>
              <button type="button" onClick={() => updateFormData({ capacity: Math.min(20, formData.capacity + 1) })}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:border-[#D9FC67] hover:text-[#D9FC67] transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 2: Location ────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Location & Address</h2>
        <p className="text-white/60">Update the studio address</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">City *</label>
            <select
              value={formData.city}
              onChange={(e) => {
                const selectedCity = e.target.value;
                const autoState = CITY_STATE_MAP[selectedCity] || "";
                updateFormData({ city: selectedCity, ...(autoState ? { state: autoState } : {}) });
              }}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
            >
              <option value="" className="bg-[#141414]">Select city…</option>
              {cities.map((c) => (<option key={c.id} value={c.name} className="bg-[#141414]">{c.name}</option>))}
              <option value="Other" className="bg-[#141414]">Other</option>
            </select>
          </div>
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              State *
              {formData.city && CITY_STATE_MAP[formData.city] && (
                <span className="text-[#D9FC67] text-xs ml-2 font-normal">Auto-filled</span>
              )}
            </label>
            <select
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
            >
              <option value="" className="bg-[#141414]">Select state…</option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s} className="bg-[#141414] text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Full Address *</label>
          <textarea value={formData.address} onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="e.g., 301, Creative Hub, Linking Road, Bandra West" rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors resize-none" />
        </div>
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Country</label>
          <input type="text" value={formData.country} onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="India"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors" />
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Pricing ─────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Pricing & Availability</h2>
        <p className="text-white/60">Update rates and working hours</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Working Hours</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1 block">Opens at</label>
              <select value={formData.workingHours.start}
                onChange={(e) => updateFormData({ workingHours: { ...formData.workingHours, start: e.target.value } })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-[#D9FC67] focus:outline-none">
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t} className="bg-[#141414] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-white/40 mt-5">to</span>
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1 block">Closes at</label>
              <select value={formData.workingHours.end}
                onChange={(e) => updateFormData({ workingHours: { ...formData.workingHours, end: e.target.value } })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-[#D9FC67] focus:outline-none">
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t} className="bg-[#141414] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Available Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = formData.availableDays.includes(day);
              return (
                <button key={day} type="button"
                  onClick={() => updateFormData({ availableDays: selected ? formData.availableDays.filter((d) => d !== day) : [...formData.availableDays, day] })}
                  className={cn("w-12 h-12 rounded-xl text-sm font-medium transition-all", selected ? "bg-[#D9FC67] text-black" : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10")}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Step 4: Packages ────────────────────────────────────────────────────

  const renderStep4 = () => {
    const pkgPlaceholders = [
      { name: "Basic Recording", desc: "Raw recording session with professional equipment" },
      { name: "Standard Mix", desc: "Recording with live mix monitoring" },
      { name: "Premium Edit", desc: "Full session with post-production editing included" },
    ];
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Booking Packages</h2>
          <p className="text-white/60">Define up to 3 packages for clients to choose during booking</p>
        </div>
        <div className="space-y-5">
          {[0, 1, 2].map((i) => {
            const pkg = formData.packages[i] ?? EMPTY_PKG;
            const ph = pkgPlaceholders[i];
            const hasName = pkg.name.trim().length > 0;
            return (
              <div key={i} className={cn("rounded-2xl border transition-all", hasName ? "border-[#D9FC67]/25 bg-[#D9FC67]/[0.03]" : "border-white/10 bg-white/[0.02]")}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-bold">{i + 1}</span>
                      <span className="text-white/60 text-sm font-medium">{hasName ? pkg.name : `Package ${i + 1} (optional)`}</span>
                      {pkg.is_popular && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9FC67]/20 text-[#D9FC67] font-bold uppercase">Best Deal</span>}
                    </div>
                    <label className="flex items-center gap-2 text-white/45 text-xs cursor-pointer select-none">
                      <input type="checkbox" checked={pkg.is_popular}
                        onChange={(e) => updatePackage(i, { is_popular: e.target.checked })}
                        className="rounded border-white/20 accent-[#D9FC67]" />
                      Best Deal
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block">Package Name</label>
                      <input value={pkg.name} onChange={(e) => updatePackage(i, { name: e.target.value })} placeholder={ph.name}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block">Price/hr (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                        <input type="number" min="0" value={pkg.price_per_hour}
                          onChange={(e) => updatePackage(i, { price_per_hour: parseInt(e.target.value) || 0 })}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 text-white focus:border-[#D9FC67] focus:outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block">Discount %</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">%</span>
                        <input type="number" min={0} max={100} value={pkg.discount_percentage}
                          onChange={(e) => updatePackage(i, { discount_percentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 text-white focus:border-[#D9FC67] focus:outline-none text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1.5 block">Description</label>
                    <input value={pkg.description} onChange={(e) => updatePackage(i, { description: e.target.value })} placeholder={ph.desc}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/60 text-xs">Features</label>
                      <div className="flex items-center gap-3">
                        {pkg.features.length === 0 && (
                          <button type="button" onClick={() => updatePackage(i, { features: DEFAULT_PKG_FEATURES[i] ?? [] })}
                            className="text-white/30 hover:text-[#D9FC67]/70 text-xs underline">Load defaults</button>
                        )}
                        <button type="button" onClick={() => addPkgFeature(i)}
                          className="text-[#D9FC67]/60 hover:text-[#D9FC67] text-xs flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add feature
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pkg.features.map((feat, fi) => (
                        <div key={fi} className="flex items-center gap-2">
                          <button type="button" onClick={() => togglePkgFeatureIncluded(i, fi)}
                            className={cn("w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0", feat.included ? "bg-[#D9FC67]/20 text-[#D9FC67]" : "bg-red-500/10 text-red-400/60")}>
                            {feat.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </button>
                          <input value={feat.text} onChange={(e) => updatePkgFeatureText(i, fi, e.target.value)} placeholder="Feature name"
                            className="flex-1 h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white placeholder:text-white/25 focus:border-[#D9FC67]/50 focus:outline-none text-sm" />
                          <button type="button" onClick={() => removePkgFeature(i, fi)} className="text-white/25 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Step 5: Photos ──────────────────────────────────────────────────────

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Studio Photos & Video</h2>
        <p className="text-white/60">Upload high-quality media to showcase the studio</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/80 text-sm font-medium">Photos * <span className="text-white/40 font-normal">(min 2, max 10)</span></label>
          <span className={cn("text-xs font-medium", formData.images.length >= 2 ? "text-green-400" : "text-white/40")}>{formData.images.length}/10</span>
        </div>
        {formData.images.length < 10 && (
          <div onDragOver={(e) => { e.preventDefault(); if (!uploadingImages) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)} onDrop={uploadingImages ? undefined : handleDrop}
            onClick={() => !uploadingImages && fileInputRef.current?.click()}
            className={cn("border-2 border-dashed rounded-2xl p-10 text-center transition-all", uploadingImages ? "border-white/10 opacity-60 cursor-not-allowed" : "cursor-pointer", isDragging ? "border-[#D9FC67] bg-[#D9FC67]/10" : "border-white/10 hover:border-white/20")}>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/*" multiple disabled={uploadingImages}
              onChange={(e) => void handleImageUpload(e.target.files)} className="hidden" />
            {uploadingImages ? (
              <><Loader2 className="w-10 h-10 mx-auto mb-3 text-[#D9FC67] animate-spin" /><p className="text-white font-medium">Uploading…</p></>
            ) : (
              <><Upload className={cn("w-10 h-10 mx-auto mb-3", isDragging ? "text-[#D9FC67]" : "text-white/40")} />
              <p className="text-white font-medium mb-1">{isDragging ? "Drop images here" : "Drag & drop or click to upload"}</p></>
            )}
            <p className="text-white/40 text-sm">JPG, PNG, WebP</p>
          </div>
        )}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {formData.images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X className="w-3.5 h-3.5" />
                </button>
                {index === 0 ? (
                  <span className="absolute bottom-2 left-2 bg-[#D9FC67] text-black text-xs px-2 py-0.5 rounded-full font-medium z-10">Cover</span>
                ) : (
                  <button type="button" onClick={() => setCoverImage(index)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-[#D9FC67] hover:text-black transition-colors z-10">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-white/80 text-sm font-medium mb-2 block">Studio Video <span className="text-white/40 font-normal">(optional)</span></label>
        <input type="url" value={formData.videoUrl} onChange={(e) => updateFormData({ videoUrl: e.target.value })}
          placeholder="YouTube, Vimeo, or Google Drive URL"
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors" />
      </div>
    </div>
  );

  // ─── Step 6: Policies ────────────────────────────────────────────────────

  const renderStep6 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Booking Policies</h2>
        <p className="text-white/60">Define cancellation policies (optional)</p>
      </div>
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
        <div>
          <p className="text-white font-medium">Use Custom Policies</p>
          <p className="text-white/40 text-sm mt-0.5">Override platform defaults with custom rules</p>
        </div>
        <button type="button" onClick={() => updateFormData({ useCustomPolicies: !formData.useCustomPolicies })}
          className={cn("w-12 h-6 rounded-full transition-colors relative shrink-0", formData.useCustomPolicies ? "bg-[#D9FC67]" : "bg-white/20")}>
          <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-black transition-transform", formData.useCustomPolicies ? "left-7" : "left-1")} />
        </button>
      </div>
      {!formData.useCustomPolicies && (
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
          <p className="text-white/50 text-sm">Using platform defaults: 100% refund if cancelled 48+ hrs before, 50% within 24–48 hrs, no refund within 24 hrs.</p>
        </div>
      )}
    </div>
  );

  // ─── Step 7: Review ──────────────────────────────────────────────────────

  const renderStep7 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review & Save</h2>
        <p className="text-white/60">Review all changes before saving.</p>
      </div>
      <div className="space-y-4">
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-sm">
          <p className="text-white font-semibold mb-3">Partner & Studio</p>
          <p><span className="text-white/40">Partner:</span><span className="text-white ml-2">{formData.ownerEmail}</span></p>
          <p><span className="text-white/40">Name:</span><span className="text-white ml-2">{formData.name}</span></p>
          <p><span className="text-white/40">Description:</span><span className="text-white ml-2">{formData.shortDescription}</span></p>
          <p><span className="text-white/40">Capacity:</span><span className="text-white ml-2">{formData.capacity} seats</span></p>
        </div>
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-sm">
          <p className="text-white font-semibold mb-3">Location</p>
          <p><span className="text-white/40">City:</span><span className="text-white ml-2">{formData.city}</span></p>
          <p><span className="text-white/40">State:</span><span className="text-white ml-2">{formData.state}</span></p>
          <p><span className="text-white/40">Address:</span><span className="text-white ml-2">{formData.address}</span></p>
        </div>
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-sm">
          <p className="text-white font-semibold mb-3">Pricing</p>
          <p><span className="text-white/40">Hours:</span><span className="text-white ml-2">{formData.workingHours.start} – {formData.workingHours.end}</span></p>
          <p><span className="text-white/40">Days:</span><span className="text-white ml-2">{formData.availableDays.join(", ")}</span></p>
        </div>
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white font-semibold mb-3 text-sm">Packages</p>
          {formData.packages.filter((p) => p.name.trim()).length === 0 ? (
            <p className="text-white/30 text-sm">No packages defined</p>
          ) : (
            <div className="space-y-2">
              {formData.packages.filter((p) => p.name.trim()).map((pkg, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-white text-xs font-medium">{pkg.name}</span>
                  <span className="text-white/50 text-xs">{pkg.price_per_hour === 0 ? "—" : `₹${pkg.price_per_hour}/hr`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-white font-semibold mb-2 text-sm">Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {formData.images.slice(0, 6).map((img, idx) => (
              <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
            ))}
            {formData.images.length === 0 && <span className="text-white/30 text-sm">No photos uploaded</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  if (dataError) {
    return (
      <div className="-m-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-semibold">{dataError}</p>
          <Link href="/admin/studios" className="text-[#D9FC67] text-sm hover:underline">← Back to Studios</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6">
      <header className="border-b border-white/5 px-6 py-3 bg-[#09090b]">
        <div className="flex items-center justify-between">
          <Link href="/admin/studios" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Studios
          </Link>
          <h1 className="text-lg font-bold text-white">Edit Studio (Admin)</h1>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isDataLoading}
            className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4 mr-2" />Save</>}
          </Button>
        </div>
      </header>

      {isDataLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#D9FC67] animate-spin mx-auto" />
            <p className="text-white/50 text-sm">Loading studio data…</p>
          </div>
        </div>
      ) : (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {renderStepIndicator()}

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 sm:p-8">
            {renderCurrentStep()}
          </div>

          {stepError && (
            <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-400/10 border border-red-400/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{stepError}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 gap-3 flex-wrap">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}
              className="border-white/10 text-white hover:bg-white/5 disabled:opacity-40">
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < 7 ? (
                <Button onClick={handleNext} disabled={uploadingImages}
                  className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50">
                  {uploadingImages ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {submitError && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {submitError}
                    </p>
                  )}
                  <Button onClick={handleSubmit} disabled={isLoading}
                    className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50">
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4 mr-2" />Save Changes</>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default function AdminEditStudioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminEditStudioPageInner />
    </Suspense>
  );
}
