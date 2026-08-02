"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { Check, ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  BookingAddonsSection,
  AddOnsStepSearchInput,
} from "@/components/booking/BookingAddonsSection";
import { StudioBookingInventoryPanel } from "@/components/booking/StudioBookingInventoryPanel";
import type { Studio, StudioSetupOption } from "@/lib/types";
import { cn } from "@/lib/utils";

function getSetupOptions(studio: Studio | null): StudioSetupOption[] {
  if (!studio) return [];

  const seen = new Set<string>();
  const options: StudioSetupOption[] = [];
  const addOption = (option: StudioSetupOption) => {
    if (!option.image_url || seen.has(option.image_url)) return;
    seen.add(option.image_url);
    options.push(option);
  };

  for (const option of studio.setup_options || []) {
    addOption(option);
  }

  const gallery = [studio.cover_image, ...(studio.image_urls || [])].filter(Boolean);
  gallery.forEach((imageUrl, index) => {
    addOption({
      id: `gallery-${index}`,
      name: index === 0 ? "Primary studio setup" : `Studio setup ${index + 1}`,
      description: studio.description,
      image_url: imageUrl,
      capacity: studio.capacity,
    });
  });

  return options.slice(0, 6);
}

export function AddOnsStep() {
  const {
    selectedAddOns,
    nextStep,
    selectedStudio,
    selectedSetup,
    setSelectedSetup,
  } = useBooking();
  const [searchTerm, setSearchTerm] = useState("");
  const setupOptions = getSetupOptions(selectedStudio);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Add Extra Services</h1>
        <p className="text-white/60 text-lg">Choose only what you need, or skip this step.</p>
      </div>

      {selectedStudio && (
        <StudioBookingInventoryPanel
          className="mb-6"
          inventory={selectedStudio.booking_inventory}
          selectedAddOns={selectedAddOns}
        />
      )}
      {setupOptions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#D9FC67]" />
                Select your studio setup
              </h3>
              <p className="mt-1 text-xs text-white/45">
                Choose from the actual room photos available for this studio.
              </p>
            </div>
            {selectedSetup && (
              <button
                type="button"
                onClick={() => setSelectedSetup(null)}
                className="text-xs text-white/40 hover:text-white/75 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {setupOptions.map((setup) => {
              const selected = selectedSetup?.id === setup.id;
              return (
                <button
                  key={setup.id}
                  type="button"
                  onClick={() => setSelectedSetup(setup)}
                  className={cn(
                    "group overflow-hidden rounded-xl border text-left transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FC67]/40",
                    selected
                      ? "border-[#D9FC67] bg-[#D9FC67]/[0.06] ring-2 ring-[#D9FC67]/25"
                      : "border-white/10 bg-black/20 hover:border-white/25"
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={setup.image_url}
                      alt={setup.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {selected && (
                      <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#D9FC67] text-black">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-semibold text-white drop-shadow">{setup.name}</p>
                      {setup.capacity ? (
                        <p className="mt-0.5 text-xs text-white/65">Up to {setup.capacity} people</p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <AddOnsStepSearchInput value={searchTerm} onChange={setSearchTerm} />
      {selectedStudio && (
        <BookingAddonsSection
          key={selectedStudio.id}
          variant="step"
          searchTerm={searchTerm}
        />
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button
          onClick={nextStep}
          className="w-full sm:w-auto px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
        >
          Review Booking
        </Button>
        {selectedAddOns.length === 0 && (
          <button
            type="button"
            onClick={nextStep}
            className="text-white/40 hover:text-white/70 text-sm transition-colors underline underline-offset-4"
          >
            Skip, no add-ons needed
          </button>
        )}
      </div>
    </div>
  );
}
