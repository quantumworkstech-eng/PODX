import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/maps/rate-limit";
import { logMapsUsage } from "@/lib/maps/usage-log";
import { parseGeocodeResult } from "@/lib/maps/parse-geocode";
import { getClientIp, getGoogleMapsServerKey } from "@/lib/maps/server-config";

const WINDOW_MS = 60_000;
const MAX = 40;

type Body = {
  placeId?: string;
  address?: string;
  city?: string;
  country?: string;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`maps:gc:${ip}`, MAX, WINDOW_MS);
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

  const placeId = (body.placeId || "").trim();
  let geocodeUrl: string;

  if (placeId) {
    geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}&key=${encodeURIComponent(key)}`;
  } else {
    const address = (body.address || "").trim();
    const city = (body.city || "").trim();
    const country = (body.country || "India").trim();
    if (!address || !city) {
      return NextResponse.json(
        { error: "Either placeId or (address and city) is required" },
        { status: 400 }
      );
    }
    const query = `${address}, ${city}, ${country}`;
    geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=in&key=${encodeURIComponent(key)}`;
  }

  const res = await fetch(geocodeUrl);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    logMapsUsage("geocode", { status: data.status, error: data.error_message });
    return NextResponse.json(
      { error: data.error_message || "Geocoding failed" },
      { status: 502 }
    );
  }

  const result = data.results?.[0];
  if (!result) {
    logMapsUsage("geocode", { empty: true });
    return NextResponse.json({ error: "ZERO_RESULTS" }, { status: 404 });
  }

  const parsed = parseGeocodeResult(result);
  if (!parsed) {
    return NextResponse.json({ error: "Could not parse location" }, { status: 502 });
  }

  logMapsUsage("geocode", { byPlaceId: Boolean(placeId) });

  return NextResponse.json({
    address: parsed.formattedAddress || (body.address || "").trim(),
    city: parsed.city,
    state: parsed.state,
    country: parsed.country || body.country || "India",
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  });
}
