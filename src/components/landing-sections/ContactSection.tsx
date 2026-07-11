"use client";

import { Phone, Mail, MapPin } from "lucide-react";
import type { ContactContent, SectionBranding } from "@/types/landing";

interface Props {
  content: ContactContent;
  branding: SectionBranding;
}

export function ContactSection({ content, branding }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const secondary = branding.secondary_color || "#0a0a0a";
  const { heading, subheading, show_email = true, show_phone = true, show_address = true } = content;

  const hasAny =
    (show_email && branding.contact_email) ||
    (show_phone && branding.contact_phone) ||
    (show_address && branding.contact_address);

  if (!hasAny) return null;

  return (
    <section
      id="contact"
      className="px-6 py-16"
      style={{ background: secondary, borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-4xl mx-auto">
        {(heading || subheading) && (
          <div className="text-center mb-10">
            {heading && <h2 className="text-2xl sm:text-3xl font-bold mb-3">{heading}</h2>}
            {subheading && <p style={{ opacity: 0.5 }}>{subheading}</p>}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap">
          {show_phone && branding.contact_phone && (
            <a
              href={`tel:${branding.contact_phone}`}
              className="flex items-center gap-3 text-sm transition-all hover:scale-105"
              style={{ opacity: 0.7 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${primary}15` }}
              >
                <Phone className="w-5 h-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>Call Us</p>
                <p className="font-semibold">{branding.contact_phone}</p>
              </div>
            </a>
          )}
          {show_email && branding.contact_email && (
            <a
              href={`mailto:${branding.contact_email}`}
              className="flex items-center gap-3 text-sm transition-all hover:scale-105"
              style={{ opacity: 0.7 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${primary}15` }}
              >
                <Mail className="w-5 h-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>Email Us</p>
                <p className="font-semibold">{branding.contact_email}</p>
              </div>
            </a>
          )}
          {show_address && branding.contact_address && (
            <div className="flex items-center gap-3 text-sm" style={{ opacity: 0.7 }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${primary}15` }}
              >
                <MapPin className="w-5 h-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ opacity: 0.5 }}>Visit Us</p>
                <p className="font-semibold">{branding.contact_address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
