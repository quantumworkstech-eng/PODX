"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  Image as ImageIcon,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CancellationRule {
  hours_before: number;
  refund_percentage: number;
}

interface Studio {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  price_per_hour: number;
  capacity: number;
  buffer_minutes: number;
  reschedule_cutoff_hours?: number;
  cancellation_rules?: CancellationRule[];
  equipment?: string[];
  addon_ids?: string[];
  images: string[];
  status: "active" | "inactive";
  review_status?: string;
}

const BUFFER_OPTIONS = [
  { value: 0,   label: "No buffer" },
  { value: 15,  label: "15 minutes" },
  { value: 30,  label: "30 minutes" },
  { value: 45,  label: "45 minutes" },
  { value: 60,  label: "1 hour" },
  { value: 90,  label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const equipmentOptions = [
  "Microphones",
  "Headphones",
  "Audio Interface",
  "Mixer",
  "Pop Filters",
  "Boom Arm",
  "Acoustic Panels",
  "Video Camera",
  "Lighting Kit",
  "Green Screen",
  "Teleprompter",
  "Monitor",
];


export default function PartnerStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormHydrating, setIsFormHydrating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_CANCELLATION_RULES: CancellationRule[] = [
    { hours_before: 48, refund_percentage: 100 },
    { hours_before: 24, refund_percentage: 50 },
    { hours_before: 0, refund_percentage: 0 },
  ];

  const [formData, setFormData] = useState<Partial<Studio> & { status?: "active" | "inactive"; addonIds?: string[] }>({
    name: "",
    description: "",
    address: "",
    city: "",
    price_per_hour: 0,
    capacity: 2,
    buffer_minutes: 0,
    reschedule_cutoff_hours: 48,
    cancellation_rules: DEFAULT_CANCELLATION_RULES,
    equipment: [],
    addonIds: [],
    images: [],
    status: "active",
  });

  const [platformAddons, setPlatformAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetch("/api/partner/studios")
      .then((r) => r.json())
      .then((d) => setStudios(d.studios || []))
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, []);

  const handleOpenModal = async (studio?: Studio) => {
    setFormError(null);
    if (studio) {
      setEditingStudio(studio);
      setFormData({
        ...studio,
        cancellation_rules: DEFAULT_CANCELLATION_RULES,
        addonIds: studio.addon_ids || [],
      });
      setIsFormHydrating(true);
      // Fetch latest studio details (single source of truth) so popup always
      // reflects the partner's latest changes, not stale list data.
      fetch(`/api/partner/studios/${studio.id}`)
        .then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed to load studio details")))
        .then(({ studio: fresh }) => {
          if (!fresh) return;
          setFormData((prev) => ({
            ...prev,
            ...fresh,
            addonIds: fresh.addon_ids || [],
          }));
        })
        .catch(() => {
          setFormError("Could not load latest studio details. Showing current values.");
        })
        .finally(() => setIsFormHydrating(false));
      // Fetch studio policy to pre-fill cancellation rules
      fetch(`/api/studios/${studio.id}/policy`)
        .then((r) => r.json())
        .then(({ rules, reschedule_cutoff_hours }) => {
          setFormData((prev) => ({
            ...prev,
            cancellation_rules: rules || DEFAULT_CANCELLATION_RULES,
            reschedule_cutoff_hours: reschedule_cutoff_hours ?? 48,
          }));
        })
        .catch(() => {});
    } else {
      setEditingStudio(null);
      setFormData({
        name: "",
        description: "",
        address: "",
        city: "",
        price_per_hour: 0,
        capacity: 2,
        buffer_minutes: 0,
        reschedule_cutoff_hours: 48,
        cancellation_rules: DEFAULT_CANCELLATION_RULES,
        equipment: [],
        addonIds: [],
        images: [],
        status: "active",
      });
    }
    setIsModalOpen(true);
    // Fetch platform add-ons
    if (platformAddons.length === 0) {
      setAddonsLoading(true);
      fetch("/api/addons")
        .then((r) => r.json())
        .then((d) => setPlatformAddons(d.addons || []))
        .catch(() => setPlatformAddons([]))
        .finally(() => setAddonsLoading(false));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudio(null);
    setFormError(null);
    setIsFormHydrating(false);
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      price_per_hour: 0,
      capacity: 2,
      buffer_minutes: 0,
      reschedule_cutoff_hours: 48,
      cancellation_rules: DEFAULT_CANCELLATION_RULES,
      equipment: [],
      addonIds: [],
      images: [],
      status: "active",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      if (editingStudio) {
        const res = await fetch(`/api/partner/studios/${editingStudio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            pricePerHour: formData.price_per_hour,
            capacity: formData.capacity,
            buffer_minutes: formData.buffer_minutes ?? 0,
            reschedule_cutoff_hours: formData.reschedule_cutoff_hours ?? 48,
            images: formData.images,
            is_active: formData.status !== "inactive",
            equipment: formData.equipment || [],
            addonIds: formData.addonIds || [],
            useCustomPolicies: true,
            cancellationRules: (formData.cancellation_rules || []).map((r) => ({
              type: "hours",
              value: r.hours_before,
              refundPercent: r.refund_percentage,
            })),
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || "Failed to update studio");
        }
      } else {
        const res = await fetch("/api/partner/studios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            pricePerHour: formData.price_per_hour,
            capacity: formData.capacity,
            images: formData.images,
            equipment: formData.equipment || [],
            addonIds: formData.addonIds || [],
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || "Failed to create studio");
        }
      }
      // Refresh list from API
      const r = await fetch("/api/partner/studios");
      const d = await r.json();
      setStudios(d.studios || []);
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save studio:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save studio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/partner/studios/${id}`, { method: "DELETE" });
      setStudios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete studio:", err);
    }
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id: string) => {
    const studio = studios.find((s) => s.id === id);
    if (!studio) return;
    const newActive = studio.status !== "active";
    try {
      await fetch(`/api/partner/studios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
      setStudios((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: (newActive ? "active" : "inactive") as "active" | "inactive" } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle studio status:", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/partner/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      } catch {
        /* skip failed uploads */
      }
    }
    if (uploaded.length > 0) {
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
    }
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment?.includes(item) ? prev.equipment.filter((e) => e !== item) : [...(prev.equipment || []), item],
    }));
  };

  const toggleAddon = (addonId: string) => {
    setFormData((prev) => ({
      ...prev,
      addonIds: (prev.addonIds || []).includes(addonId)
        ? (prev.addonIds || []).filter((id) => id !== addonId)
        : [...(prev.addonIds || []), addonId],
    }));
  };

  const nextImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({ ...prev, [studioId]: ((prev[studioId] || 0) + 1) % totalImages }));
  };

  const prevImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({ ...prev, [studioId]: ((prev[studioId] || 0) - 1 + totalImages) % totalImages }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Studios</h2>
          <p className="text-white/40">Manage your podcast studio listings</p>
        </div>
        <Link href="/partner/studios/create" className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold px-4 py-2 rounded-full inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Studio
        </Link>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : studios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div key={studio.id} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
              <div className="relative h-48 bg-white/5">
                {studio.images && studio.images.length > 0 ? (
                  <>
                    <img src={studio.images[currentImageIndex[studio.id] || 0]} alt={studio.name} className="w-full h-full object-cover" />
                    {studio.images.length > 1 && (
                      <>
                        <button onClick={() => prevImage(studio.id, studio.images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => nextImage(studio.id, studio.images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {studio.images.map((_, idx) => (
                            <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", idx === currentImageIndex[studio.id] ? "bg-[#D9FC67]" : "bg-white/30")} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  {studio.review_status !== "pending_review" && (
                    <button onClick={() => handleToggleStatus(studio.id)} className={cn("p-2 rounded-lg backdrop-blur-sm transition-colors", studio.status === "active" ? "bg-green-400/20 text-green-400" : "bg-white/10 text-white/40")}>
                      {studio.status === "active" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{studio.name}</h3>
                  {studio.review_status === "pending_review" ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                      In Review
                    </span>
                  ) : (
                    <span className={cn("text-xs px-2 py-1 rounded-full", studio.status === "active" ? "bg-green-400/10 text-green-400" : "bg-white/10 text-white/40")}>
                      {studio.status === "active" ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-white/40 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  {studio.address ? `${studio.address}, ` : ""}{studio.city}
                </div>

                {studio.review_status === "pending_review" && (
                  <p className="text-yellow-400/70 text-xs mb-2 bg-yellow-400/5 border border-yellow-400/10 rounded-lg px-3 py-2">
                    Awaiting admin approval before going live
                  </p>
                )}

                <p className="text-white/60 text-sm line-clamp-2 mb-4">{studio.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-white/60 text-sm">
                    <Users className="w-4 h-4" />
                    {studio.capacity}
                  </div>
                  <div className="flex items-center gap-1 text-[#D9FC67] font-semibold">
                    <span className="text-sm">₹</span>
                    {studio.price_per_hour.toLocaleString("en-IN")}/hr
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleOpenModal(studio)} variant="outline" size="sm" className="flex-1 border-white/10 text-white hover:bg-white/5">
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button onClick={() => setDeleteConfirm(studio.id)} variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-2xl">
          <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No studios yet</h3>
          <p className="text-white/40 mb-6">Start by adding your first podcast studio</p>
          <Button onClick={() => handleOpenModal()} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Studio
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{editingStudio ? "Edit Studio" : "Add New Studio"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(isFormHydrating || formError) && (
              <div className={cn(
                "rounded-lg px-3 py-2 text-sm",
                isFormHydrating
                  ? "bg-white/5 text-white/60 border border-white/10"
                  : "bg-red-500/10 text-red-300 border border-red-500/30"
              )}>
                {isFormHydrating ? "Loading latest studio details..." : formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Studio Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Nest Studio" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your studio..." className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#D9FC67] focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">City *</label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g., Mumbai" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Address</label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Price per Hour (₹) *</label>
                  <Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData({ ...formData, price_per_hour: parseInt(e.target.value) || 0 })} placeholder="1500" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Capacity *</label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })} placeholder="4" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" required />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-1 block">Buffer Time After Booking</label>
                <p className="text-white/30 text-xs mb-2">Time blocked after each session for cleanup & prep. Not visible to clients.</p>
                <div className="flex flex-wrap gap-2">
                  {BUFFER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, buffer_minutes: opt.value })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        formData.buffer_minutes === opt.value
                          ? "bg-[#D9FC67] text-black"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancellation & Reschedule Policy */}
              <div className="border border-white/10 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-white/80 text-sm font-medium">Cancellation & Reschedule Policy</p>
                  <p className="text-white/30 text-xs mt-0.5">Define refund tiers and the minimum notice required for rescheduling.</p>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Reschedule cutoff (hours before session)</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.reschedule_cutoff_hours ?? 48}
                    onChange={(e) => setFormData({ ...formData, reschedule_cutoff_hours: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white w-32"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-2 block uppercase tracking-wider">Cancellation refund tiers</label>
                  <div className="space-y-2">
                    {(formData.cancellation_rules || DEFAULT_CANCELLATION_RULES).map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          <Input
                            type="number"
                            min={0}
                            value={rule.hours_before}
                            onChange={(e) => {
                              const rules = [...(formData.cancellation_rules || DEFAULT_CANCELLATION_RULES)];
                              rules[i] = { ...rules[i], hours_before: parseInt(e.target.value) || 0 };
                              setFormData({ ...formData, cancellation_rules: rules });
                            }}
                            className="bg-white/5 border-white/10 text-white w-20 text-sm"
                          />
                          <span className="text-white/40 text-xs whitespace-nowrap">hrs+</span>
                          <span className="text-white/40 text-xs">→</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={rule.refund_percentage}
                            onChange={(e) => {
                              const rules = [...(formData.cancellation_rules || DEFAULT_CANCELLATION_RULES)];
                              rules[i] = { ...rules[i], refund_percentage: parseInt(e.target.value) || 0 };
                              setFormData({ ...formData, cancellation_rules: rules });
                            }}
                            className="bg-white/5 border-white/10 text-white w-16 text-sm"
                          />
                          <span className="text-white/40 text-xs">% refund</span>
                        </div>
                        {(formData.cancellation_rules || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const rules = (formData.cancellation_rules || DEFAULT_CANCELLATION_RULES).filter((_, idx) => idx !== i);
                              setFormData({ ...formData, cancellation_rules: rules });
                            }}
                            className="text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const rules = [...(formData.cancellation_rules || DEFAULT_CANCELLATION_RULES), { hours_before: 0, refund_percentage: 0 }];
                        setFormData({ ...formData, cancellation_rules: rules });
                      }}
                      className="text-[#D9FC67]/70 hover:text-[#D9FC67] text-xs flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add tier
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Equipment</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleEquipment(item)} className={cn("px-3 py-1.5 rounded-full text-sm transition-colors", formData.equipment?.includes(item) ? "bg-[#D9FC67] text-black" : "bg-white/5 text-white/60 hover:bg-white/10")}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Add-ons */}
              <div>
                <label className="text-white/60 text-sm mb-1 block">Platform Add-ons</label>
                <p className="text-white/30 text-xs mb-3">Select add-ons customers can purchase when booking this studio</p>
                {addonsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : platformAddons.length === 0 ? (
                  <p className="text-white/20 text-sm py-4 text-center bg-white/[0.02] rounded-xl border border-white/5">
                    No add-ons configured on the platform yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {platformAddons.map((addon) => {
                      const selected = (formData.addonIds || []).includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left",
                            selected
                              ? "bg-[#D9FC67]/10 border-[#D9FC67]/30"
                              : "bg-white/[0.03] border-white/5 hover:border-white/15"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-medium", selected ? "text-[#D9FC67]" : "text-white/80")}>
                              {addon.name}
                            </p>
                            {addon.description && (
                              <p className="text-white/30 text-xs mt-0.5 truncate">{addon.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                            <span className={cn("font-semibold text-sm", selected ? "text-[#D9FC67]" : "text-white/60")}>
                              ₹{Number(addon.price).toLocaleString()}
                            </span>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                              selected ? "bg-[#D9FC67] border-[#D9FC67]" : "border-white/20"
                            )}>
                              {selected && <Check className="w-3 h-3 text-black" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Studio Photos</label>
                <div className={cn("border-2 border-dashed rounded-xl p-6 text-center", uploadingImages ? "border-white/5 opacity-60" : "border-white/10")}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} className="text-[#D9FC67] hover:text-[#E8FF8A] disabled:cursor-wait">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">{uploadingImages ? "Uploading..." : "Click to upload or drag and drop"}</span>
                  </button>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} className="border-white/10 text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || uploadingImages} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black">
                {uploadingImages ? "Uploading images..." : isLoading ? "Saving..." : editingStudio ? "Update Studio" : "Create Studio"}
                {!isLoading && !uploadingImages && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Studio</DialogTitle>
          </DialogHeader>
          <p className="text-white/60">Are you sure you want to delete this studio? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-white/10 text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
