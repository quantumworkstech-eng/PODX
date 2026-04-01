"use client";

import {
  Mic, Headphones, Camera, Wifi, Shield, Zap, Star, Users,
  Globe, Music, Video, Radio, BookOpen, Award, Clock, Heart,
  LucideIcon,
} from "lucide-react";
import type { FeaturesContent, SectionBranding } from "@/types/landing";

const ICON_MAP: Record<string, LucideIcon> = {
  Mic, Headphones, Camera, Wifi, Shield, Zap, Star, Users,
  Globe, Music, Video, Radio, BookOpen, Award, Clock, Heart,
};

interface Props {
  content: FeaturesContent;
  branding: SectionBranding;
}

export function FeaturesSection({ content, branding }: Props) {
  const primary = branding.primary_color || "#D9FC67";
  const secondary = branding.secondary_color || "#0a0a0a";
  const { heading, subheading, items = [] } = content;

  return (
    <section
      className="px-6 py-20"
      style={{ background: secondary, borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-6xl mx-auto">
        {(heading || subheading) && (
          <div className="text-center mb-14">
            {heading && <h2 className="text-3xl sm:text-4xl font-bold mb-4">{heading}</h2>}
            {subheading && (
              <p className="max-w-xl mx-auto" style={{ opacity: 0.5 }}>
                {subheading}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const Icon = (item.icon && ICON_MAP[item.icon]) || Zap;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${primary}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: primary }} />
                </div>
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm" style={{ opacity: 0.5 }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
