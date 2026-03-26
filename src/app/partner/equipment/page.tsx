"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Wrench, Star, Sparkles } from "lucide-react";
import { PartnerInventoryDrawer } from "@/components/partner/PartnerInventoryDrawer";

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
  const [activeTab, setActiveTab] = useState<"custom" | "platform">("custom");

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
    ])
      .then(([platform, inv]) => {
        setPlatformItems((platform.items || []).map((i: EquipmentItem) => ({ ...i, is_platform: true })));
        setEquipment(inv.equipment || []);
        setServices(inv.services || []);
        setAddons(inv.addons || []);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment &amp; Services</h1>
          <p className="text-white/40 text-sm mt-1">
            Build your reusable library once, then attach items to each studio when editing a listing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStructuredOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl transition-colors text-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Equipment, services &amp; add-ons
        </button>
      </div>

      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "custom" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Your inventory ({inventoryTotal})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("platform")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "platform" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Platform defaults ({platformItems.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === "custom" && (
            <>
              {inventoryLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin" />
                </div>
              ) : inventoryTotal === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                  <Wrench className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">No inventory yet</p>
                  <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
                    Add cameras, services, and bookable add-ons. They appear here and in the studio editor.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStructuredOpen(true)}
                    className="px-5 py-2.5 bg-[#D9FC67] text-black font-semibold rounded-xl text-sm"
                  >
                    Add equipment, services &amp; add-ons
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {equipment.length > 0 && (
                    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                        <div className="p-1.5 rounded-lg text-blue-400 bg-blue-400/10">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-semibold text-sm">Equipment</h3>
                        <span className="text-white/30 text-xs">({equipment.length})</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {equipment.map((it) => (
                          <div key={it.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02]">
                            <div>
                              <p className="text-white/90 text-sm font-medium">{it.model_name}</p>
                              <p className="text-white/40 text-xs">
                                {EQ_LABEL[it.subcategory] || it.subcategory} · qty {it.default_quantity}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteEquipment(it.id)}
                              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {services.length > 0 && (
                    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                        <div className="p-1.5 rounded-lg text-purple-400 bg-purple-400/10">
                          <Star className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-semibold text-sm">Services</h3>
                        <span className="text-white/30 text-xs">({services.length})</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {services.map((it) => (
                          <div key={it.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02]">
                            <div className="min-w-0 flex-1">
                              <p className="text-white/90 text-sm font-medium">{it.name}</p>
                              <p className="text-white/40 text-xs truncate">
                                {SV_LABEL[it.subcategory] || it.subcategory}
                                {it.base_price != null ? ` · ₹${Number(it.base_price).toLocaleString("en-IN")}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteService(it.id)}
                              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {addons.length > 0 && (
                    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                        <div className="p-1.5 rounded-lg text-amber-400 bg-amber-400/10">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-semibold text-sm">Bookable add-ons</h3>
                        <span className="text-white/30 text-xs">({addons.length})</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {addons.map((it) => (
                          <div key={it.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02]">
                            <div>
                              <p className="text-white/90 text-sm font-medium">{it.name}</p>
                              <p className="text-white/40 text-xs">
                                {AD_LABEL[it.addon_kind] || it.addon_kind} · ₹
                                {Number(it.price).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteAddon(it.id)}
                              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "platform" && (
            <div className="space-y-4">
              {platformItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                  <p className="text-white/40">No platform defaults configured yet.</p>
                </div>
              ) : (
                grouped(platformItems).map(({ category, items }) => {
                  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  return (
                    <div key={category} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                        <div className={`p-1.5 rounded-lg ${CATEGORY_COLORS[category] || ""}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-semibold text-sm">{CATEGORY_LABELS[category]}</h3>
                        <span className="text-white/30 text-xs">({items.length})</span>
                        <span className="ml-auto text-xs text-white/20">Managed by Admin</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-6 py-3">
                            <span className="text-white/70 text-sm">{item.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/30"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
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
        initialTab="equipment"
        onClose={() => {
          setStructuredOpen(false);
          refreshAll();
        }}
      />
    </div>
  );
}
