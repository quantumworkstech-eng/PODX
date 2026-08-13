"use client";

import { useEffect, useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Images, Loader2, Users } from "lucide-react";
import Image from "next/image";
import type { Studio, StudioSetupOption } from "@/lib/types";
import { enrichStudioForBooking } from "@/lib/enrich-studio";
import { cn } from "@/lib/utils";

/** Rooms configured for the studio, falling back to gallery photos for studios
 *  that have no rooms set up yet (so the step is never a dead end). */
export function getStudioSetupOptions(studio: Studio | null): StudioSetupOption[] {
  if (!studio) return [];

  const rooms = (studio.setup_options || []).filter((option) => option.image_url);
  if (rooms.length > 0) return rooms;

  const seen = new Set<string>();
  const gallery: StudioSetupOption[] = [];
  for (const imageUrl of [studio.cover_image, ...(studio.image_urls || [])]) {
    if (!imageUrl || seen.has(imageUrl)) continue;
    seen.add(imageUrl);
    gallery.push({
      id: `gallery-${gallery.length}`,
      name: gallery.length === 0 ? "Primary studio setup" : `Studio setup ${gallery.length + 1}`,
      description: studio.description,
      image_url: imageUrl,
      capacity: studio.capacity,
    });
  }
  return gallery.slice(0, 6);
}

export function SetupStep() {
  const { selectedStudio, setSelectedStudio, selectedSetup, setSelectedSetup, nextStep } =
    useBooking();
  const [enrichFailedFor, setEnrichFailedFor] = useState<string | null>(null);

  // Studios deep-linked via ?studio= / ?preselect=1 skip StudioStep, so they arrive
  // here without rooms or booking inventory. Fill them in before rendering setups.
  const needsEnrich = !!selectedStudio?.id && selectedStudio.setup_options === undefined;

  useEffect(() => {
    if (!needsEnrich || !selectedStudio) return;
    let cancelled = false;
    enrichStudioForBooking(selectedStudio).then((enriched) => {
      if (cancelled) return;
      // enrichStudioForBooking hands back the same object when the fetch fails —
      // record that so we fall back to gallery photos instead of spinning forever.
      if (enriched === selectedStudio) setEnrichFailedFor(selectedStudio.id);
      else setSelectedStudio(enriched);
    });
    return () => {
      cancelled = true;
    };
  }, [needsEnrich, selectedStudio, setSelectedStudio]);

  const enriching = needsEnrich && enrichFailedFor !== selectedStudio?.id;
  const setups = getStudioSetupOptions(selectedStudio);

  const handleSelect = (setup: StudioSetupOption) => {
    setSelectedSetup(setup);
    // Brief pause so the selected state is visible before advancing
    setTimeout(() => nextStep(), 150);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Choose Your Setup</h1>
        <p className="text-white/60 text-lg">
          {selectedStudio
            ? `Pick the room you'd like to record in at ${selectedStudio.name}`
            : "Pick the room you'd like to record in"}
        </p>
      </div>

      {enriching ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#D9FC67] animate-spin" />
        </div>
      ) : setups.length === 0 ? (
        <div className="max-w-md mx-auto text-center rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <Images className="w-8 h-8 text-[#D9FC67] mx-auto mb-4" />
          <h2 className="text-white font-semibold mb-2">One setup available</h2>
          <p className="text-white/50 text-sm mb-6">
            This studio has a single recording setup, so there is nothing to choose here.
          </p>
          <Button
            onClick={nextStep}
            className="px-8 py-5 text-base font-semibold bg-[#D9FC67] text-black hover:bg-[#c8eb5a] rounded-xl gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {setups.map((setup) => {
            const isSelected = selectedSetup?.id === setup.id;
            const photoCount = setup.images?.length ?? 0;

            return (
              <div
                key={setup.id}
                className={cn(
                  "group flex flex-col rounded-2xl border overflow-hidden bg-[#0a0a0a] transition-all duration-300",
                  isSelected
                    ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/30 shadow-lg shadow-[#D9FC67]/10"
                    : "border-white/10 hover:border-white/30"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(setup)}
                  className="relative aspect-[4/3] overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FC67]/40"
                >
                  <Image
                    src={setup.image_url}
                    alt={setup.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {isSelected && (
                    <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#D9FC67] text-black">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  )}
                  {photoCount > 1 && (
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/75 backdrop-blur-sm">
                      <Images className="h-3 w-3" />
                      {photoCount} photos
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-semibold text-white leading-tight">{setup.name}</h3>
                  {setup.description ? (
                    <p className="mt-1.5 text-sm text-white/45 line-clamp-2">{setup.description}</p>
                  ) : null}

                  {setup.capacity ? (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
                      <Users className="h-3.5 w-3.5 text-white/35" />
                      Seats up to {setup.capacity} people
                    </div>
                  ) : null}

                  <div className="mt-auto pt-4">
                    <Button
                      onClick={() => handleSelect(setup)}
                      className={cn(
                        "w-full py-5 text-sm font-semibold rounded-xl gap-2 transition-all",
                        isSelected
                          ? "bg-[#D9FC67] text-black hover:bg-[#c8eb5a]"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          Selected — Continue
                        </>
                      ) : (
                        <>
                          Select &amp; Continue
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
