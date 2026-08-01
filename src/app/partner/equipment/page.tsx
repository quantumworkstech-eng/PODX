"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, Loader2, Wrench, Star, Sparkles, Search } from "lucide-react";
import { PartnerInventoryDrawer } from "@/components/partner/PartnerInventoryDrawer";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectWithCustom } from "@/components/ui/SelectWithCustom";
import { FeatureGate } from "@/components/partner/FeatureGate";

type EquipmentRow = {
  id: string;
  subcategory: string;
  model_name: string;
  default_quantity: number;
};

type ServiceRow = {
  id: string;
  subcategory: string;
  name: string;
  description: string | null;
  base_price: number | null;
};

type AddonRow = {
  id: string;
  addon_kind: string;
  category?: "equipment" | "service" | null;
  addon_type?: string | null;
  name: string;
  description: string | null;
  price: number;
  quantity?: number | null;
  thumbnail_url?: string | null;
};

type PlatformAddonRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
};

const ADDON_TYPE_OPTIONS = [
  "Camera",
  "Mics+Wireless mic",
  "Lights",
  "Gimbal",
  "Teleprompter",
  "Monitor (TV screen)",
  "RGB lights (custom vibe per creator)",
  "Ring light (quick solo shoots)",
  "Portable softbox (for reels corner)",
  "Practical lights (lamps, desk lights)",
  "Overhead rig",
  "Camera slider",
  "Green/Blue/White Screen",
] as const;

interface EquipmentItem {
  id: string;
  category: string;
  name: string;
  slug?: string;
  is_active: boolean;
  is_platform?: boolean;
}

const EQ_LABEL: Record<string, string> = {
  camera: "Camera",
  mic: "Mics",
  light: "Lights",
  accessory: "Accessories",
};

const SV_LABEL: Record<string, string> = {
  editing: "Editing",
  production: "Production",
  content_services: "Content services",
};

const AD_LABEL: Record<string, string> = {
  studio: "Studio add-ons",
  service: "Service add-ons",
  outsource: "Outsource add-ons",
};

export default function PartnerEquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [structuredOpen, setStructuredOpen] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [platformAddons, setPlatformAddons] = useState<PlatformAddonRow[]>([]);

  const [typeFilter, setTypeFilter] = useState<"all" | "equipment" | "services">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "studio" | "platform">("all");
  const [query, setQuery] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newError, setNewError] = useState("");
  const [newCategory, setNewCategory] = useState<"equipment" | "service">("service");
  const [newType, setNewType] = useState<string>(ADDON_TYPE_OPTIONS[0]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [newThumbUrl, setNewThumbUrl] = useState<string>("");
  const newThumbPreview = useMemo(() => {
    if (!newThumbFile) return "";
    return URL.createObjectURL(newThumbFile);
  }, [newThumbFile]);
  useEffect(() => {
    return () => {
      if (newThumbPreview) URL.revokeObjectURL(newThumbPreview);
    };
  }, [newThumbPreview]);

  const loadInventory = useCallback(() => {
    setInventoryLoading(true);
    fetch("/api/partner/inventory")
      .then((r) => r.json())
      .then((d) => {
        setEquipment(d.equipment || []);
        setServices(d.services || []);
        setAddons(d.addons || []);
      })
      .catch(() => {
        setEquipment([]);
        setServices([]);
        setAddons([]);
      })
      .finally(() => setInventoryLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/equipment").then((r) => r.json()),
      fetch("/api/partner/inventory").then((r) => r.json()),
      fetch("/api/addons").then((r) => r.json()),
    ])
      .then(([_platform, inv, platformAdd]) => {
        setEquipment(inv.equipment || []);
        setServices(inv.services || []);
        setAddons(inv.addons || []);
        setPlatformAddons(platformAdd?.addons || []);
        setLoading(false);
        setInventoryLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const refreshAll = useCallback(() => {
    loadInventory();
    fetch("/api/addons")
      .then((r) => r.json())
      .then((d) => setPlatformAddons(d?.addons || []))
      .catch(() => {});
  }, [loadInventory]);

  async function deleteEquipment(id: string) {
    await fetch(`/api/partner/inventory/equipment/${id}`, { method: "DELETE" });
    loadInventory();
  }

  async function deleteService(id: string) {
    await fetch(`/api/partner/inventory/services/${id}`, { method: "DELETE" });
    loadInventory();
  }

  async function deleteAddon(id: string) {
    await fetch(`/api/partner/inventory/addons/${id}`, { method: "DELETE" });
    loadInventory();
  }

  const inventoryTotal = equipment.length + services.length + addons.length;

  const q = query.trim().toLowerCase();
  const matchesQ = (s: string | null | undefined) => !q || String(s ?? "").toLowerCase().includes(q);

  const compressImage = (file: File, maxPx = 1280, quality = 0.82): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round((height * maxPx) / width); width = maxPx; }
          else { width = Math.round((width * maxPx) / height); height = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
          "image/jpeg", quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const readApiError = async (res: Response): Promise<string> => {
    // Some upstream errors (413, 502, auth redirects) can return HTML/text.
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        const j: any = await res.json();
        return String(j?.error || j?.message || `Request failed (${res.status})`);
      }
    } catch {
      // fall through to text
    }
    try {
      const t = await res.text();
      const trimmed = t.trim();
      if (!trimmed) return `Request failed (${res.status})`;
      // Avoid dumping full HTML into the UI
      if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) return `Request failed (${res.status})`;
      return trimmed.slice(0, 180);
    } catch {
      return `Request failed (${res.status})`;
    }
  };

  const filteredEquipment =
    (typeFilter === "all" || typeFilter === "equipment") && (sourceFilter === "all" || sourceFilter === "studio")
      ? equipment.filter((e) => matchesQ(e.model_name) || matchesQ(EQ_LABEL[e.subcategory] || e.subcategory))
      : [];

  const filteredServices =
    (typeFilter === "all" || typeFilter === "services") && (sourceFilter === "all" || sourceFilter === "studio")
      ? services.filter((s) => matchesQ(s.name) || matchesQ(s.description) || matchesQ(SV_LABEL[s.subcategory] || s.subcategory))
      : [];

  const filteredStudioAddons =
    (typeFilter === "all" || typeFilter === "services") && (sourceFilter === "all" || sourceFilter === "studio")
      ? addons.filter((a) => matchesQ(a.name) || matchesQ(a.description) || matchesQ(AD_LABEL[a.addon_kind] || a.addon_kind))
      : [];

  const filteredPlatformAddons =
    (typeFilter === "all" || typeFilter === "services") && (sourceFilter === "all" || sourceFilter === "platform")
      ? platformAddons.filter((a) => matchesQ(a.name) || matchesQ(a.description) || matchesQ(a.category))
      : [];

  const showEmpty =
    !loading &&
    !inventoryLoading &&
    filteredEquipment.length === 0 &&
    filteredServices.length === 0 &&
    filteredStudioAddons.length === 0 &&
    filteredPlatformAddons.length === 0;

  return (
    <FeatureGate featureKey="addons_management">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-white/40 text-sm">
            Manage your reusable catalog (equipment, services, and bookable add-ons). Attach them to studios when editing a listing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewError("");
            setNewCategory("service");
            setNewType(ADDON_TYPE_OPTIONS[0]);
            setNewName("");
            setNewDescription("");
            setNewQty(1);
            setNewPrice(0);
            setNewThumbFile(null);
            setNewThumbUrl("");
            setNewOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl transition-colors text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Add-on
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search add-ons…"
            className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-[#D9FC67]/60"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
            {(
              [
                { id: "all", label: "All" },
                { id: "equipment", label: "Equipment" },
                { id: "services", label: "Services" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  typeFilter === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
            {(
              [
                { id: "all", label: "All sources" },
                { id: "studio", label: "Studio add-ons" },
                { id: "platform", label: "Platform add-ons" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSourceFilter(s.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  sourceFilter === s.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : (
        <>
          {inventoryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin" />
            </div>
          ) : inventoryTotal === 0 && platformAddons.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
              <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No add-ons yet</p>
              <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                Create your own equipment/services/add-ons, or browse platform add-ons.
              </p>
              <button
                type="button"
                onClick={() => setStructuredOpen(true)}
                className="px-5 py-2.5 bg-[#D9FC67] text-black font-semibold rounded-xl text-sm"
              >
                New Add-on
              </button>
            </div>
          ) : showEmpty ? (
            <div className="text-center py-16 border border-white/10 rounded-2xl bg-white/[0.02]">
              <p className="text-white/60 font-medium">No matches</p>
              <p className="text-white/35 text-sm mt-1">Try a different search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEquipment.map((it) => (
                <div key={`eq-${it.id}`} className="group flex flex-col h-full rounded-2xl border border-white/10 bg-[#141414] overflow-hidden transition-all duration-300 hover:border-white/25">
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 backdrop-blur-sm">
                      Equipment
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteEquipment(it.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/20 transition-colors backdrop-blur-sm"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {(it.default_quantity ?? 1) > 1 && (
                      <span className="absolute top-3 right-10 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 backdrop-blur-sm">
                        qty {it.default_quantity}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-semibold text-base leading-tight drop-shadow-sm line-clamp-2">{it.model_name}</h3>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 p-4 bg-[#0d0d0d]">
                    <p className="text-white/50 text-sm line-clamp-2">{EQ_LABEL[it.subcategory] || it.subcategory}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-white/40 text-xs">Reusable catalog</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/20">
                        Equipment
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredServices.map((it) => (
                <div key={`sv-${it.id}`} className="group flex flex-col h-full rounded-2xl border border-white/10 bg-[#141414] overflow-hidden transition-all duration-300 hover:border-white/25">
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 backdrop-blur-sm">
                      Service
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteService(it.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/20 transition-colors backdrop-blur-sm"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-semibold text-base leading-tight drop-shadow-sm line-clamp-2">{it.name}</h3>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 p-4 bg-[#0d0d0d]">
                    <p className="text-white/50 text-sm line-clamp-2">{SV_LABEL[it.subcategory] || it.subcategory}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      {it.base_price != null ? (
                        <span className="text-xl font-bold text-white">
                          ₹{Number(it.base_price).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-white/40 text-xs">Reusable catalog</span>
                      )}
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-200 border border-purple-500/20">
                        Service
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredStudioAddons.map((it) => (
                <div key={`ad-${it.id}`} className="group flex flex-col h-full rounded-2xl border border-white/10 bg-[#141414] overflow-hidden transition-all duration-300 hover:border-white/25">
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    {it.thumbnail_url ? (
                      <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${it.thumbnail_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Type badge */}
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white/80 border border-white/20 backdrop-blur-sm">
                      {it.addon_type || AD_LABEL[it.addon_kind] || it.addon_kind}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteAddon(it.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/20 transition-colors backdrop-blur-sm"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Qty badge */}
                    {(it.quantity ?? 1) > 1 && (
                      <span className="absolute top-3 right-10 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 backdrop-blur-sm">
                        qty {it.quantity}
                      </span>
                    )}

                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-semibold text-base leading-tight drop-shadow-sm line-clamp-2">{it.name}</h3>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 p-4 bg-[#0d0d0d]">
                    {it.description && (
                      <p className="text-white/50 text-sm line-clamp-2">{it.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-xl font-bold text-white">
                        ₹{Number(it.price).toLocaleString("en-IN")}
                        <span className="text-white/40 text-sm font-normal ml-1">/ unit</span>
                      </span>
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {it.category === "equipment" ? "Equipment" : "Service"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredPlatformAddons.map((it) => (
                <div key={`pa-${it.id}`} className="group flex flex-col h-full rounded-2xl border border-emerald-500/20 bg-[#141414] overflow-hidden">
                  <div className="relative h-36 shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Platform
                    </span>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-semibold text-base leading-tight drop-shadow-sm line-clamp-2">{it.name}</h3>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 p-4 bg-[#0d0d0d]">
                    {it.description && (
                      <p className="text-white/50 text-sm line-clamp-2">{it.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-xl font-bold text-white">
                        ₹{Number(it.price).toLocaleString("en-IN")}
                        <span className="text-white/40 text-sm font-normal ml-1">/ session</span>
                      </span>
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Auto-applied
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-white/35 text-xs leading-relaxed">
          <strong className="text-white/55">Tip:</strong> Use the green button to add structured items (model + quantity, priced services, bookable add-ons). They sync to this page and to each studio&apos;s equipment &amp; add-on picks.
        </p>
      </div>

      <PartnerInventoryDrawer
        open={structuredOpen}
        initialTab="addons"
        onClose={() => {
          setStructuredOpen(false);
          refreshAll();
        }}
      />

      {/* New Add-on modal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-[#141414] border-white/10 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">New Add-on</DialogTitle>
            <p className="text-white/50 text-sm">
              Create a bookable add-on only visible to your account.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as "equipment" | "service")}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white focus:border-[#D9FC67]/60 focus:outline-none"
                >
                  <option value="equipment" className="bg-[#141414]">Equipment</option>
                  <option value="service" className="bg-[#141414]">Service</option>
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Type</label>
                <SelectWithCustom
                  value={newType}
                  onChange={setNewType}
                  options={ADDON_TYPE_OPTIONS}
                  customPlaceholder="Enter custom type"
                  optionClassName="bg-[#141414]"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white focus:border-[#D9FC67]/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newCategory === "equipment" ? "e.g. Sony A7S III" : "e.g. Episode Editing"}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white placeholder:text-white/25 focus:border-[#D9FC67]/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional"
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/25 focus:border-[#D9FC67]/60 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white focus:border-[#D9FC67]/60 focus:outline-none"
                />
                <p className="text-white/35 text-xs mt-1">How many clients can book at once.</p>
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-white focus:border-[#D9FC67]/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium block">Thumbnail image</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  setNewThumbUrl("");
                  setNewThumbFile(e.target.files?.[0] || null);
                }}
                className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:hover:bg-white/20"
              />
              {(newThumbUrl || newThumbPreview) && (
                <div className="flex items-center gap-3">
                  <img
                    src={newThumbUrl || newThumbPreview}
                    alt="Thumbnail preview"
                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewThumbUrl("");
                      setNewThumbFile(null);
                    }}
                    className="text-white/50 text-xs hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-white/35 text-xs">
                Recommended: 1:1 or 16:9 image under 10MB.
              </p>
            </div>

            {newError && (
              <p className="text-red-400 text-sm">{newError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setNewOpen(false)}
              disabled={savingNew}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D9FC67] text-black hover:bg-[#c9ec57]"
              disabled={savingNew}
              onClick={async () => {
                const name = newName.trim();
                if (!name) {
                  setNewError("Name is required.");
                  return;
                }
                setSavingNew(true);
                setNewError("");
                try {
                  let thumbUrl = newThumbUrl;
                  if (!thumbUrl && newThumbFile) {
                    const compressed = await compressImage(newThumbFile);
                    const fd = new FormData();
                    fd.append("file", compressed);
                    const up = await fetch("/api/partner/upload-image", { method: "POST", body: fd });
                    if (!up.ok) throw new Error(await readApiError(up));
                    const upJson: any = await up.json().catch(() => ({}));
                    thumbUrl = String(upJson?.url || "");
                    if (!thumbUrl) throw new Error("Upload failed");
                    setNewThumbUrl(thumbUrl);
                  }

                  const res = await fetch("/api/partner/inventory/addons", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      addon_kind: newCategory === "equipment" ? "studio" : "service",
                      category: newCategory,
                      addon_type: newType,
                      name,
                      description: newDescription.trim() || null,
                      quantity: newQty,
                      thumbnail_url: thumbUrl || null,
                      price: newPrice,
                      is_active: true,
                    }),
                  });
                  if (!res.ok) throw new Error(await readApiError(res));

                  setNewOpen(false);
                  refreshAll();
                } catch (e) {
                  setNewError(e instanceof Error ? e.message : "Failed to create add-on");
                } finally {
                  setSavingNew(false);
                }
              }}
            >
              {savingNew ? "Saving…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </FeatureGate>
  );
}
