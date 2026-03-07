"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, RefreshCw, X, Send, Users, User, ChevronLeft, ChevronRight } from "lucide-react";

const TYPES = ["all", "admin_message", "booking", "payment", "studio", "review"];

const typeColors: Record<string, string> = {
  admin_message: "bg-red-500/10 text-red-400 border-red-500/20",
  booking: "bg-[#D9FC67]/10 text-[#D9FC67] border-[#D9FC67]/20",
  payment: "bg-green-500/10 text-green-400 border-green-500/20",
  studio: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  review: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  users?: { email: string };
}

interface ComposeForm {
  target: "all" | "user";
  targetEmail: string;
  type: string;
  title: string;
  content: string;
  actionUrl: string;
}

const emptyForm: ComposeForm = {
  target: "all",
  targetEmail: "",
  type: "admin_message",
  title: "",
  content: "",
  actionUrl: "",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState<ComposeForm>(emptyForm);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number } | null>(null);

  const fetchNotifications = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    fetch(`/api/admin/notifications?${params}`)
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, [page, typeFilter]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendResult(null);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: form.target,
        targetEmail: form.targetEmail,
        type: form.type,
        title: form.title,
        content: form.content,
        actionUrl: form.actionUrl,
      }),
    });
    const data = await res.json();
    setSendLoading(false);
    if (res.ok) {
      setSendResult({ sent: data.sent });
      setForm(emptyForm);
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-white/40 text-sm">{total.toLocaleString()} platform notifications</p>
        </div>
        <button
          onClick={() => { setComposeOpen(true); setSendResult(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Send Notification
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              typeFilter === t
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-white/5 text-white/50 hover:text-white border border-transparent"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Notification</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-white/40">No notifications found</td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-white text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-white/40 text-xs mt-0.5 truncate">{notif.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/60 text-xs font-mono">{notif.users?.email || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border capitalize ${typeColors[notif.type] || "bg-white/10 text-white/40 border-white/10"}`}>
                        {notif.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${notif.is_read ? "bg-white/5 text-white/30 border-white/10" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                        {notif.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/40 text-xs">{new Date(notif.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/40 text-sm">Page {page} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D9FC67]/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#D9FC67]" />
                </div>
                <h3 className="text-white font-semibold">Send Notification</h3>
              </div>
              <button onClick={() => setComposeOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendResult ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <Send className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Notification Sent!</p>
                  <p className="text-white/40 text-sm mt-1">Delivered to {sendResult.sent} user{sendResult.sent !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => { setComposeOpen(false); setSendResult(null); }}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="p-6 space-y-4">
                {/* Target */}
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Send To</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, target: "all" }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${form.target === "all" ? "bg-[#D9FC67]/10 border-[#D9FC67]/30 text-[#D9FC67]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                    >
                      <Users className="w-4 h-4" />
                      All Users
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, target: "user" }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${form.target === "user" ? "bg-[#D9FC67]/10 border-[#D9FC67]/30 text-[#D9FC67]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                    >
                      <User className="w-4 h-4" />
                      Specific User
                    </button>
                  </div>
                </div>

                {form.target === "user" && (
                  <div>
                    <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">User Email *</label>
                    <input
                      required
                      type="email"
                      value={form.targetEmail}
                      onChange={(e) => setForm((f) => ({ ...f, targetEmail: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                      placeholder="user@example.com"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                    >
                      {["admin_message", "booking", "payment", "studio", "review"].map((t) => (
                        <option key={t} value={t} className="bg-[#18181b] capitalize">{t.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Action URL</label>
                    <input
                      value={form.actionUrl}
                      onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                      placeholder="/dashboard (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                    placeholder="Notification title..."
                  />
                </div>

                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Message *</label>
                  <textarea
                    required
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
                    placeholder="Notification message..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setComposeOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendLoading}
                    className="flex-1 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
