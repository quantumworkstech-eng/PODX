"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ToggleLeft,
  Search,
  Users,
  ChevronDown,
  RefreshCw,
  CheckSquare,
  XSquare,
  RotateCcw,
  Info,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  email: string;
  name: string;
}

interface FeatureRow {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  category: string;
  is_default_enabled: boolean;
  is_enabled: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  studio: "Studio Management",
  booking: "Booking & Clients",
  analytics: "Analytics",
  branding: "Branding & White Label",
  integrations: "Integrations",
  earnings: "Earnings",
  billing: "Billing",
  general: "General",
};

const CATEGORY_ORDER = [
  "studio",
  "booking",
  "analytics",
  "branding",
  "integrations",
  "earnings",
  "billing",
  "general",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeatureAccessPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);

  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [featureSearch, setFeatureSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [resetting, setResetting] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, boolean>
  >({});

  // ─── Load partners ─────────────────────────────────────────────────────────

  useEffect(() => {
    setPartnersLoading(true);
    fetch("/api/admin/studios")
      .then((r) => r.json())
      .then((d) => {
        const studios = d.studios || [];
        const seen = new Set<string>();
        const list: Partner[] = [];
        for (const s of studios) {
          if (s.owner_id && !seen.has(s.owner_id)) {
            seen.add(s.owner_id);
            list.push({
              id: s.owner_id,
              email: s.owner_email || "",
              name: s.owner_name || s.owner_email || "Unknown",
            });
          }
        }
        setPartners(list);
      })
      .catch(console.error)
      .finally(() => setPartnersLoading(false));
  }, []);

  // ─── Load features for selected partner ────────────────────────────────────

  const loadFeatures = useCallback((partnerId: string) => {
    if (!partnerId) return;
    setFeaturesLoading(true);
    setSaveError(null);
    setSaveSuccess(null);
    setPendingChanges({});
    setHasChanges(false);
    fetch(`/api/admin/partner-features?partner_id=${partnerId}`)
      .then((r) => r.json())
      .then((d) => setFeatures(d.features || []))
      .catch(console.error)
      .finally(() => setFeaturesLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPartnerId) loadFeatures(selectedPartnerId);
  }, [selectedPartnerId, loadFeatures]);

  // ─── Display state (merge pending changes into loaded features) ────────────

  const displayFeatures = useMemo(
    () =>
      features.map((f) => ({
        ...f,
        is_enabled:
          f.feature_key in pendingChanges
            ? pendingChanges[f.feature_key]
            : f.is_enabled,
      })),
    [features, pendingChanges]
  );

  const filteredFeatures = useMemo(() => {
    return displayFeatures.filter((f) => {
      const matchesSearch =
        !featureSearch ||
        f.feature_name.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.description?.toLowerCase().includes(featureSearch.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || f.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [displayFeatures, featureSearch, categoryFilter]);

  const groupedFeatures = useMemo(() => {
    const groups: Record<string, FeatureRow[]> = {};
    for (const f of filteredFeatures) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  }, [filteredFeatures]);

  const categories = useMemo(
    () =>
      [...new Set(features.map((f) => f.category))].sort(
        (a, b) =>
          (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
          (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
      ),
    [features]
  );

  const filteredPartners = useMemo(
    () =>
      partners.filter(
        (p) =>
          !partnerSearch ||
          p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
          p.email.toLowerCase().includes(partnerSearch.toLowerCase())
      ),
    [partners, partnerSearch]
  );

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  // ─── Toggle a single feature ───────────────────────────────────────────────

  const handleToggle = (featureKey: string, enabled: boolean) => {
    setPendingChanges((prev) => ({ ...prev, [featureKey]: enabled }));
    setHasChanges(true);
  };

  // ─── Save all pending changes ──────────────────────────────────────────────

  const saveAllChanges = async () => {
    if (!selectedPartnerId || Object.keys(pendingChanges).length === 0) return;
    setBulkSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch("/api/admin/partner-features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: selectedPartnerId,
          features: Object.entries(pendingChanges).map(
            ([feature_key, is_enabled]) => ({ feature_key, is_enabled })
          ),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      // Merge pending into features
      setFeatures((prev) =>
        prev.map((f) =>
          f.feature_key in pendingChanges
            ? { ...f, is_enabled: pendingChanges[f.feature_key] }
            : f
        )
      );
      setPendingChanges({});
      setHasChanges(false);
      setSaveSuccess("Feature access saved successfully.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setBulkSaving(false);
    }
  };

  // ─── Save single feature immediately (auto-save mode) ─────────────────────

  const saveFeature = async (featureKey: string, enabled: boolean) => {
    if (!selectedPartnerId) return;
    setSaving((prev) => ({ ...prev, [featureKey]: true }));
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/partner-features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: selectedPartnerId,
          feature_key: featureKey,
          is_enabled: enabled,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setFeatures((prev) =>
        prev.map((f) =>
          f.feature_key === featureKey ? { ...f, is_enabled: enabled } : f
        )
      );
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[featureKey];
        return next;
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [featureKey]: false }));
    }
  };

  // ─── Bulk enable / disable all (filtered) ─────────────────────────────────

  const bulkSetAll = (enabled: boolean) => {
    const changes: Record<string, boolean> = {};
    for (const f of filteredFeatures) {
      changes[f.feature_key] = enabled;
    }
    setPendingChanges((prev) => ({ ...prev, ...changes }));
    setHasChanges(true);
  };

  // ─── Reset to defaults ─────────────────────────────────────────────────────

  const handleReset = async () => {
    if (!selectedPartnerId) return;
    if (!confirm("Reset all feature access to defaults for this partner?")) return;
    setResetting(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/partner-features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: selectedPartnerId, reset: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      loadFeatures(selectedPartnerId);
      setSaveSuccess("Feature access reset to defaults.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
            <ToggleLeft className="w-5 h-5 text-[#D9FC67]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Feature Access Control</h2>
            <p className="text-white/40 text-sm">
              Enable or disable features per partner
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Partner */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
            Step 1 — Select Partner
          </h3>
        </div>

        <div className="relative w-full max-w-md">
          <button
            onClick={() => setPartnerDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:border-white/20 transition-colors"
          >
            <span className={selectedPartner ? "text-white" : "text-white/30"}>
              {selectedPartner
                ? `${selectedPartner.name} — ${selectedPartner.email}`
                : partnersLoading
                ? "Loading partners..."
                : "Choose a partner..."}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-white/40 transition-transform",
                partnerDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {partnerDropdownOpen && (
            <div className="absolute z-30 mt-1 w-full bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-white/5">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                  <Search className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    autoFocus
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Search partners..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  />
                </div>
              </div>
              <ul className="max-h-64 overflow-y-auto p-1">
                {filteredPartners.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-white/30 text-center">
                    No partners found
                  </li>
                ) : (
                  filteredPartners.map((p) => (
                    <li key={p.id}>
                      <button
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                          p.id === selectedPartnerId
                            ? "bg-[#D9FC67]/10 text-[#D9FC67]"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                        onClick={() => {
                          setSelectedPartnerId(p.id);
                          setPartnerDropdownOpen(false);
                          setPartnerSearch("");
                        }}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-white/30 text-xs">
                          {p.email}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Feature list */}
      {selectedPartnerId && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 min-w-[220px]">
                  <Search className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Search features..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 outline-none hover:border-white/20 transition-colors"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => bulkSetAll(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D9FC67] bg-[#D9FC67]/10 rounded-lg hover:bg-[#D9FC67]/20 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Enable All
                </button>
                <button
                  onClick={() => bulkSetAll(false)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <XSquare className="w-3.5 h-3.5" />
                  Disable All
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/50 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {resetting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Status messages */}
          {saveError && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="px-4 py-3 bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-xl text-[#D9FC67] text-sm">
              {saveSuccess}
            </div>
          )}

          {/* Loading state */}
          {featuresLoading ? (
            <div className="flex items-center justify-center py-20 bg-[#111113] border border-white/5 rounded-2xl">
              <Loader2 className="w-6 h-6 text-[#D9FC67] animate-spin" />
              <span className="ml-2 text-white/40 text-sm">
                Loading features...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORY_ORDER.filter((cat) => groupedFeatures[cat]?.length).map(
                (cat) => (
                  <CategoryGroup
                    key={cat}
                    category={cat}
                    label={CATEGORY_LABELS[cat] || cat}
                    features={groupedFeatures[cat]}
                    saving={saving}
                    onToggle={(featureKey, enabled) => {
                      handleToggle(featureKey, enabled);
                      saveFeature(featureKey, enabled);
                    }}
                  />
                )
              )}
              {/* Categories not in CATEGORY_ORDER */}
              {Object.keys(groupedFeatures)
                .filter((cat) => !CATEGORY_ORDER.includes(cat))
                .map((cat) => (
                  <CategoryGroup
                    key={cat}
                    category={cat}
                    label={CATEGORY_LABELS[cat] || cat}
                    features={groupedFeatures[cat]}
                    saving={saving}
                    onToggle={(featureKey, enabled) => {
                      handleToggle(featureKey, enabled);
                      saveFeature(featureKey, enabled);
                    }}
                  />
                ))}

              {filteredFeatures.length === 0 && (
                <div className="text-center py-16 text-white/30 text-sm bg-[#111113] border border-white/5 rounded-2xl">
                  No features match your search.
                </div>
              )}
            </div>
          )}

          {/* Sticky save bar */}
          {hasChanges && Object.keys(pendingChanges).length > 0 && (
            <div className="sticky bottom-4 flex items-center justify-between px-5 py-4 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Info className="w-4 h-4 text-[#D9FC67]" />
                <span>
                  <span className="font-semibold text-white">
                    {Object.keys(pendingChanges).length}
                  </span>{" "}
                  unsaved change
                  {Object.keys(pendingChanges).length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPendingChanges({});
                    setHasChanges(false);
                  }}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveAllChanges}
                  disabled={bulkSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#D9FC67] text-black text-sm font-semibold rounded-xl hover:bg-[#E8FF8A] transition-colors disabled:opacity-50"
                >
                  {bulkSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedPartnerId && !partnersLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111113] border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <ToggleLeft className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm">
            Select a partner above to manage their feature access
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Category Group sub-component ────────────────────────────────────────────

function CategoryGroup({
  category,
  label,
  features,
  saving,
  onToggle,
}: {
  category: string;
  label: string;
  features: FeatureRow[];
  saving: Record<string, boolean>;
  onToggle: (featureKey: string, enabled: boolean) => void;
}) {
  const enabledCount = features.filter((f) => f.is_enabled).length;

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <h4 className="text-sm font-semibold text-white/70">{label}</h4>
        <span className="text-xs text-white/30">
          {enabledCount}/{features.length} enabled
        </span>
      </div>

      {/* Feature rows */}
      <ul className="divide-y divide-white/5">
        {features.map((f) => (
          <FeatureRow
            key={f.feature_key}
            feature={f}
            saving={saving[f.feature_key] ?? false}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </div>
  );
}

// ─── Feature Row sub-component ────────────────────────────────────────────────

function FeatureRow({
  feature,
  saving,
  onToggle,
}: {
  feature: FeatureRow;
  saving: boolean;
  onToggle: (featureKey: string, enabled: boolean) => void;
}) {
  const [tooltip, setTooltip] = useState(false);

  return (
    <li className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {feature.feature_name}
            </span>
            {!feature.is_default_enabled && (
              <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full font-medium">
                Premium
              </span>
            )}
            {feature.description && (
              <div className="relative">
                <button
                  onMouseEnter={() => setTooltip(true)}
                  onMouseLeave={() => setTooltip(false)}
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {tooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-56 px-3 py-2 bg-[#222] border border-white/10 rounded-lg text-xs text-white/70 shadow-xl pointer-events-none">
                    {feature.description}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#222]" />
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5 truncate">
            {feature.feature_key}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <span
          className={cn(
            "text-xs font-medium min-w-[50px] text-right",
            feature.is_enabled ? "text-[#D9FC67]" : "text-white/30"
          )}
        >
          {feature.is_enabled ? "Enabled" : "Disabled"}
        </span>
        {saving ? (
          <div className="w-11 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
          </div>
        ) : (
          <Switch
            checked={feature.is_enabled}
            onCheckedChange={(checked) =>
              onToggle(feature.feature_key, checked)
            }
          />
        )}
      </div>
    </li>
  );
}
