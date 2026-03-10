import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  children: React.ReactNode;
  params: Promise<{ partner_slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partner_slug } = await params;
  const { data: branding } = await supabase
    .from("partner_branding")
    .select("brand_name, booking_page_title, booking_page_description, favicon_url, logo_url")
    .eq("partner_slug", partner_slug)
    .eq("is_published", true)
    .single();

  if (!branding) return { title: "Booking Platform" };

  return {
    title: branding.booking_page_title || `Book with ${branding.brand_name}`,
    description: branding.booking_page_description || `Book a podcast studio session with ${branding.brand_name}`,
    icons: branding.favicon_url ? { icon: branding.favicon_url } : undefined,
  };
}

export default async function WhiteLabelLayout({ children, params }: Props) {
  const { partner_slug } = await params;
  const { data: branding } = await supabase
    .from("partner_branding")
    .select("*")
    .eq("partner_slug", partner_slug)
    .eq("is_published", true)
    .eq("admin_disabled", false)
    .single();

  if (!branding) notFound();

  const primary = branding.primary_color || "#D9FC67";
  const bg = branding.background_color || "#09090b";
  const textColor = branding.text_color || "#ffffff";

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --wl-primary: ${primary};
            --wl-bg: ${bg};
            --wl-text: ${textColor};
            --wl-btn-text: ${branding.button_text_color || "#000000"};
            --wl-secondary: ${branding.secondary_color || "#1a1a1a"};
            --wl-accent: ${branding.accent_color || "#ffffff"};
          }
          body { background: var(--wl-bg); color: var(--wl-text); }
        `}</style>
      </head>
      <body style={{ background: bg, color: textColor, fontFamily: branding.font_family || "Inter, sans-serif" }}>
        {/* White-label header */}
        <header style={{ background: branding.secondary_color || "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          className="sticky top-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.brand_name || "Logo"} className="h-8 w-auto object-contain" />
              ) : (
                <span className="text-xl font-bold" style={{ color: primary }}>
                  {branding.brand_name || "Studio Booking"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {branding.contact_phone && (
                <a href={`tel:${branding.contact_phone}`}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity hidden sm:block">
                  {branding.contact_phone}
                </a>
              )}
              {branding.contact_email && (
                <a href={`mailto:${branding.contact_email}`}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity hidden md:block">
                  {branding.contact_email}
                </a>
              )}
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* White-label footer */}
        <footer style={{ background: branding.secondary_color || "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          className="mt-16 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="" className="h-6 w-auto opacity-60" />
                ) : (
                  <span className="text-sm font-medium opacity-60">{branding.brand_name}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm opacity-40">
                {branding.website_url && (
                  <a href={branding.website_url} target="_blank" rel="noreferrer" className="hover:opacity-80">Website</a>
                )}
                {branding.instagram_url && (
                  <a href={branding.instagram_url} target="_blank" rel="noreferrer" className="hover:opacity-80">Instagram</a>
                )}
                {branding.twitter_url && (
                  <a href={branding.twitter_url} target="_blank" rel="noreferrer" className="hover:opacity-80">Twitter</a>
                )}
              </div>
              <p className="text-xs opacity-30">Powered by PodX</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
