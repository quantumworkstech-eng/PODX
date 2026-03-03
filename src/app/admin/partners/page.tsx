"use client";

import { useEffect, useState } from "react";
import { Building2, Star, DollarSign, TrendingUp } from "lucide-react";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div>
        <h2 className="text-xl font-bold text-white">Partner Management</h2>
        <p className="text-white/40 text-sm">{partners.length} registered studio partners</p>
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
                <div className="flex gap-2 flex-wrap">
                  {partner.studios.map((studio: any) => (
                    <span key={studio.id} className={`px-2.5 py-1 rounded-full text-xs ${statusColor(studio.review_status)}`}>
                      {studio.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
