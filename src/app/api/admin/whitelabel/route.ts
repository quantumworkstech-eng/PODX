import { NextRequest, NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status"); // published | draft | disabled

  let query = supabase
    .from("partner_branding")
    .select(`
      *,
      users!partner_branding_partner_id_fkey(email),
      profiles!inner(full_name, business_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`brand_name.ilike.%${search}%,partner_slug.ilike.%${search}%,custom_domain.ilike.%${search}%`);
  }
  if (status === "published") query = query.eq("is_published", true);
  if (status === "disabled") query = query.eq("admin_disabled", true);
  if (status === "draft") query = query.eq("is_published", false).eq("admin_disabled", false);

  const { data: partners, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ partners: partners || [], total: count || 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { partner_id, admin_disabled, admin_notes, is_published,
    primary_color, default_commission_pct } = await req.json();

  if (!partner_id) return NextResponse.json({ error: "partner_id required" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (admin_disabled !== undefined) update.admin_disabled = admin_disabled;
  if (admin_notes !== undefined) update.admin_notes = admin_notes;
  if (is_published !== undefined) update.is_published = is_published;
  if (primary_color !== undefined) update.primary_color = primary_color;

  const { data, error } = await supabase
    .from("partner_branding")
    .update(update)
    .eq("partner_id", partner_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ branding: data });
}
