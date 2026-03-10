"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Building2, Calendar, DollarSign,
  FileText, CheckCircle, Clock, XCircle, Edit2, Save, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  total_bookings: number;
  total_spent: number;
  first_booking_at: string;
  last_booking_at: string;
  source: string;
  is_blocked: boolean;
  notes: string;
  tags: string[];
}

interface Booking {
  id: string;
  booking_number: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  studios: { name: string; city: string };
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
}

const statusColor: Record<string, string> = {
  confirmed: "text-green-400 bg-green-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const statusIcon: Record<string, typeof CheckCircle> = {
  confirmed: CheckCircle,
  completed: CheckCircle,
  pending: Clock,
  cancelled: XCircle,
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Client>>({});

  useEffect(() => {
    fetch(`/api/partner/clients/${id}`)
      .then((r) => r.json())
      .then(({ client: c, bookings: b, invoices: inv }) => {
        setClient(c);
        setBookings(b || []);
        setInvoices(inv || []);
        setEditData({ client_name: c.client_name, client_phone: c.client_phone, client_company: c.client_company, notes: c.notes });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/partner/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const { client: updated } = await res.json();
      setClient(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">Client not found</p>
        <Button onClick={() => router.back()} className="mt-4 bg-white/5 text-white">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </button>

      {/* Client header */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D9FC67]/10 flex items-center justify-center">
              <span className="text-[#D9FC67] text-2xl font-bold">
                {client.client_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              {editing ? (
                <input
                  value={editData.client_name || ""}
                  onChange={(e) => setEditData((d) => ({ ...d, client_name: e.target.value }))}
                  className="text-xl font-bold text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1 focus:outline-none focus:border-[#D9FC67]/50"
                />
              ) : (
                <h2 className="text-xl font-bold text-white">{client.client_name}</h2>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/40 text-sm flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{client.client_email}
                </span>
                {client.source === "whitelabel" && (
                  <span className="text-xs text-[#D9FC67] bg-[#D9FC67]/10 px-2 py-0.5 rounded-full">White-label client</span>
                )}
                {client.is_blocked && (
                  <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Blocked</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="border-white/10 text-white/60">
                  <X className="w-4 h-4" />
                </Button>
                <Button onClick={save} disabled={saving} size="sm" className="bg-[#D9FC67] text-black">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="border-white/10 text-white/60">
                <Edit2 className="w-4 h-4 mr-2" />Edit
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          {[
            { label: "Total Bookings", value: client.total_bookings, icon: Calendar, color: "text-[#D9FC67]" },
            { label: "Total Spent", value: `₹${(client.total_spent || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
            { label: "First Booking", value: client.first_booking_at ? new Date(client.first_booking_at).toLocaleDateString() : "—", icon: Calendar, color: "text-white/60" },
            { label: "Last Booking", value: client.last_booking_at ? new Date(client.last_booking_at).toLocaleDateString() : "—", icon: Clock, color: "text-white/60" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-white/40 text-xs mb-1">{stat.label}</p>
              <p className={cn("font-semibold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Editable fields */}
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
            {[
              { field: "client_phone", label: "Phone", placeholder: "+91 98765 43210" },
              { field: "client_company", label: "Company", placeholder: "Acme Podcasts" },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="text-sm text-white/60 block mb-1">{label}</label>
                <input
                  value={(editData as Record<string, string>)[field] || ""}
                  onChange={(e) => setEditData((d) => ({ ...d, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#D9FC67]/50"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-sm text-white/60 block mb-1">Internal Notes</label>
              <textarea
                value={editData.notes || ""}
                onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#D9FC67]/50 resize-none"
              />
            </div>
          </div>
        )}

        {/* Notes (view mode) */}
        {!editing && client.notes && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 mb-1">Notes</p>
            <p className="text-white/70 text-sm">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Booking history */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Booking History</h3>
        {bookings.length === 0 ? (
          <p className="text-white/40 text-sm">No bookings with this client yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => {
              const StatusIcon = statusIcon[booking.status] || Clock;
              return (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className={cn("p-2 rounded-lg", statusColor[booking.status] || "text-white/40 bg-white/5")}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{booking.booking_number || booking.id.slice(0, 8)}</p>
                    <p className="text-white/40 text-xs">
                      {booking.studios?.name} · {new Date(booking.start_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">₹{(booking.total_price || 0).toLocaleString()}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", statusColor[booking.status] || "text-white/40 bg-white/5")}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-white/40 text-sm">No invoices generated yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="p-2 rounded-lg bg-[#D9FC67]/10">
                  <FileText className="w-4 h-4 text-[#D9FC67]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{inv.invoice_number}</p>
                  <p className="text-white/40 text-xs">{new Date(inv.invoice_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">₹{(inv.total_amount || 0).toLocaleString()}</p>
                  <span className={cn("text-xs capitalize", inv.status === "paid" ? "text-green-400" : "text-yellow-400")}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
