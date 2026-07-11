"use client";

import { Star } from "lucide-react";
import Image from "next/image";

const brands = [
  "Tata", "Reliance", "Infosys", "Wipro", "Amazon", "Microsoft", "Google", "Meta"
];

const influencers = [
  { 
    name: "Ranveer Allahbadia", 
    followers: "10.2M Followers", 
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop" 
  },
  { 
    name: "Ankur Warikoo", 
    followers: "5.8M Followers", 
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop" 
  },
  { 
    name: "Tanmay Bhat", 
    followers: "4.2M Subscribers", 
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop" 
  },
  { 
    name: "Raj Shamani", 
    followers: "3.5M Followers", 
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=600&fit=crop" 
  },
  { 
    name: "Nikhil Kamath", 
    followers: "2.8M Followers", 
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop" 
  },
  { 
    name: "Seema Anand", 
    followers: "980K Followers", 
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop" 
  },
];

export function SocialProof() {
  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light italic text-white mb-4">
            We create for the best.
            <br />
            Now let's create for you.
          </h2>
          
          {/* Google rating badge */}
          <div className="inline-flex items-center gap-3 mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold">5.0</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <span className="text-white/50 text-xs">on Google with 338 reviews</span>
            </div>
          </div>
        </div>

        {/* Brand logos marquee */}
        <div className="relative overflow-hidden py-8 mb-16">
          <div className="flex gap-16 animate-scroll items-center opacity-40">
            {[...brands, ...brands].map((brand, index) => (
              <span
                key={index}
                className="flex-shrink-0 text-2xl font-bold text-white whitespace-nowrap"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-16" />

        {/* You've seen our studios everywhere */}
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">
            You've seen our studios everywhere
          </h3>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10">
              ←
            </button>
            <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10">
              →
            </button>
          </div>
        </div>

        {/* Influencer portraits - Large photos */}
        <div className="relative overflow-hidden">
          <div className="flex gap-4">
            {influencers.map((influencer, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-52 group cursor-pointer"
              >
                {/* Portrait Image */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3">
                  <Image
                    src={influencer.image}
                    alt={influencer.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Info */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={influencer.image}
                      alt={influencer.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {influencer.name}
                    </h4>
                    <p className="text-white/50 text-xs">{influencer.followers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
