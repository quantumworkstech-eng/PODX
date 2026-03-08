"use client";

import { useEffect, useState } from "react";
import { Building2, Star, DollarSign, TrendingUp, Plus, X, RefreshCw, Mail, ExternalLink } from "lucide-react";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add partner modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addFields, setAddFields] = useState({ full_name: "", email: "", phone: "" });

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    setAddSuccess(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addFields, role: "partner" }),
    });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddError(data.error || "Failed to create partner"); return; }
    setAddSuccess(`Partner account created for ${addFields.email}. They can now sign in and list studios.`);
    setAddFields({ full_name: "", email: "", phone: "" });
  };

  useEffect(() => {
    fetch("/api/admin/studios")
      .then((r) => r.json())
      .then((d) => {
        // Group studios by owner
        const studios = d.studios || [];
        const partnerMap: Record<string, any> = {};
        studios.forEach((s: any) => {
          const key = s.owner_email;
          if (!partnerMap[key]) {
            partnerMap[key] = {
              email: s.owner_email,
              name: s.owner_name,
              studios: [],
            };
          }
          partnerMap[key].studios.push(s);
        });
        setPartners(Object.values(partnerMap));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-green-500/10 text-green-400";
    if (status === "pending_review") return "bg-yellow-500/10 text-yellow-400";
    if (status === "suspended") return "bg-red-500/10 text-red-400";
    return "bg-white/5 text-white/40";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Partner Management</h2>
          <p className="text-white/40 text-sm">{partners.length} registered studio partners</p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setAddError(null); setAddSuccess(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#D9FC67] text-black hover:bg-[#E8FF8A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : partners.length === 0 ? (
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-16 text-center text-white/40">No partners found</div>
      ) : (
        <div className="grid gap-4">
          {partners.map((partner) => (
            <div key={partner.email} className="bg-[#18181b] border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{partner.name || partner.email}</p>
                    <p className="text-white/40 text-sm">{partner.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      <span>{partner.studios.length} studio{partner.studios.length !== 1 ? "s" : ""}</span>
                      <span>•</span>
                      <span>{partner.studios.filter((s: any) => s.review_status === "approved").length} approved</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {partner.studios.map((studio: any) => (
                    <span key={studio.id} className={`px-2.5 py-1 rounded-full text-xs ${statusColor(studio.review_status)}`}>
                      {studio.name}
                    </span>
                  ))}
                  <a
                    href={`mailto:${partner.email}`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Email partner"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a
                    href={`/admin/studios?search=${encodeURIComponent(partner.email)}`}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="View studios"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Partner Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h3 className="text-white font-semibold text-lg">Add New Partner</h3>
                <p className="text-white/40 text-xs mt-0.5">Creates a partner account — they can then list studios</p>
              </div>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPartner} className="p-6 space-y-4">
              {addError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{addError}</div>
              )}
              {addSuccess ? (
                <div className="space-y-4">
                  <div className="px-4 py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{addSuccess}</div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setAddOpen(false); setAddSuccess(null); }}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Close</button>
                    <button type="button" onClick={() => { setAddSuccess(null); }}
                      className="flex-1 px-4 py-2.5 bg-[#D9FC67] text-black hover:bg-[#E8FF8A] rounded-xl text-sm font-semibold">Add Another</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Full Name</label>
                    <input value={addFields.full_name} onChange={(e) => setAddFields(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" placeholder="Studio Owner Name" />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Email Address *</label>
                    <input required type="email" value={addFields.email} onChange={(e) => setAddFields(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" placeholder="partner@studio.com" />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Phone</label>
                    <input type="tel" value={addFields.phone} onChange={(e) => setAddFields(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20" placeholder="+91 98765 43210" />
                  </div>
                  <p className="text-white/30 text-xs">Account will be created with the <span className="text-purple-400">partner</span> role. Partner can sign in via Google and immediately access the partner dashboard to list studios.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">Cancel</button>
                    <button type="submit" disabled={addSaving}
                      className="flex-1 px-4 py-2.5 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                      {addSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Partner
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
