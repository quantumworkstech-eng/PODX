"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getAllStudios } from "@/lib/data";
import type { Studio } from "@/lib/types";

export function StudioSection() {
  const [activeStudio, setActiveStudio] = useState(0);
  const [studios, setStudios] = useState<Studio[]>([]);

  useEffect(() => {
    setStudios(getAllStudios());
  }, []);

  if (studios.length === 0) return null;
  
  const currentStudio = studios[activeStudio];

  return (
    <section id="studios" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Book a Podcast Studio in Mumbai
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            The widest range of world-class podcast studios in Mumbai. Customize with props 
            and branding elements, or enjoy a plug-and-play experience where you just show up and record.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {studios.map((studio, index) => (
            <button
              key={studio.id}
              onClick={() => setActiveStudio(index)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeStudio === index
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {studio.name}
            </button>
          ))}
        </div>

        {/* Studio Carousel */}
        <div className="relative">
          {/* Side previews */}
          <div className="absolute left-0 top-0 bottom-0 w-48 hidden xl:flex items-center z-10">
            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden opacity-30">
              <Image
                src={studios[(activeStudio - 1 + studios.length) % studios.length].cover_image}
                alt="Previous studio"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-48 hidden xl:flex items-center z-10">
            <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden opacity-30">
              <Image
                src={studios[(activeStudio + 1) % studios.length].cover_image}
                alt="Next studio"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={() => setActiveStudio((activeStudio - 1 + studios.length) % studios.length)}
            className="absolute left-4 xl:left-52 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button 
            onClick={() => setActiveStudio((activeStudio + 1) % studios.length)}
            className="absolute right-4 xl:right-52 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Main Studio Card */}
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-3xl overflow-hidden">
              <Image
                src={currentStudio.cover_image}
                alt={currentStudio.name}
                fill
                className="object-cover"
              />
              
              {/* PodX Watermark */}
              <div className="absolute top-6 left-6">
                <span className="text-white/80 text-xl font-bold">podX</span>
              </div>

              {/* Studio Name */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-5xl sm:text-6xl font-bold text-white mb-4">
                  {currentStudio.name}
                </h3>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-5 h-5 text-[#D9FC67]" />
                  <span>{currentStudio.location.area} - {currentStudio.location.city}</span>
                </div>
              </div>

              {/* Book Now Button */}
              <div className="absolute bottom-8 right-8">
                <Link href={`/studio/${currentStudio.slug}`}>
                  <Button 
                    size="lg"
                    className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] border-0 rounded-full text-black"
                  >
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
