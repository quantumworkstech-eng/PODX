"use client";

import { useBooking } from "@/context/BookingContext";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { bookingSteps } from "@/lib/booking-flow-steps";

export interface StepProgressProps {
  onBack: () => void;
  onExit: () => void;
  /** False on payment screen — Back/Exit still show, step dots hidden */
  showSteps: boolean;
}

export function StepProgress({ onBack, onExit, showSteps }: StepProgressProps) {
  const { currentStep, goToStep, selectionMode } = useBooking();

  const steps = bookingSteps(selectionMode);

  return (
    <div className="w-full border-b border-white/10 bg-black/40 px-3 sm:px-4 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 sm:gap-2 text-white/60 hover:text-white transition-colors shrink-0 text-sm sm:text-base self-center"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex-1 min-w-0 flex items-center justify-center overflow-x-auto py-0.5">
          {showSteps ? (
            <div className="flex items-center justify-between w-full max-w-3xl min-w-[280px] sm:min-w-[340px]">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => step.number < currentStep && goToStep(step.number)}
                    disabled={step.number > currentStep}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 transition-all shrink-0",
                      step.number <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all",
                        step.number < currentStep
                          ? "bg-[#D9FC67] text-black"
                          : step.number === currentStep
                          ? "bg-[#D9FC67] text-black ring-2 sm:ring-4 ring-[#D9FC67]/20"
                          : "bg-white/10 text-white/50 border border-white/20"
                      )}
                    >
                      {step.number < currentStep ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden sm:block text-sm font-medium transition-colors truncate max-w-[5rem] lg:max-w-none",
                        step.number === currentStep
                          ? "text-white"
                          : step.number < currentStep
                          ? "text-white/80"
                          : "text-white/40"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-[2px] mx-1.5 sm:mx-3 min-w-[4px] transition-colors",
                        step.number < currentStep ? "bg-[#D9FC67]" : "bg-white/20"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-white/35 text-sm">Payment</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10 shrink-0 text-xs sm:text-sm px-2 sm:px-3 self-center"
          onClick={onExit}
        >
          <span className="hidden sm:inline">Exit Booking</span>
          <span className="sm:hidden">Exit</span>
        </Button>
      </div>
    </div>
  );
}
