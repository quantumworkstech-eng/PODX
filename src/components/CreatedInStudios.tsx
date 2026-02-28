"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

const showcaseItems = [
  {
    name: "Raj Sharma",
    title: "Raj Sharma's INCREDIBLE ₹10 Crore Startup Journey",
    creator: "Raj Sharma",
    subscribers: "5.49M Subscribers",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  },
  {
    name: "The Mindset Show",
    title: "Freedom In Independence: How Being a Free Thinker Shapes You",
    creator: "Priya Mehta",
    subscribers: "181K Views",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
  },
  {
    name: "Tech Talk India",
    title: "Tech Talk India - Episode 1 - Why AI is Changing Everything",
    creator: "Arjun Kapoor",
    subscribers: "1.5M Followers",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800",
  },
  {
    name: "Business Unplugged",
    title: "Mumbai's Top Entrepreneur is Back! Featuring @startupindia",
    creator: "Vikram Singh",
    subscribers: "2.5M Followers",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800",
  },
  {
    name: "The Creator Economy",
    title: "The Incredible Journey Of India's #1 Content Creator",
    creator: "Sneha Reddy",
    subscribers: "340K Views",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
  },
];

export function CreatedInStudios() {
  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-12 text-center">
          Created in our podcast
          <br />
          studios in Mumbai
        </h2>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Main Carousel Content */}
          <div className="flex items-center gap-4">
            {/* Side cards (smaller) */}
            <div className="hidden lg:block w-32 flex-shrink-0 opacity-50">
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden">
                <Image
                  src={showcaseItems[4].image}
                  alt="Side preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Center card (large) */}
            <div className="flex-1 max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-3xl overflow-hidden">
                <Image
                  src={showcaseItems[0].image}
                  alt={showcaseItems[0].name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {showcaseItems[0].name}
                  </h3>
                  <p className="text-white/80 text-sm mb-4 max-w-lg mx-auto">
                    {showcaseItems[0].title}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-white/60 mb-6">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>{showcaseItems[0].creator}</span>
                    <span>|</span>
                    <span>{showcaseItems[0].subscribers}</span>
                  </div>
                  <Button className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] rounded-full px-8 text-black">
                    Watch now
                  </Button>
                </div>
              </div>
            </div>

            {/* Side cards (smaller) */}
            <div className="hidden lg:block w-32 flex-shrink-0 opacity-50">
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden">
                <Image
                  src={showcaseItems[1].image}
                  alt="Side preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
