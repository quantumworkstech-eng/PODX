"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, CheckCircle2, AlertTriangle, XCircle,
  Sparkles, Building2, Globe, BarChart3, Cpu, ChevronDown, X, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  tier: "basic" | "pro" | "enterprise";
  billing_cycle: "monthly" | "annual";
  price: number;
  max_studios: number | null;
  commission_pct: number;
  whitelabel_enabled: boolean;
  analytics_level: "basic" | "full";
  api_access: boolean;
}

interface Subscription {
  id: string;
  status: "active" | "grace_period" | "expired" | "cancelled";
  billing_cycle: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: Plan;
}

interface PaymentRecord {
  id: string;
  amount: number;
  billing_cycle: string;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  razorpay_order_id?: string;
  plan: { name: string; tier: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TIER_COLORS: Record<string, string> = {
  basic: "text-white/60 bg-white/10",
  pro: "text-blue-300 bg-blue-500/15",
  enterprise: "text-amber-300 bg-amber-500/15",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse: string }> = {
  active: { label: "Active", color: "text-green-400", pulse: "bg-green-400" },
  grace_period: { label: "Grace Period", color: "text-yellow-400", pulse: "bg-yellow-400" },
  expired: { label: "Expired", color: "text-red-400", pulse: "bg-red-400" },
  cancelled: { label: "Cancelled", color: "text-white/40", pulse: "bg-white/30" },
};

const PLAN_FEATURES: { key: keyof Plan; label: string; icon: any }[] = [
  { key: "max_studios", label: "Studios", icon: Building2 },
  { key: "commission_pct", label: "Platform Commission", icon: Sparkles },
  { key: "whitelabel_enabled", label: "White-Label", icon: Globe },
  { key: "analytics_level", label: "Analytics", icon: BarChart3 },
  { key: "api_access", label: "API Access", icon: Cpu },
];

function featureValue(key: keyof Plan, plan: Plan): string {
  switch (key) {
    case "max_studios": return plan.max_studios === null ? "Unlimited" : String(plan.max_studios);
    case "commission_pct": return `${plan.commission_pct}%`;
    case "whitelabel_enabled": return plan.whitelabel_enabled ? "✓" : "—";
    case "analytics_level": return plan.analytics_level === "full" ? "Full" : "Basic";
    case "api_access": return plan.api_access ? "✓" : "—";
    default: return "—";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null); // plan detail modal
  const [resumeLoading, setResumeLoading] = useState<string | null>(null); // payment id being resumed

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subRes, plansRes] = await Promise.all([
      fetch("/api/partner/subscription"),
      fetch("/api/subscription/plans"),
    ]);
    const subData = await subRes.json();
    const plansData = await plansRes.json();
    setSubscription(subData.subscription ?? null);
    setPaymentHistory(subData.paymentHistory ?? []);
    setPlans(plansData.plans ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Razorpay checkout ────────────────────────────────────────────────────────
  const handleCheckout = async (plan: Plan) => {
    setCheckoutLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/partner/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      // Load Razorpay SDK
      await new Promise<void>((resolve) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

      const rp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Yanisa Studio",
        description: `${data.plan.name} Subscription`,
        theme: { color: "#D9FC67" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/partner/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setCheckoutPlan(null);
            if (verifyData.warning) setWarningMsg(verifyData.warning);
            setSuccessMsg(`You're now on the ${data.plan.name} plan!`);
            fetchData();
          } else {
            setErrorMsg(verifyData.error || "Payment verification failed");
          }
        },
      });
      rp.open();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Cancel subscription ──────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelLoading(true);
    const res = await fetch("/api/partner/subscription/cancel", { method: "POST" });
    const data = await res.json();
    setCancelLoading(false);
    setShowCancelModal(false);
    if (res.ok) {
      setSuccessMsg(data.message);
      fetchData();
    } else {
      setErrorMsg(data.error);
    }
  };

  // Resume a pending Razorpay order (use existing order_id instead of creating new one)
  const handleResumePayment = async (payment: PaymentRecord) => {
    if (!payment.razorpay_order_id) return;
    setResumeLoading(payment.id);
    setErrorMsg(null);
    try {
      await new Promise<void>((resolve) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const rp = new (window as any).Razorpay({
        key: keyId,
        amount: payment.amount * 100,
        currency: "INR",
        order_id: payment.razorpay_order_id,
        name: "Yanisa Studios",
        description: `${payment.plan?.name || "Subscription"} Plan`,
        theme: { color: "#D9FC67" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/partner/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setSuccessMsg(`Payment completed! You're now on the ${payment.plan?.name || ""} plan.`);
            fetchData();
          } else {
            setErrorMsg(verifyData.error || "Payment verification failed");
          }
        },
      });
      rp.open();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setResumeLoading(null);
    }
  };

  const filteredPlans = plans.filter((p) => p.billing_cycle === billingCycle);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Alerts ── */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {warningMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{warningMsg}</p>
          <button onClick={() => setWarningMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Current Plan Card ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#D9FC67]" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {subscription ? "Current Plan" : "No Active Subscription"}
              </h2>
              {subscription && (
                <p className="text-white/50 text-sm">
                  Renews {formatDate(subscription.current_period_end)} · {subscription.billing_cycle}
                </p>
              )}
            </div>
          </div>

          {subscription && (() => {
            const sc = STATUS_CONFIG[subscription.status];
            return (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${sc.pulse}`} />
                <span className={`text-sm font-medium ${sc.color}`}>{sc.label}</span>
              </div>
            );
          })()}
        </div>

        {subscription ? (
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-1">Plan</p>
              <p className="text-white font-semibold capitalize">{subscription.plan.tier}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${TIER_COLORS[subscription.plan.tier]}`}>
                {subscription.plan.tier.toUpperCase()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-1">Price</p>
              <p className="text-white font-semibold">{formatPrice(subscription.plan.price)}</p>
              <p className="text-white/40 text-xs">/{subscription.billing_cycle === "annual" ? "year" : "month"}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-white/40 text-xs mb-1">Commission</p>
              <p className="text-white font-semibold">{subscription.plan.commission_pct}%</p>
              <p className="text-white/40 text-xs">platform fee per booking</p>
            </div>
          </div>
        ) : (
          <p className="text-white/50 text-sm mt-4">
            Subscribe to a plan below to list your studios and access partner features.
          </p>
        )}

        {subscription?.cancel_at_period_end && (
          <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Subscription cancels on {formatDate(subscription.current_period_end)} and will not renew.
          </div>
        )}
      </div>

      {/* ── Plan Comparison ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">
            {subscription ? "Change Plan" : "Choose a Plan"}
          </h3>
          {/* Monthly / Annual toggle */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-[#D9FC67] text-black" : "text-white/60 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingCycle === "annual" ? "bg-[#D9FC67] text-black" : "text-white/60 hover:text-white"}`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-400 font-semibold">−17%</span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => {
            const isCurrent =
              subscription?.plan.tier === plan.tier &&
              subscription?.billing_cycle === plan.billing_cycle &&
              subscription.status !== "expired" &&
              subscription.status !== "cancelled";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col transition-all ${
                  isCurrent
                    ? "border-[#D9FC67]/50 bg-[#D9FC67]/5"
                    : plan.tier === "pro"
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[plan.tier]}`}>
                    {plan.tier.toUpperCase()}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-[#D9FC67] font-medium">Current</span>
                  )}
                  {plan.tier === "pro" && !isCurrent && (
                    <span className="text-xs text-blue-300 font-medium">Popular</span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-bold text-white">{formatPrice(plan.price)}</div>
                  <div className="text-white/40 text-xs">/{billingCycle === "annual" ? "year" : "month"}</div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {PLAN_FEATURES.map(({ key, label, icon: Icon }) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-white/50">{label}:</span>
                      <span className="text-white font-medium">{featureValue(key, plan)}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={isCurrent || checkoutLoading}
                  onClick={() => !isCurrent && setSelectedPlan(plan)}
                  className={`w-full rounded-xl font-semibold text-sm ${
                    isCurrent
                      ? "bg-white/10 text-white/40 cursor-default"
                      : plan.tier === "enterprise"
                      ? "bg-amber-400 hover:bg-amber-300 text-black"
                      : plan.tier === "pro"
                      ? "bg-blue-500 hover:bg-blue-400 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {isCurrent ? "Current Plan" : "View Plan Details"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment History ── */}
      {paymentHistory.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Payment History</h3>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Period</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white/70">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="text-white">{p.plan?.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {p.period_start ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "paid" ? "bg-green-500/15 text-green-400" :
                        p.status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                        "bg-red-500/15 text-red-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "pending" && p.razorpay_order_id && (
                        <button
                          onClick={() => handleResumePayment(p)}
                          disabled={resumeLoading === p.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#D9FC67]/10 text-[#D9FC67] hover:bg-[#D9FC67]/20 transition-colors disabled:opacity-50"
                        >
                          {resumeLoading === p.id ? "Opening…" : "Complete Payment"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Cancel Subscription ── */}
      {subscription && !subscription.cancel_at_period_end && subscription.status !== "expired" && subscription.status !== "cancelled" && (
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* ── Plan Detail Modal ── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium mb-2 inline-block ${TIER_COLORS[selectedPlan.tier]}`}>
                  {selectedPlan.tier.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-white">{selectedPlan.name}</h3>
                <p className="text-white/40 text-sm">{formatPrice(selectedPlan.price)} / {selectedPlan.billing_cycle === "annual" ? "year" : "month"}</p>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">What&apos;s included</p>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "Studio Listings", value: selectedPlan.max_studios === null ? "Unlimited" : `Up to ${selectedPlan.max_studios}`, icon: Building2 },
                  { label: "Platform Commission", value: `${selectedPlan.commission_pct}% per booking`, icon: Sparkles },
                  { label: "Analytics", value: selectedPlan.analytics_level === "full" ? "Full analytics (studio performance, top clients, peak hours)" : "Basic analytics (revenue & bookings summary)", icon: BarChart3 },
                  { label: "White-Label Booking Page", value: selectedPlan.whitelabel_enabled ? "Included — custom branded booking link" : "Not included", icon: Globe },
                  { label: "API Access", value: selectedPlan.api_access ? "Full REST API access" : "Not included", icon: Cpu },
                  { label: "Billing Cycle", value: selectedPlan.billing_cycle === "annual" ? "Annual (billed once a year)" : "Monthly (billed every month)", icon: CreditCard },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <Icon className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/60 text-xs">{label}</p>
                      <p className="text-white text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setSelectedPlan(null)} className="flex-1 border border-white/10 text-white/70 hover:text-white">
                Back to Plans
              </Button>
              <Button
                disabled={checkoutLoading}
                onClick={() => { setSelectedPlan(null); handleCheckout(selectedPlan); }}
                className={`flex-1 font-semibold ${
                  selectedPlan.tier === "enterprise" ? "bg-amber-400 hover:bg-amber-300 text-black" :
                  selectedPlan.tier === "pro" ? "bg-blue-500 hover:bg-blue-400 text-white" :
                  "bg-[#D9FC67] hover:bg-[#E8FF8A] text-black"
                }`}
              >
                {checkoutLoading ? "Processing…" : subscription ? "Switch to This Plan" : "Subscribe Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-[#111111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Cancel Subscription?</h3>
            </div>
            <p className="text-white/60 text-sm mb-6">
              Your subscription will remain active until{" "}
              <span className="text-white font-medium">
                {subscription ? formatDate(subscription.current_period_end) : ""}
              </span>
              . After that, your studio listings will be deactivated and features will be locked.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 border border-white/10 text-white/70 hover:text-white"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Subscription
              </Button>
              <Button
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling…" : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
