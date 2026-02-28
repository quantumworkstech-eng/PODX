"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  Edit2,
  Save,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFromLocalStorage, setToLocalStorage } from "@/lib/client-utils";

interface CancellationRule {
  id: string;
  type: "days" | "hours";
  value: number;
  refundPercent: number;
  deductionPercent: number;
}

interface RescheduleRule {
  id: string;
  type: "days" | "hours";
  value: number;
  deductionPercent: number;
}

interface StudioPolicies {
  cancellation: CancellationRule[];
  reschedule: RescheduleRule[];
}

interface Booking {
  id: string;
  studioName: string;
  date: string;
  status: "confirmed" | "pending";
  totalPrice: number;
}

interface PartnerPolicies {
  defaultPolicies: StudioPolicies;
  studioPolicies: Record<string, StudioPolicies>;
}

const PARTNER_POLICIES_KEY = "partner_policies";
const PARTNER_BOOKINGS_KEY = "partner_bookings";

const defaultCancellationRules: CancellationRule[] = [
  { id: "1", type: "days", value: 7, refundPercent: 100, deductionPercent: 0 },
  { id: "2", type: "days", value: 3, refundPercent: 80, deductionPercent: 20 },
  { id: "3", type: "hours", value: 24, refundPercent: 50, deductionPercent: 50 },
  { id: "4", type: "hours", value: 0, refundPercent: 0, deductionPercent: 100 },
];

const defaultRescheduleRules: RescheduleRule[] = [
  { id: "1", type: "days", value: 3, deductionPercent: 0 },
  { id: "2", type: "hours", value: 24, deductionPercent: 10 },
  { id: "3", type: "hours", value: 0, deductionPercent: 25 },
];

const defaultPolicies: PartnerPolicies = {
  defaultPolicies: {
    cancellation: defaultCancellationRules,
    reschedule: defaultRescheduleRules,
  },
  studioPolicies: {},
};

export default function PartnerPoliciesPage() {
  const [policies, setPolicies] = useState<PartnerPolicies>(defaultPolicies);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<string | "default">("default");
  const [showWarning, setShowWarning] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"cancellation" | "reschedule">("cancellation");

  useEffect(() => {
    const stored = getFromLocalStorage(PARTNER_POLICIES_KEY, null);
    if (stored) {
      setPolicies(stored);
    } else {
      setPolicies(defaultPolicies);
    }
  }, []);

  const getCurrentPolicies = (): StudioPolicies => {
    if (selectedStudio === "default") {
      return policies.defaultPolicies;
    }
    return policies.studioPolicies[selectedStudio] || policies.defaultPolicies;
  };

  const getAllStudios = (): { id: string; name: string }[] => {
    const stored = getFromLocalStorage<any[]>("partner_studios", []);
    return stored.map((s: any) => ({ id: s.id, name: s.name }));
  };

  const checkAffectedBookings = () => {
    const bookingsStored = getFromLocalStorage<any[]>(PARTNER_BOOKINGS_KEY, []);
    if (bookingsStored.length > 0) {
      const upcoming = bookingsStored.filter(
        (b: any) => b.status === "confirmed" || b.status === "pending"
      );
      if (upcoming.length > 0) {
        setAffectedBookings(upcoming.slice(0, 3));
        setShowWarning(true);
      }
    }
  };

  const savePolicies = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setToLocalStorage(PARTNER_POLICIES_KEY, policies);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const updateCancellationRules = (rules: CancellationRule[]) => {
    if (selectedStudio === "default") {
      setPolicies((prev) => ({
        ...prev,
        defaultPolicies: { ...prev.defaultPolicies, cancellation: rules },
      }));
    } else {
      setPolicies((prev) => ({
        ...prev,
        studioPolicies: {
          ...prev.studioPolicies,
          [selectedStudio]: {
            ...(prev.studioPolicies[selectedStudio] || prev.defaultPolicies),
            cancellation: rules,
          },
        },
      }));
    }
  };

  const updateRescheduleRules = (rules: RescheduleRule[]) => {
    if (selectedStudio === "default") {
      setPolicies((prev) => ({
        ...prev,
        defaultPolicies: { ...prev.defaultPolicies, reschedule: rules },
      }));
    } else {
      setPolicies((prev) => ({
        ...prev,
        studioPolicies: {
          ...prev.studioPolicies,
          [selectedStudio]: {
            ...(prev.studioPolicies[selectedStudio] || prev.defaultPolicies),
            reschedule: rules,
          },
        },
      }));
    }
  };

  const addCancellationRule = () => {
    const current = getCurrentPolicies().cancellation;
    const newRule: CancellationRule = {
      id: Date.now().toString(),
      type: "days",
      value: 1,
      refundPercent: 100,
      deductionPercent: 0,
    };
    updateCancellationRules([...current, newRule]);
  };

  const removeCancellationRule = (id: string) => {
    const current = getCurrentPolicies().cancellation;
    updateCancellationRules(current.filter((r) => r.id !== id));
  };

  const updateCancellationRule = (id: string, updates: Partial<CancellationRule>) => {
    const current = getCurrentPolicies().cancellation;
    updateCancellationRules(
      current.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const addRescheduleRule = () => {
    const current = getCurrentPolicies().reschedule;
    const newRule: RescheduleRule = {
      id: Date.now().toString(),
      type: "days",
      value: 1,
      deductionPercent: 0,
    };
    updateRescheduleRules([...current, newRule]);
  };

  const removeRescheduleRule = (id: string) => {
    const current = getCurrentPolicies().reschedule;
    updateRescheduleRules(current.filter((r) => r.id !== id));
  };

  const updateRescheduleRule = (id: string, updates: Partial<RescheduleRule>) => {
    const current = getCurrentPolicies().reschedule;
    updateRescheduleRules(
      current.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const studios = getAllStudios();
  const currentPolicies = getCurrentPolicies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Policies</h2>
          <p className="text-white/40">Configure cancellation and reschedule rules</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setSelectedStudio("default")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedStudio === "default"
                  ? "bg-[#D9FC67] text-black"
                  : "text-white/60 hover:text-white"
              )}
            >
              Default
            </button>
            {studios.length > 0 && (
              <select
                value={selectedStudio}
                onChange={(e) => setSelectedStudio(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D9FC67]"
              >
                <option value="default" className="bg-[#141414]">Default Policies</option>
                {studios.map((studio) => (
                  <option key={studio.id} value={studio.id} className="bg-[#141414]">
                    {studio.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="flex items-start gap-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">These changes may affect {affectedBookings.length} upcoming bookings</p>
            <p className="text-white/60 text-sm mt-1">Customers with existing bookings may be subject to the new policy terms.</p>
            <div className="mt-3 space-y-2">
              {affectedBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-lg">
                  <span className="text-white">{booking.id} - {booking.studioName}</span>
                  <span className="text-white/60">{new Date(booking.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-400/10 border border-green-400/20 rounded-xl text-green-400">
          <Check className="w-5 h-5" />
          Policies saved successfully!
        </div>
      )}

      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("cancellation")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
            activeTab === "cancellation"
              ? "border-[#D9FC67] text-[#D9FC67]"
              : "border-transparent text-white/60 hover:text-white"
          )}
        >
          <Shield className="w-4 h-4" />
          Cancellation Policy
        </button>
        <button
          onClick={() => setActiveTab("reschedule")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
            activeTab === "reschedule"
              ? "border-[#D9FC67] text-[#D9FC67]"
              : "border-transparent text-white/60 hover:text-white"
          )}
        >
          <Clock className="w-4 h-4" />
          Reschedule Policy
        </button>
      </div>

      {activeTab === "cancellation" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-400/10">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Cancellation Rules</h3>
                  <p className="text-white/40 text-sm">Define multiple rules based on timing</p>
                </div>
              </div>
              <Button
                onClick={addCancellationRule}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              {currentPolicies.cancellation.map((rule, index) => (
                <div
                  key={rule.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#D9FC67]/10 text-[#D9FC67] text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-white/60 text-sm">Rule</span>
                    </div>
                    {currentPolicies.cancellation.length > 1 && (
                      <button
                        onClick={() => removeCancellationRule(rule.id)}
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">If cancelled</label>
                      <div className="flex gap-2">
                        <select
                          value={rule.type}
                          onChange={(e) =>
                            updateCancellationRule(rule.id, {
                              type: e.target.value as "days" | "hours",
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D9FC67]"
                        >
                          <option value="days" className="bg-[#141414]">days</option>
                          <option value="hours" className="bg-[#141414]">hours</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={rule.value}
                          onChange={(e) =>
                            updateCancellationRule(rule.id, {
                              value: parseInt(e.target.value) || 0,
                            })
                          }
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D9FC67]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/40 text-xs mb-2 block">before session</label>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm h-[38px] flex items-center">
                        {rule.type === "days" ? `more than ${rule.value} days` : `within ${rule.value} hours`}
                      </div>
                    </div>

                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Refund</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={rule.refundPercent}
                          onChange={(e) =>
                            updateCancellationRule(rule.id, {
                              refundPercent: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-green-400"
                        />
                        <span className="w-12 text-center text-green-400 font-semibold text-sm">
                          {rule.refundPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {rule.refundPercent < 100 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <label className="text-white/40 text-xs mb-2 block">Deduction from refund</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={rule.deductionPercent}
                          onChange={(e) =>
                            updateCancellationRule(rule.id, {
                              deductionPercent: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-red-400"
                        />
                        <span className="w-12 text-center text-red-400 font-semibold text-sm">
                          {rule.deductionPercent}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#D9FC67]/10 rounded-xl border border-[#D9FC67]/20">
              <p className="text-white/60 text-sm mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D9FC67]" />
                Policy Preview
              </p>
              <div className="space-y-2">
                {currentPolicies.cancellation
                  .sort((a, b) => {
                    const aVal = a.type === "days" ? a.value * 24 : a.value;
                    const bVal = b.type === "days" ? b.value * 24 : b.value;
                    return bVal - aVal;
                  })
                  .map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-4 text-sm"
                    >
                      <span className="text-white/40 w-6">{index + 1}.</span>
                      <span className="text-white">
                        Cancelled{" "}
                        <span className="text-[#D9FC67] font-medium">
                          {rule.type === "days"
                            ? `${rule.value}+ days`
                            : `${rule.value} hours`}
                        </span>{" "}
                        before →
                      </span>
                      <span className="text-green-400 font-medium">
                        {rule.refundPercent}% refund
                      </span>
                      {rule.deductionPercent > 0 && (
                        <span className="text-red-400">
                          (-{rule.deductionPercent}% deducted)
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reschedule" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-400/10">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Reschedule Rules</h3>
                  <p className="text-white/40 text-sm">Define rules for rescheduling bookings</p>
                </div>
              </div>
              <Button
                onClick={addRescheduleRule}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              {currentPolicies.reschedule.map((rule, index) => (
                <div
                  key={rule.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-white/60 text-sm">Rule</span>
                    </div>
                    {currentPolicies.reschedule.length > 1 && (
                      <button
                        onClick={() => removeRescheduleRule(rule.id)}
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Reschedule allowed</label>
                      <div className="flex gap-2">
                        <select
                          value={rule.type}
                          onChange={(e) =>
                            updateRescheduleRule(rule.id, {
                              type: e.target.value as "days" | "hours",
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D9FC67]"
                        >
                          <option value="days" className="bg-[#141414]">days</option>
                          <option value="hours" className="bg-[#141414]">hours</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={rule.value}
                          onChange={(e) =>
                            updateRescheduleRule(rule.id, {
                              value: parseInt(e.target.value) || 0,
                            })
                          }
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D9FC67]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/40 text-xs mb-2 block">before session</label>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-sm h-[38px] flex items-center">
                        {rule.type === "days"
                          ? `${rule.value}+ days`
                          : `${rule.value}+ hours`}
                      </div>
                    </div>

                    <div>
                      <label className="text-white/40 text-xs mb-2 block">Deduction</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={rule.deductionPercent}
                          onChange={(e) =>
                            updateRescheduleRule(rule.id, {
                              deductionPercent: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-yellow-400"
                        />
                        <span className="w-12 text-center text-yellow-400 font-semibold text-sm">
                          {rule.deductionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
              <p className="text-white/60 text-sm mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-400" />
                Policy Preview
              </p>
              <div className="space-y-2">
                {currentPolicies.reschedule
                  .sort((a, b) => {
                    const aVal = a.type === "days" ? a.value * 24 : a.value;
                    const bVal = b.type === "days" ? b.value * 24 : b.value;
                    return bVal - aVal;
                  })
                  .map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-4 text-sm"
                    >
                      <span className="text-white/40 w-6">{index + 1}.</span>
                      <span className="text-white">
                        Reschedule{" "}
                        <span className="text-yellow-400 font-medium">
                          {rule.type === "days"
                            ? `${rule.value}+ days`
                            : `${rule.value}+ hours`}
                        </span>{" "}
                        before →
                      </span>
                      {rule.deductionPercent > 0 ? (
                        <span className="text-yellow-400 font-medium">
                          -{rule.deductionPercent}% deducted
                        </span>
                      ) : (
                        <span className="text-green-400 font-medium">Free</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={checkAffectedBookings}
          className="border-white/10 text-white hover:bg-white/5"
        >
          <Eye className="w-4 h-4 mr-2" />
          Check Affected Bookings
        </Button>
        <Button
          onClick={savePolicies}
          disabled={isSaving}
          className="bg-[#D9FC67] hover:bg-[#E8FF8A] text-black font-semibold"
        >
          {isSaving ? "Saving..." : "Save Policies"}
          {!isSaving && <Save className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
