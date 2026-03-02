"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Camera,
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
  Sparkles,
  CheckCircle,
  Shield,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCities, City } from "@/lib/data";

const STUDIO_TYPES = [
  { id: "audio", name: "Audio Only", icon: Mic, description: "Perfect for podcasts & voice recordings" },
  { id: "video", name: "Video", icon: Video, description: "For video podcasts & content creation" },
  { id: "hybrid", name: "Hybrid", icon: Sparkles, description: "Full audio & video production" },
];

const EQUIPMENT_OPTIONS = [
  { id: "microphones", name: "Professional Microphones", icon: Mic },
  { id: "headphones", name: "Studio Headphones", icon: Music },
  { id: "cameras", name: "Video Cameras", icon: Video },
  { id: "lighting", name: "Studio Lighting", icon: Lightbulb },
  { id: "mixer", name: "Audio Mixer", icon: Volume2 },
  { id: "soundproofing", name: "Soundproofing", icon: Volume2 },
  { id: "teleprompter", name: "Teleprompter", icon: Monitor },
  { id: "monitor", name: "Reference Monitors", icon: Monitor },
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
  studioType: "audio" | "video" | "hybrid";
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
  amenities: string[];
  images: string[];
  useCustomPolicies: boolean;
  cancellationRules: CancellationRule[];
  rescheduleRules: RescheduleRule[];
}

const initialFormData: StudioFormData = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  studioType: "hybrid",
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
  amenities: [],
  images: [],
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
  { id: 5, name: "Photos", short: "Photos" },
  { id: 6, name: "Policies", short: "Policies" },
  { id: 7, name: "Review", short: "Review" },
];

export default function CreateStudioPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StudioFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCities().then(setCities).catch(console.error);
  }, []);

  const updateFormData = (updates: Partial<StudioFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.name && !!formData.shortDescription;
      case 2:
        return !!formData.address && !!formData.city;
      case 3:
        return formData.pricePerHour > 0;
      case 4:
        return formData.equipment.length > 0;
      case 5:
        return formData.images.length > 0;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            updateFormData({ images: [...formData.images, ...newImages] });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, [formData.images]);

  const removeImage = (index: number) => {
    updateFormData({ images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const studioId = Date.now().toString();
    
    const newStudio = {
      id: studioId,
      name: formData.name,
      description: formData.shortDescription,
      address: formData.address,
      city: formData.city,
      area: formData.address.split(",")[0] || formData.city,
      price_per_hour: formData.pricePerHour,
      capacity: formData.capacity,
      equipment: formData.equipment,
      images: formData.images,
      status: "active" as const,
    };

    const existingStudios = localStorage.getItem("partner_studios");
    const studios = existingStudios ? JSON.parse(existingStudios) : [];
    studios.push(newStudio);
    localStorage.setItem("partner_studios", JSON.stringify(studios));

    if (formData.useCustomPolicies) {
      const existingPolicies = localStorage.getItem("partner_policies");
      let policies = existingPolicies ? JSON.parse(existingPolicies) : { defaultPolicies: { cancellation: [], reschedule: [] }, studioPolicies: {} };
      
      policies.studioPolicies[studioId] = {
        cancellation: formData.cancellationRules,
        reschedule: formData.rescheduleRules,
      };
      
      localStorage.setItem("partner_policies", JSON.stringify(policies));
    }

    setIsLoading(false);
    router.push("/partner/studios");
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  currentStep === step.id
                    ? "bg-[#D9FC67] text-black ring-4 ring-[#D9FC67]/20"
                    : currentStep > step.id
                    ? "bg-[#D9FC67] text-black"
                    : "bg-white/10 text-white/40"
                )}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={cn("text-xs mt-2 hidden sm:block", currentStep >= step.id ? "text-white" : "text-white/40")}>
                {step.short}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn("w-12 sm:w-20 h-0.5 mx-2 transition-colors", currentStep > step.id ? "bg-[#D9FC67]" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Basic Studio Information</h2>
        <p className="text-white/60">Tell us about your studio</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Studio Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Nest Studio, Apex Recording"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors text-lg"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Short Description *</label>
          <input
            type="text"
            value={formData.shortDescription}
            onChange={(e) => updateFormData({ shortDescription: e.target.value })}
            placeholder="e.g., Cozy fireside studio for intimate podcasts"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Full Description</label>
          <textarea
            value={formData.fullDescription}
            onChange={(e) => updateFormData({ fullDescription: e.target.value })}
            placeholder="Describe your studio in detail..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Studio Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STUDIO_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => updateFormData({ studioType: type.id as "audio" | "video" | "hybrid" })}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  formData.studioType === type.id
                    ? "border-[#D9FC67] bg-[#D9FC67]/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                <type.icon className={cn("w-6 h-6 mb-2", formData.studioType === type.id ? "text-[#D9FC67]" : "text-white/60")} />
                <p className="text-white font-medium">{type.name}</p>
                <p className="text-white/40 text-xs mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Capacity (number of seats) *</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateFormData({ capacity: Math.max(1, formData.capacity - 1) })}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:border-white/30 transition-colors"
            >
              -
            </button>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-white/60" />
              <span className="text-2xl font-bold text-white w-12 text-center">{formData.capacity}</span>
              <span className="text-white/60">guests</span>
            </div>
            <button
              type="button"
              onClick={() => updateFormData({ capacity: Math.min(20, formData.capacity + 1) })}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white hover:border-white/30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Location & Address</h2>
        <p className="text-white/60">Where is your studio located?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">City *</label>
          <select
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white focus:border-[#D9FC67] focus:outline-none transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center", backgroundSize: "1.5em" }}
          >
            <option value="" className="bg-[#141414]">Select a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name} className="bg-[#141414]">{city.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Full Address *</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateFormData({ address: e.target.value })}
              placeholder="Street address, area, landmark"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="e.g., Maharashtra"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
            />
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

        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-white/20 mx-auto mb-2" />
              <p className="text-white/40">Map preview will appear here</p>
              <p className="text-white/20 text-sm">{formData.address || "Enter address above"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Pricing & Availability</h2>
        <p className="text-white/60">Set your rates and working hours</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Price per Hour *</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="number"
              value={formData.pricePerHour}
              onChange={(e) => updateFormData({ pricePerHour: parseInt(e.target.value) || 0 })}
              placeholder="1500"
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors text-lg"
            />
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-2 block">Discount (%)</label>
          <input
            type="number"
            value={formData.discountPercent}
            onChange={(e) => updateFormData({ discountPercent: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/30 focus:border-[#D9FC67] focus:outline-none transition-colors"
          />
          <p className="text-white/40 text-xs mt-2">Optional discount for bookings</p>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Working Hours</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1 block">Start Time</label>
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
              <label className="text-white/40 text-xs mb-1 block">End Time</label>
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
          <label className="text-white/80 text-sm font-medium mb-3 block">Available Days</label>
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
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Equipment & Features</h2>
        <p className="text-white/60">What equipment and amenities do you have?</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Equipment</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const newEquipment = formData.equipment.includes(item.id)
                    ? formData.equipment.filter((e) => e !== item.id)
                    : [...formData.equipment, item.id];
                  updateFormData({ equipment: newEquipment });
                }}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                  formData.equipment.includes(item.id)
                    ? "border-[#D9FC67] bg-[#D9FC67]/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                <item.icon className={cn("w-6 h-6", formData.equipment.includes(item.id) ? "text-[#D9FC67]" : "text-white/60")} />
                <span className={cn("text-xs text-center", formData.equipment.includes(item.id) ? "text-white" : "text-white/60")}>
                  {item.name}
                </span>
                {formData.equipment.includes(item.id) && (
                  <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-[#D9FC67]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm font-medium mb-3 block">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AMENITIES_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const newAmenities = formData.amenities.includes(item.id)
                    ? formData.amenities.filter((a) => a !== item.id)
                    : [...formData.amenities, item.id];
                  updateFormData({ amenities: newAmenities });
                }}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                  formData.amenities.includes(item.id)
                    ? "border-[#D9FC67] bg-[#D9FC67]/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                <item.icon className={cn("w-6 h-6", formData.amenities.includes(item.id) ? "text-[#D9FC67]" : "text-white/60")} />
                <span className={cn("text-xs text-center", formData.amenities.includes(item.id) ? "text-white" : "text-white/60")}>
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Studio Photos</h2>
        <p className="text-white/60">Upload high-quality photos of your studio</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
          isDragging
            ? "border-[#D9FC67] bg-[#D9FC67]/10"
            : "border-white/10 hover:border-white/20"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
        <Upload className={cn("w-12 h-12 mx-auto mb-4", isDragging ? "text-[#D9FC67]" : "text-white/40")} />
        <p className="text-white font-medium mb-1">
          {isDragging ? "Drop images here" : "Drag & drop images or click to upload"}
        </p>
        <p className="text-white/40 text-sm">PNG, JPG up to 10MB each</p>
      </div>

      {formData.images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {formData.images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-[#D9FC67] text-black text-xs px-2 py-1 rounded-full font-medium">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => {
    const addCancellationRule = () => {
      const newRule = { id: Date.now().toString(), type: "days" as const, value: 1, refundPercent: 100, deductionPercent: 0 };
      updateFormData({ cancellationRules: [...formData.cancellationRules, newRule] });
    };
    
    const removeCancellationRule = (id: string) => {
      updateFormData({ cancellationRules: formData.cancellationRules.filter(r => r.id !== id) });
    };
    
    const updateCancellationRule = (id: string, updates: Partial<CancellationRule>) => {
      updateFormData({
        cancellationRules: formData.cancellationRules.map(r => r.id === id ? { ...r, ...updates } : r)
      });
    };
    
    const addRescheduleRule = () => {
      const newRule = { id: Date.now().toString(), type: "days" as const, value: 1, deductionPercent: 0 };
      updateFormData({ rescheduleRules: [...formData.rescheduleRules, newRule] });
    };
    
    const removeRescheduleRule = (id: string) => {
      updateFormData({ rescheduleRules: formData.rescheduleRules.filter(r => r.id !== id) });
    };
    
    const updateRescheduleRule = (id: string, updates: Partial<RescheduleRule>) => {
      updateFormData({
        rescheduleRules: formData.rescheduleRules.map(r => r.id === id ? { ...r, ...updates } : r)
      });
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Policies</h2>
          <p className="text-white/60">Configure cancellation and reschedule rules</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="text-white font-medium">Use Custom Policies</p>
            <p className="text-white/40 text-sm">Enable custom policies for this studio</p>
          </div>
          <button
            onClick={() => updateFormData({ useCustomPolicies: !formData.useCustomPolicies })}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              formData.useCustomPolicies ? "bg-[#D9FC67]" : "bg-white/20"
            )}
          >
            <span className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-black transition-transform",
              formData.useCustomPolicies ? "left-7" : "left-1"
            )} />
          </button>
        </div>

        {formData.useCustomPolicies ? (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-400/10">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-white font-semibold">Cancellation Rules</h3>
                </div>
                <button onClick={addCancellationRule} className="text-[#D9FC67] text-sm hover:underline flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.cancellationRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/40 text-xs">Rule {index + 1}</span>
                      {formData.cancellationRules.length > 1 && (
                        <button onClick={() => removeCancellationRule(rule.id)} className="ml-auto text-white/40 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) => updateCancellationRule(rule.id, { type: e.target.value as "days" | "hours" })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                      >
                        <option value="days" className="bg-[#141414]">days</option>
                        <option value="hours" className="bg-[#141414]">hours</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={rule.value}
                        onChange={(e) => updateCancellationRule(rule.id, { value: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.refundPercent}
                        onChange={(e) => updateCancellationRule(rule.id, { refundPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                        placeholder="Refund %"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-400/10">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-white font-semibold">Reschedule Rules</h3>
                </div>
                <button onClick={addRescheduleRule} className="text-[#D9FC67] text-sm hover:underline flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.rescheduleRules.map((rule, index) => (
                  <div key={rule.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/40 text-xs">Rule {index + 1}</span>
                      {formData.rescheduleRules.length > 1 && (
                        <button onClick={() => removeRescheduleRule(rule.id)} className="ml-auto text-white/40 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) => updateRescheduleRule(rule.id, { type: e.target.value as "days" | "hours" })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                      >
                        <option value="days" className="bg-[#141414]">days</option>
                        <option value="hours" className="bg-[#141414]">hours</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={rule.value}
                        onChange={(e) => updateRescheduleRule(rule.id, { value: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.deductionPercent}
                        onChange={(e) => updateRescheduleRule(rule.id, { deductionPercent: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs"
                        placeholder="Deduction %"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
            <Shield className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">This studio will use your default policies</p>
            <p className="text-white/40 text-sm mt-1">Configure default policies in Settings → Policies</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review & Confirm</h2>
        <p className="text-white/60">Review your studio details before publishing</p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Basic Information</h3>
            <button onClick={() => setCurrentStep(1)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-white/40">Name:</span> <span className="text-white">{formData.name}</span></p>
            <p><span className="text-white/40">Description:</span> <span className="text-white">{formData.shortDescription}</span></p>
            <p><span className="text-white/40">Type:</span> <span className="text-white capitalize">{formData.studioType}</span></p>
            <p><span className="text-white/40">Capacity:</span> <span className="text-white">{formData.capacity} guests</span></p>
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Location</h3>
            <button onClick={() => setCurrentStep(2)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-white/40">City:</span> <span className="text-white">{formData.city}</span></p>
            <p><span className="text-white/40">Address:</span> <span className="text-white">{formData.address}</span></p>
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pricing</h3>
            <button onClick={() => setCurrentStep(3)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-white/40">Price:</span> <span className="text-white">₹{formData.pricePerHour}/hour</span></p>
            {formData.discountPercent > 0 && (
              <p><span className="text-white/40">Discount:</span> <span className="text-white">{formData.discountPercent}%</span></p>
            )}
            <p><span className="text-white/40">Hours:</span> <span className="text-white">{formData.workingHours.start} - {formData.workingHours.end}</span></p>
            <p><span className="text-white/40">Days:</span> <span className="text-white">{formData.availableDays.join(", ")}</span></p>
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Equipment & Amenities</h3>
            <button onClick={() => setCurrentStep(4)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.equipment.map((eq) => (
              <span key={eq} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">{eq}</span>
            ))}
            {formData.amenities.map((am) => (
              <span key={am} className="px-3 py-1 bg-[#D9FC67]/10 rounded-full text-xs text-[#D9FC67]">{am}</span>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Photos</h3>
            <button onClick={() => setCurrentStep(5)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {formData.images.slice(0, 5).map((img, index) => (
              <img key={index} src={img} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            ))}
            {formData.images.length > 5 && (
              <span className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white flex-shrink-0">+{formData.images.length - 5} more</span>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Policies</h3>
            <button onClick={() => setCurrentStep(6)} className="text-[#D9FC67] text-sm hover:underline">Edit</button>
          </div>
          {formData.useCustomPolicies ? (
            <div className="space-y-3 text-sm">
              <p className="text-white/40">Using custom policies for this studio</p>
              <div>
                <p className="text-white/60 text-xs mb-1">Cancellation:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.cancellationRules.slice(0, 2).map((rule) => (
                    <span key={rule.id} className="px-2 py-1 bg-red-400/10 rounded text-xs text-red-400">
                      {rule.type === "days" ? `${rule.value}d` : `${rule.value}h`} → {rule.refundPercent}%
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Reschedule:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.rescheduleRules.slice(0, 2).map((rule) => (
                    <span key={rule.id} className="px-2 py-1 bg-yellow-400/10 rounded text-xs text-yellow-400">
                      {rule.type === "days" ? `${rule.value}d` : `${rule.value}h`} → -{rule.deductionPercent}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">Using default partner policies</p>
          )}
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

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/partner/studios" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Studios</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Create New Studio</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {renderStepIndicator()}

        <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
          {renderCurrentStep()}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 7 ? (
            <Button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold disabled:opacity-50"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold"
            >
              {isLoading ? "Creating..." : "Create Studio"}
              {!isLoading && <CheckCircle className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
