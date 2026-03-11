"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroData {
  headline?: string;
  subheadline?: string;
  cta_primary_text?: string;
  cta_primary_url?: string;
  cta_secondary_text?: string;
  cta_secondary_url?: string;
  media_type?: string;
  media_url?: string;
  overlay_opacity?: number;
}

interface StatItem {
  number: string;
  label: string;
}

interface HeroProps {
  data?: HeroData;
  stats?: StatItem[];
}

const DEFAULT_HERO: HeroData = {
  headline: "Where Great Podcasts Begin",
  subheadline:
    "Over 500 podcasters, creators, and brands produce their content with Yanisa Studio. Book world-class podcast studios with professional equipment and expert support.",
  cta_primary_text: "Browse Studios",
  cta_primary_url: "/studios",
  cta_secondary_text: "Book a Session",
  cta_secondary_url: "/book",
  media_type: "image",
  media_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80",
  overlay_opacity: 60,
};

const DEFAULT_STATS: StatItem[] = [
  { number: "500+", label: "Creators" },
  { number: "50+", label: "Studios" },
  { number: "10K+", label: "Hours Recorded" },
  { number: "#1", label: "In India" },
];

export function Hero({ data, stats }: HeroProps) {
  const hero = { ...DEFAULT_HERO, ...data };
  const statItems = stats && stats.length > 0 ? stats : DEFAULT_STATS;

  const overlayOpacity = (hero.overlay_opacity ?? 60) / 100;
  const mediaUrl = hero.media_url || DEFAULT_HERO.media_url;

  return (
    <section className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background Media */}
      <div className="absolute inset-0">
        {hero.media_type === "video" && mediaUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mediaUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80"}
            alt="Podcast Studio"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Dark overlay with configurable opacity */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />
        {/* Gradient at the bottom for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-3xl">
          {/* Label */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D9FC67]/30 bg-[#D9FC67]/10 mb-8"
            style={{ animation: "fadeInUp 0.5s ease-out both" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67] inline-block" />
            <span className="text-[#D9FC67] text-sm font-medium">India&apos;s #1 Podcast Studio Network</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-6 tracking-tight"
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
          >
            {hero.headline || DEFAULT_HERO.headline}
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl"
            style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
          >
            {hero.subheadline || DEFAULT_HERO.subheadline}
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-wrap gap-4"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            <Link href={hero.cta_primary_url || "/studios"}>
              <Button
                size="lg"
                className="px-8 py-6 text-base font-semibold bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-full shadow-lg shadow-[#D9FC67]/20 hover:shadow-[#D9FC67]/40 transition-all hover:scale-105 border-0 gap-2"
              >
                {hero.cta_primary_text || "Browse Studios"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={hero.cta_secondary_url || "/book"}>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-semibold bg-white/5 backdrop-blur-sm border border-white/30 text-white hover:bg-white/15 hover:border-white/50 rounded-full transition-all"
              >
                {hero.cta_secondary_text || "Book a Session"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-8"
          style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}
        >
          {statItems.map((stat, i) => (
            <div key={i} className="text-left">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.number}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
