"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const creatorImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200",
];

export function BookStudioBanner() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Floating creator photos - Top row */}
      <div className="absolute top-0 left-0 right-0 flex justify-around gap-4 -translate-y-1/2">
        {creatorImages.slice(0, 5).map((img, i) => (
          <div
            key={`top-${i}`}
            className="w-24 h-32 sm:w-32 sm:h-40 rounded-2xl overflow-hidden shadow-xl"
          >
            <Image
              src={img}
              alt={`Creator ${i + 1}`}
              width={128}
              height={160}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
        {/* Left floating photo */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-40 h-52 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={creatorImages[0]}
              alt="Creator"
              width={160}
              height={208}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right floating photo */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-40 h-52 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={creatorImages[1]}
              alt="Creator"
              width={160}
              height={208}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9FC67] to-[#B8E050]">
            Book a studio
          </span>
        </h2>
        <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
          Starting from ₹2,500
        </p>
        <Link href="/book">
          <Button 
            size="lg"
            className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black"
          >
            Book a studio
          </Button>
        </Link>
      </div>

      {/* Floating creator photos - Bottom row */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around gap-4 translate-y-1/2">
        {creatorImages.slice(5, 10).map((img, i) => (
          <div
            key={`bottom-${i}`}
            className="w-24 h-32 sm:w-32 sm:h-40 rounded-2xl overflow-hidden shadow-xl"
          >
            <Image
              src={img}
              alt={`Creator ${i + 6}`}
              width={128}
              height={160}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

