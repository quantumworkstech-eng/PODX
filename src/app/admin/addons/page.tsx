"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Power, RefreshCw, X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_ADDON_TYPES = [
  "Full podcast edit (cuts, audio cleanup)",
  "Multi-cam switching",
  "Color grading",
  "Reels Creation",
  "YouTube thumbnails (high CTR style)",
] as const;

const CATEGORIES = ["general", "post-production", "social-media", "design", "content"] as const;

interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  addon_type: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  addon_type: string;
  thumbFile: File | null;
  thumbUrl: string;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  category: "general",
  addon_type: ADMIN_ADDON_TYPES[0],
  thumbFile: null,
  thumbUrl: "",
};

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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [thumbPreview, setThumbPreview] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        const j: any = await res.json();
        return String(j?.error || j?.message || `Request failed (${res.status})`);
      }
    } catch { /* fall through */ }
    try {
      const t = await res.text();
      const trimmed = t.trim();
      if (!trimmed || trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html"))
        return `Request failed (${res.status})`;
      return trimmed.slice(0, 180);
    } catch {
      return `Request failed (${res.status})`;
    }
  };

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
    setThumbPreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setForm({
      name: addon.name,
      description: addon.description || "",
      price: String(addon.price),
      category: addon.category,
      addon_type: addon.addon_type || ADMIN_ADDON_TYPES[0],
      thumbFile: null,
      thumbUrl: addon.thumbnail_url || "",
    });
    setThumbPreview(addon.thumbnail_url || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { setFormError("Name and price are required."); return; }
    setFormLoading(true);
    setFormError("");
    try {
      let thumbUrl = form.thumbUrl;
      if (form.thumbFile) {
        const compressed = await compressImage(form.thumbFile);
        const fd = new FormData();
        fd.append("file", compressed);
        const up = await fetch("/api/partner/upload-image", { method: "POST", body: fd });
        if (!up.ok) throw new Error(await readApiError(up));
        const upJson: any = await up.json().catch(() => ({}));
        thumbUrl = String(upJson?.url || "");
        if (!thumbUrl) throw new Error("Upload failed");
      }

      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        category: form.category,
        addon_type: form.addon_type || null,
        thumbnail_url: thumbUrl || null,
      };

      const url = editingAddon ? `/api/admin/addons/${editingAddon.id}` : "/api/admin/addons";
      const method = editingAddon ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readApiError(res));

      setModalOpen(false);
      fetchAddons();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save add-on");
    } finally {
      setFormLoading(false);
    }
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

  const q = search.trim().toLowerCase();
  const filtered = addons.filter((a) => {
    const matchesCat = categoryFilter === "all" || a.category === categoryFilter;
    const matchesQ = !q || a.name.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q) || (a.addon_type || "").toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{total} platform add-ons · auto-applied to all studios</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Add-on
        </button>
      </div>

      {/* Search + Category filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <form onSubmit={(e) => { e.preventDefault(); fetchAddons(); }} className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </form>

        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                categoryFilter === c ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-6 h-6 text-[#D9FC67] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No platform add-ons yet</p>
          <p className="text-white/40 text-sm mb-6 max-w-md mx-auto">
            Platform add-ons are automatically available for all studios in the booking flow.
          </p>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#D9FC67] text-black font-semibold rounded-xl text-sm"
          >
            New Add-on
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((addon) => (
            <div key={addon.id} className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
              <div className="h-28 relative">
                {addon.thumbnail_url ? (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url(${addon.thumbnail_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/15 to-transparent" />
                )}
                <div className="absolute inset-0 px-5 py-4 flex items-center justify-between">
                  <div className="min-w-0 relative z-[1]">
                    <p className="text-white font-semibold truncate">{addon.name}</p>
                    <p className="text-white/50 text-xs truncate">
                      {addon.addon_type || addon.category}
                      {` · ₹${Number(addon.price).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 relative z-[1]">
                    <button
                      onClick={() => openEdit(addon)}
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/50 hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(addon)}
                      disabled={actionLoading === `toggle-${addon.id}`}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        addon.is_active
                          ? "hover:bg-orange-500/10 text-white/50 hover:text-orange-400"
                          : "hover:bg-green-500/10 text-white/50 hover:text-green-400"
                      )}
                      title={addon.is_active ? "Disable" : "Enable"}
                    >
                      {actionLoading === `toggle-${addon.id}` ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteId(addon.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-white/40 text-xs capitalize">{addon.category}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  addon.is_active
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {addon.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {addon.description && (
                <div className="px-5 pb-4">
                  <p className="text-white/40 text-xs line-clamp-2">{addon.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="text-white font-semibold">{editingAddon ? "Edit Add-on" : "New Add-on"}</h3>
                <p className="text-white/40 text-xs mt-0.5">
                  Platform add-ons are automatically available for all studios.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Type</label>
                  <select
                    value={form.addon_type}
                    onChange={(e) => setForm((f) => ({ ...f, addon_type: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    {ADMIN_ADDON_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#18181b]">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#18181b] capitalize">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  placeholder="e.g. Full Episode Edit"
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

              <div className="space-y-2">
                <label className="text-white/60 text-xs uppercase tracking-wider block">Thumbnail image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((f) => ({ ...f, thumbFile: file }));
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setThumbPreview(url);
                    } else {
                      setThumbPreview(form.thumbUrl);
                    }
                  }}
                  className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:hover:bg-white/20"
                />
                {thumbPreview && (
                  <div className="flex items-center gap-3">
                    <img
                      src={thumbPreview}
                      alt="Thumbnail preview"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, thumbFile: null, thumbUrl: "" }));
                        setThumbPreview("");
                      }}
                      className="text-white/50 text-xs hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-white/35 text-xs">Recommended: 1:1 or 16:9 image under 10MB.</p>
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

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
            <p className="text-white/50 text-sm mb-6">This will permanently remove the add-on from all studios.</p>
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
