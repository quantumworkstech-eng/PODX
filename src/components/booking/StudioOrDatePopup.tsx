"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioOrDatePopupProps {
  onSelectStudio: () => void;
  onSelectDate: () => void;
  onBack?: () => void;
}

export function StudioOrDatePopup({ onSelectStudio, onSelectDate, onBack }: StudioOrDatePopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            How would you like to book?
          </h2>
          <p className="text-white/60">
            Select your studio first or pick your preferred date & time
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={onSelectDate}
            className="group p-6 rounded-2xl border-2 border-white/10 hover:border-[#D9FC67] bg-white/5 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#D9FC67]/20 flex items-center justify-center mb-4 group-hover:bg-[#D9FC67]/30 transition-colors">
              <Calendar className="w-7 h-7 text-[#D9FC67]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Select Date First</h3>
            <p className="text-white/50 text-sm mb-4">
              Choose your preferred date and time, then we'll show available studios
            </p>
            <div className="flex items-center text-[#D9FC67] font-medium">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          <button
            onClick={onSelectStudio}
            className="group p-6 rounded-2xl border-2 border-white/10 hover:border-[#D9FC67] bg-white/5 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#D9FC67]/20 flex items-center justify-center mb-4 group-hover:bg-[#D9FC67]/30 transition-colors">
              <Building2 className="w-7 h-7 text-[#D9FC67]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Select Studio First</h3>
            <p className="text-white/50 text-sm mb-4">
              Browse our studios and pick one, then choose your booking time
            </p>
            <div className="flex items-center text-[#D9FC67] font-medium">
              Browse Studios <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
