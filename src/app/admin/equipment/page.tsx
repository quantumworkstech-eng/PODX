"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, Package } from "lucide-react";

type Category = "equipment" | "service" | "amenity";

interface EquipmentItem {
  id: string;
  category: Category;
  slug: string;
  name: string;
  icon_name: string;
  is_active: boolean;
}

const CATEGORY_LABELS: Record<Category, string> = {
  equipment: "Equipment",
  service: "Service",
  amenity: "Amenity",
};

const CATEGORY_COLORS: Record<Category, string> = {
  equipment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  service: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  amenity: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function AdminEquipmentPage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category: "equipment" as Category, name: "", icon_name: "package" });
  const [addLoading, setAddLoading] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/admin/equipment");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    const res = await fetch("/api/admin/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (data.item) {
      setItems((prev) => [...prev, data.item]);
      setAddForm({ category: "equipment", name: "", icon_name: "package" });
      setShowAdd(false);
    }
    setAddLoading(false);
  }

  async function handleToggleActive(item: EquipmentItem) {
    await fetch(`/api/admin/equipment/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return;
    setEditLoading(true);
    await fetch(`/api/admin/equipment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, name: editName } : i));
    setEditId(null);
    setEditLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/equipment/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
  }

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">
            Manage default equipment, services, and amenities shown to partners during studio creation.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2">
        {(["all", "equipment", "service", "amenity"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            <span className="ml-1.5 text-xs opacity-60">
              ({cat === "all" ? items.length : items.filter((i) => i.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#141414] border border-[#D9FC67]/20 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Add New Option</h3>
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
              placeholder="Option name…"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 min-w-48 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#D9FC67] focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Icon name (lucide)"
              value={addForm.icon_name}
              onChange={(e) => setAddForm((f) => ({ ...f, icon_name: e.target.value }))}
              className="w-40 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:border-[#D9FC67] focus:outline-none"
            />
            <button
              type="submit"
              disabled={addLoading}
              className="h-10 px-4 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold rounded-xl text-sm disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
          <Package className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 font-medium">No items found</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/40 text-xs font-medium px-6 py-3">Name</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-3">Category</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-3">Slug</th>
                <th className="text-left text-white/40 text-xs font-medium px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    {editId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 px-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#D9FC67]"
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
                      <span className="text-white font-medium">{item.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[item.category]}`}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white/30 text-xs font-mono">{item.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        item.is_active
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-white/5 text-white/30 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${item.is_active ? "bg-green-400" : "bg-white/30"}`} />
                      {item.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {deleteId === item.id ? (
                        <>
                          <span className="text-white/40 text-xs mr-2">Delete?</span>
                          <button onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium">
                            Yes
                          </button>
                          <button onClick={() => setDeleteId(null)}
                            className="px-3 py-1.5 bg-white/5 text-white/40 hover:bg-white/10 rounded-lg text-xs">
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditId(item.id); setEditName(item.name); }}
                            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-white/30 text-xs">
          <strong className="text-white/50">Note:</strong> These options are shown to all partners in the studio creation wizard.
          Inactive options are hidden from new studios but existing studios that already have them selected are unaffected.
          If the <code className="text-[#D9FC67]/60 font-mono">platform_equipment</code> table doesn&apos;t exist in your database,
          run the SQL migration shown in the API file at <code className="text-white/40 font-mono">src/app/api/admin/equipment/route.ts</code>.
        </p>
      </div>
    </div>
  );
}
