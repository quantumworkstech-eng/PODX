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
    .select(
      `
      *,
      users!partner_branding_partner_id_fkey(email),
      profiles(full_name, business_name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `brand_name.ilike.%${search}%,partner_slug.ilike.%${search}%,custom_domain.ilike.%${search}%`
    );
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

  const body = await req.json();
  const { partner_id } = body;
  if (!partner_id) return NextResponse.json({ error: "partner_id required" }, { status: 400 });

  // Whitelist every field admins are allowed to update
  const ALLOWED_FIELDS = [
    // Identity
    "brand_name", "partner_slug", "logo_url", "favicon_url", "tagline",
    // Colors
    "primary_color", "secondary_color", "accent_color", "background_color",
    "text_color", "button_text_color",
    // Typography
    "font_family",
    // Page content
    "booking_page_title", "booking_page_description",
    // Social
    "website_url", "instagram_url", "twitter_url", "linkedin_url", "youtube_url",
    // Contact
    "contact_email", "contact_phone", "contact_address",
    // Email branding
    "email_sender_name", "email_sender_address", "email_footer_text",
    // Domain
    "subdomain", "custom_domain", "url_mode", "domain_verified",
    // Publishing / admin controls
    "is_published", "admin_disabled", "admin_notes", "is_whitelabel_enabled",
  ] as const;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  // Validate slug uniqueness if being changed
  if (body.partner_slug) {
    const { data: existing } = await supabase
      .from("partner_branding")
      .select("partner_id")
      .eq("partner_slug", body.partner_slug)
      .neq("partner_id", partner_id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Slug is already taken by another partner" }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("partner_branding")
    .update(update)
    .eq("partner_id", partner_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ branding: data });
}

// Admin can hard-delete a partner's white-label branding config
export async function DELETE(req: NextRequest) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const partner_id = searchParams.get("partner_id");
  if (!partner_id) return NextResponse.json({ error: "partner_id required" }, { status: 400 });

  const { error } = await supabase
    .from("partner_branding")
    .delete()
    .eq("partner_id", partner_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
