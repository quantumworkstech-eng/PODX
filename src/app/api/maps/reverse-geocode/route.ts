import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/maps/rate-limit";
import { logMapsUsage } from "@/lib/maps/usage-log";
import { parseGeocodeResult } from "@/lib/maps/parse-geocode";
import { getClientIp, getGoogleMapsServerKey } from "@/lib/maps/server-config";

const WINDOW_MS = 60_000;
const MAX = 50;

type Body = {
  latitude?: number;
  longitude?: number;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`maps:rg:${ip}`, MAX, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const key = getGoogleMapsServerKey();
  if (!key) {
    return NextResponse.json(
      { error: "Maps not configured (GOOGLE_MAPS_SERVER_KEY or GOOGLE_MAPS_API_KEY)" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lat = body.latitude;
  const lng = body.longitude;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "latitude and longitude required" }, { status: 400 });
  }

  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}&key=${encodeURIComponent(key)}`;

  const res = await fetch(geocodeUrl);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    logMapsUsage("reverse_geocode", { status: data.status, error: data.error_message });
    return NextResponse.json(
      { error: data.error_message || "Reverse geocoding failed" },
      { status: 502 }
    );
  }

  const result = data.results?.[0];
  if (!result) {
    logMapsUsage("reverse_geocode", { empty: true });
    return NextResponse.json({ error: "ZERO_RESULTS" }, { status: 404 });
  }

  const parsed = parseGeocodeResult(result);
  if (!parsed) {
    return NextResponse.json({ error: "Could not parse address" }, { status: 502 });
  }

  logMapsUsage("reverse_geocode", {});

  return NextResponse.json({
    address: parsed.formattedAddress,
    city: parsed.city,
    state: parsed.state,
    country: parsed.country,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  });
}
