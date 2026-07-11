/**
 * Server key: Places API (New) Autocomplete + Geocoding — keep secret, IP-restrict in GCP.
 * Browser key (NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY): Maps JavaScript SDK only — HTTP referrer–restrict.
 * Enable: Places API (New), Geocoding API, Maps JavaScript API.
 */
export function getGoogleMapsServerKey(): string | null {
  return process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

export function getClientIp(request: Request): string {
  const h = request.headers.get("x-forwarded-for");
  if (h) return h.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
