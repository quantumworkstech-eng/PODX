"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe, Search, Eye, EyeOff, AlertCircle, CheckCircle,
  ExternalLink, ChevronDown, DollarSign, BarChart3, X,
  Shield, Loader2, RefreshCw, Download, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhiteLabelPartner {
  id: string;
  partner_id: string;
  brand_name: string;
  partner_slug: string;
  logo_url: string;
  primary_color: string;
  custom_domain: string;
  subdomain: string;
  domain_verified: boolean;
  url_mode: string;
  is_published: boolean;
  is_whitelabel_enabled: boolean;
  admin_disabled: boolean;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  users: { email: string };
  profiles: { full_name: string; business_name: string };
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
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [payoutActionData, setPayoutActionData] = useState({ reference_number: "", notes: "" });

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

  const togglePartner = async (partner: WhiteLabelPartner, field: "admin_disabled" | "is_published") => {
    setActionLoading(partner.partner_id);
    try {
      await fetch("/api/admin/whitelabel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: partner.partner_id,
          [field]: !partner[field],
        }),
      });
      fetchPartners();
      if (selectedPartner?.partner_id === partner.partner_id) {
        setSelectedPartner((prev) => prev ? { ...prev, [field]: !prev[field] } : null);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const savePartnerNotes = async (partner: WhiteLabelPartner, notes: string) => {
    await fetch("/api/admin/whitelabel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_id: partner.partner_id, admin_notes: notes }),
    });
    setSelectedPartner((prev) => prev ? { ...prev, admin_notes: notes } : null);
    fetchPartners();
  };

  const processPayoutUpdate = async (payout: Payout, status: string) => {
    setActionLoading(payout.id);
    try {
      await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout_id: payout.id,
          status,
          reference_number: payoutActionData.reference_number,
          notes: payoutActionData.notes,
        }),
      });
      setSelectedPayout(null);
      setPayoutActionData({ reference_number: "", notes: "" });
      fetchPayouts();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">White-Label Management</h1>
          <p className="text-white/40">Manage partner branding platforms and payouts</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: "partners", label: "Partners", icon: Globe },
          { id: "payouts", label: "Payouts", icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "partners" | "payouts")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-[#D9FC67] text-black" : "text-white/50 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PARTNERS TAB ─────────────────────── */}
      {activeTab === "partners" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand name, slug, domain…"
                className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex gap-1 p-1 bg-[#141414] rounded-xl border border-white/5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    statusFilter === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
              <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No white-label partners found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className={cn(
                    "flex items-center gap-4 p-4 bg-[#141414] border rounded-xl transition-all cursor-pointer hover:border-white/10",
                    partner.admin_disabled ? "border-red-500/20 opacity-60" : "border-white/5"
                  )}
                  onClick={() => setSelectedPartner(partner)}
                >
                  {/* Color swatch */}
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-black font-bold text-sm"
                    style={{ background: partner.primary_color || "#D9FC67" }}
                  >
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
                          <Shield className="w-2.5 h-2.5" />Domain Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-white/40 text-xs">{partner.users?.email}</span>
                      {partner.partner_slug && (
                        <span className="text-white/30 text-xs">/p/{partner.partner_slug}</span>
                      )}
                      {partner.custom_domain && (
                        <span className="text-white/30 text-xs">{partner.custom_domain}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {partner.partner_slug && (
                      <a
                        href={`/p/${partner.partner_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-white/30 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePartner(partner, "admin_disabled"); }}
                      disabled={actionLoading === partner.partner_id}
                      className={cn(
                        "p-2 rounded-lg transition-colors text-sm",
                        partner.admin_disabled ? "text-green-400 hover:bg-green-400/10" : "text-red-400 hover:bg-red-400/10"
                      )}
                      title={partner.admin_disabled ? "Enable" : "Disable"}
                    >
                      {actionLoading === partner.partner_id
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

      {/* ── PAYOUTS TAB ─────────────────────── */}
      {activeTab === "payouts" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending", value: payoutSummary.total_pending, color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { label: "Processing", value: payoutSummary.total_processing, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Paid Out", value: payoutSummary.total_paid, color: "text-green-400", bg: "bg-green-400/10" },
            ].map((s) => (
              <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>₹{(s.value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-[#141414] rounded-xl border border-white/5 w-fit">
            {["", "pending", "processing", "paid", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setPayoutStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                  payoutStatusFilter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}
              >
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
                <div
                  key={payout.id}
                  className="flex items-center gap-4 p-4 bg-[#141414] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-all"
                  onClick={() => setSelectedPayout(payout)}
                >
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

      {/* ── PARTNER DETAIL DRAWER ─────────────────────── */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}>
          <div className="bg-[#141414] border-l border-white/10 w-full max-w-md h-full overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Partner Details</h3>
              <button onClick={() => setSelectedPartner(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brand preview */}
            <div className="p-4 rounded-xl" style={{ background: selectedPartner.primary_color + "15", border: `1px solid ${selectedPartner.primary_color}30` }}>
              <div className="flex items-center gap-3">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt="" className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-black" style={{ background: selectedPartner.primary_color }}>
                    {selectedPartner.brand_name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{selectedPartner.brand_name}</p>
                  <p className="text-white/40 text-xs">{selectedPartner.users?.email}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {[
                { label: "Slug", value: selectedPartner.partner_slug ? `/p/${selectedPartner.partner_slug}` : "—" },
                { label: "URL Mode", value: selectedPartner.url_mode || "slug" },
                { label: "Subdomain", value: selectedPartner.subdomain || "—" },
                { label: "Custom Domain", value: selectedPartner.custom_domain || "—" },
                { label: "Domain Verified", value: selectedPartner.domain_verified ? "Yes" : "No" },
                { label: "Published", value: selectedPartner.is_published ? "Yes" : "No" },
                { label: "Created", value: new Date(selectedPartner.created_at).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Admin actions */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-sm font-medium text-white">Admin Actions</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => togglePartner(selectedPartner, "is_published")}
                  disabled={actionLoading === selectedPartner.partner_id}
                  size="sm"
                  className={cn("flex-1", selectedPartner.is_published ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20")}
                >
                  {selectedPartner.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  onClick={() => togglePartner(selectedPartner, "admin_disabled")}
                  disabled={actionLoading === selectedPartner.partner_id}
                  size="sm"
                  className={cn("flex-1", selectedPartner.admin_disabled ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}
                >
                  {selectedPartner.admin_disabled ? "Enable" : "Disable"}
                </Button>
              </div>
              {selectedPartner.partner_slug && (
                <a
                  href={`/p/${selectedPartner.partner_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#D9FC67] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live Page
                </a>
              )}
            </div>

            {/* Admin notes */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <p className="text-sm font-medium text-white">Admin Notes</p>
              <AdminNotes
                initial={selectedPartner.admin_notes || ""}
                onSave={(notes) => savePartnerNotes(selectedPartner, notes)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PAYOUT DETAIL DRAWER ─────────────────────── */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPayout(null)}>
          <div className="bg-[#141414] border-l border-white/10 w-full max-w-md h-full overflow-y-auto p-6 space-y-5"
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
                <div key={label} className="flex justify-between">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white capitalize">{value}</span>
                </div>
              ))}
            </div>

            {/* Process form */}
            {(selectedPayout.status === "pending" || selectedPayout.status === "processing") && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <p className="text-sm font-medium text-white">Process Payout</p>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Reference Number</label>
                  <input
                    value={payoutActionData.reference_number}
                    onChange={(e) => setPayoutActionData((d) => ({ ...d, reference_number: e.target.value }))}
                    placeholder="UTR / Transaction ID"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Notes</label>
                  <input
                    value={payoutActionData.notes}
                    onChange={(e) => setPayoutActionData((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
                <div className="flex gap-2">
                  {selectedPayout.status === "pending" && (
                    <Button
                      onClick={() => processPayoutUpdate(selectedPayout, "processing")}
                      disabled={actionLoading === selectedPayout.id}
                      size="sm"
                      className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                    >
                      {actionLoading === selectedPayout.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Mark Processing
                    </Button>
                  )}
                  <Button
                    onClick={() => processPayoutUpdate(selectedPayout, "paid")}
                    disabled={actionLoading === selectedPayout.id}
                    size="sm"
                    className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                  >
                    {actionLoading === selectedPayout.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Mark Paid
                  </Button>
                  <Button
                    onClick={() => processPayoutUpdate(selectedPayout, "failed")}
                    disabled={actionLoading === selectedPayout.id}
                    size="sm"
                    className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  >
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

function AdminNotes({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [notes, setNotes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  };
  return (
    <div className="space-y-2">
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
        placeholder="Internal admin notes about this partner…"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50 resize-none"
      />
      <Button onClick={save} disabled={saving} size="sm" className="bg-white/5 text-white border border-white/10 hover:bg-white/10">
        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
        Save Notes
      </Button>
    </div>
  );
}
