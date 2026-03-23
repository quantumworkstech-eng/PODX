/**
 * Partner API: Manage studio-specific custom equipment options.
 *
 * Partners can add custom equipment/service/amenity options beyond the platform
 * defaults. These appear in their studio creation wizard alongside the admin-managed
 * platform_equipment options.
 *
 * Required Supabase table (run once):
 * ─────────────────────────────────────────────────────────────────────────────
 * CREATE TABLE partner_custom_equipment (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   partner_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   category    text NOT NULL DEFAULT 'equipment',  -- equipment | service | amenity
 *   name        text NOT NULL,
 *   is_active   boolean DEFAULT true,
 *   created_at  timestamptz DEFAULT now()
 * );
 * ALTER TABLE partner_custom_equipment ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON partner_custom_equipment USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPartnerId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("partner_custom_equipment")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .order("category")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  const partnerId = await getPartnerId();
  if (!partnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name?.trim() || !body.category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("partner_custom_equipment")
      .insert({
        partner_id: partnerId,
        category: body.category,
        name: body.name.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
