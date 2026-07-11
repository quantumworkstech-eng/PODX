/**
 * Admin API: Manage default equipment/service/amenity options.
 *
 * These options appear in the studio creation wizard (Step 4) for ALL partners.
 * The table is auto-seeded with the hardcoded defaults if it's empty.
 *
 * Required Supabase table (run once):
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE TABLE platform_equipment (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   category    text NOT NULL DEFAULT 'equipment',  -- equipment | service | amenity
 *   slug        text NOT NULL,
 *   name        text NOT NULL,
 *   icon_name   text NOT NULL DEFAULT 'package',
 *   is_active   boolean DEFAULT true,
 *   created_at  timestamptz DEFAULT now()
 * );
 * ALTER TABLE platform_equipment ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON platform_equipment USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adminSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "admin-fallback-secret"
);

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, adminSecret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

const DEFAULT_SEED = [
  // Equipment
  { category: "equipment", slug: "microphones", name: "Professional Microphones", icon_name: "mic" },
  { category: "equipment", slug: "headphones", name: "Studio Headphones", icon_name: "headphones" },
  { category: "equipment", slug: "cameras", name: "Video Cameras", icon_name: "video" },
  { category: "equipment", slug: "lighting", name: "Studio Lighting", icon_name: "lightbulb" },
  { category: "equipment", slug: "mixer", name: "Audio Mixer", icon_name: "sliders" },
  { category: "equipment", slug: "soundproofing", name: "Soundproofing", icon_name: "volume-x" },
  { category: "equipment", slug: "teleprompter", name: "Teleprompter", icon_name: "monitor" },
  { category: "equipment", slug: "reference_monitors", name: "Reference Monitors", icon_name: "monitor" },
  // Services
  { category: "service", slug: "recording", name: "Recording", icon_name: "mic" },
  { category: "service", slug: "editing", name: "Editing", icon_name: "film" },
  { category: "service", slug: "live_streaming", name: "Live Streaming", icon_name: "radio" },
  { category: "service", slug: "production_support", name: "Production Support", icon_name: "music" },
  { category: "service", slug: "photography", name: "Photography", icon_name: "camera" },
  { category: "service", slug: "podcasting", name: "Podcasting", icon_name: "book-open" },
  // Amenities
  { category: "amenity", slug: "wifi", name: "Free WiFi", icon_name: "wifi" },
  { category: "amenity", slug: "ac", name: "Air Conditioning", icon_name: "building-2" },
  { category: "amenity", slug: "parking", name: "Parking", icon_name: "car" },
  { category: "amenity", slug: "refreshments", name: "Refreshments", icon_name: "coffee" },
];

async function ensureSeeded() {
  const { count } = await supabaseAdmin
    .from("platform_equipment")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) === 0) {
    await supabaseAdmin.from("platform_equipment").insert(DEFAULT_SEED);
  }
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  try {
    await ensureSeeded();
    const { data, error } = await supabaseAdmin
      .from("platform_equipment")
      .select("*")
      .order("category")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg, items: DEFAULT_SEED }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { category, slug, name, icon_name } = body;

  if (!category || !name) {
    return NextResponse.json({ error: "category and name are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("platform_equipment")
    .insert({
      category,
      slug: slug || name.toLowerCase().replace(/\s+/g, "_"),
      name,
      icon_name: icon_name || "package",
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
