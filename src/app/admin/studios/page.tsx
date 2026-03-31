"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, CheckCircle, XCircle, PauseCircle, RefreshCw, Building2,
  Pencil, Trash2, Play, X, Save, Check, Mic, Music, Video, Lightbulb,
  Volume2, Monitor, MapPin, Plus, Ban, Upload, Loader2, Image as ImageIcon,
  ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { AdminAddStudioWizard } from "./AdminAddStudioWizard";
import { getCities, type City } from "@/lib/data";
import { PartnerStudioLocationPicker } from "@/components/maps/PartnerStudioLocationPicker";
import type { StudioLocation } from "@/types/location";
import { cn } from "@/lib/utils";

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

const EQUIPMENT_DISPLAY = [
  { id: "microphones", name: "Professional Microphones", icon: Mic },
  { id: "headphones", name: "Studio Headphones", icon: Music },
  { id: "cameras", name: "Video Cameras", icon: Video },
  { id: "lighting", name: "Studio Lighting", icon: Lightbulb },
  { id: "mixer", name: "Audio Mixer", icon: Volume2 },
  { id: "soundproofing", name: "Soundproofing", icon: Volume2 },
  { id: "teleprompter", name: "Teleprompter", icon: Monitor },
  { id: "monitor", name: "Reference Monitors", icon: Monitor },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

interface StudioDetail {
  studio: any;
  rooms: any[];
  images: any[];
  studioAmenities: any[];
  allAmenities: any[];
  hours: any[];
  policies: any[];
  studioAddonIds: string[];
  allAddons: any[];
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

const ACTION_MESSAGES: Record<string, string> = {
  approve: "Studio approved successfully",
  reject: "Studio rejected",
  suspend: "Studio suspended",
  pause: "Studio paused successfully",
  activate: "Studio is live again",
};

function AdminStudiosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editFromUrlHandled = useRef<string | null>(null);

  const [studios, setStudios] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  /** Single action key: `${studioId}-${action}` — only that control shows loading / is disabled */
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<
    | null
    | { studioId: string; studioName: string; action: "reject" | "suspend" }
  >(null);

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState<StudioDetail | null>(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit form state
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]); // UUIDs
  const [editAvailableDays, setEditAvailableDays] = useState<string[]>([]);
  const [editWorkingHours, setEditWorkingHours] = useState({ start: "09:00", end: "21:00" });
  const [editPolicies, setEditPolicies] = useState<{ cancellation: any[]; reschedule: any[] }>({ cancellation: [], reschedule: [] });
  const [useCustomPolicies, setUseCustomPolicies] = useState(false);

  // Add-ons
  const [allAddons, setAllAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add studio wizard
  const [addOpen, setAddOpen] = useState(false);

  /** Gallery order = cover first (same as partner). */
  const [photoDraftUrls, setPhotoDraftUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [mapCities, setMapCities] = useState<City[]>([]);
  /** When true, form fields are display-only (tabs still work). */
  const [studioDrawerViewOnly, setStudioDrawerViewOnly] = useState(false);

  useEffect(() => {
    getCities().then(setMapCities).catch(() => setMapCities([]));
  }, []);

  const locationPickerValue: StudioLocation = useMemo(
    () => ({
      address: editFields.address || "",
      city: editFields.city || "",
      state: editFields.state || "",
      country: editFields.country || "India",
      latitude:
        editFields.latitude !== "" && editFields.latitude != null
          ? Number(editFields.latitude)
          : undefined,
      longitude:
        editFields.longitude !== "" && editFields.longitude != null
          ? Number(editFields.longitude)
          : undefined,
    }),
    [
      editFields.address,
      editFields.city,
      editFields.state,
      editFields.country,
      editFields.latitude,
      editFields.longitude,
    ]
  );

  const patchLocationFields = (patch: Partial<StudioLocation>) => {
    setEditFields((f) => ({
      ...f,
      address: patch.address ?? f.address,
      city: patch.city ?? f.city,
      state: patch.state ?? f.state,
      country: patch.country ?? f.country,
      latitude:
        patch.latitude !== undefined ? String(patch.latitude) : f.latitude,
      longitude:
        patch.longitude !== undefined ? String(patch.longitude) : f.longitude,
    }));
  };

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

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(t);
  }, [flash]);

  const runPatchAction = async (studioId: string, action: string) => {
    const key = `${studioId}-${action}`;
    setActionLoading(key);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlash({ type: "error", message: (data as { error?: string }).error || "Request failed" });
        return;
      }
      setFlash({
        type: "success",
        message: ACTION_MESSAGES[action] || "Studio updated",
      });
      fetchStudios();
    } catch {
      setFlash({ type: "error", message: "Network error. Try again." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (studioId: string, action: string) => {
    void runPatchAction(studioId, action);
  };

  const handleDelete = async (studioId: string) => {
    setActionLoading(`${studioId}-delete`);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlash({ type: "error", message: (data as { error?: string }).error || "Delete failed" });
        return;
      }
      setFlash({ type: "success", message: "Studio removed from the platform" });
      setDeleteId(null);
      fetchStudios();
    } catch {
      setFlash({ type: "error", message: "Network error. Try again." });
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = useCallback(async (studioId: string) => {
    setEditOpen(true);
    setEditLoading(true);
    setActiveSection("basic");
    setSaveError(null);
    const res = await fetch(`/api/admin/studios/${studioId}`);
    const data: StudioDetail = await res.json();
    setEditData(data);

    const s = data.studio;
    setEditFields({
      name: s.name || "",
      description: s.description || "",
      short_description: s.short_description || "",
      capacity: s.capacity || s.rooms?.[0]?.capacity || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      country: s.country || "",
      latitude: s.latitude || "",
      longitude: s.longitude || "",
      price_per_hour: s.price_per_hour || (data.rooms?.[0]?.price_per_hour) || "",
    });

    // Amenities — UUIDs from DB
    setSelectedAmenities((data.studioAmenities || []).map((a: any) => a.id).filter(Boolean));

    // Add-ons — UUIDs from DB
    setSelectedAddonIds(data.studioAddonIds || []);

    // Working hours & available days from studio_hours
    const dayMap: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
    const activeHours = (data.hours || []).filter((h: any) => !h.is_closed);
    if (activeHours.length > 0) {
      setEditWorkingHours({ start: activeHours[0]?.open_time || "09:00", end: activeHours[0]?.close_time || "21:00" });
    } else {
      setEditWorkingHours({ start: "09:00", end: "21:00" });
    }
    const activeDays = (data.hours || []).filter((h: any) => !h.is_closed).map((h: any) => dayMap[h.day_of_week]).filter(Boolean);
    setEditAvailableDays(activeDays.length > 0 ? activeDays : ["Mon", "Tue", "Wed", "Thu", "Fri"]);

    // Policies
    const hasPolicies = (data.policies || []).length > 0;
    setUseCustomPolicies(hasPolicies);
    setEditPolicies({
      cancellation: hasPolicies
        ? data.policies.map((p: any) => ({ id: p.id || crypto.randomUUID(), type: "hours", value: p.hours_before || 0, refundPercent: p.refund_percentage || 0 }))
        : [{ id: crypto.randomUUID(), type: "hours", value: 48, refundPercent: 100 }],
      reschedule: [{ id: crypto.randomUUID(), type: "hours", value: 24, deductionPercent: 0 }],
    });

    const sortedImgs = [...(data.images || [])].sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    setPhotoDraftUrls(sortedImgs.map((img: any) => img.image_url).filter(Boolean));
    setStudioDrawerViewOnly(false);

    setEditLoading(false);
  }, []);

  /** Open editor when landing with ?edit=studio_id (e.g. from /admin/studios/edit/[id]) */
  useEffect(() => {
    const raw = searchParams.get("edit");
    if (!raw) {
      editFromUrlHandled.current = null;
      return;
    }
    if (editFromUrlHandled.current === raw) return;
    editFromUrlHandled.current = raw;
    void openEdit(raw).finally(() => {
      router.replace("/admin/studios", { scroll: false });
    });
  }, [searchParams, router, openEdit]);

  const handleAdminPhotoFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingPhotos(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) urls.push(data.url);
      }
      if (urls.length) setPhotoDraftUrls((prev) => [...prev, ...urls]);
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const movePhoto = (index: number, dir: -1 | 1) => {
    setPhotoDraftUrls((prev) => {
      const to = index + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  };

  const setCoverPhotoAt = (index: number) => {
    if (index === 0) return;
    setPhotoDraftUrls((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const n = [...prev];
      const [picked] = n.splice(index, 1);
      return [picked, ...n];
    });
  };

  const removePhotoAt = (index: number) => {
    setPhotoDraftUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEdit = async () => {
    if (!editData || studioDrawerViewOnly) return;
    setEditSaving(true);
    setSaveError(null);

    // Map available days to studio_hours format
    const dayNameToNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const hoursData = Object.entries(dayNameToNum).map(([name, num]) => ({
      day_of_week: num,
      open_time: editWorkingHours.start,
      close_time: editWorkingHours.end,
      is_closed: !editAvailableDays.includes(name),
    }));

    const policyUpdates = useCustomPolicies
      ? editPolicies.cancellation.map((p) => ({
          hours_before: Number(p.value),
          refund_percentage: Number(p.refundPercent),
          description: `${p.refundPercent}% refund if cancelled ${p.value}+ ${p.type} before`,
        }))
      : [];

    const res = await fetch(`/api/admin/studios/${editData.studio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioFields: {
          name: editFields.name,
          short_description: editFields.short_description,
          description: editFields.description,
          address: editFields.address,
          city: editFields.city,
          state: editFields.state,
          country: editFields.country,
          latitude: editFields.latitude ? Number(editFields.latitude) : null,
          longitude: editFields.longitude ? Number(editFields.longitude) : null,
          price_per_hour: Number(editFields.price_per_hour) || 0,
          capacity: Number(editFields.capacity) || 0,
        },
        amenityIds: selectedAmenities,
        addonIds: selectedAddonIds,
        hoursData,
        policyUpdates,
        imageUrls: photoDraftUrls,
      }),
    });

    const result = await res.json();
    setEditSaving(false);

    if (!res.ok) {
      setSaveError(result.error || "Failed to save");
      return;
    }

    setEditOpen(false);
    setFlash({ type: "success", message: "Studio saved successfully" });
    fetchStudios();
  };

  const setField = (key: string, value: any) => setEditFields((f) => ({ ...f, [key]: value }));
  const toggleAmenity = (id: string) =>
    setSelectedAmenities((ids) => ids.includes(id) ? ids.filter((a) => a !== id) : [...ids, id]);
  const toggleDay = (day: string) =>
    setEditAvailableDays((days) => days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);

  const toggleAddon = (id: string) =>
    setSelectedAddonIds((ids) => ids.includes(id) ? ids.filter((a) => a !== id) : [...ids, id]);

  const EDIT_SECTIONS = [
    { id: "basic", label: "Basic Info" },
    { id: "location", label: "Location" },
    { id: "pricing", label: "Pricing & Availability" },
    { id: "amenities", label: "Amenities" },
    { id: "addons", label: "Add-ons" },
    { id: "inventory", label: "Equipment" },
    { id: "photos", label: "Photos" },
    { id: "policies", label: "Policies" },
  ];

  const isBtnBusy = (studioId: string, action: string) => actionLoading === `${studioId}-${action}`;

  return (
    <div className="space-y-6">
      {flash && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            flash.type === "success"
              ? "border-[#D9FC67]/30 bg-[#D9FC67]/10 text-[#D9FC67]"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {flash.message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total studios · Full control</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
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
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Quick Add
          </button>
          <a
            href="/admin/studios/create"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D9FC67] text-black hover:bg-[#E8FF8A] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Studio
          </a>
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
                      <td className="px-6 py-4"><span className="text-white/50 text-sm">{studio.city}</span></td>
                      <td className="px-6 py-4"><span className="text-white font-medium text-sm">₹{studio.price_per_hour}/hr</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 flex-wrap relative z-10">
                          <a
                            href={`/admin/studios/edit/${studio.id}`}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors inline-flex"
                            title="Edit studio"
                            aria-label="Edit studio"
                          >
                            <Pencil className="w-4 h-4" />
                          </a>
                          {studio.review_status !== "approved" && studio.review_status !== "deleted" && (
                            <button
                              type="button"
                              onClick={() => handleAction(studio.id, "approve")}
                              disabled={isBtnBusy(studio.id, "approve")}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Approve listing"
                              aria-label="Approve listing"
                            >
                              {isBtnBusy(studio.id, "approve") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          )}
                          {studio.review_status === "approved" && (
                            <button
                              type="button"
                              onClick={() => handleAction(studio.id, "pause")}
                              disabled={isBtnBusy(studio.id, "pause")}
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Pause studio (hidden from booking)"
                              aria-label="Pause studio"
                            >
                              {isBtnBusy(studio.id, "pause") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                            </button>
                          )}
                          {(studio.review_status === "paused" || studio.review_status === "suspended") && (
                            <button
                              type="button"
                              onClick={() => handleAction(studio.id, "activate")}
                              disabled={isBtnBusy(studio.id, "activate")}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-white/40 hover:text-green-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title={studio.review_status === "suspended" ? "Restore studio (approve)" : "Resume studio"}
                              aria-label="Resume or restore studio"
                            >
                              {isBtnBusy(studio.id, "activate") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}
                          {!["rejected", "deleted"].includes(studio.review_status) && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({ studioId: studio.id, studioName: studio.name, action: "reject" })
                              }
                              disabled={isBtnBusy(studio.id, "reject")}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Reject listing"
                              aria-label="Reject listing"
                            >
                              {isBtnBusy(studio.id, "reject") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          )}
                          {!["suspended", "deleted", "paused"].includes(studio.review_status) && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({ studioId: studio.id, studioName: studio.name, action: "suspend" })
                              }
                              disabled={isBtnBusy(studio.id, "suspend")}
                              className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-white/40 hover:text-yellow-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Suspend studio"
                              aria-label="Suspend studio"
                            >
                              {isBtnBusy(studio.id, "suspend") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            </button>
                          )}
                          {studio.review_status !== "deleted" && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(studio.id)}
                              disabled={isBtnBusy(studio.id, "delete")}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              title="Remove studio (soft delete)"
                              aria-label="Delete studio"
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
                <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-lg truncate">{editData.studio.name}</h3>
                      {editData.studio.admin_last_edited_at && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                          Edited by admin
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">Owner: {editData.studio.owner_email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudioDrawerViewOnly((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/70 hover:bg-white/5"
                    >
                      {studioDrawerViewOnly ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {studioDrawerViewOnly ? "Edit" : "View only"}
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={editSaving || studioDrawerViewOnly}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-40"
                    >
                      {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    <button type="button" onClick={() => setEditOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {saveError && (
                  <div className="mx-6 mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {saveError}
                  </div>
                )}

                {/* Section tabs */}
                <div className="px-6 py-3 border-b border-white/5 flex gap-1 overflow-x-auto">
                  {EDIT_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeSection === s.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Section content */}
                <div
                  className={cn(
                    "p-6 space-y-4",
                    studioDrawerViewOnly && "pointer-events-none opacity-55 select-none"
                  )}
                >
                  {studioDrawerViewOnly && (
                    <p className="text-amber-200/90 text-xs border border-amber-500/20 bg-amber-500/5 rounded-lg px-3 py-2 -mt-4 mb-2 pointer-events-auto">
                      View only — click <span className="font-semibold">Edit</span> in the header to change fields.
                    </p>
                  )}
                  {/* ── BASIC INFO ── */}
                  {activeSection === "basic" && (
                    <>
                      <InputField label="Studio Name" value={editFields.name} onChange={(v) => setField("name", v)} />
                      <TextareaField label="Short Description" value={editFields.short_description} onChange={(v) => setField("short_description", v)} />
                      <TextareaField label="Full Description" value={editFields.description} onChange={(v) => setField("description", v)} rows={4} />
                      <InputField label="Seating Capacity" value={editFields.capacity} onChange={(v) => setField("capacity", v)} type="number" />
                    </>
                  )}

                  {/* ── LOCATION ── */}
                  {activeSection === "location" && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-white/40" />
                        <span className="text-white/50 text-xs">Search, map pin, and fields stay in sync.</span>
                      </div>
                      {mapCities.length > 0 ? (
                        <div className="rounded-xl border border-white/10 overflow-hidden mb-4">
                          <PartnerStudioLocationPicker
                            cities={mapCities}
                            value={locationPickerValue}
                            onChange={patchLocationFields}
                          />
                        </div>
                      ) : (
                        <p className="text-white/40 text-xs mb-3">Loading map… or enter coordinates manually below.</p>
                      )}
                      <InputField label="Address" value={editFields.address} onChange={(v) => setField("address", v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="City" value={editFields.city} onChange={(v) => setField("city", v)} />
                        <InputField label="State" value={editFields.state} onChange={(v) => setField("state", v)} />
                      </div>
                      <InputField label="Country" value={editFields.country} onChange={(v) => setField("country", v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Latitude" value={editFields.latitude} onChange={(v) => setField("latitude", v)} type="number" />
                        <InputField label="Longitude" value={editFields.longitude} onChange={(v) => setField("longitude", v)} type="number" />
                      </div>
                    </>
                  )}

                  {/* ── PRICING & AVAILABILITY ── */}
                  {activeSection === "pricing" && (
                    <>
                      <InputField label="Price per Hour (₹)" value={editFields.price_per_hour} onChange={(v) => setField("price_per_hour", v)} type="number" />

                      <div className="border-t border-white/5 pt-4 mt-4">
                        <label className="text-white/40 text-xs uppercase tracking-wider block mb-3">Working Hours</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-white/50 text-xs block mb-1">Start Time</label>
                            <select
                              value={editWorkingHours.start}
                              onChange={(e) => setEditWorkingHours((h) => ({ ...h, start: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                            >
                              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-white/50 text-xs block mb-1">End Time</label>
                            <select
                              value={editWorkingHours.end}
                              onChange={(e) => setEditWorkingHours((h) => ({ ...h, end: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20"
                            >
                              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4 mt-4">
                        <label className="text-white/40 text-xs uppercase tracking-wider block mb-3">Available Days</label>
                        <div className="flex gap-2 flex-wrap">
                          {DAYS.map((day) => (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                                editAvailableDays.includes(day)
                                  ? "bg-[#D9FC67]/10 border-[#D9FC67]/30 text-[#D9FC67]"
                                  : "bg-white/[0.02] border-white/5 text-white/30 hover:border-white/10"
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── AMENITIES — uses DB amenities with UUIDs ── */}
                  {activeSection === "amenities" && (
                    <>
                      {(editData.allAmenities || []).length === 0 ? (
                        <p className="text-white/40 text-sm py-8 text-center">No amenities configured in the system</p>
                      ) : (
                        <>
                          <p className="text-white/40 text-xs mb-3">Select amenities available at this studio</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(editData.allAmenities || []).map((a: any) => {
                              const selected = selectedAmenities.includes(a.id);
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => toggleAmenity(a.id)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                                    selected
                                      ? "bg-[#D9FC67]/10 border-[#D9FC67]/30"
                                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                    selected ? "bg-[#D9FC67] border-[#D9FC67]" : "border-white/20"
                                  }`}>
                                    {selected && <Check className="w-3 h-3 text-black" />}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${selected ? "text-[#D9FC67]" : "text-white/50"}`}>{a.name}</p>
                                    {a.category && <p className="text-white/30 text-xs capitalize">{a.category}</p>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* ── ADD-ONS ── */}
                  {activeSection === "addons" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/60 text-sm font-medium">Booking Add-ons</p>
                          <p className="text-white/30 text-xs mt-0.5">Select which add-ons customers can purchase when booking this studio.</p>
                        </div>
                        <span className="text-white/30 text-xs">
                          {selectedAddonIds.length} selected
                        </span>
                      </div>

                      {(editData.allAddons || []).length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-white/10 rounded-xl">
                          <p className="text-white/30 text-sm">No add-ons configured on the platform</p>
                          <p className="text-white/20 text-xs mt-1">Add platform add-ons from the Add-ons management page first</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {(editData.allAddons || []).map((addon: any) => {
                            const selected = selectedAddonIds.includes(addon.id);
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left w-full ${
                                  selected
                                    ? "bg-[#D9FC67]/10 border-[#D9FC67]/30"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                  selected ? "bg-[#D9FC67] border-[#D9FC67]" : "border-white/20"
                                }`}>
                                  {selected && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${selected ? "text-[#D9FC67]" : "text-white/70"}`}>
                                    {addon.name}
                                  </p>
                                  {addon.description && (
                                    <p className="text-white/30 text-xs mt-0.5 truncate">{addon.description}</p>
                                  )}
                                  {addon.category && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[10px] capitalize">
                                      {addon.category}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-2 text-right flex-shrink-0">
                                  <p className={`font-semibold text-sm ${selected ? "text-[#D9FC67]" : "text-white/50"}`}>
                                    ₹{Number(addon.price).toLocaleString()}
                                  </p>
                                  <p className="text-white/20 text-[10px]">flat fee</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── EQUIPMENT (partner inventory) ── */}
                  {activeSection === "inventory" && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                      <p className="text-white/80 text-sm font-medium">Equipment &amp; services</p>
                      <p className="text-white/45 text-xs leading-relaxed">
                        Detailed equipment, services, and custom add-ons are stored as partner inventory. Partners manage them from{" "}
                        <span className="text-white/60">Partner → Equipment &amp; Services</span> and per-studio picks in{" "}
                        <span className="text-white/60">Edit studio</span>. Admin saves here still override listing text, photos, pricing, hours, amenities, platform add-ons, and policies.
                      </p>
                    </div>
                  )}

                  {/* ── PHOTOS ── */}
                  {activeSection === "photos" && (
                    <div className="space-y-4">
                      <p className="text-white/50 text-sm">
                        First image is the <span className="text-[#D9FC67]">cover</span> everywhere on the site. Drag new files or use arrows to reorder.
                      </p>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => void handleAdminPhotoFiles(e.target.files)}
                      />
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                          uploadingPhotos ? "border-white/5 opacity-60" : "border-white/10 hover:border-[#D9FC67]/40 cursor-pointer"
                        )}
                        onClick={() => !uploadingPhotos && !studioDrawerViewOnly && photoInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!studioDrawerViewOnly) void handleAdminPhotoFiles(e.dataTransfer.files);
                        }}
                      >
                        {uploadingPhotos ? (
                          <Loader2 className="w-8 h-8 mx-auto text-[#D9FC67] animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 mx-auto text-white/30 mb-2" />
                        )}
                        <p className="text-white/70 text-sm font-medium">Upload or drop images</p>
                        <p className="text-white/35 text-xs mt-1">JPG, PNG, WebP — up to 10MB each</p>
                      </div>

                      {photoDraftUrls.length === 0 ? (
                        <p className="text-white/30 text-sm py-6 text-center border border-dashed border-white/10 rounded-xl">No photos yet — upload above.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photoDraftUrls.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                              <img src={url} alt={`Studio ${idx + 1}`} className="w-full h-full object-cover" />
                              {idx === 0 && (
                                <span className="absolute bottom-2 left-2 bg-[#D9FC67] text-black text-[10px] px-2 py-0.5 rounded-full font-semibold z-10">
                                  Cover
                                </span>
                              )}
                              {!studioDrawerViewOnly && (
                                <>
                                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); movePhoto(idx, -1); }}
                                      disabled={idx === 0}
                                      className="p-1 rounded-md bg-black/70 text-white hover:bg-[#D9FC67] hover:text-black disabled:opacity-30"
                                      title="Move up"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); movePhoto(idx, 1); }}
                                      disabled={idx === photoDraftUrls.length - 1}
                                      className="p-1 rounded-md bg-black/70 text-white hover:bg-[#D9FC67] hover:text-black disabled:opacity-30"
                                      title="Move down"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {idx !== 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setCoverPhotoAt(idx); }}
                                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/65 text-white hover:bg-[#D9FC67] hover:text-black z-10"
                                      title="Set as cover"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removePhotoAt(idx); }}
                                    className="absolute top-2 left-2 p-1 rounded-md bg-red-600/90 text-white hover:bg-red-500 z-10"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── POLICIES ── */}
                  {activeSection === "policies" && (
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className={`w-10 h-5 rounded-full relative transition-colors ${useCustomPolicies ? "bg-[#D9FC67]" : "bg-white/10"}`}
                          onClick={() => setUseCustomPolicies(!useCustomPolicies)}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${useCustomPolicies ? "translate-x-5" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-white/60 text-sm">Use custom cancellation policies</span>
                      </label>

                      {useCustomPolicies ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white/50 text-xs uppercase tracking-wider font-medium">Cancellation Rules</h4>
                            <button
                              onClick={() => setEditPolicies((p) => ({ ...p, cancellation: [...p.cancellation, { id: crypto.randomUUID(), type: "hours", value: 0, refundPercent: 0 }] }))}
                              className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Rule
                            </button>
                          </div>
                          {editPolicies.cancellation.map((rule, idx) => (
                            <div key={rule.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                              <div className="grid grid-cols-4 gap-3 items-end">
                                <div>
                                  <label className="text-white/40 text-xs block mb-1">Unit</label>
                                  <select
                                    value={rule.type}
                                    onChange={(e) => {
                                      const u = [...editPolicies.cancellation]; u[idx] = { ...u[idx], type: e.target.value };
                                      setEditPolicies((p) => ({ ...p, cancellation: u }));
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                                  >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                  </select>
                                </div>
                                <InputField label="Before Booking" value={rule.value} onChange={(v) => {
                                  const u = [...editPolicies.cancellation]; u[idx] = { ...u[idx], value: v };
                                  setEditPolicies((p) => ({ ...p, cancellation: u }));
                                }} type="number" />
                                <InputField label="Refund %" value={rule.refundPercent} onChange={(v) => {
                                  const u = [...editPolicies.cancellation]; u[idx] = { ...u[idx], refundPercent: v };
                                  setEditPolicies((p) => ({ ...p, cancellation: u }));
                                }} type="number" />
                                <button
                                  onClick={() => setEditPolicies((p) => ({ ...p, cancellation: p.cancellation.filter((_, i) => i !== idx) }))}
                                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors self-end"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                          <p className="text-white/40 text-sm">Using platform default policies:</p>
                          <ul className="mt-2 space-y-1 text-white/50 text-xs">
                            <li>• 48+ hours before: Full refund</li>
                            <li>• 24-48 hours before: 50% refund</li>
                            <li>• Less than 24 hours: No refund</li>
                          </ul>
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

      {/* Reject / Suspend confirmation */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-white font-semibold text-lg mb-2">
              {confirmDialog.action === "suspend" ? "Suspend this studio?" : "Reject this studio?"}
            </h3>
            <p className="text-white/50 text-sm mb-6">
              {confirmDialog.action === "suspend"
                ? `Are you sure you want to suspend "${confirmDialog.studioName}"? It will be hidden from booking until restored.`
                : `Are you sure you want to reject "${confirmDialog.studioName}"? The owner will be notified.`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { studioId, action } = confirmDialog;
                  setConfirmDialog(null);
                  void runPatchAction(studioId, action);
                }}
                disabled={isBtnBusy(confirmDialog.studioId, confirmDialog.action)}
                className={
                  confirmDialog.action === "suspend"
                    ? "flex-1 px-4 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    : "flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                }
              >
                {isBtnBusy(confirmDialog.studioId, confirmDialog.action) ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : confirmDialog.action === "suspend" ? (
                  "Suspend"
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Delete this studio permanently?</h3>
            <p className="text-white/50 text-sm mb-6">
              This soft-deletes the listing and notifies the owner. You can filter by status to see removed studios.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={isBtnBusy(deleteId, "delete")}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBtnBusy(deleteId, "delete") ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Studio Wizard */}
      {addOpen && (
        <AdminAddStudioWizard
          onClose={() => setAddOpen(false)}
          onSuccess={() => { setAddOpen(false); fetchStudios(); }}
        />
      )}
    </div>
  );
}

export default function AdminStudiosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminStudiosPageInner />
    </Suspense>
  );
}
