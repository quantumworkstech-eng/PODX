"use client";

import { Button } from "@/components/ui/button";
import { MapPin, Clock, Mic2, Radio, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Hero() {

  return (
    <section className="relative min-h-screen bg-background overflow-hidden">
      {/* Full-width Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920"
          alt="Podcast Studio"
          fill
          className="object-cover"
          priority
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div 
          className="min-h-[calc(100vh-13rem)]"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4rem',
            alignItems: 'center' 
          }}
        >
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-[#D9FC67] animate-pulse" />
              <span className="text-xs text-white/90 font-medium">Now Booking for 2025</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Where
              <span className="text-[#D9FC67]"> Great</span>
              <br />
              Podcasts Begin
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/80 mb-8 max-w-md leading-relaxed">
              Professional podcast studios in Mumbai with Sony FX3 cameras, 
              Shure SM7dB mics, and everything you need to create content that stands out.
            </p>

            {/* Location & Hours - Same row */}
            <div className="flex flex-wrap items-start gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4 text-[#D9FC67]" />
                <span>Mumbai</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Sunday to Friday: 10:00 to 22:00</span>
                  <span className="text-white/50">Saturday: Upon Request</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/studios">
                <Button
                  size="lg"
                  className="px-10 py-6 text-base font-semibold bg-[#D9FC67] hover:bg-[#E8FF8A] border-0 rounded-full text-black shadow-lg shadow-[#D9FC67]/25 hover:shadow-[#D9FC67]/40 transition-all hover:scale-105"
                >
                  Browse Studios
                </Button>
              </Link>
              <Link href="/book">
                <Button
                  size="lg"
                  className="px-10 py-6 text-base font-semibold bg-white text-black hover:bg-white/90 border-0 rounded-full transition-all hover:scale-105"
                >
                  Book a Session
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-10 py-6 text-base font-semibold bg-white/5 backdrop-blur-sm border border-white/30 text-white hover:bg-white/15 hover:border-white/50 rounded-full transition-all"
                >
                  Talk to an Expert
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/10">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-black/50" />
                ))}
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">2,000+ Creators</div>
                <div className="text-white/50 text-xs">Trust PodX</div>
              </div>
            </div>
          </div>

          {/* Right - Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#D9FC67]/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic2 className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">2,000+</div>
              <div className="text-xs text-white/60">Podcasters Empowered</div>
            </div>

            {/* Card 2 */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#D9FC67]/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Radio className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">9</div>
              <div className="text-xs text-white/60">Premium Studios</div>
            </div>

            {/* Card 3 */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#D9FC67]/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Headphones className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">75K+</div>
              <div className="text-xs text-white/60">Hours Recorded</div>
            </div>

            {/* Card 4 */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#D9FC67]/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">#1</div>
              <div className="text-xs text-white/60">In India</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Audio Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 opacity-30 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => {
          const height = 20 + ((i * 17) % 60);
          return (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-[#D9FC67] to-transparent rounded-full"
              style={{
                height: `${height}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          );
        })}
      </div>

      {/* Gradient Fade at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
