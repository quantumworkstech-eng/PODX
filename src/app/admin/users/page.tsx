"use client";

import { useEffect, useState } from "react";
import { Search, Shield, Ban, RefreshCw, ChevronDown, Eye, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROLES = ["all", "podcaster", "studio_owner", "admin", "editor"];

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  studio_owner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  podcaster: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  editor: "bg-[#D9FC67]/10 text-[#D9FC67] border-[#D9FC67]/20",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);

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

  const handleAction = async (userId: string, action: string, role?: string) => {
    setActionLoading(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, role }),
    });
    setActionLoading(null);
    setShowRoleModal(null);
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
        <div className="flex gap-2 flex-wrap">
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
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
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
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-white/40">
                    <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-white/40">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.full_name || "—"}</p>
                          <p className="text-white/40 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length === 0 ? (
                          <span className="text-white/30 text-xs">No role</span>
                        ) : (
                          user.roles.map((role: string) => (
                            <span key={role} className={`px-2 py-0.5 rounded-full text-xs border ${roleColors[role] || "bg-white/5 text-white/50 border-white/10"}`}>
                              {role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/50 text-sm capitalize">{user.auth_provider || "email"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/40 text-sm">
                        {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowRoleModal(user.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-[#D9FC67] transition-colors"
                          title="Change Role"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(user.id, user.email_verified ? "ban" : "unban")}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                          title={user.email_verified ? "Ban User" : "Unban User"}
                        >
                          {actionLoading === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Change User Role</h3>
            <div className="space-y-2">
              {["podcaster", "studio_owner", "admin", "editor"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleAction(showRoleModal, "change_role", role)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white capitalize text-sm transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRoleModal(null)}
              className="mt-4 w-full px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
