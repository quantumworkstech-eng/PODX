"use client";

import { Lock } from "lucide-react";
import { usePartnerFeatures } from "@/context/PartnerFeatureContext";

export { usePartnerFeatures };

// ─── FeatureGate ──────────────────────────────────────────────────────────────

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
  /** If true, renders a locked/upgrade placeholder. If false, renders nothing. Default: true */
  showLocked?: boolean;
  /** Custom locked UI */
  lockedFallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on whether the partner has access
 * to featureKey. Uses the shared PartnerFeatureContext (no extra fetches).
 */
export function FeatureGate({
  featureKey,
  children,
  showLocked = true,
  lockedFallback,
}: FeatureGateProps) {
  const { featureMap } = usePartnerFeatures();

  // While loading, show children (avoid flash of locked state)
  if (featureMap === null) return <>{children}</>;

  const enabled = featureMap[featureKey] !== false;
  if (enabled) return <>{children}</>;

  if (!showLocked) return null;

  if (lockedFallback) return <>{lockedFallback}</>;

  return <LockedFeaturePlaceholder />;
}

// ─── Locked placeholder ───────────────────────────────────────────────────────

export function LockedFeaturePlaceholder({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 bg-[#111113] border border-white/5 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-white/20" />
      </div>
      <p className="text-white font-semibold text-base mb-1">
        Feature Not Available
      </p>
      <p className="text-white/40 text-sm text-center max-w-xs">
        {message ||
          "This feature is not enabled for your account. Contact your administrator or upgrade your plan to access it."}
      </p>
    </div>
  );
}
