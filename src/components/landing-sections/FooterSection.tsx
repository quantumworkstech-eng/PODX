"use client";

import Link from "next/link";
import { Globe, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import type { FooterContent, SectionBranding } from "@/types/landing";

interface Props {
  content: FooterContent;
  branding: SectionBranding;
}

export function FooterSection({ content, branding }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const secondary = branding.secondary_color || "#0a0a0a";
  const { tagline, show_social = true, show_nav = true, nav_links = [], copyright_text } = content;

  return (
    <footer
      className="px-6 py-12"
      style={{
        background: secondary,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            {branding.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt={branding.brand_name} className="h-10 object-contain mb-3" />
            ) : (
              <p className="text-xl font-bold mb-3" style={{ color: primary }}>
                {branding.brand_name}
              </p>
            )}
            {(tagline || branding.tagline) && (
              <p className="text-sm" style={{ opacity: 0.45 }}>
                {tagline || branding.tagline}
              </p>
            )}
          </div>

          {/* Nav links */}
          {show_nav && nav_links.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ opacity: 0.4 }}>
                Navigation
              </p>
              <ul className="space-y-2">
                {nav_links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.url}
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ opacity: 0.6, color: "inherit" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social */}
          {show_social && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ opacity: 0.4 }}>
                Connect
              </p>
              <div className="flex gap-3">
                {branding.website_url && (
                  <a href={branding.website_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Globe className="w-4 h-4" style={{ opacity: 0.6 }} />
                  </a>
                )}
                {branding.instagram_url && (
                  <a href={branding.instagram_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Instagram className="w-4 h-4" style={{ opacity: 0.6 }} />
                  </a>
                )}
                {branding.twitter_url && (
                  <a href={branding.twitter_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Twitter className="w-4 h-4" style={{ opacity: 0.6 }} />
                  </a>
                )}
                {branding.linkedin_url && (
                  <a href={branding.linkedin_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Linkedin className="w-4 h-4" style={{ opacity: 0.6 }} />
                  </a>
                )}
                {branding.youtube_url && (
                  <a href={branding.youtube_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Youtube className="w-4 h-4" style={{ opacity: 0.6 }} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs" style={{ opacity: 0.3 }}>
            {copyright_text || `© ${new Date().getFullYear()} ${branding.brand_name}. All rights reserved.`}
          </p>
          <p className="text-xs" style={{ opacity: 0.2 }}>
            Powered by <span style={{ color: primary }}>PodX</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
