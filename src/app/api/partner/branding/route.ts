import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
const supabase = supabaseAdmin!;
import { checkFeature } from "@/lib/subscription-gates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: branding, error } = await supabase
    .from("partner_branding")
    .select("*")
    .eq("partner_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ branding: branding || null });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Subscription gate: white-label requires Pro or Enterprise
  const canWhitelabel = await checkFeature(user.id, "whitelabel");
  if (!canWhitelabel) {
    return NextResponse.json(
      {
        error: "White-label branding requires a Pro or Enterprise subscription. Visit Billing & Plans to upgrade.",
        code: "FEATURE_GATED",
        feature: "whitelabel",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    brand_name, partner_slug, logo_url, favicon_url, tagline,
    primary_color, secondary_color, accent_color, background_color,
    text_color, button_text_color, font_family,
    booking_page_title, booking_page_description,
    website_url, instagram_url, twitter_url, linkedin_url, youtube_url,
    contact_email, contact_phone, contact_address,
    email_sender_name, email_sender_address, email_footer_text,
    subdomain, custom_domain, url_mode, is_published,
  } = body;

  // Validate slug uniqueness if changed
  if (partner_slug) {
    const { data: existing } = await supabase
      .from("partner_branding")
      .select("id, partner_id")
      .eq("partner_slug", partner_slug)
      .single();
    if (existing && existing.partner_id !== user.id) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
  }

  const payload = {
    partner_id: user.id,
    brand_name, partner_slug, logo_url, favicon_url, tagline,
    primary_color, secondary_color, accent_color, background_color,
    text_color, button_text_color, font_family,
    booking_page_title, booking_page_description,
    website_url, instagram_url, twitter_url, linkedin_url, youtube_url,
    contact_email, contact_phone, contact_address,
    email_sender_name, email_sender_address, email_footer_text,
    subdomain, custom_domain, url_mode,
    is_published: is_published ?? false,
    is_whitelabel_enabled: true,
    updated_at: new Date().toISOString(),
  };

  const { data: branding, error } = await supabase
    .from("partner_branding")
    .upsert(payload, { onConflict: "partner_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ branding });
}

// DELETE — partner resets (deletes) their entire white-label configuration
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("partner_branding")
    .delete()
    .eq("partner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
