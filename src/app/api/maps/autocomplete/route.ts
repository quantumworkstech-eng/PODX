import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/maps/rate-limit";
import { logMapsUsage } from "@/lib/maps/usage-log";
import { getClientIp, getGoogleMapsServerKey } from "@/lib/maps/server-config";

const AUTOCOMPLETE_WINDOW_MS = 60_000;
const AUTOCOMPLETE_MAX = 45;

type Body = {
  input?: string;
  sessionToken?: string;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`maps:ac:${ip}`, AUTOCOMPLETE_MAX, AUTOCOMPLETE_WINDOW_MS);
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

  const input = (body.input || "").trim();
  if (input.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const sessionToken = (body.sessionToken || "").trim() || undefined;

  const url = "https://places.googleapis.com/v1/places:autocomplete";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
    },
    body: JSON.stringify({
      input,
      sessionToken,
      includedRegionCodes: ["in"],
      languageCode: "en",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logMapsUsage("autocomplete", { status: res.status, error: data });
    return NextResponse.json(
      { error: data?.error?.message || "Autocomplete failed" },
      { status: 502 }
    );
  }

  logMapsUsage("autocomplete", { inputLen: input.length });

  const raw = (data.suggestions || []) as Array<{
    placePrediction?: { placeId?: string; text?: { text?: string } };
  }>;

  const suggestions = raw
    .map((s) => {
      const p = s.placePrediction;
      if (!p?.placeId) return null;
      return {
        placeId: p.placeId,
        description: p.text?.text || "",
      };
    })
    .filter(Boolean)
    .slice(0, 5) as { placeId: string; description: string }[];

  return NextResponse.json({ suggestions });
}
