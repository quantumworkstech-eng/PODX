"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Inbox, RefreshCw, AlertCircle, Check, Clock, X, Search,
  Send, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";

type Log = {
  id: string;
  event_key: string;
  audience: string;
  priority: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: "queued" | "sent" | "failed" | "skipped";
  attempts: number;
  last_error: string | null;
  provider_message_id: string | null;
  booking_id: string | null;
  created_at: string;
  sent_at: string | null;
};

const statusStyles: Record<string, string> = {
  sent: "bg-green-500/10 text-green-400 border-green-500/20",
  queued: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  skipped: "bg-white/5 text-white/40 border-white/10",
};

const audienceStyles: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-400",
  partner: "bg-purple-500/10 text-purple-400",
  admin: "bg-orange-500/10 text-orange-400",
};

const statusIcons: Record<string, React.ElementType> = {
  sent: Check, queued: Clock, failed: X, skipped: AlertCircle,
};

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [eventKeys, setEventKeys] = useState<string[]>([]);
  const [migrationMissing, setMigrationMissing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [audience, setAudience] = useState("all");
  const [eventKey, setEventKey] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [preview, setPreview] = useState<(Log & { html?: string; metadata?: unknown }) | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  // Refetch trigger for the refresh button and post-resend reloads.
  const [reloadToken, setReloadToken] = useState(0);
  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (status !== "all") params.set("status", status);
      if (audience !== "all") params.set("audience", audience);
      if (eventKey !== "all") params.set("event_key", eventKey);
      if (query) params.set("q", query);

      try {
        const res = await fetch(`/api/admin/email-logs?${params}`, { signal: controller.signal });
        const d = await res.json();
        // A slower earlier request must not overwrite newer results.
        if (cancelled) return;
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setPageSize(d.pageSize || 25);
        setSummary(d.summary || {});
        setEventKeys(d.eventKeys || []);
        setMigrationMissing(Boolean(d.migrationMissing));
      } catch {
        /* aborted or offline — leave the previous page in place */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, status, audience, eventKey, query, reloadToken]);

  const openPreview = async (log: Log) => {
    setPreview(log);
    setPreviewLoading(true);
    const res = await fetch(`/api/admin/email-logs/${log.id}`);
    const d = await res.json().catch(() => ({}));
    setPreviewLoading(false);
    if (d.log) setPreview(d.log);
  };

  const resend = async (id: string) => {
    setResending(id);
    await fetch(`/api/admin/email-logs/${id}`, { method: "POST" });
    setResending(null);
    refresh();
    if (preview?.id === id) setPreview(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const tiles = [
    { key: "sent", label: "Sent", color: "text-green-400" },
    { key: "queued", label: "Queued", color: "text-yellow-400" },
    { key: "failed", label: "Failed", color: "text-red-400" },
    { key: "skipped", label: "Skipped", color: "text-white/40" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Inbox className="w-5 h-5 text-red-400" /> Email Logs
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {total.toLocaleString()} messages recorded by the notification system.
        </p>
      </div>

      {migrationMissing && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The <code className="font-mono text-xs">email_notifications</code> table does not exist yet.
            Run <code className="font-mono text-xs">npm run db:migrate-email-notifications</code> to start recording email.
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.key} className="bg-[#18181b] border border-white/5 rounded-2xl p-5">
            <p className="text-xs text-white/40">{t.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${t.color}`}>{(summary[t.key] || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setQuery(search); setPage(1); } }}
            placeholder="Search recipient or subject, then press Enter"
            className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40"
          />
        </div>
        <select value={audience} onChange={(e) => { setAudience(e.target.value); setPage(1); }} className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/40">
          <option value="all">All audiences</option>
          <option value="client">Client</option>
          <option value="partner">Partner</option>
          <option value="admin">Admin</option>
        </select>
        <select value={eventKey} onChange={(e) => { setEventKey(e.target.value); setPage(1); }} className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/40 max-w-[220px]">
          <option value="all">All events</option>
          {eventKeys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={refresh} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "sent", "queued", "failed", "skipped"].map((f) => (
          <button key={f} onClick={() => { setStatus(f); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border ${status === f ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/5 text-white/50 hover:text-white border-transparent"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left">
                {["Status", "Event", "Recipient", "Subject", "Sent", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-xs font-medium text-white/40 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-white/30 text-sm">No emails match these filters.</td></tr>
              ) : (
                logs.map((log) => {
                  const Icon = statusIcons[log.status] || AlertCircle;
                  return (
                    <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border capitalize ${statusStyles[log.status]}`}>
                          <Icon className="w-3 h-3" /> {log.status}
                        </span>
                        {log.attempts > 1 && <span className="ml-2 text-[11px] text-white/25">{log.attempts} tries</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-mono text-white/70 whitespace-nowrap">{log.event_key}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium capitalize ${audienceStyles[log.audience] || "bg-white/5 text-white/40"}`}>
                          {log.audience} · {log.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white truncate max-w-[200px]">{log.recipient_email}</p>
                        {log.recipient_name && <p className="text-xs text-white/30 truncate max-w-[200px]">{log.recipient_name}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white/70 truncate max-w-[260px]">{log.subject}</p>
                        {log.last_error && <p className="text-xs text-red-400/70 truncate max-w-[260px] mt-0.5">{log.last_error}</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs text-white/50">{new Date(log.sent_at || log.created_at).toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openPreview(log)} title="Preview" className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => resend(log.id)} disabled={resending === log.id} title="Resend" className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-green-400 transition-colors disabled:opacity-40">
                            {resending === log.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <p className="text-xs text-white/40">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview drawer */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-white/5 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{preview.subject}</p>
                <p className="text-xs text-white/40 mt-1 truncate">
                  {preview.event_key} → {preview.recipient_email}
                </p>
                {preview.provider_message_id && (
                  <p className="text-[11px] text-white/25 mt-1 font-mono break-all">id: {preview.provider_message_id}</p>
                )}
              </div>
              <button onClick={() => setPreview(null)} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {previewLoading ? (
                <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto my-12" />
              ) : preview.html ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={preview.html}
                  className="w-full h-[420px] rounded-xl border border-white/10 bg-black"
                />
              ) : (
                <p className="text-sm text-white/30 text-center py-8">No rendered content stored.</p>
              )}
              {preview.last_error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 break-words">
                  {preview.last_error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => resend(preview.id)} disabled={resending === preview.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50">
                {resending === preview.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Resend this email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
