"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, Search, RefreshCw, Plus, X, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown,
  Calendar, Users, TrendingUp, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  tier: "basic" | "pro" | "enterprise";
  price: number;
  billing_cycle?: string;
  commission_pct?: number;
  max_studios?: number | null;
  whitelabel_enabled?: boolean;
  api_access?: boolean;
}

interface Subscription {
  id: string;
  partner_id: string;
  status: "active" | "grace_period" | "expired" | "cancelled";
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  grace_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  plan: Plan;
  partner: { id: string; email: string };
}

interface Summary {
  active: number;
  grace_period: number;
  expired: number;
  cancelled: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  active: { label: "Active", cls: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  grace_period: { label: "Grace Period", cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  expired: { label: "Expired", cls: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
  cancelled: { label: "Cancelled", cls: "text-white/40 bg-white/5 border-white/10", icon: XCircle },
};

const TIER_CONFIG: Record<string, string> = {
  basic: "text-white/60 bg-white/5 border-white/10",
  pro: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  enterprise: "text-[#D9FC67] bg-[#D9FC67]/10 border-[#D9FC67]/20",
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Main component ────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<Summary>({ active: 0, grace_period: 0, expired: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ status: "", plan_id: "", current_period_end: "", notes: "" });

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [partners, setPartners] = useState<{ id: string; email: string }[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [assignFields, setAssignFields] = useState({ partner_id: "", plan_id: "", billing_cycle: "monthly", period_months: "1" });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const r = await fetch(`/api/admin/subscriptions?${params}`);
      const d = await r.json();
      setSubscriptions(d.subscriptions || []);
      setSummary(d.summary || { active: 0, grace_period: 0, expired: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Load plans + partners for assign modal
  useEffect(() => {
    if (!assignOpen) return;
    Promise.all([
      fetch("/api/subscription/plans").then(r => r.json()),
      fetch("/api/admin/partners").then(r => r.json()),
    ]).then(([plansData, partnersData]) => {
      setPlans(plansData.plans || []);
      const list = (partnersData.partners || []).map((p: { id: string; email: string }) => ({ id: p.id, email: p.email }));
      setPartners(list);
    }).catch(console.error);
  }, [assignOpen]);

  const syncStatus = async () => {
    setSyncing(true);
    await fetch("/api/admin/subscriptions/sync-status");
    await load();
    setSyncing(false);
  };

  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    setEditError(null);
    setEditFields({
      status: sub.status,
      plan_id: sub.plan.id,
      current_period_end: sub.current_period_end.slice(0, 10),
      notes: "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editFields.status,
          plan_id: editFields.plan_id !== editing.plan.id ? editFields.plan_id : undefined,
          current_period_end: editFields.current_period_end ? new Date(editFields.current_period_end).toISOString() : undefined,
          notes: editFields.notes || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to update");
      setEditing(null);
      await load();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSaving(true);
    setAssignError(null);
    setAssignSuccess(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: assignFields.partner_id,
          plan_id: assignFields.plan_id,
          billing_cycle: assignFields.billing_cycle,
          period_months: parseInt(assignFields.period_months, 10),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to assign");
      const partnerEmail = partners.find(p => p.id === assignFields.partner_id)?.email || "";
      const planName = plans.find(p => p.id === assignFields.plan_id)?.name || "";
      setAssignSuccess(`Assigned ${planName} to ${partnerEmail} successfully.`);
      setAssignFields({ partner_id: "", plan_id: "", billing_cycle: "monthly", period_months: "1" });
      await load();
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setAssignSaving(false);
    }
  };

  const filtered = subscriptions.filter(s =>
    !search ||
    s.partner?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.plan?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
            <p className="text-white/40 text-sm">Manage partner subscription plans</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncStatus}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            Sync Status
          </button>
          <button
            onClick={() => { setAssignOpen(true); setAssignError(null); setAssignSuccess(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9FC67] text-black text-sm font-semibold hover:bg-[#E8FF8A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Assign Subscription
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active", value: summary.active, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Grace Period", value: summary.grace_period, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Expired", value: summary.expired, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Cancelled", value: summary.cancelled, icon: AlertTriangle, color: "text-white/40", bg: "bg-white/5" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-[#111113] border border-white/10 rounded-xl">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or plan…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#111113] border border-white/10 rounded-xl text-sm text-white/70 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="grace_period">Grace Period</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Partner</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Period</th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Billing</th>
                <th className="px-5 py-3.5 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-white/30 text-sm">
                    No subscriptions found
                  </td>
                </tr>
              ) : filtered.map(sub => {
                const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG.expired;
                const StatusIcon = sc.icon;
                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-white truncate max-w-[180px]">{sub.partner?.email || sub.partner_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-white font-medium">{sub.plan?.name}</span>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border w-fit", TIER_CONFIG[sub.plan?.tier] || TIER_CONFIG.basic)}>
                          {sub.plan?.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", sc.cls)}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-white/50 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{fmt(sub.current_period_start)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/30">
                          <TrendingUp className="w-3 h-3" />
                          <span>Ends {fmt(sub.current_period_end)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs space-y-0.5">
                        <span className="text-white/60 capitalize">{sub.billing_cycle}</span>
                        {sub.plan?.price !== undefined && (
                          <div className="text-white/30">₹{sub.plan.price.toLocaleString("en-IN")}/mo</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEdit(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#D9FC67]/10 text-white/50 hover:text-[#D9FC67] border border-white/10 hover:border-[#D9FC67]/30 text-xs font-medium transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h3 className="text-white font-semibold text-lg">Edit Subscription</h3>
                <p className="text-white/40 text-xs mt-0.5">{editing.partner?.email}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{editError}</div>
              )}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Status</label>
                <select
                  value={editFields.status}
                  onChange={e => setEditFields(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20"
                >
                  <option value="active">Active</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Period End Date</label>
                <input
                  type="date"
                  value={editFields.current_period_end}
                  onChange={e => setEditFields(f => ({ ...f, current_period_end: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20"
                />
                <p className="text-white/30 text-xs mt-1">Grace period will be set to 7 days after end date</p>
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Admin Notes (optional)</label>
                <textarea
                  value={editFields.notes}
                  onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Reason for change…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex-1 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Subscription Modal */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h3 className="text-white font-semibold text-lg">Assign Subscription</h3>
                <p className="text-white/40 text-xs mt-0.5">Grant a plan to a partner — cancels their existing active subscription</p>
              </div>
              <button onClick={() => setAssignOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={assign} className="p-6 space-y-4">
              {assignError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{assignError}</div>
              )}
              {assignSuccess ? (
                <div className="space-y-4">
                  <div className="px-4 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{assignSuccess}</div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setAssignOpen(false); setAssignSuccess(null); }}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Close</button>
                    <button type="button" onClick={() => setAssignSuccess(null)}
                      className="flex-1 px-4 py-2.5 bg-[#D9FC67] text-black hover:bg-[#E8FF8A] rounded-xl text-sm font-semibold">Assign Another</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Partner *</label>
                    <div className="relative">
                      <select
                        required
                        value={assignFields.partner_id}
                        onChange={e => setAssignFields(f => ({ ...f, partner_id: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20 appearance-none"
                      >
                        <option value="">Select a partner…</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.email}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Plan *</label>
                    <div className="relative">
                      <select
                        required
                        value={assignFields.plan_id}
                        onChange={e => setAssignFields(f => ({ ...f, plan_id: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20 appearance-none"
                      >
                        <option value="">Select a plan…</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — ₹{p.price?.toLocaleString("en-IN")}/mo ({p.tier})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Billing Cycle</label>
                      <div className="relative">
                        <select
                          value={assignFields.billing_cycle}
                          onChange={e => setAssignFields(f => ({ ...f, billing_cycle: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20 appearance-none"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Duration (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={assignFields.period_months}
                        onChange={e => setAssignFields(f => ({ ...f, period_months: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-white/20"
                      />
                    </div>
                  </div>
                  <p className="text-white/30 text-xs">Any existing active subscription will be cancelled and replaced.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setAssignOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
                    <button type="submit" disabled={assignSaving}
                      className="flex-1 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                      {assignSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Assign Plan
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
