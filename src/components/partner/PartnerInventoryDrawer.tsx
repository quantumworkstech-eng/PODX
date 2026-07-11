"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus, Trash2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type InvTab = "equipment" | "services" | "addons";

type EqItem = {
  id: string;
  subcategory: string;
  model_name: string;
  default_quantity: number;
  use_count?: number;
};

type SvItem = {
  id: string;
  subcategory: string;
  name: string;
  description: string | null;
  base_price: number | null;
  use_count?: number;
};

type AdItem = {
  id: string;
  addon_kind: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  use_count?: number;
};

const EQ_SUB: { value: string; label: string }[] = [
  { value: "camera", label: "Camera" },
  { value: "mic", label: "Mics" },
  { value: "light", label: "Lights" },
  { value: "accessory", label: "Accessories" },
];

const SV_SUB: { value: string; label: string }[] = [
  { value: "editing", label: "Editing" },
  { value: "production", label: "Production" },
  { value: "content_services", label: "Content services" },
];

const AD_KIND: { value: string; label: string }[] = [
  { value: "studio", label: "Studio add-ons" },
  { value: "service", label: "Service add-ons" },
  { value: "outsource", label: "Outsource add-ons" },
];

function sortMostUsed<T extends { use_count?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.use_count ?? 0) - (a.use_count ?? 0));
}

export function PartnerInventoryDrawer({
  open,
  onClose,
  initialTab = "equipment",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: InvTab;
}) {
  const [tab, setTab] = useState<InvTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [equipment, setEquipment] = useState<EqItem[]>([]);
  const [services, setServices] = useState<SvItem[]>([]);
  const [addons, setAddons] = useState<AdItem[]>([]);

  const load = useCallback(() => {
    setLoading(true);
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
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      load();
    }
  }, [open, initialTab, load]);

  const filteredEq = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? equipment.filter(
          (e) =>
            e.model_name.toLowerCase().includes(q) ||
            e.subcategory.toLowerCase().includes(q)
        )
      : equipment;
    return sortMostUsed(list);
  }, [equipment, search]);

  const filteredSv = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q)
        )
      : services;
    return sortMostUsed(list);
  }, [services, search]);

  const filteredAd = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? addons.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.description || "").toLowerCase().includes(q)
        )
      : addons;
    return sortMostUsed(list);
  }, [addons, search]);

  const mostEq = useMemo(() => sortMostUsed(equipment).slice(0, 5), [equipment]);
  const mostSv = useMemo(() => sortMostUsed(services).slice(0, 5), [services]);
  const mostAd = useMemo(() => sortMostUsed(addons).slice(0, 5), [addons]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[#111] border border-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Manage custom inventory</h2>
            <p className="text-white/45 text-xs mt-0.5">
              Saved once — reuse on every studio. Add equipment, services, and bookable add-ons.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {(
            [
              ["equipment", "Equipment"],
              ["services", "Services"],
              ["addons", "Add-ons"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
                tab === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-3">
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin text-[#D9FC67]" />
              Loading…
            </div>
          ) : tab === "equipment" ? (
            <EquipmentTab
              items={filteredEq}
              mostUsed={mostEq}
              onRefresh={load}
            />
          ) : tab === "services" ? (
            <ServicesTab items={filteredSv} mostUsed={mostSv} onRefresh={load} />
          ) : (
            <AddonsTab items={filteredAd} mostUsed={mostAd} onRefresh={load} />
          )}
        </div>
      </div>
    </div>
  );
}

function EquipmentTab({
  items,
  mostUsed,
  onRefresh,
}: {
  items: EqItem[];
  mostUsed: EqItem[];
  onRefresh: () => void;
}) {
  const [sub, setSub] = useState("camera");
  const [model, setModel] = useState("");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!model.trim()) return;
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/partner/inventory/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subcategory: sub,
        model_name: model.trim(),
        default_quantity: qty,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError((data as { error?: string }).error || "Could not save. Try again.");
      return;
    }
    setModel("");
    setQty(1);
    onRefresh();
  }

  async function remove(id: string) {
    await fetch(`/api/partner/inventory/equipment/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-white/80 text-sm font-medium">Add equipment</p>
        {formError && (
          <p className="text-red-400 text-xs">{formError}</p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className="h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          >
            {EQ_SUB.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model name (e.g. Sony A7 III)"
            className="h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wide">Default qty</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-10 w-24 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#D9FC67] text-black font-semibold text-sm inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add row
          </button>
        </div>
      </form>

      {mostUsed.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Most used — tap to fill the form
          </p>
          <div className="flex flex-wrap gap-2">
            {mostUsed.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSub(m.subcategory);
                  setModel(m.model_name);
                  setQty(Math.max(1, m.default_quantity));
                  setFormError(null);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-[#D9FC67]/15 hover:border-[#D9FC67]/40 hover:text-white transition-colors"
              >
                {m.model_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-white/40">All items ({items.length})</p>
        {items.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">No equipment yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.02]"
              >
                <div>
                  <p className="text-white text-sm font-medium">{it.model_name}</p>
                  <p className="text-white/40 text-xs">
                    {EQ_SUB.find((s) => s.value === it.subcategory)?.label || it.subcategory} · qty{" "}
                    {it.default_quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ServicesTab({
  items,
  mostUsed,
  onRefresh,
}: {
  items: SvItem[];
  mostUsed: SvItem[];
  onRefresh: () => void;
}) {
  const [sub, setSub] = useState("editing");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/partner/inventory/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subcategory: sub,
        name: name.trim(),
        description: desc.trim() || null,
        base_price: price === "" ? null : Number(price),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError((data as { error?: string }).error || "Could not save. Try again.");
      return;
    }
    setName("");
    setDesc("");
    setPrice("");
    onRefresh();
  }

  async function remove(id: string) {
    await fetch(`/api/partner/inventory/services/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-white/80 text-sm font-medium">Add service</p>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <select
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
        >
          {SV_SUB.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Service name"
          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30 resize-none"
        />
        <div className="flex flex-wrap gap-3 items-end">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Base price ₹ (optional)"
            type="number"
            min={0}
            className="h-10 flex-1 min-w-[140px] px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#D9FC67] text-black font-semibold text-sm inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>

      {mostUsed.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Most used — tap to fill the form
          </p>
          <div className="flex flex-wrap gap-2">
            {mostUsed.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSub(m.subcategory);
                  setName(m.name);
                  setDesc(m.description || "");
                  setPrice(m.base_price != null ? String(m.base_price) : "");
                  setFormError(null);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-[#D9FC67]/15 hover:border-[#D9FC67]/40 hover:text-white transition-colors"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-white/40">All services ({items.length})</p>
        {items.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">No services yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.02]"
              >
                <div>
                  <p className="text-white text-sm font-medium">{it.name}</p>
                  <p className="text-white/40 text-xs line-clamp-2">{it.description || "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddonsTab({
  items,
  mostUsed,
  onRefresh,
}: {
  items: AdItem[];
  mostUsed: AdItem[];
  onRefresh: () => void;
}) {
  const [kind, setKind] = useState("studio");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/partner/inventory/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addon_kind: kind,
        name: name.trim(),
        description: desc.trim() || null,
        price: Number(price) || 0,
        is_active: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setFormError((data as { error?: string }).error || "Could not save. Try again.");
      return;
    }
    setName("");
    setDesc("");
    setPrice("0");
    onRefresh();
  }

  async function remove(id: string) {
    await fetch(`/api/partner/inventory/addons/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-white/80 text-sm font-medium">Add bookable add-on</p>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
        >
          {AD_KIND.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30 resize-none"
        />
        <div className="flex flex-wrap gap-3 items-end">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price ₹"
            type="number"
            min={0}
            className="h-10 w-36 px-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-[#D9FC67] text-black font-semibold text-sm inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>

      {mostUsed.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Most used — tap to fill the form
          </p>
          <div className="flex flex-wrap gap-2">
            {mostUsed.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setKind(m.addon_kind);
                  setName(m.name);
                  setDesc(m.description || "");
                  setPrice(String(m.price ?? 0));
                  setFormError(null);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-[#D9FC67]/15 hover:border-[#D9FC67]/40 hover:text-white transition-colors"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-white/40">All add-ons ({items.length})</p>
        {items.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">No add-ons yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.02]"
              >
                <div>
                  <p className="text-white text-sm font-medium">{it.name}</p>
                  <p className="text-white/40 text-xs">
                    {AD_KIND.find((k) => k.value === it.addon_kind)?.label || it.addon_kind} · ₹
                    {Number(it.price).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
