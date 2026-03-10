"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Search, Plus, Mail, Phone, Building2, Calendar,
  DollarSign, ChevronRight, X, Loader2, AlertCircle, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Client {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  total_bookings: number;
  total_spent: number;
  last_booking_at: string;
  first_booking_at: string;
  source: string;
  is_blocked: boolean;
  tags: string[];
}

export default function PartnerClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [newClient, setNewClient] = useState({ client_name: "", client_email: "", client_phone: "", client_company: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
    fetch(`/api/partner/clients?${params}`)
      .then((r) => r.json())
      .then(({ clients: c, total: t }) => {
        setClients(c || []);
        setTotal(t || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const addClient = async () => {
    if (!newClient.client_name || !newClient.client_email) {
      setAddError("Name and email are required");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/partner/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAddModal(false);
      setNewClient({ client_name: "", client_email: "", client_phone: "", client_company: "", notes: "" });
      fetchClients();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add client");
    } finally {
      setAdding(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-white/40">{total} total client{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, or company…"
          className="w-full bg-[#141414] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
        {search && (
          <button onClick={() => handleSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Client list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white font-medium">{search ? "No clients match your search" : "No clients yet"}</p>
          <p className="text-white/40 text-sm mt-1">
            {search ? "Try a different search term" : "Clients appear here when they book through your white-label site"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/partner/clients/${client.id}`}
                className="flex items-center gap-4 p-4 bg-[#141414] border border-white/5 rounded-xl hover:border-white/10 transition-all group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#D9FC67]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D9FC67] font-semibold text-sm">
                    {client.client_name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{client.client_name}</p>
                    {client.is_blocked && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Blocked</span>
                    )}
                    {client.source === "whitelabel" && (
                      <span className="text-xs text-[#D9FC67] bg-[#D9FC67]/10 px-2 py-0.5 rounded-full hidden sm:inline">White-label</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" />{client.client_email}
                    </span>
                    {client.client_company && (
                      <span className="text-white/40 text-xs hidden sm:flex items-center gap-1">
                        <Building2 className="w-3 h-3" />{client.client_company}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-white font-semibold">{client.total_bookings}</p>
                    <p className="text-white/40 text-xs">bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D9FC67] font-semibold">₹{(client.total_spent || 0).toLocaleString()}</p>
                    <p className="text-white/40 text-xs">total spent</p>
                  </div>
                  {client.last_booking_at && (
                    <div className="text-right hidden lg:block">
                      <p className="text-white/60 text-sm">{new Date(client.last_booking_at).toLocaleDateString()}</p>
                      <p className="text-white/40 text-xs">last booking</p>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-sm">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 text-sm transition-colors">
                  Prev
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 text-sm transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Client</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />{addError}
              </div>
            )}

            <div className="space-y-3">
              {[
                { field: "client_name", label: "Full Name *", type: "text", placeholder: "Rahul Sharma" },
                { field: "client_email", label: "Email *", type: "email", placeholder: "rahul@example.com" },
                { field: "client_phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
                { field: "client_company", label: "Company", type: "text", placeholder: "Acme Podcasts" },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm text-white/60 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(newClient as Record<string, string>)[field]}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-white/60 mb-1">Notes</label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about this client…"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D9FC67]/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 border-white/10 text-white/60">
                Cancel
              </Button>
              <Button onClick={addClient} disabled={adding} className="flex-1 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold">
                {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Client
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
