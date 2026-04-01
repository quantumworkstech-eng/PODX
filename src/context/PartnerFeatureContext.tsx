"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type FeatureMap = Record<string, boolean>;

interface PartnerFeatureContextValue {
  featureMap: FeatureMap | null;
  isLoading: boolean;
  isEnabled: (featureKey: string) => boolean;
  refresh: () => void;
}

const PartnerFeatureContext = createContext<PartnerFeatureContextValue>({
  featureMap: null,
  isLoading: true,
  isEnabled: () => true,
  refresh: () => {},
});

export function PartnerFeatureProvider({ children }: { children: ReactNode }) {
  const [featureMap, setFeatureMap] = useState<FeatureMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch("/api/partner/features")
      .then((r) => r.json())
      .then((d) => setFeatureMap(d.features ?? {}))
      .catch(() => setFeatureMap({}))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEnabled = useCallback(
    (featureKey: string): boolean => {
      if (!featureMap) return true; // optimistic while loading
      return featureMap[featureKey] !== false;
    },
    [featureMap]
  );

  return (
    <PartnerFeatureContext.Provider
      value={{ featureMap, isLoading, isEnabled, refresh: load }}
    >
      {children}
    </PartnerFeatureContext.Provider>
  );
}

export function usePartnerFeatures() {
  return useContext(PartnerFeatureContext);
}
