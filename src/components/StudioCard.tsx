"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Studio } from "@/lib/types";
import { BOOKING_PENDING_KEY, BOOKING_PRESELECT_STUDIO_KEY } from "@/lib/booking-flow-storage";

interface StudioCardProps {
  studio: Studio;
}

export function StudioCard({ studio }: StudioCardProps) {
  const router = useRouter();
  // Parse tags from description (comma separated)
  const tags = studio.description.split(",").map(tag => tag.trim());

  const handleBookNow = () => {
    try {
      localStorage.removeItem(BOOKING_PENDING_KEY);
    } catch {
      /* ignore */
    }
    sessionStorage.setItem(BOOKING_PRESELECT_STUDIO_KEY, JSON.stringify(studio));
    router.push("/book?preselect=1");
  };

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={studio.cover_image}
          alt={studio.name}
          fill
          className="object-cover transition-transform duration-700"
          sizes="100vw"
          priority
        />
      </div>

      {/* Dark Overlay - stronger for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Content - Centered with header offset */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 z-10">
        {/* Capacity Badge */}
        <p className="text-sm uppercase tracking-[0.2em] text-white/90 mb-4 font-medium">
          Up to {studio.capacity} people
        </p>

        {/* Studio Name */}
        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
          {studio.name}
        </h2>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-4 py-2 rounded-full text-sm text-white font-medium bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white px-6 py-6"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch video
          </Button>
          <Button
            size="lg"
            className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 text-black"
            onClick={handleBookNow}
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Location Badge - Bottom Left */}
      <div className="absolute bottom-8 left-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full z-10">
        <span className="text-white/90 text-sm">
          {studio.location.area}, {studio.location.city}
        </span>
      </div>

      {/* Price Badge - Bottom Right */}
      {studio.price_per_hour > 0 && (
        <div className="absolute bottom-8 right-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full z-10">
          <span className="text-white font-semibold">
            from {studio.currency}{studio.price_per_hour.toLocaleString()}/hr
          </span>
        </div>
      )}
    </section>
  );
}
