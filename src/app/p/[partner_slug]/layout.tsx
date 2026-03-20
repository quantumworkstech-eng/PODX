import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Google Fonts available through the partner settings font picker
const GOOGLE_FONTS: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700",
  Poppins: "Poppins:wght@400;500;600;700",
  Roboto: "Roboto:wght@400;500;700",
  Montserrat: "Montserrat:wght@400;500;600;700",
  Raleway: "Raleway:wght@400;500;600;700",
  Nunito: "Nunito:wght@400;500;600;700",
  "Open Sans": "Open+Sans:wght@400;500;600;700",
  Lato: "Lato:wght@400;700",
};

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
    description:
      branding.booking_page_description ||
      `Book a podcast studio session with ${branding.brand_name}`,
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
  const secondary = branding.secondary_color || "#0a0a0a";
  const bg = branding.background_color || "#09090b";
  const textColor = branding.text_color || "#ffffff";
  const btnText = branding.button_text_color || "#000000";
  const accent = branding.accent_color || "#ffffff";
  const fontFamily = branding.font_family || "Inter";
  const googleFontParam = GOOGLE_FONTS[fontFamily] || GOOGLE_FONTS["Inter"];

  return (
    <html lang="en">
      <head>
        {/* Google Font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href={`https://fonts.googleapis.com/css2?family=${googleFontParam}&display=swap`}
          rel="stylesheet"
        />
        {/* Partner CSS custom properties */}
        <style>{`
          :root {
            --wl-primary: ${primary};
            --wl-secondary: ${secondary};
            --wl-bg: ${bg};
            --wl-text: ${textColor};
            --wl-btn-text: ${btnText};
            --wl-accent: ${accent};
            --wl-font: '${fontFamily}', sans-serif;
          }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: var(--wl-bg);
            color: var(--wl-text);
            font-family: var(--wl-font);
            -webkit-font-smoothing: antialiased;
          }
          a { color: inherit; text-decoration: none; }
          ::selection { background: var(--wl-primary); color: var(--wl-btn-text); }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--wl-secondary); }
          ::-webkit-scrollbar-thumb { background: var(--wl-primary); border-radius: 3px; }
        `}</style>
      </head>
      <body>
        {/* ── White-label header ─────────────────────────────────────── */}
        <header
          style={{
            background: secondary,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
          className="sticky top-0 z-50 px-6 py-4"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={branding.brand_name || "Logo"}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span
                  className="text-xl font-bold"
                  style={{ color: primary, fontFamily: `'${fontFamily}', sans-serif` }}
                >
                  {branding.brand_name || "Studio Booking"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {branding.contact_phone && (
                <a
                  href={`tel:${branding.contact_phone}`}
                  className="text-sm transition-opacity hidden sm:block"
                  style={{ color: textColor, opacity: 0.6 }}
                  onMouseOver={(e) => ((e.target as HTMLElement).style.opacity = "1")}
                  onMouseOut={(e) => ((e.target as HTMLElement).style.opacity = "0.6")}
                >
                  {branding.contact_phone}
                </a>
              )}
              {branding.contact_email && (
                <a
                  href={`mailto:${branding.contact_email}`}
                  className="text-sm transition-opacity hidden md:block"
                  style={{ color: textColor, opacity: 0.6 }}
                >
                  {branding.contact_email}
                </a>
              )}
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* ── White-label footer ─────────────────────────────────────── */}
        <footer
          style={{
            background: secondary,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
          className="mt-16 px-6 py-10"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              {/* Brand column */}
              <div>
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt={branding.brand_name || ""}
                    className="h-7 w-auto object-contain mb-3 opacity-80"
                  />
                ) : (
                  <p
                    className="font-bold text-lg mb-3"
                    style={{ color: primary }}
                  >
                    {branding.brand_name}
                  </p>
                )}
                {branding.tagline && (
                  <p className="text-sm" style={{ color: textColor, opacity: 0.4 }}>
                    {branding.tagline}
                  </p>
                )}
              </div>

              {/* Contact column */}
              {(branding.contact_email || branding.contact_phone || branding.contact_address) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
                    Contact
                  </p>
                  <div className="space-y-1.5 text-sm" style={{ color: textColor, opacity: 0.5 }}>
                    {branding.contact_email && <p>{branding.contact_email}</p>}
                    {branding.contact_phone && <p>{branding.contact_phone}</p>}
                    {branding.contact_address && <p>{branding.contact_address}</p>}
                  </div>
                </div>
              )}

              {/* Social links column */}
              {(branding.website_url || branding.instagram_url || branding.twitter_url || branding.linkedin_url || branding.youtube_url) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary, opacity: 0.7 }}>
                    Follow Us
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {branding.website_url && (
                      <a
                        href={branding.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-opacity"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        Website
                      </a>
                    )}
                    {branding.instagram_url && (
                      <a
                        href={branding.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-opacity"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        Instagram
                      </a>
                    )}
                    {branding.twitter_url && (
                      <a
                        href={branding.twitter_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-opacity"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        Twitter
                      </a>
                    )}
                    {branding.linkedin_url && (
                      <a
                        href={branding.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-opacity"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        LinkedIn
                      </a>
                    )}
                    {branding.youtube_url && (
                      <a
                        href={branding.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-opacity"
                        style={{ color: textColor, opacity: 0.5 }}
                      >
                        YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div
              className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-xs" style={{ color: textColor, opacity: 0.25 }}>
                © {new Date().getFullYear()} {branding.brand_name}. All rights reserved.
              </p>
              <p className="text-xs" style={{ color: textColor, opacity: 0.2 }}>
                Powered by PodX
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
