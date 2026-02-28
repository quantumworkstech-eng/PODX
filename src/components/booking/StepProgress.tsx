"use client";

import { useBooking } from "@/context/BookingContext";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const stepsDateFirst = [
  { number: 1, title: "Date & Time" },
  { number: 2, title: "Studio" },
  { number: 3, title: "Package" },
  { number: 4, title: "Add-ons" },
  { number: 5, title: "Review" },
];

const stepsStudioFirst = [
  { number: 1, title: "Studio" },
  { number: 2, title: "Date & Time" },
  { number: 3, title: "Package" },
  { number: 4, title: "Add-ons" },
  { number: 5, title: "Review" },
];

export function StepProgress() {
  const { currentStep, goToStep, showPayment, selectionMode } = useBooking();

  if (showPayment) return null;

  const steps = selectionMode === "studio" ? stepsStudioFirst : stepsDateFirst;

  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <button
                onClick={() => step.number < currentStep && goToStep(step.number)}
                disabled={step.number > currentStep}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  step.number <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    step.number < currentStep
                      ? "bg-[#D9FC67] text-black"
                      : step.number === currentStep
                      ? "bg-[#D9FC67] text-black ring-4 ring-[#D9FC67]/20"
                      : "bg-white/10 text-white/50 border border-white/20"
                  )}
                >
                  {step.number < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "hidden sm:block text-sm font-medium transition-colors",
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
                    "flex-1 h-[2px] mx-4 transition-colors",
                    step.number < currentStep ? "bg-[#D9FC67]" : "bg-white/20"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
