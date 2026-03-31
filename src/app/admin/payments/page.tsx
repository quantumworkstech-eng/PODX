"use client";

import { useEffect, useState } from "react";
import { RefreshCw, DollarSign, AlertCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  succeeded: "bg-green-500/10 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refundModal, setRefundModal] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [tab, setTab] = useState<"payments" | "refunds">("payments");

  const fetchPayments = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/admin/payments?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setPayments(d.payments || []);
        setRefunds(d.refunds || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [page, statusFilter]);

  const handleRefund = async () => {
    if (!refundModal) return;
    setRefundLoading(true);
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: refundModal.id, amount: refundAmount ? Number(refundAmount) : undefined, reason: refundReason }),
    });
    setRefundLoading(false);
    setRefundModal(null);
    setRefundAmount("");
    setRefundReason("");
    fetchPayments();
  };

  const statusFilters = ["all", "succeeded", "pending", "failed", "refunded"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-white/40 text-sm">{total.toLocaleString()} total transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("payments")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "payments" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-white/50"}`}>
            Payments
          </button>
          <button onClick={() => setTab("refunds")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "refunds" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-white/50"}`}>
            Refunds
          </button>
        </div>
      </div>

      {tab === "payments" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((f) => (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === f ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white/50 hover:text-white border border-transparent"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Transaction</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Studio</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center"><div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-white/40">No payments found</td></tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white text-sm font-mono text-xs">{payment.provider_payment_id || payment.id.slice(0, 8)}</p>
                          <p className="text-white/30 text-xs">{new Date(payment.created_at).toLocaleDateString("en-IN")}</p>
                        </td>
                        <td className="px-6 py-4"><p className="text-white/70 text-sm">{payment.user_name || payment.user_email}</p></td>
                        <td className="px-6 py-4"><p className="text-white/50 text-sm">{payment.studio_name || "—"}</p></td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">₹{Number(payment.amount).toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${statusColors[payment.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {payment.status === "succeeded" && (
                            <button
                              onClick={() => { setRefundModal(payment); setRefundAmount(String(payment.amount)); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs transition-colors"
                            >
                              <DollarSign className="w-3 h-3" /> Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "refunds" && (
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Refund ID</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Reason</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs font-medium uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-white/40">No refunds found</td></tr>
                ) : (
                  refunds.map((refund) => (
                    <tr key={refund.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-6 py-4"><p className="text-white text-xs font-mono">{refund.id.slice(0, 8)}…</p></td>
                      <td className="px-6 py-4"><span className="text-white font-medium">₹{Number(refund.amount).toLocaleString("en-IN")}</span></td>
                      <td className="px-6 py-4"><p className="text-white/50 text-sm">{refund.reason || "—"}</p></td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${statusColors[refund.status] || "bg-white/5 text-white/40 border-white/10"}`}>{refund.status}</span>
                      </td>
                      <td className="px-6 py-4"><p className="text-white/40 text-sm">{new Date(refund.created_at).toLocaleDateString("en-IN")}</p></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-1">Initiate Refund</h3>
            <p className="text-white/40 text-sm mb-4">Payment: {refundModal.provider_payment_id || refundModal.id.slice(0, 8)}</p>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm block mb-1.5">Refund Amount (₹)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">Reason</label>
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRefundModal(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleRefund} disabled={refundLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {refundLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
