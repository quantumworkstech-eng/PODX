/**
 * Default state/country when a partner picks a city from the platform list.
 * Keys must match `cities.name` in the database.
 */
export const CITY_LOCATION_DEFAULTS: Record<string, { state: string; country: string }> = {
  Mumbai: { state: "Maharashtra", country: "India" },
  Delhi: { state: "Delhi", country: "India" },
  Bangalore: { state: "Karnataka", country: "India" },
  Hyderabad: { state: "Telangana", country: "India" },
  Pune: { state: "Maharashtra", country: "India" },
  Chennai: { state: "Tamil Nadu", country: "India" },
  Kolkata: { state: "West Bengal", country: "India" },
  Dubai: { state: "Dubai", country: "United Arab Emirates" },
};

/** Regions shown in the state dropdown when country is UAE (Indian list does not apply). */
export const UAE_REGION_OPTIONS = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"] as const;

export function matchUaeRegion(suggested: string): string {
  const s = suggested.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const exact = UAE_REGION_OPTIONS.find((x) => x.toLowerCase() === lower);
  if (exact) return exact;
  const partial = UAE_REGION_OPTIONS.find(
    (x) => lower.includes(x.toLowerCase()) || x.toLowerCase().includes(lower)
  );
  return partial || s;
}
