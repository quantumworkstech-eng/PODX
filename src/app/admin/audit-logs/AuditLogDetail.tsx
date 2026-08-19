"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { actionTone, humanizeAction } from "@/lib/audit/actions";

export type AuditLogRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  module: string;
  description: string;
  record_type: string | null;
  record_id: string | null;
  record_name: string | null;
  status: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  browser?: string | null;
  device?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
};

const toneClasses: Record<string, string> = {
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (value === "") return "(empty)";
  return String(value);
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/30 mb-1">{label}</p>
      <p className={`text-sm text-white/85 break-words ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
    </div>
  );
}

export function AuditLogDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [log, setLog] = useState<AuditLogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/audit-logs/${id}`);
        const d = await res.json();
        if (cancelled) return;
        if (d.log) setLog(d.log);
        else setError(d.error || "Could not load this entry");
      } catch {
        if (!cancelled) setError("Could not load this entry");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Escape closes the drawer, matching the rest of the admin panel's modals.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Only fields that actually changed are stored, so the union of both keys is
  // exactly the change set.
  const changedKeys = Array.from(
    new Set([...Object.keys(log?.old_values || {}), ...Object.keys(log?.new_values || {})])
  ).sort();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="bg-[#18181b] border-l border-white/10 w-full max-w-xl h-full flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Audit log details"
      >
        <header className="flex items-start justify-between gap-4 p-5 border-b border-white/5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Audit Entry</h2>
            <p className="text-xs text-white/40 mt-0.5 font-mono truncate">{id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-6 h-6 text-red-400 animate-spin" />
            </div>
          ) : error || !log ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error || "Not found"}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${toneClasses[actionTone(log.action)]}`}>
                  {humanizeAction(log.action)}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10">
                  {log.module}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${log.status === "FAILED" ? toneClasses.danger : toneClasses.success}`}>
                  {log.status}
                </span>
              </div>

              <p className="text-sm text-white/85 leading-relaxed">{log.description}</p>

              {log.error_message && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 break-words">{log.error_message}</p>
                </div>
              )}

              <section className="grid grid-cols-2 gap-4">
                <Field label="User" value={log.user_name} />
                <Field label="Email" value={log.user_email} />
                <Field label="Role" value={log.user_role} />
                <Field label="Date & time" value={new Date(log.created_at).toLocaleString()} />
              </section>

              <section className="grid grid-cols-2 gap-4 pt-1 border-t border-white/5">
                <div className="col-span-2 pt-4" />
                <Field label="Record type" value={log.record_type} />
                <Field label="Record name" value={log.record_name} />
                <Field label="Record ID" value={log.record_id} mono />
                <Field label="Browser" value={log.browser} />
                <Field label="Device" value={log.device} />
              </section>

              {changedKeys.length === 0 && /_(UPDATED|CHANGED)$/.test(log.action) && (
                <section className="pt-4 border-t border-white/5">
                  <h3 className="text-xs uppercase tracking-wide text-white/30 mb-3">Changes</h3>
                  <p className="text-sm text-white/40 bg-[#0f0f11] border border-white/5 rounded-xl p-3.5">
                    No field values were different — the record was saved without changes.
                  </p>
                </section>
              )}

              {changedKeys.length > 0 && (
                <section className="pt-4 border-t border-white/5">
                  <h3 className="text-xs uppercase tracking-wide text-white/30 mb-3">Changes</h3>
                  <div className="space-y-3">
                    {changedKeys.map((key) => (
                      <div key={key} className="bg-[#0f0f11] border border-white/5 rounded-xl p-3.5">
                        <p className="text-xs font-medium text-white/70 mb-2.5">{key}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                          <div className="flex-1 min-w-0 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                            <p className="text-[10px] uppercase text-red-400/60 mb-1">Previous</p>
                            <pre className="text-red-300/90 whitespace-pre-wrap break-words font-mono">{display(log.old_values?.[key])}</pre>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-white/25 shrink-0 rotate-90 sm:rotate-0 mx-auto sm:mx-0" />
                          <div className="flex-1 min-w-0 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2">
                            <p className="text-[10px] uppercase text-green-400/60 mb-1">New</p>
                            <pre className="text-green-300/90 whitespace-pre-wrap break-words font-mono">{display(log.new_values?.[key])}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <section className="pt-4 border-t border-white/5">
                  <h3 className="text-xs uppercase tracking-wide text-white/30 mb-3">Metadata</h3>
                  <pre className="bg-[#0f0f11] border border-white/5 rounded-xl p-3.5 text-xs text-white/60 font-mono overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
