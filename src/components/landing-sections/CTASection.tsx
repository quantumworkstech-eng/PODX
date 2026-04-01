"use client";

import { Calendar } from "lucide-react";
import type { CTAContent, SectionBranding } from "@/types/landing";

interface Props {
  content: CTAContent;
  branding: SectionBranding;
  onCtaClick?: () => void;
}

export function CTASection({ content, branding, onCtaClick }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const btnText = branding.button_text_color || "#000000";
  const { heading, subheading, cta_text, background_style = "gradient", background_image_url } = content;

  const bgStyle =
    background_style === "image" && background_image_url
      ? {
          backgroundImage: `url(${background_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : background_style === "solid"
      ? { background: `${primary}18`, border: `1px solid ${primary}30` }
      : {
          background: `linear-gradient(135deg, ${primary}20 0%, ${primary}05 100%)`,
          border: `1px solid ${primary}20`,
        };

  return (
    <section className="px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={bgStyle}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${primary}15 0%, transparent 70%)`,
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{heading}</h2>
            {subheading && (
              <p className="text-lg mb-8 max-w-xl mx-auto" style={{ opacity: 0.6 }}>
                {subheading}
              </p>
            )}
            {cta_text && (
              <button
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
                style={{
                  background: primary,
                  color: btnText,
                  boxShadow: `0 8px 40px ${primary}30`,
                }}
              >
                <Calendar className="w-5 h-5" />
                {cta_text}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
