import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Resolve a partner by custom domain or subdomain header
// Called by middleware or directly with ?domain=booking.example.com
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const subdomain = searchParams.get("subdomain");

  if (!domain && !subdomain) {
    return NextResponse.json({ error: "domain or subdomain required" }, { status: 400 });
  }

  let query = supabase
    .from("partner_branding")
    .select("partner_slug, brand_name, partner_id, primary_color, logo_url, booking_page_title")
    .eq("is_published", true)
    .eq("admin_disabled", false);

  if (domain) {
    query = query.eq("custom_domain", domain).eq("domain_verified", true);
  } else {
    query = query.eq("subdomain", subdomain);
  }

  const { data: branding } = await query.single();

  if (!branding) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  return NextResponse.json({ branding });
}
