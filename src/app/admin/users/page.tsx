"use client";

import { useEffect, useState } from "react";
import { Search, Pencil, Plus, X, RefreshCw } from "lucide-react";
import { UserEditDrawer } from "./UserEditDrawer";

const ROLES = ["all", "user", "partner", "admin"];

const roleColors: Record<string, string> = {
  admin:   "bg-red-500/10 text-red-400 border-red-500/20",
  partner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  user:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Add user modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addFields, setAddFields] = useState({ full_name: "", email: "", phone: "", role: "user" });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addFields),
    });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddError(data.error || "Failed to create user"); return; }
    setAddOpen(false);
    setAddFields({ full_name: "", email: "", phone: "", role: "user" });
    fetchUsers();
  };

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (roleFilter !== "all") params.set("role", roleFilter);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total users</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                roleFilter === r
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/50 hover:text-white border border-transparent"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => { setAddOpen(true); setAddError(null); }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D9FC67] text-black hover:bg-[#E8FF8A] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Roles</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Provider</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-white/40">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-white/40">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.full_name || "—"}</p>
                          <p className="text-white/40 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap items-center">
                        {user.roles.length === 0 ? (
                          <span className="text-white/30 text-xs">No role</span>
                        ) : (
                          user.roles.map((role: string) => (
                            <span key={role} className={`px-2 py-0.5 rounded-full text-xs border ${roleColors[role] || "bg-white/5 text-white/50 border-white/10"}`}>
                              {role}
                            </span>
                          ))
                        )}
                        {user.studio_count > 0 && (
                          <span className="text-white/30 text-xs ml-1">{user.studio_count} studio{user.studio_count > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/50 text-sm capitalize">{user.auth_provider || "email"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${user.email_verified ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {user.email_verified ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/40 text-sm">
                        {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditUserId(user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#D9FC67]/10 text-white/50 hover:text-[#D9FC67] border border-white/10 hover:border-[#D9FC67]/30 text-xs font-medium transition-all"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/40 text-sm">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:text-white disabled:opacity-30 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <h3 className="text-white font-semibold text-lg">Add New User</h3>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {addError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{addError}</div>
              )}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Full Name</label>
                <input value={addFields.full_name} onChange={(e) => setAddFields(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20" placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Email Address *</label>
                <input required type="email" value={addFields.email} onChange={(e) => setAddFields(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20" placeholder="rahul@example.com" />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Phone</label>
                <input type="tel" value={addFields.phone} onChange={(e) => setAddFields(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Role</label>
                <select value={addFields.role} onChange={(e) => setAddFields(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 appearance-none">
                  <option value="user" className="bg-[#18181b]">User</option>
                  <option value="partner" className="bg-[#18181b]">Partner</option>
                  <option value="admin" className="bg-[#18181b]">Admin</option>
                </select>
              </div>
              <p className="text-white/30 text-xs">User will be created without a password. They can sign in via Google OAuth or request a password reset.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={addSaving}
                  className="flex-1 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                  {addSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Drawer */}
      {editUserId && (
        <UserEditDrawer
          userId={editUserId}
          onClose={() => setEditUserId(null)}
          onSaved={() => fetchUsers()}
        />
      )}
    </div>
  );
}
