"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import { getAllStudios } from "@/lib/data";
import type { Studio } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { VideoModal } from "@/components/booking/VideoModal";

export function StudioStep() {
  const { selectedStudio, setSelectedStudio, participants, nextStep, prevStep, canProceed } = useBooking();
  const [videoStudio, setVideoStudio] = useState<{ name: string; videoUrl?: string } | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]);

  useEffect(() => {
    setStudios(getAllStudios());
  }, []);

  const isStudioAvailable = () => true;

  const canAccommodate = (capacity: number) => capacity >= participants;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Choose Your Studio
        </h1>
        <p className="text-white/60 text-lg">
          Select a studio that fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios.slice(0, 6).map((studio) => {
          const available = isStudioAvailable();
          const canFit = canAccommodate(studio.capacity);
          const isSelected = selectedStudio?.id === studio.id;
          const disabled = !available || !canFit;

          return (
            <div
              key={studio.id}
              className={cn(
                "relative group rounded-2xl border overflow-hidden transition-all duration-300",
                isSelected
                  ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30"
                  : disabled
                  ? "border-white/10 opacity-60"
                  : "border-white/10 hover:border-white/30"
              )}
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={studio.cover_image}
                  alt={studio.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <button
                  onClick={() => setVideoStudio({ name: studio.name })}
                  className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  1 min video
                </button>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#D9FC67] flex items-center justify-center">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                )}

                {!available && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      Full for selected time
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-white">{studio.name}</h3>
                </div>
              </div>

              <div className="p-5 bg-[#0a0a0a]">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{studio.location.area}, {studio.location.city}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className={cn(
                      "text-sm font-medium",
                      canFit ? "text-white" : "text-red-400"
                    )}>
                      Up to {studio.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="text-white text-sm font-medium">{studio.rating}</span>
                    <span className="text-white/50 text-sm">({studio.review_count})</span>
                  </div>
                </div>

                <p className="text-white/50 text-sm mb-4 line-clamp-2">
                  {studio.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">₹{studio.price_per_hour.toLocaleString()}</span>
                    <span className="text-white/50 text-sm">/hour</span>
                  </div>
                  <Button
                    onClick={() => setSelectedStudio(studio)}
                    disabled={disabled}
                    className={cn(
                      "px-6 font-semibold transition-all",
                      isSelected
                        ? "bg-[#D9FC67] text-black hover:bg-[#c8eb5a]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50"
        >
          Continue to Package
        </Button>
      </div>

      <VideoModal
        isOpen={!!videoStudio}
        onClose={() => setVideoStudio(null)}
        studioName={videoStudio?.name || ""}
      />
    </div>
  );
}
