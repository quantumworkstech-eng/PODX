"use client";

import { ArrowRight, Mail } from "lucide-react";
import type { HeroContent, SectionBranding } from "@/types/landing";

interface Props {
  content: HeroContent;
  branding: SectionBranding;
  onCtaClick?: () => void;
}

export function HeroSection({ content, branding, onCtaClick }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const btnText = branding.button_text_color || "#000000";
  const {
    heading,
    subheading,
    cta_primary_text,
    cta_secondary_text,
    background_image_url,
    background_video_url,
    overlay_opacity = 40,
  } = content;

  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      {/* Background media */}
      {background_video_url ? (
        <video
          src={background_video_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : background_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background_image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      {/* Overlay */}
      {(background_image_url || background_video_url) && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${overlay_opacity / 100})` }}
        />
      )}

      {/* Gradient accent (no background media) */}
      {!background_image_url && !background_video_url && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}25 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${primary} 1px, transparent 1px), linear-gradient(90deg, ${primary} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </>
      )}

      <div className="relative max-w-4xl mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          style={{ letterSpacing: "-0.02em" }}
        >
          {heading || "Book Your Studio Session"}
        </h1>

        {subheading && (
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ opacity: 0.65 }}
          >
            {subheading}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {cta_primary_text && (
            <button
              onClick={onCtaClick}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105 hover:shadow-lg"
              style={{
                background: primary,
                color: btnText,
                boxShadow: `0 0 40px ${primary}30`,
              }}
            >
              {cta_primary_text}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          {cta_secondary_text && (
            <a
              href={content.cta_secondary_url || "#contact"}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Mail className="w-5 h-5" style={{ opacity: 0.6 }} />
              {cta_secondary_text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
