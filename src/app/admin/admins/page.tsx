"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, X, Shield, ShieldCheck, ShieldOff, Check, AlertCircle, Pencil } from "lucide-react";
import { AdminEditDrawer } from "./AdminEditDrawer";

interface Admin {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  added_by_email: string;
  created_at: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove confirm
  const [removeId, setRemoveId] = useState<string | null>(null);

  // Edit drawer
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);

  const fetchAdmins = () => {
    setLoading(true);
    fetch("/api/admin/admins")
      .then((r) => r.json())
      .then((d) => { setAdmins(d.admins || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error || "Failed to add admin");
      setInviteLoading(false);
      return;
    }
    setInviteLoading(false);
    setInviteOpen(false);
    setInviteEmail("");
    fetchAdmins();
  };

  const handleRemove = async (id: string) => {
    setActionLoading(`remove-${id}`);
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to remove admin");
      setActionLoading(null);
      setRemoveId(null);
      return;
    }
    setActionLoading(null);
    setRemoveId(null);
    fetchAdmins();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{total} admins on this platform</p>
        </div>
        <button
          onClick={() => { setInviteOpen(true); setInviteError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 text-sm font-medium">Admin Access</p>
          <p className="text-blue-400/60 text-xs mt-0.5">
            Added admins receive login credentials via the admin login page. They must set a password on first login.
            Super admins have full platform control including adding/removing other admins.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Admin</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Added By</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Added</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-white/40">No admins found</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{admin.email.split("@")[0]}</p>
                          <p className="text-white/40 text-xs">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${
                        admin.role === "super_admin"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${admin.is_active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {admin.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/50 text-xs">{admin.added_by_email || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/40 text-xs">{new Date(admin.created_at).toLocaleDateString("en-IN")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditAdmin(admin)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#D9FC67]/10 text-white/50 hover:text-[#D9FC67] border border-white/10 hover:border-[#D9FC67]/30 text-xs font-medium transition-all"
                          title="Edit admin"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setRemoveId(admin.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-white font-semibold">Add Admin</h3>
              <button onClick={() => setInviteOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Email Address *</label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                >
                  <option value="admin" className="bg-[#18181b]">Admin</option>
                  <option value="super_admin" className="bg-[#18181b]">Super Admin</option>
                </select>
              </div>
              <p className="text-white/30 text-xs">
                The user will be able to log in at /admin/login. They'll set a password on their first login.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setInviteOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2.5 bg-[#D9FC67] text-black rounded-xl text-sm font-semibold hover:bg-[#c9ec57] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirm */}
      {removeId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-2">Remove Admin</h3>
            <p className="text-white/50 text-sm mb-6">
              This will permanently revoke admin access and remove their login credentials.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveId(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleRemove(removeId)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drawer */}
      {editAdmin && (
        <AdminEditDrawer
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={() => { fetchAdmins(); setEditAdmin(null); }}
          onRemoveRequest={(id) => { setEditAdmin(null); setRemoveId(id); }}
        />
      )}
    </div>
  );
}
