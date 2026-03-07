"use client";

import { useEffect, useState } from "react";
import {
  Search, CheckCircle, XCircle, PauseCircle, RefreshCw, Building2,
  Pencil, Trash2, Play, X, Save, Check,
} from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All Studios" },
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paused", label: "Paused" },
  { value: "suspended", label: "Suspended" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pending", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  paused: { label: "Paused", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  suspended: { label: "Suspended", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  deleted: { label: "Deleted", color: "bg-white/5 text-white/30 border-white/10" },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface StudioDetail {
  studio: any;
  rooms: any[];
  images: any[];
  studioAmenities: any[];
  allAmenities: any[];
  hours: any[];
  policies: any[];
}

function InputField({ label, value, onChange, type = "text" }: {
  label: string; value: any; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
      />
    </div>
  );
}

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState<StudioDetail | null>(null);
  const [activeSection, setActiveSection] = useState("basic");

  // Edit form state
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [editRooms, setEditRooms] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [editHours, setEditHours] = useState<any[]>([]);
  const [editPolicies, setEditPolicies] = useState<any[]>([]);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchStudios = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/studios?${params}`)
      .then((r) => r.json())
      .then((d) => { setStudios(d.studios || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStudios(); }, [page, statusFilter]);

  const handleAction = async (studioId: string, action: string) => {
    setActionLoading(`${studioId}-${action}`);
    await fetch(`/api/admin/studios/${studioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    fetchStudios();
  };

  const handleDelete = async (studioId: string) => {
    setActionLoading(`${studioId}-delete`);
    await fetch(`/api/admin/studios/${studioId}`, { method: "DELETE" });
    setActionLoading(null);
    setDeleteId(null);
    fetchStudios();
  };

  const openEdit = async (studioId: string) => {
    setEditOpen(true);
    setEditLoading(true);
    setActiveSection("basic");
    const res = await fetch(`/api/admin/studios/${studioId}`);
    const data: StudioDetail = await res.json();
    setEditData(data);

    const s = data.studio;
    setEditFields({
      name: s.name || "",
      description: s.description || "",
      short_description: s.short_description || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      postal_code: s.postal_code || "",
      phone: s.phone || "",
      email: s.email || "",
      website: s.website || "",
    });
    setEditRooms(data.rooms.map((r: any) => ({
      id: r.id,
      name: r.name,
      price_per_hour: r.price_per_hour,
      capacity: r.capacity,
      is_active: r.is_active,
      description: r.description || "",
      equipment: r.room_equipment || [],
    })));
    setSelectedAmenities((data.studioAmenities || []).map((a: any) => a.id));
    setEditHours(
      DAY_NAMES.map((_, i) => {
        const existing = (data.hours || []).find((h: any) => h.day_of_week === i);
        return {
          day_of_week: i,
          open_time: existing?.open_time || "09:00",
          close_time: existing?.close_time || "21:00",
          is_closed: existing?.is_closed ?? (i === 0),
        };
      })
    );
    setEditPolicies(data.policies.length > 0 ? data.policies : [
      { hours_before: 48, refund_percentage: 100, description: "Full refund" },
      { hours_before: 24, refund_percentage: 50, description: "50% refund" },
    ]);
    setEditLoading(false);
  };

  const saveEdit = async () => {
    if (!editData) return;
    setEditSaving(true);
    await fetch(`/api/admin/studios/${editData.studio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioFields: editFields,
        roomUpdates: editRooms.map((r) => ({
          id: r.id,
          name: r.name,
          price_per_hour: r.price_per_hour,
          capacity: r.capacity,
          is_active: r.is_active,
          description: r.description,
        })),
        amenityIds: selectedAmenities,
        hoursData: editHours,
        policyUpdates: editPolicies,
      }),
    });
    setEditSaving(false);
    setEditOpen(false);
    fetchStudios();
  };

  const setField = (key: string, value: any) => setEditFields((f) => ({ ...f, [key]: value }));
  const setRoom = (idx: number, key: string, value: any) =>
    setEditRooms((rooms) => rooms.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const toggleAmenity = (id: string) =>
    setSelectedAmenities((ids) => ids.includes(id) ? ids.filter((a) => a !== id) : [...ids, id]);
  const setHour = (idx: number, key: string, value: any) =>
    setEditHours((h) => h.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  const setPolicy = (idx: number, key: string, value: any) =>
    setEditPolicies((p) => p.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));

  const EDIT_SECTIONS = [
    { id: "basic", label: "Basic Info" },
    { id: "rooms", label: "Rooms & Pricing" },
    { id: "amenities", label: "Amenities" },
    { id: "hours", label: "Availability" },
    { id: "policies", label: "Policies" },
    { id: "images", label: "Images" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Studio Management</h2>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total studios · Full control</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/50 hover:text-white border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchStudios(); }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studios..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors">Search</button>
      </form>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Studio</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Owner</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Price</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : studios.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-white/40">No studios found</td></tr>
              ) : (
                studios.map((studio) => {
                  const cfg = statusConfig[studio.review_status] || statusConfig.pending_review;
                  return (
                    <tr key={studio.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {studio.image ? (
                            <img src={studio.image} alt={studio.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white/20" />
                            </div>
                          )}
                          <p className="text-white text-sm font-medium">{studio.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white/60 text-sm">{studio.owner_name || studio.owner_email}</p>
                        <p className="text-white/30 text-xs">{studio.owner_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/50 text-sm">{studio.city}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium text-sm">₹{studio.price_per_hour}/hr</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(studio.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit Studio"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Approve */}
                          {studio.review_status !== "approved" && studio.review_status !== "deleted" && (
                            <button
                              onClick={() => handleAction(studio.id, "approve")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
                              title="Approve"
                            >
                              {actionLoading === `${studio.id}-approve` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Pause (approved) */}
                          {studio.review_status === "approved" && (
                            <button
                              onClick={() => handleAction(studio.id, "pause")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors"
                              title="Pause Listing"
                            >
                              {actionLoading === `${studio.id}-pause` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Activate (paused) */}
                          {studio.review_status === "paused" && (
                            <button
                              onClick={() => handleAction(studio.id, "activate")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors"
                              title="Reactivate"
                            >
                              {actionLoading === `${studio.id}-activate` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Reject */}
                          {!["rejected", "deleted"].includes(studio.review_status) && (
                            <button
                              onClick={() => handleAction(studio.id, "reject")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                              title="Reject"
                            >
                              {actionLoading === `${studio.id}-reject` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Suspend */}
                          {!["suspended", "deleted", "paused"].includes(studio.review_status) && (
                            <button
                              onClick={() => handleAction(studio.id, "suspend")}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-white/40 hover:text-yellow-400 transition-colors"
                              title="Suspend"
                            >
                              {actionLoading === `${studio.id}-suspend` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Delete */}
                          {studio.review_status !== "deleted" && (
                            <button
                              onClick={() => setDeleteId(studio.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                              title="Delete Studio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/40 text-sm">Page {page} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT DRAWER ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border-l border-white/5 overflow-y-auto">
            {editLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : editData && (
              <>
                {/* Drawer header */}
                <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{editData.studio.name}</h3>
                    <p className="text-white/40 text-xs">Owner: {editData.studio.owner_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-50"
                    >
                      {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    <button onClick={() => setEditOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Section tabs */}
                <div className="px-6 py-3 border-b border-white/5 flex gap-1 overflow-x-auto">
                  {EDIT_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeSection === s.id
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Section content */}
                <div className="p-6 space-y-4">
                  {/* ── BASIC INFO ── */}
                  {activeSection === "basic" && (
                    <>
                      <InputField label="Studio Name" value={editFields.name} onChange={(v) => setField("name", v)} />
                      <TextareaField label="Description" value={editFields.description} onChange={(v) => setField("description", v)} rows={4} />
                      <TextareaField label="Short Description" value={editFields.short_description} onChange={(v) => setField("short_description", v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Address" value={editFields.address} onChange={(v) => setField("address", v)} />
                        <InputField label="City" value={editFields.city} onChange={(v) => setField("city", v)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="State" value={editFields.state} onChange={(v) => setField("state", v)} />
                        <InputField label="Postal Code" value={editFields.postal_code} onChange={(v) => setField("postal_code", v)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Phone" value={editFields.phone} onChange={(v) => setField("phone", v)} />
                        <InputField label="Email" value={editFields.email} onChange={(v) => setField("email", v)} type="email" />
                      </div>
                      <InputField label="Website" value={editFields.website} onChange={(v) => setField("website", v)} />
                    </>
                  )}

                  {/* ── ROOMS & PRICING ── */}
                  {activeSection === "rooms" && (
                    <>
                      {editRooms.length === 0 ? (
                        <p className="text-white/40 text-sm py-8 text-center">No rooms configured for this studio</p>
                      ) : (
                        editRooms.map((room, idx) => (
                          <div key={room.id} className="bg-white/[0.03] rounded-xl p-4 space-y-3 border border-white/5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-medium text-sm">{room.name}</h4>
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={room.is_active}
                                  onChange={(e) => setRoom(idx, "is_active", e.target.checked)}
                                  className="rounded border-white/20"
                                />
                                <span className="text-white/50">Active</span>
                              </label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <InputField label="Room Name" value={room.name} onChange={(v) => setRoom(idx, "name", v)} />
                              <InputField label="Price/hr (₹)" value={room.price_per_hour} onChange={(v) => setRoom(idx, "price_per_hour", v)} type="number" />
                              <InputField label="Capacity" value={room.capacity} onChange={(v) => setRoom(idx, "capacity", v)} type="number" />
                            </div>
                            <TextareaField label="Description" value={room.description} onChange={(v) => setRoom(idx, "description", v)} />
                            {room.equipment && room.equipment.length > 0 && (
                              <div>
                                <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">Equipment</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {room.equipment.map((re: any) => (
                                    <span key={re.equipment?.id || Math.random()} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs">
                                      {re.equipment?.name || "Unknown"} {re.quantity > 1 ? `×${re.quantity}` : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* ── AMENITIES ── */}
                  {activeSection === "amenities" && (
                    <>
                      {(editData.allAmenities || []).length === 0 ? (
                        <p className="text-white/40 text-sm py-8 text-center">No amenities available in the system</p>
                      ) : (
                        <>
                          <p className="text-white/40 text-xs mb-2">Select amenities available at this studio</p>
                          {Object.entries(
                            (editData.allAmenities || []).reduce((acc: Record<string, any[]>, a: any) => {
                              const cat = a.category || "other";
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(a);
                              return acc;
                            }, {})
                          ).map(([category, amenities]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium capitalize">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {(amenities as any[]).map((a: any) => (
                                  <label
                                    key={a.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                                      selectedAmenities.includes(a.id)
                                        ? "bg-[#D9FC67]/10 border-[#D9FC67]/30 text-[#D9FC67]"
                                        : "bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedAmenities.includes(a.id)}
                                      onChange={() => toggleAmenity(a.id)}
                                      className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                      selectedAmenities.includes(a.id) ? "bg-[#D9FC67] border-[#D9FC67]" : "border-white/20"
                                    }`}>
                                      {selectedAmenities.includes(a.id) && <Check className="w-3 h-3 text-black" />}
                                    </div>
                                    <span className="text-sm">{a.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {/* ── AVAILABILITY / HOURS ── */}
                  {activeSection === "hours" && (
                    <div className="space-y-2">
                      <p className="text-white/40 text-xs mb-2">Configure studio operating hours</p>
                      {editHours.map((h, idx) => (
                        <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${h.is_closed ? "bg-white/[0.01] border-white/5 opacity-50" : "bg-white/[0.03] border-white/5"}`}>
                          <span className="text-white text-sm font-medium w-24">{DAY_NAMES[h.day_of_week]}</span>
                          <label className="flex items-center gap-2 text-xs mr-3">
                            <input
                              type="checkbox"
                              checked={h.is_closed}
                              onChange={(e) => setHour(idx, "is_closed", e.target.checked)}
                              className="rounded border-white/20"
                            />
                            <span className="text-white/40">Closed</span>
                          </label>
                          {!h.is_closed && (
                            <>
                              <input
                                type="time"
                                value={h.open_time}
                                onChange={(e) => setHour(idx, "open_time", e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-white/20"
                              />
                              <span className="text-white/30 text-xs">to</span>
                              <input
                                type="time"
                                value={h.close_time}
                                onChange={(e) => setHour(idx, "close_time", e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-white/20"
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── POLICIES ── */}
                  {activeSection === "policies" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white/40 text-xs">Cancellation refund tiers</p>
                        <button
                          onClick={() => setEditPolicies((p) => [...p, { hours_before: 0, refund_percentage: 0, description: "" }])}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      {editPolicies.map((p, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-3 items-end bg-white/[0.03] rounded-xl p-3 border border-white/5">
                          <InputField label="Hours Before" value={p.hours_before} onChange={(v) => setPolicy(idx, "hours_before", v)} type="number" />
                          <InputField label="Refund %" value={p.refund_percentage} onChange={(v) => setPolicy(idx, "refund_percentage", v)} type="number" />
                          <InputField label="Description" value={p.description || ""} onChange={(v) => setPolicy(idx, "description", v)} />
                          <button
                            onClick={() => setEditPolicies((policies) => policies.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors self-end"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── IMAGES ── */}
                  {activeSection === "images" && (
                    <div className="space-y-3">
                      <p className="text-white/40 text-xs">Studio images (managed via partner dashboard)</p>
                      {(editData.images || []).length === 0 ? (
                        <p className="text-white/30 text-sm py-8 text-center">No images uploaded</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {editData.images.map((img: any, idx: number) => (
                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/5">
                              <img src={img.image_url} alt={img.caption || `Image ${idx + 1}`} className="w-full h-32 object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-xs truncate">{img.caption || `Image ${idx + 1}`}</p>
                                <p className="text-white/40 text-[10px]">Order: {img.display_order}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Delete Studio</h3>
            <p className="text-white/50 text-sm mb-6">
              This will deactivate the studio and notify the owner. This action is irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
