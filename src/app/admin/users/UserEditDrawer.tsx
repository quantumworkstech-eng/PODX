"use client";

import { useEffect, useState } from "react";
import {
  X, User, Mail, Phone, Calendar, Shield, Building2, Ban, CheckCircle,
  RefreshCw, Save, ExternalLink, Clock, ChevronRight, AlertCircle,
} from "lucide-react";

const roleColors: Record<string, string> = {
  admin:   "bg-red-500/10 text-red-400 border-red-500/20",
  partner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  user:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const statusColor = (s: string) => {
  if (s === "approved")      return "bg-green-500/10 text-green-400 border-green-500/20";
  if (s === "pending_review") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (s === "suspended")     return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-white/5 text-white/40 border-white/10";
};

interface Props {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function UserEditDrawer({ userId, onClose, onSaved }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "bookings" | "studios">("profile");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      setData(json);
      setEditName(json.user?.profiles?.full_name || "");
      setEditPhone(json.user?.profiles?.phone || "");
      setEditRole(json.user?.role || "user");
      // Show studios tab if partner
      if ((json.user?.studio_count || 0) > 0) setTab("profile");
    } catch {
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_profile", full_name: editName, phone: editPhone }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save profile"); return; }
    flash("Profile saved");
    fetchUser();
    onSaved();
  };

  const handleRoleChange = async (newRole: string) => {
    setActionLoading("role");
    setError(null);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_role", role: newRole }),
    });
    setActionLoading(null);
    setEditRole(newRole);
    flash("Role updated");
    fetchUser();
    onSaved();
  };

  const handleBanToggle = async () => {
    const isBanned = !data?.user?.email_verified;
    setActionLoading("ban");
    setError(null);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isBanned ? "unban" : "ban" }),
    });
    setActionLoading(null);
    flash(isBanned ? "User unbanned" : "User banned");
    fetchUser();
    onSaved();
  };

  const user = data?.user;
  const bookings: any[] = data?.bookings || [];
  const isPartner = (user?.studio_count || 0) > 0 || user?.roles?.includes("partner");
  const isBanned = user && !user.email_verified;

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "bookings", label: `Bookings (${bookings.length})` },
    ...(isPartner ? [{ id: "studios", label: `Studios (${user?.studio_count || 0})` }] : []),
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#09090b] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-lg">Edit User</h2>
            <p className="text-white/40 text-xs mt-0.5">ID: {userId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center text-white/40">User not found</div>
        ) : (
          <>
            {/* User identity card */}
            <div className="px-6 py-5 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                  {(user.profiles?.full_name || user.email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{user.profiles?.full_name || "—"}</p>
                  <p className="text-white/50 text-sm truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {user.roles?.map((r: string) => (
                      <span key={r} className={`px-2 py-0.5 rounded-full text-xs border ${roleColors[r] || "bg-white/5 text-white/50 border-white/10"}`}>{r}</span>
                    ))}
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${isBanned ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                      {isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-semibold text-sm">{bookings.length}</p>
                  <p className="text-white/40 text-xs">Bookings</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-semibold text-sm capitalize">{user.auth_provider || "email"}</p>
                  <p className="text-white/40 text-xs">Provider</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-semibold text-sm">{new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  <p className="text-white/40 text-xs">Joined</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 flex-shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                    tab === t.id
                      ? "border-[#D9FC67] text-[#D9FC67]"
                      : "border-transparent text-white/40 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* Alerts */}
              {(error || successMsg) && (
                <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                  error ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"
                }`}>
                  {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  {error || successMsg}
                </div>
              )}

              {tab === "profile" && (
                <div className="p-6 space-y-6">
                  {/* Edit profile fields */}
                  <div className="space-y-4">
                    <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Profile Information</h3>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Full name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          value={user.email}
                          disabled
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white/40 text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </button>
                  </div>

                  <div className="border-t border-white/5" />

                  {/* Role */}
                  <div className="space-y-3">
                    <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Role</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["user", "partner", "admin"].map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          disabled={actionLoading === "role"}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                            editRole === r
                              ? roleColors[r] || "bg-white/10 text-white border-white/20"
                              : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {actionLoading === "role" && editRole !== r ? <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" /> : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5" />

                  {/* Account actions */}
                  <div className="space-y-3">
                    <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">Account Status</h3>
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${isBanned ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/10"}`}>
                      <div>
                        <p className={`text-sm font-medium ${isBanned ? "text-red-400" : "text-white"}`}>{isBanned ? "Account Banned" : "Account Active"}</p>
                        <p className="text-white/40 text-xs mt-0.5">{isBanned ? "User cannot sign in" : "User can sign in normally"}</p>
                      </div>
                      <button
                        onClick={handleBanToggle}
                        disabled={actionLoading === "ban"}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isBanned
                            ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {actionLoading === "ban" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        {isBanned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === "bookings" && (
                <div className="p-6">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-white/30">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((b: any) => (
                        <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{b.studios?.name || "Studio"}</p>
                            <p className="text-white/40 text-xs mt-0.5">
                              {b.booking_number && <span className="mr-2">#{b.booking_number}</span>}
                              {b.start_time ? new Date(b.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-xs border capitalize ${
                              b.status === "confirmed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                              b.status === "completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              b.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>{b.status}</span>
                            <span className="text-white text-sm font-medium">₹{Number(b.total_price).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "studios" && (
                <div className="p-6">
                  <p className="text-white/40 text-xs mb-4">Studios owned by this partner</p>
                  <a
                    href={`/admin/studios?search=${encodeURIComponent(user.email)}`}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 text-sm hover:bg-purple-500/20 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    View {user.studio_count} Studio{user.studio_count !== 1 ? "s" : ""} in Studio Manager
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Clock className="w-3.5 h-3.5" />
                Joined {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
