"use client";

import { useState } from "react";
import {
  X, Shield, ShieldCheck, ShieldOff, RefreshCw, Trash2,
  AlertCircle, CheckCircle, Calendar, UserCheck,
} from "lucide-react";

interface Admin {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  added_by_email: string;
  created_at: string;
}

interface Props {
  admin: Admin;
  onClose: () => void;
  onSaved: () => void;
  onRemoveRequest: (id: string) => void;
}

export function AdminEditDrawer({ admin, onClose, onSaved, onRemoveRequest }: Props) {
  const [role, setRole] = useState(admin.role);
  const [isActive, setIsActive] = useState(admin.is_active);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const patch = async (payload: Record<string, unknown>, key: string, successText: string) => {
    setActionLoading(key);
    setError(null);
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setActionLoading(null);
    if (!res.ok) { setError("Update failed"); return; }
    flash(successText);
    onSaved();
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    patch({ role: newRole }, "role", "Role updated");
  };

  const handleToggleActive = () => {
    const next = !isActive;
    setIsActive(next);
    patch({ is_active: next }, "status", next ? "Access restored" : "Access revoked");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#09090b] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Edit Admin</h2>
              <p className="text-white/40 text-xs">{admin.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alerts */}
          {(error || successMsg) && (
            <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
              error ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"
            }`}>
              {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {error || successMsg}
            </div>
          )}

          {/* Identity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium">Admin Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Email</span>
                <span className="text-white text-sm font-medium">{admin.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Added by</span>
                <span className="text-white/60 text-sm">{admin.added_by_email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Added on</span>
                <span className="text-white/60 text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(admin.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-3">
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium">Role</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "admin", label: "Admin", desc: "Standard admin access", icon: Shield },
                { value: "super_admin", label: "Super Admin", desc: "Full platform control", icon: ShieldCheck },
              ].map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleRoleChange(value)}
                  disabled={actionLoading === "role"}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    role === value
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs opacity-60 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            {actionLoading === "role" && (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating role…
              </div>
            )}
          </div>

          {/* Access Status */}
          <div className="space-y-3">
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium">Access Status</h3>
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              isActive ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
            }`}>
              <div>
                <p className={`text-sm font-medium ${isActive ? "text-green-400" : "text-red-400"}`}>
                  {isActive ? "Access Active" : "Access Revoked"}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  {isActive ? "Admin can log in to the panel" : "Login is blocked"}
                </p>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={actionLoading === "status"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20"
                    : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                }`}
              >
                {actionLoading === "status"
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                {isActive ? "Revoke" : "Restore"}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="space-y-3">
            <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium">Danger Zone</h3>
            <div className="border border-red-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-red-400 text-sm font-medium">Remove Admin</p>
                <p className="text-white/40 text-xs mt-0.5">Permanently removes login access</p>
              </div>
              <button
                onClick={() => { onClose(); onRemoveRequest(admin.id); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
