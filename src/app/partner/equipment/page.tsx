"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Wrench, Star, Sparkles, Search } from "lucide-react";
import { PartnerInventoryDrawer } from "@/components/partner/PartnerInventoryDrawer";
import { cn } from "@/lib/utils";

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
  name: string;
  description: string | null;
  price: number;
};

type PlatformAddonRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
};

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
  const [platformItems, setPlatformItems] = useState<EquipmentItem[]>([]);
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
      .then(([platform, inv, platformAdd]) => {
        setPlatformItems((platform.items || []).map((i: EquipmentItem) => ({ ...i, is_platform: true })));
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
    fetch("/api/admin/equipment")
      .then((r) => r.json())
      .then((platform) => {
        setPlatformItems((platform.items || []).map((i: EquipmentItem) => ({ ...i, is_platform: true })));
      })
      .catch(() => {});
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

  const grouped = (items: EquipmentItem[]) =>
    (["equipment", "service", "amenity"] as const).map((cat) => ({
      category: cat,
      items: items.filter((i) => i.category === cat),
    })).filter((g) => g.items.length > 0);

  const CATEGORY_ICONS = {
    equipment: Wrench,
    service: Star,
    amenity: Sparkles,
  };

  const CATEGORY_COLORS: Record<string, string> = {
    equipment: "text-blue-400 bg-blue-400/10",
    service: "text-purple-400 bg-purple-400/10",
    amenity: "text-green-400 bg-green-400/10",
  };

  const CATEGORY_LABELS: Record<string, string> = {
    equipment: "Equipment",
    service: "Service",
    amenity: "Amenity",
  };

  const q = query.trim().toLowerCase();
  const matchesQ = (s: string | null | undefined) => !q || String(s ?? "").toLowerCase().includes(q);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Add-ons</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your reusable catalog (equipment, services, and bookable add-ons). Attach them to studios when editing a listing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStructuredOpen(true)}
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
                <div key={`eq-${it.id}`} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-blue-500/15 to-transparent px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{it.model_name}</p>
                      <p className="text-white/40 text-xs truncate">
                        {EQ_LABEL[it.subcategory] || it.subcategory} · qty {it.default_quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEquipment(it.id)}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-white/40 text-xs">Equipment</span>
                    <span className="text-white/60 text-xs">Reusable catalog</span>
                  </div>
                </div>
              ))}

              {filteredServices.map((it) => (
                <div key={`sv-${it.id}`} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-purple-500/15 to-transparent px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{it.name}</p>
                      <p className="text-white/40 text-xs truncate">
                        {SV_LABEL[it.subcategory] || it.subcategory}
                        {it.base_price != null ? ` · ₹${Number(it.base_price).toLocaleString("en-IN")}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteService(it.id)}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-white/40 text-xs">Service</span>
                    <span className="text-white/60 text-xs">Reusable catalog</span>
                  </div>
                </div>
              ))}

              {filteredStudioAddons.map((it) => (
                <div key={`ad-${it.id}`} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-amber-500/15 to-transparent px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{it.name}</p>
                      <p className="text-white/40 text-xs truncate">
                        {AD_LABEL[it.addon_kind] || it.addon_kind}
                        {" · ₹"}
                        {Number(it.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAddon(it.id)}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <span className="text-white/40 text-xs">Studio add-on</span>
                    <span className="text-white/60 text-xs">Bookable</span>
                  </div>
                </div>
              ))}

              {filteredPlatformAddons.map((it) => (
                <div key={`pa-${it.id}`} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-emerald-500/15 to-transparent px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{it.name}</p>
                      <p className="text-white/40 text-xs truncate">
                        {it.category ? `${it.category} · ` : ""}
                        {"₹"}
                        {Number(it.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                      Platform
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-white/50 text-xs line-clamp-2">
                      {it.description || "Platform add-on"}
                    </p>
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
    </div>
  );
}
