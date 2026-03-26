"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Power, RefreshCw, X, Check } from "lucide-react";

const CATEGORIES = ["all", "popular", "post-production", "social-media", "design", "content", "general"];

const categoryColors: Record<string, string> = {
  popular: "bg-[#D9FC67]/10 text-[#D9FC67] border-[#D9FC67]/25",
  "post-production": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "social-media": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "design": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "content": "bg-green-500/10 text-green-400 border-green-500/20",
  "general": "bg-white/10 text-white/40 border-white/10",
};

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
}

const emptyForm: FormData = { name: "", description: "", price: "", category: "general" };

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAddons = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/addons?${params}`)
      .then((r) => r.json())
      .then((d) => { setAddons(d.addons || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAddons(); }, []);

  const openCreate = () => {
    setEditingAddon(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setForm({ name: addon.name, description: addon.description || "", price: String(addon.price), category: addon.category });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = { name: form.name, description: form.description, price: Number(form.price), category: form.category };

    const url = editingAddon ? `/api/admin/addons/${editingAddon.id}` : "/api/admin/addons";
    const method = editingAddon ? "PATCH" : "POST";

    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setFormLoading(false);
    setModalOpen(false);
    fetchAddons();
  };

  const toggleActive = async (addon: Addon) => {
    setActionLoading(`toggle-${addon.id}`);
    await fetch(`/api/admin/addons/${addon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !addon.is_active }),
    });
    setActionLoading(null);
    fetchAddons();
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`delete-${id}`);
    await fetch(`/api/admin/addons/${id}`, { method: "DELETE" });
    setActionLoading(null);
    setDeleteId(null);
    fetchAddons();
  };

  const filtered = categoryFilter === "all" ? addons : addons.filter((a) => a.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Add-ons Management</h2>
          <p className="text-white/40 text-sm">{total} platform add-ons</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Add-on
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              categoryFilter === c
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-white/5 text-white/50 hover:text-white border border-transparent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); fetchAddons(); }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Add-on</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-white/40">No add-ons found</td>
                </tr>
              ) : (
                filtered.map((addon) => (
                  <tr key={addon.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium text-sm">{addon.name}</p>
                      <p className="text-white/40 text-xs mt-0.5 max-w-xs truncate">{addon.description || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border capitalize ${categoryColors[addon.category] || categoryColors.general}`}>
                        {addon.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold text-sm">₹{Number(addon.price).toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${addon.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {addon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(addon)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(addon)}
                          disabled={actionLoading === `toggle-${addon.id}`}
                          className={`p-1.5 rounded-lg transition-colors ${addon.is_active ? "hover:bg-orange-500/10 text-white/40 hover:text-orange-400" : "hover:bg-green-500/10 text-white/40 hover:text-green-400"}`}
                          title={addon.is_active ? "Disable" : "Enable"}
                        >
                          {actionLoading === `toggle-${addon.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteId(addon.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-white font-semibold">{editingAddon ? "Edit Add-on" : "New Add-on"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  placeholder="e.g. Video Editing"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
                  placeholder="Brief description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    {["general", "post-production", "social-media", "design", "content"].map((c) => (
                      <option key={c} value={c} className="bg-[#18181b]">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingAddon ? "Save Changes" : "Create Add-on"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Delete Add-on</h3>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone. The add-on will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
