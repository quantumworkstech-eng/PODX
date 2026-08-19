"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollText, Download, Search, X, ChevronLeft, ChevronRight,
  Users as UsersIcon, CalendarDays, AlertTriangle, Activity, RefreshCw, Eye,
} from "lucide-react";
import { actionTone, humanizeAction } from "@/lib/audit/actions";
import { AuditLogDetail, type AuditLogRow } from "./AuditLogDetail";

type Facets = {
  actions: string[];
  modules: string[];
  roles: string[];
  users: { email: string; name: string }[];
};

const toneClasses: Record<string, string> = {
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

/** "2 minutes ago" — the exact timestamp stays available on hover and in details. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

const selectClass =
  "bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/40";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [summary, setSummary] = useState({ total: 0, today: 0, activeUsers: 0, failed: 0 });
  const [facets, setFacets] = useState<Facets>({ actions: [], modules: [], roles: [], users: [] });
  const [migrationMissing, setMigrationMissing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // `searchInput` is what the user types; `search` is the debounced value that
  // actually triggers a request.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [user, setUser] = useState("all");
  const [role, setRole] = useState("all");
  const [action, setAction] = useState("all");
  const [module, setModule] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (user !== "all") p.set("user", user);
    if (role !== "all") p.set("role", role);
    if (action !== "all") p.set("action", action);
    if (module !== "all") p.set("module", module);
    if (status !== "all") p.set("status", status);
    return p;
  }, [search, from, to, user, role, action, module, status]);

  const hasFilters = params.toString().length > 0;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams(params);
      query.set("page", String(page));
      try {
        const res = await fetch(`/api/admin/audit-logs?${query}`, { signal: controller.signal });
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(d.error || "Failed to load audit logs"); return; }
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setPageSize(d.pageSize || 25);
        setSummary(d.summary || { total: 0, today: 0, activeUsers: 0, failed: 0 });
        setFacets(d.facets || { actions: [], modules: [], roles: [], users: [] });
        setMigrationMissing(Boolean(d.migrationMissing));
      } catch (e) {
        if (!cancelled && (e as Error).name !== "AbortError") setError("Failed to load audit logs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [params, page, reloadToken]);

  const clearFilters = useCallback(() => {
    setSearchInput(""); setSearch(""); setFrom(""); setTo("");
    setUser("all"); setRole("all"); setAction("all"); setModule("all"); setStatus("all");
    setPage(1);
  }, []);

  const exportCsv = () => {
    // Export respects exactly the filters currently applied.
    window.location.href = `/api/admin/audit-logs/export?${params.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cards = [
    { label: "Total Events", value: summary.total, icon: Activity, color: "text-blue-400" },
    { label: "Events Today", value: summary.today, icon: CalendarDays, color: "text-green-400" },
    { label: "Active Users", value: summary.activeUsers, icon: UsersIcon, color: "text-purple-400" },
    { label: "Failed Actions", value: summary.failed, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-red-400" /> Audit Logs
          </h1>
          <p className="text-white/40 text-sm mt-1">Track all activity and changes across your Podcast Studio.</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors self-start"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {migrationMissing && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-2 text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The <code className="font-mono text-xs">audit_logs</code> table does not exist yet. Run{" "}
            <code className="font-mono text-xs">npm run db:migrate-audit-logs</code> to start recording activity.
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#18181b] border border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs text-white/40">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className={`text-2xl font-semibold mt-2 ${c.color}`}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search user, email, description or record ID"
            className="w-full bg-[#0f0f11] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-2">
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={selectClass} aria-label="From date" />
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={selectClass} aria-label="To date" />
          <select value={user} onChange={(e) => { setUser(e.target.value); setPage(1); }} className={selectClass} aria-label="User">
            <option value="all">All users</option>
            {facets.users.map((u) => <option key={u.email} value={u.email}>{u.name}</option>)}
          </select>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className={selectClass} aria-label="Role">
            <option value="all">All roles</option>
            {facets.roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={selectClass} aria-label="Action">
            <option value="all">All actions</option>
            {facets.actions.map((a) => <option key={a} value={a}>{humanizeAction(a)}</option>)}
          </select>
          <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} className={selectClass} aria-label="Module">
            <option value="all">All modules</option>
            {facets.modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass} aria-label="Status">
            <option value="all">All statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between gap-3 text-red-400 text-sm">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</span>
          <button onClick={() => setReloadToken((n) => n + 1)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium hover:bg-red-500/20">
            Retry
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-[#18181b]">
              <tr className="border-b border-white/5 text-left">
                {["Date & Time", "User", "Email", "Role", "Action", "Module", "Description", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-medium text-white/40 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-3 bg-white/5 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <ScrollText className="w-8 h-8 text-white/15 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">{hasFilters ? "No activity matches these filters." : "No activity recorded yet."}</p>
                    {hasFilters && <button onClick={clearFilters} className="text-xs text-red-400 hover:underline mt-2">Clear filters</button>}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs text-white/60" title={new Date(log.created_at).toLocaleString()}>
                        {relativeTime(log.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[10px] font-semibold text-white/60 shrink-0">
                          {initials(log.user_name, log.user_email)}
                        </span>
                        <span className="text-sm text-white truncate max-w-[120px]">{log.user_name || "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs text-white/50 truncate block max-w-[170px]">{log.user_email || "—"}</span></td>
                    <td className="px-4 py-4"><span className="text-xs text-white/50 capitalize">{log.user_role || "—"}</span></td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[11px] font-medium border whitespace-nowrap ${toneClasses[actionTone(log.action)]}`}>
                        {humanizeAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs text-white/60">{log.module}</span></td>
                    <td className="px-4 py-4"><span className="text-xs text-white/60 truncate block max-w-[240px]" title={log.description}>{log.description}</span></td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[11px] font-medium border ${log.status === "FAILED" ? toneClasses.danger : toneClasses.success}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => setDetailId(log.id)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-xs transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile / tablet cards — the table would otherwise overflow the page */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#18181b] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="h-3 bg-white/5 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="bg-[#18181b] border border-white/5 rounded-2xl p-10 text-center">
            <ScrollText className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">{hasFilters ? "No activity matches these filters." : "No activity recorded yet."}</p>
          </div>
        ) : (
          logs.map((log) => (
            <button key={log.id} onClick={() => setDetailId(log.id)} className="w-full text-left bg-[#18181b] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[10px] font-semibold text-white/60 shrink-0">
                    {initials(log.user_name, log.user_email)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{log.user_name || "System"}</p>
                    <p className="text-[11px] text-white/35 truncate">{log.user_email || "—"}</p>
                  </div>
                </div>
                <span className="text-[11px] text-white/35 shrink-0" title={new Date(log.created_at).toLocaleString()}>
                  {relativeTime(log.created_at)}
                </span>
              </div>
              <p className="text-xs text-white/60 mb-3 line-clamp-2">{log.description}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${toneClasses[actionTone(log.action)]}`}>
                  {humanizeAction(log.action)}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/50 border border-white/10">{log.module}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${log.status === "FAILED" ? toneClasses.danger : toneClasses.success}`}>
                  {log.status}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-white/40">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors" aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/50 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors" aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setReloadToken((n) => n + 1)} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white transition-colors" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {detailId && <AuditLogDetail id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
