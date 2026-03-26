"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Upload,
  X,
  IndianRupee,
  Users,
  Clock,
  Mic,
  Video,
  Lightbulb,
  Music,
  Volume2,
  Wifi,
  Car,
  Coffee,
  Monitor,
  Building2,
  CheckCircle,
  Shield,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CreditCard,
  Radio,
  Film,
  Camera,
  Headphones,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCities, City } from "@/lib/data";
import { PartnerStudioLocationPicker } from "@/components/maps/PartnerStudioLocationPicker";

// ─── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = [
  { id: "microphones", name: "Professional Microphones", icon: Mic },
  { id: "headphones", name: "Studio Headphones", icon: Headphones },
  { id: "cameras", name: "Video Cameras", icon: Video },
  { id: "lighting", name: "Studio Lighting", icon: Lightbulb },
  { id: "mixer", name: "Audio Mixer", icon: Volume2 },
  { id: "soundproofing", name: "Soundproofing", icon: Volume2 },
  { id: "teleprompter", name: "Teleprompter", icon: Monitor },
  { id: "monitor", name: "Reference Monitors", icon: Monitor },
];

const SERVICES_OPTIONS = [
  { id: "recording", name: "Recording", icon: Mic },
  { id: "editing", name: "Editing", icon: Film },
  { id: "live_streaming", name: "Live Streaming", icon: Radio },
  { id: "production_support", name: "Production Support", icon: Music },
  { id: "photography", name: "Photography", icon: Camera },
  { id: "podcasting", name: "Podcasting", icon: BookOpen },
];

const AMENITIES_OPTIONS = [
  { id: "wifi", name: "Free WiFi", icon: Wifi },
  { id: "ac", name: "Air Conditioning", icon: Building2 },
  { id: "parking", name: "Parking", icon: Car },
  { id: "refreshments", name: "Refreshments", icon: Coffee },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

const DRAFT_KEY = "podx_draft_studio";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CancellationRule {
  id: string;
  type: "days" | "hours";
  value: number;
  refundPercent: number;
  deductionPercent: number;
}

interface RescheduleRule {
  id: string;
  type: "days" | "hours";
  value: number;
  deductionPercent: number;
}

interface StudioFormData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  capacity: number;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  pricePerHour: number;
  discountPercent: number;
  workingHours: { start: string; end: string };
  availableDays: string[];
  equipment: string[];
  services: string[];
  amenities: string[];
  images: string[];
  videoUrl: string;
  useCustomPolicies: boolean;
  cancellationRules: CancellationRule[];
  rescheduleRules: RescheduleRule[];
}

const initialFormData: StudioFormData = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  capacity: 2,
  address: "",
  city: "",
  state: "",
  country: "India",
  pricePerHour: 1500,
  discountPercent: 0,
  workingHours: { start: "09:00", end: "21:00" },
  availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  equipment: [],
  services: [],
  amenities: [],
  images: [],
  videoUrl: "",
  useCustomPolicies: false,
  cancellationRules: [
    { id: "1", type: "days", value: 7, refundPercent: 100, deductionPercent: 0 },
    { id: "2", type: "days", value: 3, refundPercent: 80, deductionPercent: 20 },
    { id: "3", type: "hours", value: 24, refundPercent: 50, deductionPercent: 50 },
    { id: "4", type: "hours", value: 0, refundPercent: 0, deductionPercent: 100 },
  ],
  rescheduleRules: [
    { id: "1", type: "days", value: 3, deductionPercent: 0 },
    { id: "2", type: "hours", value: 24, deductionPercent: 10 },
    { id: "3", type: "hours", value: 0, deductionPercent: 25 },
  ],
};

const STEPS = [
  { id: 1, name: "Basic Info", short: "Info" },
  { id: 2, name: "Location", short: "Location" },
  { id: 3, name: "Pricing", short: "Pricing" },
  { id: 4, name: "Equipment", short: "Equipment" },
  { id: 5, name: "Add-ons", short: "Add-ons" },
  { id: 6, name: "Photos", short: "Photos" },
  { id: 7, name: "Policies", short: "Policies" },
  { id: 8, name: "Review", short: "Review" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPolicyLabel(type: "days" | "hours", value: number): string {
  if (value === 0) return "at the time of cancellation";
  return `${value} ${type} before the session`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateStudioPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StudioFormData>(() => {
    // Restore draft from localStorage on mount
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) return { ...initialFormData, ...JSON.parse(saved) };
      } catch {}
    }
    return initialFormData;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [platformAddons, setPlatformAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "no_plan" | "loading" | null>(null);

  // Dynamic equipment/services/amenities from DB
  const [platformEquipment, setPlatformEquipment] = useState<{ id: string; category: string; slug: string; name: string }[]>([]);
  const [customEquipment, setCustomEquipment] = useState<{ id: string; category: string; name: string }[]>([]);
  const [equipmentLoaded, setEquipmentLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cities
  useEffect(() => {
    getCities().then(setCities).catch(console.error);
  }, []);

  // Load equipment options when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && !equipmentLoaded) {
      Promise.all([
        fetch("/api/admin/equipment").then((r) => r.json()),
        fetch("/api/partner/custom-equipment").then((r) => r.json()),
      ]).then(([platform, custom]) => {
        setPlatformEquipment(platform.items || []);
        setCustomEquipment(custom.items || []);
        setEquipmentLoaded(true);
      }).catch(() => setEquipmentLoaded(true));
    }
  }, [currentStep, equipmentLoaded]);

  // Load platform add-ons when reaching step 5
  useEffect(() => {
    if (currentStep === 5 && platformAddons.length === 0) {
      setAddonsLoading(true);
      fetch("/api/addons")
        .then((r) => r.json())
        .then((d) => setPlatformAddons(d.addons || []))
        .catch(() => setPlatformAddons([]))
        .finally(() => setAddonsLoading(false));
    }
  }, [currentStep]);

  // Check subscription when reaching review step
  useEffect(() => {
    if (currentStep === 8 && subscriptionStatus === null) {
      setSubscriptionStatus("loading");
      fetch("/api/partner/subscription")
        .then((r) => r.json())
        .then((d) => {
          const status = d?.subscription?.status;
          setSubscriptionStatus(status === "active" || status === "grace_period" ? "active" : "no_plan");
        })
        .catch(() => setSubscriptionStatus("no_plan"));
    }
  }, [currentStep]);

  // Autosave debounced — skips blob/base64 data URLs to avoid quota errors
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        const draftData = {
          ...formData,
          // Only persist remote image URLs, not blob/base64 strings
          images: formData.images.filter((url) => url.startsWith("http")),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch (e) {
        console.warn("Draft save failed (storage quota?):", e);
      }
    }, 800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [formData]);

  const updateFormData = (updates: Partial<StudioFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setStepError("");
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep = (step: number): string => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) return "Studio name is required.";
        if (!formData.shortDescription.trim()) return "Short description is required.";
        if (formData.shortDescription.trim().length < 20) return "Short description must be at least 20 characters.";
        if (formData.shortDescription.trim().length > 150) return "Short description must be 150 characters or fewer.";
        return "";
      case 2:
        if (!formData.city) return "Please select a city.";
        if (!formData.address.trim()) return "Full address is required.";
        if (!formData.state) return "Please select a state.";
        if (formData.latitude == null || formData.longitude == null) {
          return "Please verify your location (pick a suggestion, Verify & Pin, or Select on Map).";
        }
        return "";
      case 3:
        if (!formData.pricePerHour || formData.pricePerHour <= 0) return "Please enter a valid price per hour.";
        if (formData.availableDays.length === 0) return "Please select at least one available day.";
        return "";
      case 4:
        if (formData.equipment.length === 0 && formData.services.length === 0)
          return "Please select at least one equipment item or service.";
        return "";
      case 5:
        return "";
      case 6:
        if (formData.images.length < 2) return "Please upload at least 2 photos of your studio.";
        return "";
      case 7:
        return "";
      case 8:
        return "";
      default:
        return "";
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    if (currentStep < 8) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStepError("");
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ─── Image Upload ────────────────────────────────────────────────────────────

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - formData.images.length;
    if (remaining <= 0) {
      setStepError("Maximum 10 photos allowed.");
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validFiles = Array.from(files).filter((f) => allowed.includes(f.type)).slice(0, remaining);
    if (validFiles.length === 0) {
      setStepError("Only JPG, PNG, and WebP images are allowed.");
      return;
    }
    setUploadingImages(true);
    setStepError("");
    const uploadedUrls: string[] = [];
    for (const file of validFiles) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/partner/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setStepError(data.error || "Failed to upload image. Please try again.");
          setUploadingImages(false);
          return;
        }
        uploadedUrls.push(data.url);
      } catch {
        setStepError("Network error uploading image. Please try again.");
        setUploadingImages(false);
        return;
      }
    }
    updateFormData({ images: [...formData.images, ...uploadedUrls] });
    setUploadingImages(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      void handleImageUpload(e.dataTransfer.files);
    },
    [formData.images]
  );

  const removeImage = (index: number) => {
    updateFormData({ images: formData.images.filter((_, i) => i !== index) });
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/partner/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.shortDescription,
          fullDescription: formData.fullDescription,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country || "India",
          pricePerHour: formData.pricePerHour,
          capacity: formData.capacity,
          equipment: formData.equipment,
          services: formData.services,
          amenities: formData.amenities,
          images: formData.images,
          videoUrl: formData.videoUrl || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
          cancellationRules: formData.useCustomPolicies ? formData.cancellationRules : null,
          rescheduleRules: formData.useCustomPolicies ? formData.rescheduleRules : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.code === "STUDIO_LIMIT_REACHED" && err.max === 0) {
          setSubscriptionStatus("no_plan");
        } else {
          setSubmitError(err.error || "Failed to create studio. Please try again.");
        }
        setIsLoading(false);
        return;
      }
      // Clear draft on success
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      router.push("/partner/studios");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  // ─── Step Indicator ──────────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  currentStep === step.id
                    ? "bg-[#D9FC67] text-black ring-4 ring-[#D9FC67]/20"
                    : currentStep > step.id
                    ? "bg-[#D9FC67] text-black"
                    : "bg-white/10 text-white/40"
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={cn("text-xs mt-1.5 hidden sm:block", currentStep >= step.id ? "text-white" : "text-white/40")}>
                {step.short}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn("w-8 sm:w-14 h-0.5 mx-1.5 transition-colors", currentStep > step.id ? "bg-[#D9FC67]" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Step 1: Basic Info ──────────────────────────────────────────────────────

  const renderStep1 = () => {
    const descLen = formData.shortDescription.trim().length;
    const descValid = descLen >= 20 && descLen <= 150;
    const descColor = descLen === 0 ? "text-white/30" : descValid ? "text-green-400" : "text-red-400";
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Basic Studio Information</h2>
          <p className="text-white/60">Tell us about your podcast / content studio</p>
        </div>

        <div className="space-y-5">
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
              <span className="text-white/40 font-normal ml-2">(shown in search listings)</span>
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => {
                if (e.target.value.length <= 150) updateFormData({ shortDescription: e.target.value });
              }}
              placeholder="e.g., Professional podcast studio with acoustic treatment"
              className={cn(
                "w-full h-14 bg-white/5 border rounded-xl px-5 text-white placeholder:text-white/30 focus:outline-none transition-colors",
                descLen > 0 && !descValid ? "border-red-400/50 focus:border-red-400" : "border-white/10 focus:border-[#D9FC67]"
              )}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-white/30 text-xs">Minimum 20 characters required</p>
              <p className={cn("text-xs font-medium", descColor)}>{descLen}/150</p>
            </div>
            {descLen > 0 && descLen < 20 && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Need {20 - descLen} more characters
              </p>
            )}
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              Detailed Studio Description
              <span className="text-white/40 font-normal ml-2">(visible to customers on studio page & booking summary)</span>
            </label>
            <textarea
              value={formData.fullDescription}
              onChange={(e) => updateFormData({ fullDescription: e.target.value })}
              placeholder="Describe your studio in detail — acoustic treatment, ambiance, equipment, what makes it unique, accessibility notes..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-3 block">Seating Capacity *</label>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => updateFormData({ capacity: Math.max(1, formData.capacity - 1) })}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:border-[#D9FC67] hover:text-[#D9FC67] transition-colors"
              >
                −
              </button>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#D9FC67]" />
                <span className="text-3xl font-bold text-white w-12 text-center">{formData.capacity}</span>
                <span className="text-white/60 text-sm">seats</span>
              </div>
              <button
                type="button"
                onClick={() => updateFormData({ capacity: Math.min(20, formData.capacity + 1) })}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:border-[#D9FC67] hover:text-[#D9FC67] transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-white/30 text-xs mt-2">Maximum number of people who can be accommodated</p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 2: Location ────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Location & Address</h2>
        <p className="text-white/60">Enter your exact studio address so clients can find you</p>
      </div>

      <PartnerStudioLocationPicker
        cities={cities}
        value={{
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }}
        onChange={(patch) => updateFormData(patch)}
      />
    </div>
  );

  // ─── Step 3: Pricing ─────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Pricing & Availability</h2>
        <p className="text-white/60">Set your rates and working hours</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Price per Hour (₹) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 text-lg font-medium">₹</span>
            <input
              type="number"
              value={formData.pricePerHour}
              onChange={(e) => updateFormData({ pricePerHour: parseInt(e.target.value) || 0 })}
              placeholder="1500"
              min="0"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-10 pr-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors text-lg"
            />
          </div>
          {formData.pricePerHour > 0 && (
            <p className="text-[#D9FC67] text-xs mt-1.5 font-medium">
              ₹{formData.pricePerHour.toLocaleString("en-IN")}/hour
              {formData.discountPercent > 0 && (
                <span className="text-white/40 ml-2 line-through">
                  → ₹{Math.round(formData.pricePerHour * (1 - formData.discountPercent / 100)).toLocaleString("en-IN")}/hour after discount
                </span>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Discount (%)</label>
          <input
            type="number"
            value={formData.discountPercent}
            onChange={(e) => updateFormData({ discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
            placeholder="0"
            min="0"
            max="100"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
          />
          <p className="text-white/40 text-xs mt-1.5">Optional — applied on top of hourly rate (0 = no discount)</p>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Working Hours</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1 block">Opens at</label>
              <select
                value={formData.workingHours.start}
                onChange={(e) => updateFormData({ workingHours: { ...formData.workingHours, start: e.target.value } })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time} className="bg-[#141414]">{time}</option>
                ))}
              </select>
            </div>
            <span className="text-white/40 mt-5">to</span>
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1 block">Closes at</label>
              <select
                value={formData.workingHours.end}
                onChange={(e) => updateFormData({ workingHours: { ...formData.workingHours, end: e.target.value } })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time} className="bg-[#141414]">{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Available Days *</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const newDays = formData.availableDays.includes(day)
                    ? formData.availableDays.filter((d) => d !== day)
                    : [...formData.availableDays, day];
                  updateFormData({ availableDays: newDays });
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  formData.availableDays.includes(day)
                    ? "bg-[#D9FC67] text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-2">Select all days your studio is open for bookings</p>
        </div>
      </div>
    </div>
  );

  // ─── Step 4: Equipment & Services ────────────────────────────────────────────

  const renderEquipmentGrid = (
    items: { id: string; slug?: string; name: string }[],
    field: "equipment" | "services" | "amenities"
  ) => {
    const selected: string[] = formData[field];
    return items.map((item) => {
      const key = item.slug ?? item.id;
      const isSelected = selected.includes(key);
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            const next = isSelected ? selected.filter((v) => v !== key) : [...selected, key];
            updateFormData({ [field]: next });
          }}
          className={cn(
            "relative p-4 rounded-xl border transition-all flex flex-col items-center gap-2 text-center",
            isSelected ? "border-[#D9FC67] bg-[#D9FC67]/10" : "border-white/10 bg-white/5 hover:border-white/20"
          )}
        >
          <span className={cn("text-xs leading-tight", isSelected ? "text-white" : "text-white/60")}>{item.name}</span>
          {isSelected && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-[#D9FC67]" />}
        </button>
      );
    });
  };

  const renderStep4 = () => {
    // Merge platform defaults + custom (custom items use custom_ prefix to avoid collision)
    const equipItems = [
      ...(platformEquipment.filter((i) => i.category === "equipment").length > 0
        ? platformEquipment.filter((i) => i.category === "equipment")
        : EQUIPMENT_OPTIONS.map((o) => ({ id: o.id, category: "equipment", slug: o.id, name: o.name }))),
      ...customEquipment.filter((i) => i.category === "equipment").map((i) => ({ ...i, slug: `custom_${i.id}` })),
    ];
    const serviceItems = [
      ...(platformEquipment.filter((i) => i.category === "service").length > 0
        ? platformEquipment.filter((i) => i.category === "service")
        : SERVICES_OPTIONS.map((o) => ({ id: o.id, category: "service", slug: o.id, name: o.name }))),
      ...customEquipment.filter((i) => i.category === "service").map((i) => ({ ...i, slug: `custom_${i.id}` })),
    ];
    const amenityItems = [
      ...(platformEquipment.filter((i) => i.category === "amenity").length > 0
        ? platformEquipment.filter((i) => i.category === "amenity")
        : AMENITIES_OPTIONS.map((o) => ({ id: o.id, category: "amenity", slug: o.id, name: o.name }))),
      ...customEquipment.filter((i) => i.category === "amenity").map((i) => ({ ...i, slug: `custom_${i.id}` })),
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Equipment & Services</h2>
          <p className="text-white/60">What equipment and services does your studio offer?</p>
        </div>

        {!equipmentLoaded && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin mr-2" />
            <span className="text-white/40 text-sm">Loading options…</span>
          </div>
        )}

        {equipmentLoaded && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/80 text-sm font-medium">Equipment</p>
                  <p className="text-white/40 text-xs mt-0.5">Select all equipment available in your studio</p>
                </div>
                <a href="/partner/equipment" target="_blank" className="text-xs text-[#D9FC67]/70 hover:text-[#D9FC67] transition-colors">
                  + Manage custom →
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {renderEquipmentGrid(equipItems, "equipment")}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/80 text-sm font-medium">Services Offered</p>
                  <p className="text-white/40 text-xs mt-0.5">Select services your studio provides to clients</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {renderEquipmentGrid(serviceItems, "services")}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/80 text-sm font-medium">Amenities</p>
                  <p className="text-white/40 text-xs mt-0.5">Additional facilities available at your studio</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {renderEquipmentGrid(amenityItems, "amenities")}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Step 5: Add-ons ─────────────────────────────────────────────────────────

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Platform Add-ons</h2>
        <p className="text-white/60">Add-ons customers can purchase alongside their booking</p>
      </div>

      <div className="p-4 bg-[#D9FC67]/5 border border-[#D9FC67]/15 rounded-xl mb-4">
        <p className="text-[#D9FC67]/80 text-sm font-medium mb-1">How add-ons work</p>
        <p className="text-white/50 text-xs">
          These are platform-wide add-ons managed by the PodX admin team (e.g., extra editing hours, drone footage).
          They are automatically available to customers booking your studio. You don't need to configure anything here.
        </p>
      </div>

      {addonsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : platformAddons.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
          <p className="text-white/40 font-medium">No platform add-ons configured yet</p>
          <p className="text-white/20 text-sm mt-1">Add-ons will appear here once added by the admin team</p>
        </div>
      ) : (
        <div className="space-y-3">
          {platformAddons.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium">{addon.name}</p>
                {addon.description && <p className="text-white/40 text-sm mt-0.5">{addon.description}</p>}
                {addon.category && (
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-white/30 text-xs capitalize">
                    {addon.category}
                  </span>
                )}
              </div>
              <div className="ml-6 text-right flex-shrink-0">
                <p className="text-[#D9FC67] font-bold text-lg">₹{Number(addon.price).toLocaleString("en-IN")}</p>
                <p className="text-white/30 text-xs">flat fee</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Step 6: Photos ──────────────────────────────────────────────────────────

  const renderStep6 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Studio Photos & Video</h2>
        <p className="text-white/60">Upload high-quality media to showcase your studio</p>
      </div>

      {/* Image Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white/80 text-sm font-medium">
            Photos *
            <span className="text-white/40 font-normal ml-2">(min 2, max 10)</span>
          </label>
          <span className={cn("text-xs font-medium", formData.images.length >= 2 ? "text-green-400" : "text-white/40")}>
            {formData.images.length}/10 uploaded
          </span>
        </div>

        {formData.images.length < 10 && (
          <div
            onDragOver={(e) => { e.preventDefault(); if (!uploadingImages) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={uploadingImages ? undefined : handleDrop}
            onClick={() => !uploadingImages && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all",
              uploadingImages ? "border-white/10 opacity-60 cursor-not-allowed" : "cursor-pointer",
              isDragging ? "border-[#D9FC67] bg-[#D9FC67]/10" : "border-white/10 hover:border-white/20"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp"
              multiple
              disabled={uploadingImages}
              onChange={(e) => void handleImageUpload(e.target.files)}
              className="hidden"
            />
            {uploadingImages ? (
              <>
                <Loader2 className="w-10 h-10 mx-auto mb-3 text-[#D9FC67] animate-spin" />
                <p className="text-white font-medium mb-1">Uploading images…</p>
              </>
            ) : (
              <>
                <Upload className={cn("w-10 h-10 mx-auto mb-3", isDragging ? "text-[#D9FC67]" : "text-white/40")} />
                <p className="text-white font-medium mb-1">
                  {isDragging ? "Drop images here" : "Drag & drop or click to upload"}
                </p>
              </>
            )}
            <p className="text-white/40 text-sm">JPG, PNG, WebP — up to 10MB each</p>
          </div>
        )}

        {formData.images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {formData.images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 bg-[#D9FC67] text-black text-xs px-2 py-0.5 rounded-full font-medium">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {formData.images.length < 2 && formData.images.length > 0 && (
          <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Upload at least {2 - formData.images.length} more photo{2 - formData.images.length > 1 ? "s" : ""} to continue
          </p>
        )}
      </div>

      {/* Video Upload / URL */}
      <div>
        <label className="text-white/80 text-sm font-medium mb-2 block">
          Studio Video
          <span className="text-white/40 font-normal ml-2">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.videoUrl}
          onChange={(e) => updateFormData({ videoUrl: e.target.value })}
          placeholder="Paste YouTube or Vimeo URL (e.g., https://youtube.com/watch?v=...)"
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
        />
        <p className="text-white/30 text-xs mt-1">A walkthrough video helps clients visualise the space before booking</p>
      </div>
    </div>
  );

  // ─── Step 7: Policies ────────────────────────────────────────────────────────

  const renderStep7 = () => {
    const addCancellationRule = () => {
      updateFormData({ cancellationRules: [...formData.cancellationRules, { id: Date.now().toString(), type: "days", value: 1, refundPercent: 100, deductionPercent: 0 }] });
    };
    const removeCancellationRule = (id: string) => {
      updateFormData({ cancellationRules: formData.cancellationRules.filter((r) => r.id !== id) });
    };
    const updateCancellationRule = (id: string, updates: Partial<CancellationRule>) => {
      updateFormData({ cancellationRules: formData.cancellationRules.map((r) => r.id === id ? { ...r, ...updates } : r) });
    };
    const addRescheduleRule = () => {
      updateFormData({ rescheduleRules: [...formData.rescheduleRules, { id: Date.now().toString(), type: "days", value: 1, deductionPercent: 0 }] });
    };
    const removeRescheduleRule = (id: string) => {
      updateFormData({ rescheduleRules: formData.rescheduleRules.filter((r) => r.id !== id) });
    };
    const updateRescheduleRule = (id: string, updates: Partial<RescheduleRule>) => {
      updateFormData({ rescheduleRules: formData.rescheduleRules.map((r) => r.id === id ? { ...r, ...updates } : r) });
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Booking Policies</h2>
          <p className="text-white/60">Define cancellation and reschedule rules for your studio</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="text-white font-medium">Use Custom Policies</p>
            <p className="text-white/40 text-sm mt-0.5">Override platform defaults with your own rules</p>
          </div>
          <button
            type="button"
            onClick={() => updateFormData({ useCustomPolicies: !formData.useCustomPolicies })}
            className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", formData.useCustomPolicies ? "bg-[#D9FC67]" : "bg-white/20")}
          >
            <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-black transition-transform", formData.useCustomPolicies ? "left-7" : "left-1")} />
          </button>
        </div>

        {formData.useCustomPolicies ? (
          <div className="space-y-6">
            {/* Cancellation Policy */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-400/10">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Cancellation Policy</h3>
                      <p className="text-white/40 text-xs mt-0.5">Controls what refund customers receive when they cancel a booking</p>
                    </div>
                  </div>
                  <button onClick={addCancellationRule} className="text-[#D9FC67] text-sm hover:underline flex items-center gap-1 flex-shrink-0">
                    <Plus className="w-4 h-4" /> Add Rule
                  </button>
                </div>

                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-white/50 text-xs font-medium mb-2">How rules work:</p>
                  <p className="text-white/40 text-xs">Each rule means: "If cancelled <strong className="text-white/60">X hours/days BEFORE</strong> the scheduled session time, the customer receives Y% refund."</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-white/35 text-xs">• Example: 7 days → 100% refund = Full refund if cancelled 7+ days before</p>
                    <p className="text-white/35 text-xs">• Example: 24 hours → 50% refund = Half refund if cancelled within 24 hours</p>
                    <p className="text-white/35 text-xs">• Example: 0 hours → 0% refund = No refund if cancelled at session time</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 px-1">
                  <span className="text-white/30 text-xs">Time unit</span>
                  <span className="text-white/30 text-xs">Before session</span>
                  <span className="text-white/30 text-xs">Refund %</span>
                </div>
                {formData.cancellationRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-xs">Rule {index + 1} — Cancel {formatPolicyLabel(rule.type, rule.value)}</span>
                      {formData.cancellationRules.length > 1 && (
                        <button onClick={() => removeCancellationRule(rule.id)} className="text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) => updateCancellationRule(rule.id, { type: e.target.value as "days" | "hours" })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                      >
                        <option value="days" className="bg-[#141414]">days</option>
                        <option value="hours" className="bg-[#141414]">hours</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={rule.value}
                        onChange={(e) => updateCancellationRule(rule.id, { value: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                        placeholder="Value"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.refundPercent}
                        onChange={(e) => {
                          const refund = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          updateCancellationRule(rule.id, { refundPercent: refund, deductionPercent: 100 - refund });
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                        placeholder="Refund %"
                      />
                    </div>
                    <p className="text-white/25 text-xs mt-1.5">
                      → Customer gets {rule.refundPercent}% refund · you keep {100 - rule.refundPercent}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reschedule Policy */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-400/10">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Reschedule Policy</h3>
                      <p className="text-white/40 text-xs mt-0.5">Controls any fee charged when customers move a booking to a new time</p>
                    </div>
                  </div>
                  <button onClick={addRescheduleRule} className="text-[#D9FC67] text-sm hover:underline flex items-center gap-1 flex-shrink-0">
                    <Plus className="w-4 h-4" /> Add Rule
                  </button>
                </div>

                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-white/50 text-xs font-medium mb-1">How rules work:</p>
                  <p className="text-white/40 text-xs">"If rescheduled <strong className="text-white/60">X hours/days BEFORE</strong> the session, a Y% rescheduling fee applies."</p>
                  <p className="text-white/35 text-xs mt-1">• 0% deduction = free rescheduling within that window</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 px-1">
                  <span className="text-white/30 text-xs">Time unit</span>
                  <span className="text-white/30 text-xs">Before session</span>
                  <span className="text-white/30 text-xs">Fee %</span>
                </div>
                {formData.rescheduleRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-xs">Rule {index + 1} — Reschedule {formatPolicyLabel(rule.type, rule.value)}</span>
                      {formData.rescheduleRules.length > 1 && (
                        <button onClick={() => removeRescheduleRule(rule.id)} className="text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) => updateRescheduleRule(rule.id, { type: e.target.value as "days" | "hours" })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                      >
                        <option value="days" className="bg-[#141414]">days</option>
                        <option value="hours" className="bg-[#141414]">hours</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={rule.value}
                        onChange={(e) => updateRescheduleRule(rule.id, { value: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                        placeholder="Value"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.deductionPercent}
                        onChange={(e) => updateRescheduleRule(rule.id, { deductionPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:border-[#D9FC67] focus:outline-none"
                        placeholder="Fee %"
                      />
                    </div>
                    <p className="text-white/25 text-xs mt-1.5">
                      → {rule.deductionPercent === 0 ? "Free rescheduling" : `${rule.deductionPercent}% rescheduling fee applies`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
            <Shield className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-medium">Using Platform Default Policies</p>
            <p className="text-white/40 text-sm mt-1">
              Standard policies apply: 48h+ = full refund · 24–48h = 50% refund · under 24h = no refund
            </p>
            <p className="text-white/30 text-xs mt-3">
              To set custom rules for this studio, toggle "Use Custom Policies" above
            </p>
          </div>
        )}
      </div>
    );
  };

  // ─── Step 8: Review ──────────────────────────────────────────────────────────

  const renderStep8 = () => {
    if (subscriptionStatus === "loading") {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      );
    }

    if (subscriptionStatus === "no_plan") {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Subscription Required</h2>
            <p className="text-white/60">You need an active plan to list studios on PodX</p>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-5">
              <CreditCard className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">No Active Subscription Plan</p>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
              Your studio details have been saved as a draft. Subscribe to a plan to publish your studio and start receiving bookings.
            </p>
            <Link
              href="/partner/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D9FC67] text-black font-semibold rounded-xl hover:bg-[#E8FF8A] transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Choose a Plan
            </Link>
            <p className="text-white/30 text-xs mt-4">Your draft is saved — you can come back after subscribing</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Review & Confirm</h2>
          <p className="text-white/60">Check all details before submitting for review</p>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Basic Information</h3>
              <button onClick={() => setCurrentStep(1)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-white/40">Name:</span> <span className="text-white ml-2">{formData.name}</span></p>
              <p><span className="text-white/40">Description:</span> <span className="text-white ml-2">{formData.shortDescription}</span></p>
              <p><span className="text-white/40">Capacity:</span> <span className="text-white ml-2">{formData.capacity} seats</span></p>
            </div>
          </div>

          {/* Location */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Location</h3>
              <button onClick={() => setCurrentStep(2)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-white/40">City:</span> <span className="text-white ml-2">{formData.city}</span></p>
              <p><span className="text-white/40">State:</span> <span className="text-white ml-2">{formData.state}</span></p>
              <p><span className="text-white/40">Address:</span> <span className="text-white ml-2">{formData.address}</span></p>
              {formData.latitude && formData.longitude ? (
                <p className="flex items-center gap-1"><span className="text-white/40">Map pin:</span> <span className="text-green-400 text-xs ml-2">✓ Location pinned ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</span></p>
              ) : (
                <p><span className="text-white/40">Map pin:</span> <span className="text-yellow-400 text-xs ml-2">Not pinned — optional</span></p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Pricing & Availability</h3>
              <button onClick={() => setCurrentStep(3)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-white/40">Price:</span> <span className="text-white ml-2">₹{formData.pricePerHour.toLocaleString("en-IN")}/hour</span></p>
              {formData.discountPercent > 0 && (
                <p><span className="text-white/40">Discount:</span> <span className="text-white ml-2">{formData.discountPercent}%</span></p>
              )}
              <p><span className="text-white/40">Hours:</span> <span className="text-white ml-2">{formData.workingHours.start} – {formData.workingHours.end}</span></p>
              <p><span className="text-white/40">Days:</span> <span className="text-white ml-2">{formData.availableDays.join(", ")}</span></p>
            </div>
          </div>

          {/* Equipment & Services */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Equipment & Services</h3>
              <button onClick={() => setCurrentStep(4)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            {formData.equipment.length === 0 && formData.services.length === 0 && formData.amenities.length === 0 ? (
              <p className="text-white/30 text-sm">None selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((eq) => (
                  <span key={eq} className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-white">{eq}</span>
                ))}
                {formData.services.map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-[#D9FC67]/10 rounded-full text-xs text-[#D9FC67]">{s}</span>
                ))}
                {formData.amenities.map((am) => (
                  <span key={am} className="px-2.5 py-1 bg-blue-400/10 rounded-full text-xs text-blue-400">{am}</span>
                ))}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Photos {formData.videoUrl && "& Video"}</h3>
              <button onClick={() => setCurrentStep(6)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {formData.images.slice(0, 6).map((img, index) => (
                <img key={index} src={img} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ))}
              {formData.images.length > 6 && (
                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-white/60 text-xs">+{formData.images.length - 6}</span>
                </div>
              )}
            </div>
            {formData.videoUrl && (
              <p className="text-white/40 text-xs mt-2 truncate">Video: {formData.videoUrl}</p>
            )}
          </div>

          {/* Policies */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Booking Policies</h3>
              <button onClick={() => setCurrentStep(7)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            {formData.useCustomPolicies ? (
              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Cancellation</p>
                  <div className="space-y-1.5">
                    {formData.cancellationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between px-3 py-2 bg-red-400/5 rounded-lg border border-red-400/10">
                        <span className="text-white/70 text-xs">
                          Cancel {formatPolicyLabel(rule.type, rule.value)}
                        </span>
                        <span className="text-red-400 text-xs font-medium">
                          {rule.refundPercent}% refund
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Reschedule</p>
                  <div className="space-y-1.5">
                    {formData.rescheduleRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between px-3 py-2 bg-yellow-400/5 rounded-lg border border-yellow-400/10">
                        <span className="text-white/70 text-xs">
                          Reschedule {formatPolicyLabel(rule.type, rule.value)}
                        </span>
                        <span className="text-yellow-400 text-xs font-medium">
                          {rule.deductionPercent === 0 ? "Free" : `${rule.deductionPercent}% fee`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-white/60 text-xs">Cancel 48+ hours before session</span>
                  <span className="text-green-400 text-xs font-medium">100% refund</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-white/60 text-xs">Cancel 24–48 hours before session</span>
                  <span className="text-yellow-400 text-xs font-medium">50% refund</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-white/60 text-xs">Cancel within 24 hours of session</span>
                  <span className="text-red-400 text-xs font-medium">No refund</span>
                </div>
                <p className="text-white/30 text-xs mt-1 pl-1">Using platform default policies</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return null;
    }
  };

  const isSubmitDisabled = subscriptionStatus === "no_plan" || subscriptionStatus === "loading" || uploadingImages;

  return (
    <div className="-m-6">
      <header className="border-b border-white/5 px-6 py-3 bg-[#09090b]">
        <div className="flex items-center justify-between">
          <Link href="/partner/studios" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Studios
          </Link>
          <h1 className="text-lg font-bold text-white">Create New Studio</h1>
          <span className="text-white/30 text-xs">
            {typeof window !== "undefined" && localStorage.getItem(DRAFT_KEY) ? "Draft saved" : ""}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {renderStepIndicator()}

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 sm:p-8">
          {renderCurrentStep()}
        </div>

        {/* Step Error */}
        {stepError && (
          <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-400/10 border border-red-400/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{stepError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-white/10 text-white hover:bg-white/5 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 8 ? (
            <Button
              onClick={handleNext}
              disabled={uploadingImages}
              className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50"
            >
              {uploadingImages ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <p className="text-red-400 text-sm text-right flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {submitError}
                </p>
              )}
              {subscriptionStatus !== "no_plan" && (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isSubmitDisabled}
                  className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Submit for Review</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Autosave notice */}
        <p className="text-center text-white/20 text-xs mt-4">
          Progress is automatically saved as a draft
        </p>
      </main>
    </div>
  );
}
