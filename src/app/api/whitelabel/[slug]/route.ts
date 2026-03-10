import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public endpoint: resolve a white-label partner by slug, subdomain, or custom domain
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  const { data: branding, error } = await supabase
    .from("partner_branding")
    .select("*")
    .eq("partner_slug", slug)
    .eq("is_published", true)
    .eq("admin_disabled", false)
    .single();

  if (error || !branding) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  // Fetch partner's studios (only active)
  const { data: studios } = await supabase
    .from("studios")
    .select(`
      id, name, slug, description, short_description, city, address,
      featured_image_url, is_active, is_verified,
      rooms(id, name, capacity, price_per_hour, min_booking_hours, max_booking_hours, is_active)
    `)
    .eq("owner_id", branding.partner_id)
    .eq("is_active", true);

  return NextResponse.json({
    branding: {
      brand_name: branding.brand_name,
      partner_slug: branding.partner_slug,
      logo_url: branding.logo_url,
      favicon_url: branding.favicon_url,
      tagline: branding.tagline,
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      accent_color: branding.accent_color,
      background_color: branding.background_color,
      text_color: branding.text_color,
      button_text_color: branding.button_text_color,
      font_family: branding.font_family,
      booking_page_title: branding.booking_page_title,
      booking_page_description: branding.booking_page_description,
      website_url: branding.website_url,
      instagram_url: branding.instagram_url,
      twitter_url: branding.twitter_url,
      contact_email: branding.contact_email,
      contact_phone: branding.contact_phone,
      contact_address: branding.contact_address,
      partner_id: branding.partner_id,
    },
    studios: studios || [],
  });
}
