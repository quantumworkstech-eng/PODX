"use client";

import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  X,
  Check,
  Calendar,
  Building2,
} from "lucide-react";
import { FeatureGate } from "@/components/partner/FeatureGate";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_booking_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  studio_id: string | null;
  studios?: { name: string } | null;
  created_at: string;
}

interface Studio {
  id: string;
  name: string;
}

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "",
  min_booking_amount: "",
  max_discount_amount: "",
  max_uses: "",
  valid_from: "",
  valid_until: "",
  studio_id: "",
};

export default function PartnerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/partner/coupons").then((r) => r.json()),
      fetch("/api/partner/studios").then((r) => r.json()),
    ])
      .then(([cd, sd]) => {
        setCoupons(cd.coupons || []);
        setStudios(sd.studios || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_booking_amount: String(c.min_booking_amount || ""),
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : "",
      max_uses: c.max_uses ? String(c.max_uses) : "",
      valid_from: c.valid_from ? c.valid_from.slice(0, 10) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : "",
      studio_id: c.studio_id || "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      setError("Discount value must be greater than 0"); return;
    }
    if (form.discount_type === "percentage" && Number(form.discount_value) > 100) {
      setError("Percentage discount cannot exceed 100"); return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_booking_amount: form.min_booking_amount ? Number(form.min_booking_amount) : 0,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_from: form.valid_from || new Date().toISOString(),
        valid_until: form.valid_until || null,
        studio_id: form.studio_id || null,
      };

      const url = editing
        ? `/api/partner/coupons/${editing.id}`
        : "/api/partner/coupons";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save coupon"); return; }

      setShowModal(false);
      load();
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/partner/coupons/${id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/partner/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x))
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGate featureKey="coupon_management">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">
            Create discount codes for your clients to use at checkout
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D9FC67] text-black text-sm font-semibold rounded-xl hover:bg-[#E8FF8A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Coupons", value: coupons.length },
          { label: "Active", value: coupons.filter((c) => c.is_active).length },
          { label: "Total Uses", value: coupons.reduce((s, c) => s + c.uses_count, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-white/50 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <Tag className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No coupons yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`bg-white/5 rounded-2xl border p-5 transition-colors ${
                c.is_active ? "border-white/10" : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold tracking-wider text-sm font-mono bg-white/10 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.is_active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                      }`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                      {c.studios?.name && (
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {c.studios.name}
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-white/50 text-xs mt-1">{c.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-white/40">
                      <span>
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% off`
                          : `₹${c.discount_value} off`}
                        {c.max_discount_amount ? ` (max ₹${c.max_discount_amount})` : ""}
                      </span>
                      {c.min_booking_amount > 0 && (
                        <span>Min ₹{c.min_booking_amount}</span>
                      )}
                      {c.max_uses && (
                        <span>{c.uses_count}/{c.max_uses} uses</span>
                      )}
                      {!c.max_uses && (
                        <span>{c.uses_count} uses</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(c.valid_from)} – {formatDate(c.valid_until)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(c)}
                    disabled={togglingId === c.id}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    title={c.is_active ? "Deactivate" : "Activate"}
                  >
                    {togglingId === c.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : c.is_active ? (
                      <ToggleRight className="w-5 h-5 text-[#D9FC67]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-white/50 hover:text-red-400"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  disabled={!!editing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50 disabled:opacity-50"
                />
                {editing && (
                  <p className="text-white/30 text-xs mt-1">Code cannot be changed after creation</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. 20% off for first-time clients"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discount_type: e.target.value as "percentage" | "fixed",
                      }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D9FC67]/50"
                  >
                    <option value="percentage" className="bg-[#0f0f0f]">Percentage (%)</option>
                    <option value="fixed" className="bg-[#0f0f0f]">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                      {form.discount_type === "percentage" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={form.discount_type === "percentage" ? "100" : undefined}
                      value={form.discount_value}
                      onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Min booking amount + max discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Min Booking (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_booking_amount}
                    onChange={(e) => setForm((f) => ({ ...f, min_booking_amount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_discount_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, max_discount_amount: e.target.value }))
                    }
                    placeholder="No cap"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
              </div>

              {/* Max uses + studio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Studio (optional)
                  </label>
                  <select
                    value={form.studio_id}
                    onChange={(e) => setForm((f) => ({ ...f, studio_id: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D9FC67]/50"
                  >
                    <option value="" className="bg-[#0f0f0f]">All Studios</option>
                    {studios.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0f0f0f]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validity dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider block mb-1.5">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#D9FC67] text-black text-sm font-semibold hover:bg-[#E8FF8A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editing ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
