"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Wrench, Star, Sparkles, Check, X, Pencil } from "lucide-react";
import { PartnerInventoryDrawer } from "@/components/partner/PartnerInventoryDrawer";

type Category = "equipment" | "service" | "amenity";

interface EquipmentItem {
  id: string;
  category: Category;
  name: string;
  slug?: string;
  is_active: boolean;
  is_platform?: boolean;
}

const CATEGORY_LABELS: Record<Category, string> = {
  equipment: "Equipment",
  service: "Service",
  amenity: "Amenity",
};

const CATEGORY_ICONS = {
  equipment: Wrench,
  service: Star,
  amenity: Sparkles,
};

const CATEGORY_COLORS: Record<Category, string> = {
  equipment: "text-blue-400 bg-blue-400/10",
  service: "text-purple-400 bg-purple-400/10",
  amenity: "text-green-400 bg-green-400/10",
};

export default function PartnerEquipmentPage() {
  const [platformItems, setPlatformItems] = useState<EquipmentItem[]>([]);
  const [customItems, setCustomItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category: "equipment" as Category, name: "" });
  const [addLoading, setAddLoading] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"custom" | "platform">("custom");
  const [structuredOpen, setStructuredOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/equipment").then((r) => r.json()),
      fetch("/api/partner/custom-equipment").then((r) => r.json()),
    ]).then(([platform, custom]) => {
      setPlatformItems((platform.items || []).map((i: EquipmentItem) => ({ ...i, is_platform: true })));
      setCustomItems(custom.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    const res = await fetch("/api/partner/custom-equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (data.item) {
      setCustomItems((prev) => [...prev, data.item]);
      setAddForm({ category: "equipment", name: "" });
      setShowAdd(false);
    }
    setAddLoading(false);
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return;
    setEditLoading(true);
    await fetch(`/api/partner/custom-equipment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setCustomItems((prev) => prev.map((i) => i.id === id ? { ...i, name: editName } : i));
    setEditId(null);
    setEditLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/partner/custom-equipment/${id}`, { method: "DELETE" });
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
  }

  const grouped = (items: EquipmentItem[]) =>
    (["equipment", "service", "amenity"] as Category[]).map((cat) => ({
      category: cat,
      items: items.filter((i) => i.category === cat),
    })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment & Services</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your custom equipment and services shown to customers when booking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStructuredOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors text-sm border border-white/10"
          >
            Equipment, services & add-ons
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Quick tag
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("custom")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "custom" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Your Custom Options ({customItems.length})
        </button>
        <button
          onClick={() => setActiveTab("platform")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "platform" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
        >
          Platform Defaults ({platformItems.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : (
        <>
          {/* Add form */}
          {showAdd && activeTab === "custom" && (
            <div className="bg-[#141414] border border-[#D9FC67]/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Add Custom Option</h3>
              <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as Category }))}
                  className="h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-[#D9FC67] focus:outline-none"
                >
                  <option value="equipment">Equipment</option>
                  <option value="service">Service</option>
                  <option value="amenity">Amenity</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. 4K Camera, Green Screen…"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="flex-1 min-w-48 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#D9FC67] focus:outline-none"
                  autoFocus
                  required
                />
                <button type="submit" disabled={addLoading}
                  className="h-10 px-4 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl text-sm disabled:opacity-50">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm">
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Custom items */}
          {activeTab === "custom" && (
            <>
              {customItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                  <Wrench className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">No custom options yet</p>
                  <p className="text-white/40 text-sm mb-4">
                    Add custom equipment or services unique to your studios.
                  </p>
                  <button onClick={() => setShowAdd(true)}
                    className="px-4 py-2 bg-[#D9FC67] text-black font-semibold rounded-xl text-sm">
                    Add Your First Option
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped(customItems).map(({ category, items }) => {
                    const Icon = CATEGORY_ICONS[category];
                    return (
                      <div key={category} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                          <div className={`p-1.5 rounded-lg ${CATEGORY_COLORS[category]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-white font-semibold text-sm">{CATEGORY_LABELS[category]}</h3>
                          <span className="text-white/30 text-xs">({items.length})</span>
                        </div>
                        <div className="divide-y divide-white/5">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02]">
                              {editId === item.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-8 px-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D9FC67] flex-1"
                                    autoFocus
                                  />
                                  <button onClick={() => handleEdit(item.id)} disabled={editLoading}
                                    className="p-1.5 text-[#D9FC67] hover:bg-[#D9FC67]/10 rounded-lg">
                                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button onClick={() => setEditId(null)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-white/80 text-sm">{item.name}</span>
                                  <div className="flex items-center gap-1">
                                    {deleteId === item.id ? (
                                      <>
                                        <span className="text-white/40 text-xs mr-2">Delete?</span>
                                        <button onClick={() => handleDelete(item.id)}
                                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium">Yes</button>
                                        <button onClick={() => setDeleteId(null)}
                                          className="px-3 py-1.5 bg-white/5 text-white/40 hover:bg-white/10 rounded-lg text-xs">No</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setEditId(item.id); setEditName(item.name); }}
                                          className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg">
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setDeleteId(item.id)}
                                          className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Platform items (read-only) */}
          {activeTab === "platform" && (
            <div className="space-y-4">
              {platformItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                  <p className="text-white/40">No platform defaults configured yet.</p>
                </div>
              ) : (
                grouped(platformItems).map(({ category, items }) => {
                  const Icon = CATEGORY_ICONS[category];
                  return (
                    <div key={category} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
                        <div className={`p-1.5 rounded-lg ${CATEGORY_COLORS[category]}`}>
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
        <p className="text-white/30 text-xs">
          <strong className="text-white/50">Tip:</strong> Quick tags are simple labels. Use{" "}
          <button type="button" onClick={() => setStructuredOpen(true)} className="text-[#D9FC67]/80 hover:text-[#D9FC67]">
            structured inventory
          </button>{" "}
          for model + quantity, priced services, and bookable add-ons.
        </p>
      </div>

      <PartnerInventoryDrawer
        open={structuredOpen}
        initialTab="equipment"
        onClose={() => {
          setStructuredOpen(false);
          Promise.all([
            fetch("/api/admin/equipment").then((r) => r.json()),
            fetch("/api/partner/custom-equipment").then((r) => r.json()),
          ]).then(([platform, custom]) => {
            setPlatformItems((platform.items || []).map((i: EquipmentItem) => ({ ...i, is_platform: true })));
            setCustomItems(custom.items || []);
          });
        }}
      />
    </div>
  );
}
