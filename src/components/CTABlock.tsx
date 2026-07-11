"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTABlockProps {
  headline?: string;
  primaryText?: string;
  primaryUrl?: string;
  secondaryText?: string;
  secondaryUrl?: string;
}

export function CTABlock({
  headline = "Ready to start your podcast journey?",
  primaryText = "Browse Studios",
  primaryUrl = "/studios",
  secondaryText = "Talk to an Expert",
  secondaryUrl = "/contact",
}: CTABlockProps) {
  return (
    <section className="py-24 lg:py-32 bg-[#09090b] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#D9FC67]/5 blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D9FC67]/20 bg-[#D9FC67]/5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9FC67] inline-block" />
          <span className="text-[#D9FC67] text-sm font-medium">Get started today</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          {headline}
        </h2>

        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
          Join 500+ creators who record their best content at Yanisa Studio.
          Instant booking, professional equipment, expert operators.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={primaryUrl}>
            <Button
              size="lg"
              className="px-8 py-6 text-base font-semibold bg-[#D9FC67] hover:bg-[#E8FF8A] text-black rounded-full shadow-lg shadow-[#D9FC67]/20 hover:shadow-[#D9FC67]/40 transition-all hover:scale-105 border-0 gap-2"
            >
              {primaryText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={secondaryUrl}>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40 rounded-full transition-all"
            >
              {secondaryText}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
