"use client";

import { IndianRupee, CreditCard, FileText, Download, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "./UpcomingBookings";

interface BillingSectionProps {
  bookings: BookingData[];
}

export function BillingSection({ bookings }: BillingSectionProps) {
  // confirmed = paid but session upcoming; completed = session done; both are charged
  const paidBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalSpent = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const averagePerSession = paidBookings.length > 0 ? Math.round(totalSpent / paidBookings.length) : 0;

  const invoices = paidBookings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((b, index) => ({
      id: `INV-${String(index + 1).padStart(4, "0")}`,
      bookingId: b.id,
      date: b.createdAt,
      amount: b.totalPrice,
      studio: b.studio.name,
      status: b.status === "completed" ? "paid" : "paid",
    }));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-[#D9FC67]" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-white">₹{totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Average per Session</p>
          <p className="text-3xl font-bold text-white">₹{averagePerSession.toLocaleString()}</p>
        </div>

        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm mb-1">Total Invoices</p>
          <p className="text-3xl font-bold text-white">{invoices.length}</p>
        </div>
      </div>

      <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Invoice History</h3>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Invoice</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Studio</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-4">
                      <p className="text-white font-medium font-mono text-sm">{invoice.id}</p>
                      <p className="text-white/30 text-xs font-mono mt-0.5">{invoice.bookingId}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white/70">{invoice.studio}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white/70">
                        {invoice.date
                          ? new Date(invoice.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-semibold">₹{invoice.amount.toLocaleString("en-IN")}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        Paid
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const content = `Invoice: ${invoice.id}\nBooking: ${invoice.bookingId}\nStudio: ${invoice.studio}\nDate: ${new Date(invoice.date).toLocaleDateString("en-IN")}\nAmount: ₹${invoice.amount.toLocaleString("en-IN")}\nStatus: Paid`;
                            const blob = new Blob([content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${invoice.id}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          title="Download invoice"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
