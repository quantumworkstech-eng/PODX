"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe, Search, Eye, EyeOff,
  ExternalLink, DollarSign, X,
  Shield, Loader2, Building2,
  CheckCircle2, XCircle, Save, Trash2,
  Palette, Link as LinkIcon, Mail, Image,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface WhiteLabelPartner {
  id: string;
  partner_id: string;
  brand_name: string;
  partner_slug: string;
  logo_url: string;
  favicon_url: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_text_color: string;
  font_family: string;
  booking_page_title: string;
  booking_page_description: string;
  website_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  email_sender_name: string;
  email_sender_address: string;
  email_footer_text: string;
  custom_domain: string;
  subdomain: string;
  url_mode: string;
  domain_verified: boolean;
  is_published: boolean;
  is_whitelabel_enabled: boolean;
  admin_disabled: boolean;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  users: { email: string };
  profiles: { full_name: string; business_name: string };
}

interface PartnerStudio {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
  review_status: string;
}

interface Payout {
  id: string;
  partner_id: string;
  payout_amount: number;
  booking_count: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string;
  reference_number: string;
  users: { email: string };
  profiles: { full_name: string; business_name: string };
}

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: "all", label: "All Partners" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "disabled", label: "Disabled" },
];

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  paid: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
  cancelled: "text-white/40 bg-white/5",
};

const DRAWER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "edit", label: "Edit Branding" },
  { id: "studios", label: "Studios" },
  { id: "notes", label: "Notes" },
];

const FONT_OPTIONS = ["Inter", "Poppins", "Roboto", "Montserrat", "Raleway", "Nunito", "Open Sans", "Lato"];

// ── Input helper ──────────────────────────────────────────────────────────

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50 focus:ring-1 focus:ring-[#D9FC67]/20 transition-colors";

function Field({ label, hint, children, className }: {
  label: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-white/60">
        {label}
        {hint && <span className="text-white/25 ml-1 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function AdminWhiteLabelPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "payouts">("partners");
  const [partners, setPartners] = useState<WhiteLabelPartner[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState({ total_pending: 0, total_processing: 0, total_paid: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<WhiteLabelPartner | null>(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payoutActionData, setPayoutActionData] = useState({ reference_number: "", notes: "" });
  const [partnerStudios, setPartnerStudios] = useState<PartnerStudio[]>([]);
  const [studiosLoading, setStudiosLoading] = useState(false);

  // Edit branding state
  const [editBranding, setEditBranding] = useState<Partial<WhiteLabelPartner>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter === "all" ? "" : statusFilter });
    fetch(`/api/admin/whitelabel?${params}`)
      .then((r) => r.json())
      .then(({ partners: p, total: t }) => { setPartners(p || []); setTotal(t || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const fetchPayouts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: payoutStatusFilter });
    fetch(`/api/admin/payouts?${params}`)
      .then((r) => r.json())
      .then(({ payouts: p, summary: s }) => { setPayouts(p || []); setPayoutSummary(s || {}); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [payoutStatusFilter]);

  useEffect(() => {
    if (activeTab === "partners") fetchPartners();
    else fetchPayouts();
  }, [activeTab, fetchPartners, fetchPayouts]);

  // When a partner is selected, initialise the edit form
  useEffect(() => {
    if (!selectedPartner) { setPartnerStudios([]); setEditBranding({}); return; }
    setEditBranding({ ...selectedPartner });
    setEditSaved(false);
    setEditError(null);

    setStudiosLoading(true);
    fetch(`/api/admin/studios?owner_id=${selectedPartner.partner_id}`)
      .then((r) => r.json())
      .then(({ studios }) => setPartnerStudios(studios || []))
      .catch(console.error)
      .finally(() => setStudiosLoading(false));
  }, [selectedPartner]);

  const openPartner = (partner: WhiteLabelPartner) => {
    setSelectedPartner(partner);
    setDrawerTab("overview");
    setShowDeleteConfirm(false);
  };

  const updateEdit = (field: string, value: string | boolean) => {
    setEditBranding((prev) => ({ ...prev, [field]: value }));
    setEditSaved(false);
  };

  const saveEditBranding = async () => {
    if (!selectedPartner) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch("/api/admin/whitelabel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: selectedPartner.partner_id, ...editBranding }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      // Update the partner in both the list and the selected state
      const updated = data.branding as WhiteLabelPartner;
      setSelectedPartner((prev) => prev ? { ...prev, ...updated } : null);
      setPartners((prev) => prev.map((p) => p.partner_id === selectedPartner.partner_id ? { ...p, ...updated } : p));
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 3000);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setEditSaving(false);
    }
  };

  const togglePartner = async (partner: WhiteLabelPartner, field: "admin_disabled" | "is_published") => {
    setActionLoading(partner.partner_id + field);
    try {
      const res = await fetch("/api/admin/whitelabel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: partner.partner_id, [field]: !partner[field] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = data.branding as WhiteLabelPartner;
      setPartners((prev) => prev.map((p) => p.partner_id === partner.partner_id ? { ...p, ...updated } : p));
      if (selectedPartner?.partner_id === partner.partner_id) {
        setSelectedPartner((prev) => prev ? { ...prev, ...updated } : null);
        setEditBranding((prev) => ({ ...prev, [field]: !partner[field] }));
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const deleteBranding = async () => {
    if (!selectedPartner) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/whitelabel?partner_id=${selectedPartner.partner_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPartners((prev) => prev.filter((p) => p.partner_id !== selectedPartner.partner_id));
      setSelectedPartner(null);
      setShowDeleteConfirm(false);
      fetchPartners();
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  const toggleStudio = async (studio: PartnerStudio, action: "activate" | "suspend") => {
    setActionLoading(`studio-${studio.id}`);
    try {
      await fetch(`/api/admin/studios/${studio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setPartnerStudios((prev) =>
        prev.map((s) => s.id === studio.id
          ? { ...s, is_active: action === "activate", review_status: action === "suspend" ? "suspended" : "approved" }
          : s
        )
      );
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const savePartnerNotes = async (notes: string) => {
    if (!selectedPartner) return;
    await fetch("/api/admin/whitelabel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_id: selectedPartner.partner_id, admin_notes: notes }),
    });
    setSelectedPartner((prev) => prev ? { ...prev, admin_notes: notes } : null);
    setPartners((prev) => prev.map((p) => p.partner_id === selectedPartner.partner_id ? { ...p, admin_notes: notes } : p));
  };

  const processPayoutUpdate = async (payout: Payout, status: string) => {
    setActionLoading(payout.id);
    try {
      await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payout.id, status, ...payoutActionData }),
      });
      setSelectedPayout(null);
      setPayoutActionData({ reference_number: "", notes: "" });
      fetchPayouts();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-white/40 text-sm">
          {total} white-label partner{total !== 1 ? "s" : ""} · manage branding, studios, and payouts
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {[{ id: "partners", label: "Partners", icon: Globe }, { id: "payouts", label: "Payouts", icon: DollarSign }].map((tab) => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as "partners" | "payouts")}
            className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-[#D9FC67] text-black" : "text-white/50 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PARTNERS TAB ──────────────────────────────────────────── */}
      {activeTab === "partners" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand name, slug, domain…"
                className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex gap-1 p-1 bg-[#141414] rounded-xl border border-white/5">
              {STATUS_TABS.map((t) => (
                <button key={t.id} onClick={() => setStatusFilter(t.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    statusFilter === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin text-[#D9FC67]" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
              <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No white-label partners found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <div key={partner.id}
                  className={cn("flex items-center gap-4 p-4 bg-[#141414] border rounded-xl transition-all cursor-pointer hover:border-white/10",
                    partner.admin_disabled ? "border-red-500/20 opacity-60" : "border-white/5"
                  )}
                  onClick={() => openPartner(partner)}
                >
                  {/* Color avatar */}
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-black font-bold text-sm"
                    style={{ background: partner.primary_color || "#D9FC67" }}>
                    {partner.brand_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium">{partner.brand_name || "(Unnamed)"}</p>
                      {partner.is_published && !partner.admin_disabled && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Live</span>
                      )}
                      {partner.admin_disabled && (
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Disabled</span>
                      )}
                      {!partner.is_published && !partner.admin_disabled && (
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Draft</span>
                      )}
                      {partner.domain_verified && (
                        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />Domain
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-white/40 text-xs">{partner.users?.email}</span>
                      {partner.partner_slug && <span className="text-white/30 text-xs">/p/{partner.partner_slug}</span>}
                      {partner.custom_domain && <span className="text-white/30 text-xs">{partner.custom_domain}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {partner.partner_slug && (
                      <a href={`/p/${partner.partner_slug}`} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-white/30 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePartner(partner, "admin_disabled"); }}
                      disabled={actionLoading === partner.partner_id + "admin_disabled"}
                      className={cn("p-2 rounded-lg transition-colors",
                        partner.admin_disabled ? "text-green-400 hover:bg-green-400/10" : "text-red-400 hover:bg-red-400/10"
                      )}
                      title={partner.admin_disabled ? "Enable" : "Disable"}
                    >
                      {actionLoading === partner.partner_id + "admin_disabled"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : partner.admin_disabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PAYOUTS TAB ───────────────────────────────────────────── */}
      {activeTab === "payouts" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending", value: payoutSummary.total_pending, color: "text-yellow-400" },
              { label: "Processing", value: payoutSummary.total_processing, color: "text-blue-400" },
              { label: "Paid Out", value: payoutSummary.total_paid, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>₹{(s.value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-[#141414] rounded-xl border border-white/5 w-fit">
            {["", "pending", "processing", "paid", "failed"].map((s) => (
              <button key={s} onClick={() => setPayoutStatusFilter(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                  payoutStatusFilter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}>
                {s || "All"}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
              <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No payout requests found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((payout) => (
                <div key={payout.id}
                  className="flex items-center gap-4 p-4 bg-[#141414] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-all"
                  onClick={() => setSelectedPayout(payout)}>
                  <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{payout.profiles?.full_name || payout.users?.email}</p>
                    <p className="text-white/40 text-xs">{payout.profiles?.business_name} · {payout.booking_count} bookings · {new Date(payout.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₹{payout.payout_amount.toLocaleString()}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", PAYOUT_STATUS_COLORS[payout.status] || "text-white/40")}>
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PARTNER DETAIL DRAWER
          ══════════════════════════════════════════════════════════════ */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedPartner(null)}>
          <div
            className="bg-[#0f0f0f] border-l border-white/10 w-full max-w-lg h-full overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-[#0f0f0f] border-b border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
                  style={{ background: selectedPartner.primary_color || "#D9FC67" }}>
                  {selectedPartner.brand_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">{selectedPartner.brand_name || "(Unnamed)"}</h3>
                  <p className="text-white/40 text-xs">{selectedPartner.users?.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="text-white/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer sub-tabs */}
            <div className="flex gap-0.5 px-4 pt-3 pb-0 flex-shrink-0">
              {DRAWER_TABS.map((t) => (
                <button key={t.id} onClick={() => setDrawerTab(t.id)}
                  className={cn("px-3.5 py-2 rounded-t-xl text-xs font-medium transition-all border-b-2",
                    drawerTab === t.id
                      ? "text-white border-[#D9FC67] bg-white/5"
                      : "text-white/40 border-transparent hover:text-white"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="border-t border-white/5 mx-4" />

            {/* ── Tab: Overview ── */}
            {drawerTab === "overview" && (
              <div className="p-6 space-y-5 flex-1">
                {/* Live preview */}
                <div className="p-4 rounded-xl"
                  style={{ background: (selectedPartner.primary_color || "#D9FC67") + "12", border: `1px solid ${selectedPartner.primary_color || "#D9FC67"}25` }}>
                  <div className="flex items-center gap-3 mb-3">
                    {selectedPartner.logo_url ? (
                      <img src={selectedPartner.logo_url} alt="" className="h-8 w-auto object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black"
                        style={{ background: selectedPartner.primary_color || "#D9FC67" }}>
                        {selectedPartner.brand_name?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">{selectedPartner.brand_name}</p>
                      {selectedPartner.tagline && <p className="text-white/40 text-xs">{selectedPartner.tagline}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPartner.is_published && !selectedPartner.admin_disabled && (
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">● Live</span>
                    )}
                    {selectedPartner.admin_disabled && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Disabled by Admin</span>
                    )}
                    {!selectedPartner.is_published && !selectedPartner.admin_disabled && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Draft</span>
                    )}
                  </div>
                </div>

                {/* Key details */}
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Slug / URL", value: selectedPartner.partner_slug ? `/p/${selectedPartner.partner_slug}` : "—" },
                    { label: "URL Mode", value: selectedPartner.url_mode || "slug" },
                    { label: "Subdomain", value: selectedPartner.subdomain ? `${selectedPartner.subdomain}.podx.com` : "—" },
                    { label: "Custom Domain", value: selectedPartner.custom_domain || "—" },
                    { label: "Domain Verified", value: selectedPartner.domain_verified ? "✓ Verified" : "Not verified" },
                    { label: "Primary Color", value: selectedPartner.primary_color || "—" },
                    { label: "Font", value: selectedPartner.font_family || "Inter" },
                    { label: "Contact Email", value: selectedPartner.contact_email || "—" },
                    { label: "Contact Phone", value: selectedPartner.contact_phone || "—" },
                    { label: "Created", value: new Date(selectedPartner.created_at).toLocaleDateString() },
                    { label: "Last Updated", value: new Date(selectedPartner.updated_at).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white text-xs">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => togglePartner(selectedPartner, "is_published")}
                      disabled={!!actionLoading}
                      size="sm"
                      className={cn("text-xs", selectedPartner.is_published
                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                      )}>
                      {actionLoading === selectedPartner.partner_id + "is_published" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {selectedPartner.is_published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      onClick={() => togglePartner(selectedPartner, "admin_disabled")}
                      disabled={!!actionLoading}
                      size="sm"
                      className={cn("text-xs", selectedPartner.admin_disabled
                        ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      )}>
                      {actionLoading === selectedPartner.partner_id + "admin_disabled" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      {selectedPartner.admin_disabled ? "Re-enable" : "Disable"}
                    </Button>
                  </div>
                  {selectedPartner.partner_slug && (
                    <a href={`/p/${selectedPartner.partner_slug}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-[#D9FC67] hover:underline mt-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View live page
                    </a>
                  )}
                </div>

                {/* Delete */}
                <div className="pt-4 border-t border-white/5">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete entire white-label configuration
                    </button>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-xs">
                          This will permanently delete all branding config for <strong>{selectedPartner.brand_name}</strong>. This cannot be undone.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={deleteBranding} disabled={deleting} size="sm"
                          className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs">
                          {deleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Confirm Delete
                        </Button>
                        <Button onClick={() => setShowDeleteConfirm(false)} size="sm"
                          className="flex-1 bg-white/5 text-white/60 border border-white/10 text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Edit Branding ── */}
            {drawerTab === "edit" && (
              <div className="p-6 space-y-6 flex-1">
                {/* Save bar */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">Edit all branding fields for this partner</p>
                  <div className="flex items-center gap-2">
                    {editSaved && <span className="text-xs text-green-400">Saved!</span>}
                    <Button onClick={saveEditBranding} disabled={editSaving} size="sm"
                      className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black text-xs font-semibold">
                      {editSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                      {editSaving ? "Saving…" : "Save All"}
                    </Button>
                  </div>
                </div>

                {editError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {editError}
                  </div>
                )}

                {/* ─ Identity ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Image className="w-3.5 h-3.5" /> Identity
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Brand Name" className="col-span-2">
                      <input value={editBranding.brand_name || ""} onChange={(e) => updateEdit("brand_name", e.target.value)}
                        placeholder="e.g. Mumbai Podcast Hub" className={inputCls} />
                    </Field>
                    <Field label="URL Slug">
                      <div className="flex">
                        <span className="flex items-center px-2 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-white/30 text-xs">/p/</span>
                        <input value={editBranding.partner_slug || ""}
                          onChange={(e) => updateEdit("partner_slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="my-studio" className={cn(inputCls, "rounded-l-none")} />
                      </div>
                    </Field>
                    <Field label="Font Family">
                      <select value={editBranding.font_family || "Inter"} onChange={(e) => updateEdit("font_family", e.target.value)} className={inputCls}>
                        {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Field>
                    <Field label="Logo URL" className="col-span-2">
                      <input value={editBranding.logo_url || ""} onChange={(e) => updateEdit("logo_url", e.target.value)}
                        placeholder="https://cdn.example.com/logo.png" className={inputCls} />
                    </Field>
                    <Field label="Favicon URL">
                      <input value={editBranding.favicon_url || ""} onChange={(e) => updateEdit("favicon_url", e.target.value)}
                        placeholder="https://cdn.example.com/fav.ico" className={inputCls} />
                    </Field>
                    <Field label="Tagline">
                      <input value={editBranding.tagline || ""} onChange={(e) => updateEdit("tagline", e.target.value)}
                        placeholder="Your tagline here" className={inputCls} />
                    </Field>
                  </div>
                </section>

                {/* ─ Colors ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Colors
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "primary_color", label: "Primary" },
                      { field: "secondary_color", label: "Secondary" },
                      { field: "background_color", label: "Background" },
                      { field: "text_color", label: "Text" },
                      { field: "button_text_color", label: "Button Text" },
                      { field: "accent_color", label: "Accent" },
                    ].map(({ field, label }) => (
                      <Field key={field} label={label}>
                        <div className="flex items-center gap-2">
                          <input type="color"
                            value={(editBranding as Record<string, string>)[field] || "#ffffff"}
                            onChange={(e) => updateEdit(field, e.target.value)}
                            className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0" />
                          <input value={(editBranding as Record<string, string>)[field] || ""}
                            onChange={(e) => updateEdit(field, e.target.value)}
                            placeholder="#ffffff" className={cn(inputCls, "flex-1")} />
                        </div>
                      </Field>
                    ))}
                  </div>
                  {/* Color preview */}
                  <div className="rounded-xl p-4 text-center mt-2"
                    style={{ background: editBranding.background_color || "#09090b", color: editBranding.text_color || "#fff", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm font-bold mb-2">{editBranding.brand_name || "Brand Preview"}</p>
                    <button className="px-5 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: editBranding.primary_color || "#D9FC67", color: editBranding.button_text_color || "#000" }}>
                      Book Now
                    </button>
                  </div>
                </section>

                {/* ─ Page Content ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Page Content
                  </p>
                  <Field label="Booking Page Title">
                    <input value={editBranding.booking_page_title || ""} onChange={(e) => updateEdit("booking_page_title", e.target.value)}
                      placeholder="Book Your Podcast Studio Session" className={inputCls} />
                  </Field>
                  <Field label="Booking Page Description">
                    <textarea value={editBranding.booking_page_description || ""} onChange={(e) => updateEdit("booking_page_description", e.target.value)}
                      rows={2} placeholder="Describe the booking experience…" className={cn(inputCls, "resize-none")} />
                  </Field>
                </section>

                {/* ─ Contact & Social ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Contact & Social
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact Email">
                      <input type="email" value={editBranding.contact_email || ""} onChange={(e) => updateEdit("contact_email", e.target.value)}
                        placeholder="hello@studio.com" className={inputCls} />
                    </Field>
                    <Field label="Contact Phone">
                      <input value={editBranding.contact_phone || ""} onChange={(e) => updateEdit("contact_phone", e.target.value)}
                        placeholder="+91 98765 43210" className={inputCls} />
                    </Field>
                    <Field label="Address" className="col-span-2">
                      <input value={editBranding.contact_address || ""} onChange={(e) => updateEdit("contact_address", e.target.value)}
                        placeholder="123 Studio Lane, Mumbai" className={inputCls} />
                    </Field>
                    {[
                      { field: "website_url", label: "Website" },
                      { field: "instagram_url", label: "Instagram" },
                      { field: "twitter_url", label: "Twitter / X" },
                      { field: "linkedin_url", label: "LinkedIn" },
                      { field: "youtube_url", label: "YouTube" },
                    ].map(({ field, label }) => (
                      <Field key={field} label={label}>
                        <input value={(editBranding as Record<string, string>)[field] || ""}
                          onChange={(e) => updateEdit(field, e.target.value)}
                          placeholder={`https://...`} className={inputCls} />
                      </Field>
                    ))}
                  </div>
                </section>

                {/* ─ Domain ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5" /> Domain & URLs
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="URL Mode">
                      <select value={editBranding.url_mode || "slug"} onChange={(e) => updateEdit("url_mode", e.target.value)} className={inputCls}>
                        <option value="slug">Path Slug (/p/slug)</option>
                        <option value="subdomain">Subdomain (slug.podx.com)</option>
                        <option value="custom_domain">Custom Domain</option>
                      </select>
                    </Field>
                    <Field label="Subdomain">
                      <div className="flex">
                        <input value={editBranding.subdomain || ""}
                          onChange={(e) => updateEdit("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="mystudio" className={cn(inputCls, "rounded-r-none")} />
                        <span className="flex items-center px-2 bg-white/5 border border-l-0 border-white/10 rounded-r-xl text-white/30 text-xs whitespace-nowrap">.podx.com</span>
                      </div>
                    </Field>
                    <Field label="Custom Domain" className="col-span-2">
                      <input value={editBranding.custom_domain || ""} onChange={(e) => updateEdit("custom_domain", e.target.value.toLowerCase())}
                        placeholder="booking.yourstudio.com" className={inputCls} />
                    </Field>
                    <Field label="Domain Verified" hint="Admin override">
                      <div className="flex items-center gap-3 h-10">
                        <button
                          onClick={() => updateEdit("domain_verified", !editBranding.domain_verified)}
                          className={cn("relative w-10 h-5 rounded-full transition-colors",
                            editBranding.domain_verified ? "bg-[#D9FC67]" : "bg-white/10"
                          )}>
                          <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            editBranding.domain_verified ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                        <span className="text-sm text-white/60">{editBranding.domain_verified ? "Verified" : "Not verified"}</span>
                      </div>
                    </Field>
                  </div>
                </section>

                {/* ─ Email Branding ─ */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email Branding
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sender Name">
                      <input value={editBranding.email_sender_name || ""} onChange={(e) => updateEdit("email_sender_name", e.target.value)}
                        placeholder="Mumbai Podcast Hub" className={inputCls} />
                    </Field>
                    <Field label="Reply-to Email">
                      <input type="email" value={editBranding.email_sender_address || ""} onChange={(e) => updateEdit("email_sender_address", e.target.value)}
                        placeholder="bookings@studio.com" className={inputCls} />
                    </Field>
                    <Field label="Email Footer Text" className="col-span-2">
                      <textarea value={editBranding.email_footer_text || ""} onChange={(e) => updateEdit("email_footer_text", e.target.value)}
                        rows={2} placeholder="Thank you for booking…" className={cn(inputCls, "resize-none")} />
                    </Field>
                  </div>
                </section>

                {/* ─ Admin controls ─ */}
                <section className="space-y-3 pt-2 border-t border-white/5">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Status Controls
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "is_published", label: "Published" },
                      { field: "is_whitelabel_enabled", label: "WL Enabled" },
                      { field: "admin_disabled", label: "Admin Disabled" },
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-sm text-white/70">{label}</span>
                        <button
                          onClick={() => updateEdit(field, !(editBranding as Record<string, boolean>)[field])}
                          className={cn("relative w-9 h-5 rounded-full transition-colors",
                            (editBranding as Record<string, boolean>)[field] ? "bg-[#D9FC67]" : "bg-white/10"
                          )}>
                          <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            (editBranding as Record<string, boolean>)[field] ? "translate-x-4" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Bottom save button */}
                <div className="pt-4 sticky bottom-0 bg-[#0f0f0f] pb-2">
                  {editError && (
                    <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{editError}
                    </p>
                  )}
                  <Button onClick={saveEditBranding} disabled={editSaving}
                    className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {editSaving ? "Saving…" : editSaved ? "Saved ✓" : "Save All Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Tab: Studios ── */}
            {drawerTab === "studios" && (
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white/40" />
                  <p className="text-sm font-medium text-white">Partner Studios</p>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{partnerStudios.length}</span>
                  <button onClick={() => {
                    setStudiosLoading(true);
                    fetch(`/api/admin/studios?owner_id=${selectedPartner.partner_id}`)
                      .then((r) => r.json())
                      .then(({ studios }) => setPartnerStudios(studios || []))
                      .catch(console.error)
                      .finally(() => setStudiosLoading(false));
                  }} className="ml-auto text-white/30 hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {studiosLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                  </div>
                ) : partnerStudios.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No studios found for this partner.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {partnerStudios.map((studio) => (
                      <div key={studio.id} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                          studio.is_active ? "bg-green-400" : studio.review_status === "suspended" ? "bg-red-400" : "bg-yellow-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{studio.name}</p>
                          <p className="text-white/40 text-xs capitalize">{studio.city} · {studio.review_status?.replace(/_/g, " ")}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {studio.is_active ? (
                            <button onClick={() => toggleStudio(studio, "suspend")}
                              disabled={actionLoading === `studio-${studio.id}`}
                              title="Suspend" className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                              {actionLoading === `studio-${studio.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <button onClick={() => toggleStudio(studio, "activate")}
                              disabled={actionLoading === `studio-${studio.id}`}
                              title="Activate" className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors">
                              {actionLoading === `studio-${studio.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Notes ── */}
            {drawerTab === "notes" && (
              <div className="p-6 space-y-4 flex-1">
                <p className="text-xs text-white/40">Internal admin notes — not visible to the partner.</p>
                <AdminNotes
                  key={selectedPartner.id}
                  initial={selectedPartner.admin_notes || ""}
                  onSave={savePartnerNotes}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYOUT DETAIL DRAWER ───────────────────────────────── */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedPayout(null)}>
          <div className="bg-[#0f0f0f] border-l border-white/10 w-full max-w-md h-full overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Payout Request</h3>
              <button onClick={() => setSelectedPayout(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-white/5 rounded-xl space-y-2 text-sm">
              {[
                { label: "Partner", value: selectedPayout.profiles?.business_name || selectedPayout.users?.email },
                { label: "Amount", value: `₹${selectedPayout.payout_amount.toLocaleString()}` },
                { label: "Bookings", value: selectedPayout.booking_count },
                { label: "Method", value: selectedPayout.payment_method },
                { label: "Status", value: selectedPayout.status },
                { label: "Requested", value: new Date(selectedPayout.created_at).toLocaleDateString() },
                { label: "Reference", value: selectedPayout.reference_number || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white capitalize">{value}</span>
                </div>
              ))}
            </div>
            {(selectedPayout.status === "pending" || selectedPayout.status === "processing") && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-sm font-medium text-white">Process Payout</p>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Reference Number</label>
                  <input value={payoutActionData.reference_number}
                    onChange={(e) => setPayoutActionData((d) => ({ ...d, reference_number: e.target.value }))}
                    placeholder="UTR / Transaction ID"
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Notes</label>
                  <input value={payoutActionData.notes}
                    onChange={(e) => setPayoutActionData((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className={inputCls} />
                </div>
                <div className="flex gap-2">
                  {selectedPayout.status === "pending" && (
                    <Button onClick={() => processPayoutUpdate(selectedPayout, "processing")}
                      disabled={actionLoading === selectedPayout.id} size="sm"
                      className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20">
                      {actionLoading === selectedPayout.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Mark Processing
                    </Button>
                  )}
                  <Button onClick={() => processPayoutUpdate(selectedPayout, "paid")}
                    disabled={actionLoading === selectedPayout.id} size="sm"
                    className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">
                    {actionLoading === selectedPayout.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Mark Paid
                  </Button>
                  <Button onClick={() => processPayoutUpdate(selectedPayout, "failed")}
                    disabled={actionLoading === selectedPayout.id} size="sm"
                    className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                    Failed
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Notes sub-component ─────────────────────────────────────────────

function AdminNotes({ initial, onSave }: { initial: string; onSave: (v: string) => Promise<void> }) {
  const [notes, setNotes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="space-y-3">
      <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} rows={6}
        placeholder="Internal notes about this partner (not visible to them)…"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50 resize-none"
      />
      <Button onClick={save} disabled={saving} size="sm"
        className="bg-white/5 text-white border border-white/10 hover:bg-white/10">
        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
        {saved ? "Saved!" : "Save Notes"}
      </Button>
    </div>
  );
}
