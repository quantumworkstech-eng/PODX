"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Upload,
  X,
  Users,
  Clock,
  CheckCircle,
  Shield,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCities, City } from "@/lib/data";
import { PartnerInventoryDrawer } from "@/components/partner/PartnerInventoryDrawer";
import { StudioPartnerAddonPicker } from "@/components/partner/StudioPartnerAddonPicker";

// ─── Constants ────────────────────────────────────────────────────────────────

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

interface PkgFeature {
  text: string;
  included: boolean;
}

interface StudioPackage {
  name: string;
  description: string;
  price_per_hour: number;
  features: PkgFeature[];
  is_popular: boolean;
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
  partnerEquipmentSelections: { id: string; quantity: number }[];
  partnerServiceIds: string[];
  partnerAddonSelections: { id: string; enabled_for_booking: boolean }[];
  studioPlatformAddonIds: string[];
  packages: StudioPackage[];
}

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

const DEFAULT_PKG_TEMPLATES: StudioPackage[] = [
  { name: "", description: "", price_per_hour: 0, features: [], is_popular: false },
  { name: "", description: "", price_per_hour: 0, features: [], is_popular: false },
  { name: "", description: "", price_per_hour: 0, features: [], is_popular: false },
];

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
  partnerEquipmentSelections: [],
  partnerServiceIds: [],
  partnerAddonSelections: [],
  studioPlatformAddonIds: [],
  packages: DEFAULT_PKG_TEMPLATES,
};

const STEPS = [
  { id: 1, name: "Basic Info", short: "Info" },
  { id: 2, name: "Location", short: "Location" },
  { id: 3, name: "Pricing", short: "Pricing" },
  { id: 4, name: "Packages", short: "Packages" },
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

function CreateStudioPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [currentStep, setCurrentStep] = useState(1);
  // Always start fresh — drafts are loaded from the server via ?draftId=
  const [formData, setFormData] = useState<StudioFormData>(initialFormData);
  const [draftLoading, setDraftLoading] = useState(!!draftId);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [platformAddons, setPlatformAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "no_plan" | "loading" | null>(null);

  const [inventoryLibrary, setInventoryLibrary] = useState<{
    equipment: { id: string; subcategory: string; model_name: string; default_quantity: number }[];
    services: { id: string; name: string; subcategory: string }[];
    addons: { id: string; addon_kind: string; name: string; description: string | null; price: number; is_active?: boolean }[];
  }>({ equipment: [], services: [], addons: [] });
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [inventoryDrawerOpen, setInventoryDrawerOpen] = useState(false);
  const [inventoryDrawerTab, setInventoryDrawerTab] = useState<"equipment" | "services" | "addons">("equipment");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cities
  useEffect(() => {
    getCities().then(setCities).catch(console.error);
  }, []);

  // Load draft from server when ?draftId= is present
  useEffect(() => {
    if (!draftId) return;
    setDraftLoading(true);
    fetch(`/api/partner/studios/${draftId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ studio }) => {
        if (!studio) return;
        const allEquip: string[] = studio.equipment || [];
        const EQUIP_IDS = new Set(["microphones","headphones","cameras","lighting","mixer","soundproofing","teleprompter","monitor"]);
        const SVC_IDS   = new Set(["recording","editing","live_streaming","production_support","photography","podcasting"]);
        const AMEN_IDS  = new Set(["wifi","ac","parking","refreshments"]);
        setFormData((prev) => ({
          ...prev,
          name: studio.name || "",
          shortDescription: studio.short_description || "",
          fullDescription: studio.full_description || "",
          address: studio.address || "",
          city: studio.city || "",
          state: studio.state || "",
          country: studio.country || "India",
          pricePerHour: studio.price_per_hour || prev.pricePerHour,
          capacity: studio.capacity || prev.capacity,
          equipment: allEquip.filter((e) => EQUIP_IDS.has(e)),
          services: allEquip.filter((e) => SVC_IDS.has(e)),
          amenities: allEquip.filter((e) => AMEN_IDS.has(e)),
          images: studio.images || [],
          videoUrl: studio.video_url || "",
          studioPlatformAddonIds: studio.addon_ids || [],
          partnerEquipmentSelections: studio.partner_inventory?.partnerEquipmentSelections ?? [],
          partnerServiceIds: studio.partner_inventory?.partnerServiceIds ?? [],
          partnerAddonSelections: studio.partner_inventory?.partnerAddonSelections ?? [],
          packages: studio.packages?.length ? studio.packages : DEFAULT_PKG_TEMPLATES,
        }));
      })
      .catch(() => {})
      .finally(() => setDraftLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);


  const refreshInventory = useCallback(() => {
    fetch("/api/partner/inventory")
      .then((r) => r.json())
      .then((d) => {
        setInventoryLibrary({
          equipment: d.equipment || [],
          services: d.services || [],
          addons: d.addons || [],
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentStep === 5 && !inventoryLoaded) {
      fetch("/api/partner/inventory")
        .then((r) => r.json())
        .then((d) => {
          setInventoryLibrary({
            equipment: d.equipment || [],
            services: d.services || [],
            addons: d.addons || [],
          });
          setInventoryLoaded(true);
        })
        .catch(() => setInventoryLoaded(true));
    }
  }, [currentStep, inventoryLoaded]);

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

  // Autosave within-session (localStorage) — so browser refreshes don't lose work.
  // Only active when continuing a draft (draftId present) or nothing in the session yet.
  // New sessions (no draftId) do NOT restore from this key; it's purely for refresh resilience.
  useEffect(() => {
    if (draftLoading) return; // don't overwrite while loading
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        const draftData = {
          ...formData,
          _draftId: draftId ?? undefined,
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
  }, [formData, draftId, draftLoading]);

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
        return "";
      case 3:
        if (!formData.pricePerHour || formData.pricePerHour <= 0) return "Please enter a valid price per hour.";
        if (formData.availableDays.length === 0) return "Please select at least one available day.";
        return "";
      case 4:
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

  // ─── Save as Draft ───────────────────────────────────────────────────────────

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState("");

  const handleSaveDraft = async () => {
    if (!formData.name.trim() || !formData.city) {
      setDraftSaveError("Please enter at least a studio name and city before saving a draft.");
      return;
    }
    setIsSavingDraft(true);
    setDraftSaveError("");
    const allEquipment = [...formData.equipment, ...formData.services, ...formData.amenities];
    try {
      if (draftId) {
        // Update existing draft
        const res = await fetch(`/api/partner/studios/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            shortDescription: formData.shortDescription,
            description: formData.shortDescription,
            fullDescription: formData.fullDescription,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country || "India",
            pricePerHour: formData.pricePerHour,
            capacity: formData.capacity,
            equipment: allEquipment,
            images: formData.images,
            videoUrl: formData.videoUrl || null,
            availableDays: formData.availableDays,
            workingHours: formData.workingHours,
            partnerEquipmentSelections: formData.partnerEquipmentSelections || [],
            partnerServiceIds: formData.partnerServiceIds || [],
            partnerAddonSelections: formData.partnerAddonSelections || [],
            addonIds: formData.studioPlatformAddonIds || [],
            packages: formData.packages.filter((p) => p.name.trim()),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setDraftSaveError(err.error || "Failed to update draft.");
          setIsSavingDraft(false);
          return;
        }
      } else {
        // Create new draft
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
            cancellationRules: null,
            rescheduleRules: null,
            partnerEquipmentSelections: formData.partnerEquipmentSelections || [],
            partnerServiceIds: formData.partnerServiceIds || [],
            partnerAddonSelections: formData.partnerAddonSelections || [],
            addonIds: formData.studioPlatformAddonIds || [],
            packages: formData.packages.filter((p) => p.name.trim()),
            saveAsDraft: true,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setDraftSaveError(err.error || "Failed to save draft.");
          setIsSavingDraft(false);
          return;
        }
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      router.push("/partner/studios");
    } catch {
      setDraftSaveError("Network error. Please try again.");
    }
    setIsSavingDraft(false);
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

  const setCoverImage = (index: number) => {
    if (index === 0 || index < 0 || index >= formData.images.length) return;
    const next = [...formData.images];
    const [picked] = next.splice(index, 1);
    updateFormData({ images: [picked, ...next] });
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitError("");
    const allEquipment = [...formData.equipment, ...formData.services, ...formData.amenities];
    try {
      let res: Response;
      if (draftId) {
        // Finalise an existing draft: full update + set review_status → pending_review
        res = await fetch(`/api/partner/studios/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            shortDescription: formData.shortDescription,
            description: formData.shortDescription,
            fullDescription: formData.fullDescription,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country || "India",
            pricePerHour: formData.pricePerHour,
            capacity: formData.capacity,
            equipment: allEquipment,
            images: formData.images,
            videoUrl: formData.videoUrl || null,
            availableDays: formData.availableDays,
            workingHours: formData.workingHours,
            cancellationRules: formData.useCustomPolicies ? formData.cancellationRules : null,
            useCustomPolicies: formData.useCustomPolicies,
            partnerEquipmentSelections: formData.partnerEquipmentSelections || [],
            partnerServiceIds: formData.partnerServiceIds || [],
            partnerAddonSelections: formData.partnerAddonSelections || [],
            addonIds: formData.studioPlatformAddonIds || [],
            packages: formData.packages.filter((p) => p.name.trim()),
            review_status: "pending_review",
          }),
        });
      } else {
        // Brand-new studio submission
        res = await fetch("/api/partner/studios", {
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
            cancellationRules: formData.useCustomPolicies ? formData.cancellationRules : null,
            rescheduleRules: formData.useCustomPolicies ? formData.rescheduleRules : null,
            partnerEquipmentSelections: formData.partnerEquipmentSelections || [],
            partnerServiceIds: formData.partnerServiceIds || [],
            partnerAddonSelections: formData.partnerAddonSelections || [],
            addonIds: formData.studioPlatformAddonIds || [],
            packages: formData.packages.filter((p) => p.name.trim()),
          }),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        if (err.code === "STUDIO_LIMIT_REACHED" && err.max === 0) {
          setSubscriptionStatus("no_plan");
        } else {
          setSubmitError(err.error || "Failed to submit studio. Please try again.");
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
        <p className="text-white/60">Enter your studio address so clients can find you</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">City *</label>
            <select
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors"
            >
              <option value="" className="bg-[#141414]">Select city…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name} className="bg-[#141414]">{c.name}</option>
              ))}
              <option value="Other" className="bg-[#141414]">Other</option>
            </select>
          </div>
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">State *</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="e.g., Maharashtra"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Full Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="e.g., 301, Creative Hub, Linking Road, Bandra West"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors resize-none"
          />
          <p className="text-white/30 text-xs mt-1.5">Include building name, floor, street, and landmark if applicable</p>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="India"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
          />
        </div>
      </div>
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

  // ─── Package helpers ─────────────────────────────────────────────────────────

  const updatePackage = (index: number, updates: Partial<StudioPackage>) => {
    const next = [...formData.packages];
    next[index] = { ...DEFAULT_PKG_TEMPLATES[index], ...next[index], ...updates };
    updateFormData({ packages: next });
  };

  const addPkgFeature = (pkgIndex: number) => {
    const next = [...formData.packages];
    const pkg = { ...DEFAULT_PKG_TEMPLATES[pkgIndex], ...next[pkgIndex] };
    pkg.features = [...(pkg.features || []), { text: "", included: true }];
    next[pkgIndex] = pkg;
    updateFormData({ packages: next });
  };

  const removePkgFeature = (pkgIndex: number, featIndex: number) => {
    const next = [...formData.packages];
    const pkg = { ...next[pkgIndex] };
    pkg.features = pkg.features.filter((_, fi) => fi !== featIndex);
    next[pkgIndex] = pkg;
    updateFormData({ packages: next });
  };

  const updatePkgFeatureText = (pkgIndex: number, featIndex: number, text: string) => {
    const next = [...formData.packages];
    const pkg = { ...next[pkgIndex] };
    pkg.features = pkg.features.map((f, fi) => fi === featIndex ? { ...f, text } : f);
    next[pkgIndex] = pkg;
    updateFormData({ packages: next });
  };

  const togglePkgFeatureIncluded = (pkgIndex: number, featIndex: number) => {
    const next = [...formData.packages];
    const pkg = { ...next[pkgIndex] };
    pkg.features = pkg.features.map((f, fi) => fi === featIndex ? { ...f, included: !f.included } : f);
    next[pkgIndex] = pkg;
    updateFormData({ packages: next });
  };

  const applyDefaultPkgFeatures = (pkgIndex: number) => {
    updatePackage(pkgIndex, { features: DEFAULT_PKG_FEATURES[pkgIndex] ?? [] });
  };

  const renderStep4 = () => {
    const pkgPlaceholders = [
      { name: "Basic Recording", desc: "Raw recording session with professional equipment" },
      { name: "Standard Mix", desc: "Recording with live mix monitoring by our engineer" },
      { name: "Premium Edit", desc: "Full session with post-production editing included" },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Booking Packages</h2>
          <p className="text-white/60">Define up to 3 packages clients can choose during booking</p>
        </div>

        <div className="space-y-5">
          {[0, 1, 2].map((i) => {
            const pkg = formData.packages[i] ?? DEFAULT_PKG_TEMPLATES[i];
            const ph = pkgPlaceholders[i];
            const hasName = pkg.name.trim().length > 0;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border transition-all",
                  hasName ? "border-[#D9FC67]/25 bg-[#D9FC67]/[0.03]" : "border-white/10 bg-white/[0.02]"
                )}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-bold shrink-0">{i + 1}</span>
                      <span className="text-white/60 text-sm font-medium">
                        {hasName ? pkg.name : `Package ${i + 1} (optional)`}
                      </span>
                      {pkg.is_popular && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9FC67]/20 text-[#D9FC67] font-bold uppercase">Best Deal</span>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-white/45 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pkg.is_popular}
                        onChange={(e) => updatePackage(i, { is_popular: e.target.checked })}
                        className="rounded border-white/20 accent-[#D9FC67]"
                      />
                      Mark as Best Deal
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block">Package Name</label>
                      <input
                        value={pkg.name}
                        onChange={(e) => updatePackage(i, { name: e.target.value })}
                        placeholder={ph.name}
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block">
                        Additional Price/hr
                        <span className="text-white/30 ml-1 font-normal">(₹, leave 0 if included in studio rate)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={pkg.price_per_hour}
                          onChange={(e) => updatePackage(i, { price_per_hour: parseInt(e.target.value) || 0 })}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 text-white focus:border-[#D9FC67] focus:outline-none text-sm transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-xs mb-1.5 block">Description</label>
                    <input
                      value={pkg.description}
                      onChange={(e) => updatePackage(i, { description: e.target.value })}
                      placeholder={ph.desc}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/25 focus:border-[#D9FC67] focus:outline-none text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/60 text-xs">Features</label>
                      <div className="flex items-center gap-3">
                        {pkg.features.length === 0 && (
                          <button
                            type="button"
                            onClick={() => applyDefaultPkgFeatures(i)}
                            className="text-white/30 hover:text-[#D9FC67]/70 text-xs underline underline-offset-2 transition-colors"
                          >
                            Load defaults
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => addPkgFeature(i)}
                          className="text-[#D9FC67]/60 hover:text-[#D9FC67] text-xs flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add feature
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pkg.features.map((feat, fi) => (
                        <div key={fi} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePkgFeatureIncluded(i, fi)}
                            title={feat.included ? "Click to mark as excluded" : "Click to mark as included"}
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0",
                              feat.included ? "bg-[#D9FC67]/20 text-[#D9FC67]" : "bg-red-500/10 text-red-400/60"
                            )}
                          >
                            {feat.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </button>
                          <input
                            value={feat.text}
                            onChange={(e) => updatePkgFeatureText(i, fi, e.target.value)}
                            placeholder="e.g., Professional studio access"
                            className="flex-1 h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-white placeholder:text-white/25 focus:border-[#D9FC67]/50 focus:outline-none text-sm transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => removePkgFeature(i, fi)}
                            className="text-white/25 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {pkg.features.length === 0 && (
                        <p className="text-white/25 text-xs pl-7">No features added yet — use defaults or add manually.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-white/25 text-xs text-center">
          Leave package name empty to skip it. At least 1 package is recommended.
        </p>
      </div>
    );
  };

  // ─── Step 5: Add-ons ─────────────────────────────────────────────────────────

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Add-ons for this Studio</h2>
        <p className="text-white/60">Platform add-ons are auto-applied to all studios. Select which of your own add-ons to offer.</p>
      </div>

      {addonsLoading && !inventoryLoaded ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : (
        <StudioPartnerAddonPicker
          platformAddons={platformAddons}
          partnerAddons={inventoryLibrary.addons}
          selectedPlatformIds={formData.studioPlatformAddonIds}
          partnerAddonSelections={formData.partnerAddonSelections}
          onChangePlatform={(ids) => updateFormData({ studioPlatformAddonIds: ids })}
          onChangePartnerSelections={(rows) => updateFormData({ partnerAddonSelections: rows })}
        />
      )}

      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-white/35 text-xs">
          Need to create new add-ons? Go to the{" "}
          <button
            type="button"
            onClick={() => {
              setInventoryDrawerTab("addons");
              setInventoryDrawerOpen(true);
            }}
            className="text-[#D9FC67]/70 hover:text-[#D9FC67] underline underline-offset-2"
          >
            Add-ons Manager
          </button>
        </p>
      </div>
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
                  className="absolute top-2 right-2 p-1 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {index === 0 ? (
                  <span className="absolute bottom-2 left-2 bg-[#D9FC67] text-black text-xs px-2 py-0.5 rounded-full font-medium z-10">
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCoverImage(index)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-[#D9FC67] hover:text-black transition-colors z-10"
                    title="Set as cover image"
                    aria-label="Set as cover image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
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
          placeholder="YouTube, Vimeo, or Google Drive link (e.g., https://youtube.com/watch?v=...)"
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
        />
        <p className="text-white/30 text-xs mt-1">YouTube, Vimeo, or Google Drive links are supported. A walkthrough video helps clients visualise the space before booking.</p>
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

          {/* Packages */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Packages</h3>
              <button onClick={() => setCurrentStep(4)} className="text-[#D9FC67] text-xs hover:underline">Edit</button>
            </div>
            {formData.packages.filter((p) => p.name.trim()).length === 0 ? (
              <p className="text-white/30 text-sm">No packages defined yet</p>
            ) : (
              <div className="space-y-2">
                {formData.packages.filter((p) => p.name.trim()).map((pkg, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                    <span className="text-white text-xs font-medium">{pkg.name}</span>
                    <div className="flex items-center gap-2">
                      {pkg.is_popular && <span className="text-[10px] text-[#D9FC67] font-bold">BEST DEAL</span>}
                      <span className="text-white/50 text-xs">
                        {pkg.price_per_hour === 0 ? "Included" : `+₹${pkg.price_per_hour}/hr`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(formData.studioPlatformAddonIds.length > 0 || formData.partnerAddonSelections.length > 0) && (
              <p className="text-white/40 text-xs mt-3">
                Add-ons: {formData.studioPlatformAddonIds.length} platform · {formData.partnerAddonSelections.length} custom
              </p>
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

  if (draftLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="-m-6">
      <header className="border-b border-white/5 px-6 py-3 bg-[#09090b]">
        <div className="flex items-center justify-between">
          <Link href="/partner/studios" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Studios
          </Link>
          <h1 className="text-lg font-bold text-white">
            {draftId ? "Continue Draft" : "Create New Studio"}
          </h1>
          {draftId ? (
            <span className="text-amber-400/70 text-xs bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
              Draft
            </span>
          ) : (
            <span className="w-20" />
          )}
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
        <div className="flex items-center justify-between mt-6 gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-white/10 text-white hover:bg-white/5 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Save as Draft — always visible while in the flow */}
            {currentStep < 8 && (
              <Button
                variant="outline"
                onClick={() => void handleSaveDraft()}
                disabled={isSavingDraft || !formData.name.trim() || !formData.city}
                className="border-white/20 text-white/60 hover:border-amber-400/50 hover:text-amber-400 disabled:opacity-40"
                title={!formData.name.trim() || !formData.city ? "Enter a name and city first" : undefined}
              >
                {isSavingDraft ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save as Draft"}
              </Button>
            )}

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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void handleSaveDraft()}
                      disabled={isSavingDraft}
                      className="border-white/20 text-white/60 hover:border-amber-400/50 hover:text-amber-400 disabled:opacity-40"
                    >
                      {isSavingDraft ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save as Draft"}
                    </Button>
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {draftSaveError && (
          <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {draftSaveError}
          </p>
        )}

        {/* Autosave notice */}
        <p className="text-center text-white/20 text-xs mt-4">
          {draftId ? "Continuing draft \u2014 click Save as Draft or Submit for Review to keep changes" : "Use \u201cSave as Draft\u201d to save progress and continue later"}
        </p>
      </main>

      <PartnerInventoryDrawer
        open={inventoryDrawerOpen}
        initialTab={inventoryDrawerTab}
        onClose={() => {
          setInventoryDrawerOpen(false);
          refreshInventory();
        }}
      />
    </div>
  );
}

export default function CreateStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CreateStudioPageInner />
    </Suspense>
  );
}
