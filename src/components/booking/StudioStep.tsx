"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import { getAllStudios } from "@/lib/data";
import type { Studio } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Check, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { VideoModal } from "@/components/booking/VideoModal";

function StudioCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-5 bg-[#0a0a0a] space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-7 bg-white/10 rounded-full w-20" />
          <div className="h-7 bg-white/10 rounded-full w-16" />
        </div>
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 bg-white/10 rounded w-24" />
          <div className="h-9 bg-white/10 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

export function StudioStep() {
  const {
    selectedStudio,
    setSelectedStudio,
    participants,
    nextStep,
    canProceed,
    selectionMode,
  } = useBooking();
  const [videoStudio, setVideoStudio] = useState<{ name: string } | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllStudios()
      .then((data) => {
        setStudios(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load studios. Please try again.");
        setLoading(false);
      });
  }, []);

  const canAccommodate = (capacity: number) => capacity >= participants;

  const nextStepLabel =
    selectionMode === "date" ? "Continue to Package" : "Continue to Date & Time";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Choose Your Studio</h1>
        <p className="text-white/60 text-lg">Select a studio that fits your needs</p>
      </div>

      {error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              getAllStudios()
                .then((data) => { setStudios(data); setLoading(false); })
                .catch(() => { setError("Failed to load studios. Please try again."); setLoading(false); });
            }}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StudioCardSkeleton key={i} />)
            : studios.slice(0, 6).map((studio) => {
                const canFit = canAccommodate(studio.capacity);
                const isSelected = selectedStudio?.id === studio.id;
                const disabled = !canFit;

                return (
                  <div
                    key={studio.id}
                    onClick={() => !disabled && setSelectedStudio(studio)}
                    className={cn(
                      "relative group rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer",
                      isSelected
                        ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30 shadow-lg shadow-[#D9FC67]/10"
                        : disabled
                        ? "border-white/10 opacity-50 cursor-not-allowed"
                        : "border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-black/30"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoStudio({ name: studio.name });
                        }}
                        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/60 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Preview
                      </button>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#D9FC67] flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}

                      {!canFit && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                            Capacity too small
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-xl font-bold text-white drop-shadow">{studio.name}</h3>
                      </div>
                    </div>

                    <div className="p-5 bg-[#0a0a0a]">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {studio.location.area}, {studio.location.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                            canFit
                              ? "bg-white/10 text-white/70"
                              : "bg-red-500/10 text-red-400"
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Up to {studio.capacity}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="text-white text-sm font-medium">{studio.rating}</span>
                          <span className="text-white/40 text-xs">({studio.review_count})</span>
                        </div>
                      </div>

                      <p className="text-white/40 text-sm mb-4 line-clamp-2">
                        {studio.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-white">
                            ₹{studio.price_per_hour.toLocaleString()}
                          </span>
                          <span className="text-white/40 text-sm">/hr</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) setSelectedStudio(isSelected ? null : studio);
                          }}
                          disabled={disabled}
                          className={cn(
                            "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-[#D9FC67] text-black"
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
        >
          {nextStepLabel}
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
