"use client";

interface LandingMarqueeProps {
  items?: string[];
}

const DEFAULT_ITEMS = [
  "Spotify",
  "YouTube",
  "Apple Podcasts",
  "Google Podcasts",
  "Amazon Music",
  "JioSaavn",
  "Gaana",
  "Audible",
  "iHeartRadio",
  "Pocket Casts",
];

export function LandingMarquee({ items }: LandingMarqueeProps) {
  const marqueeItems = items && items.length > 0 ? items : DEFAULT_ITEMS;
  // Double the array to create a seamless loop
  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <section className="py-8 bg-[#09090b] border-y border-white/5 overflow-hidden">
      <div className="relative flex">
        <div className="animate-marquee flex items-center gap-0 whitespace-nowrap will-change-transform">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-6 px-8">
              <span className="text-white/40 text-sm font-medium uppercase tracking-widest">{item}</span>
              <span className="w-1 h-1 rounded-full bg-[#D9FC67]/40 flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
