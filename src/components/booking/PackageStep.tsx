"use client";

import { useBooking } from "@/context/BookingContext";
import { SERVICE_PACKAGES } from "@/lib/booking-types";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PackageStep() {
  const { selectedPackage, setSelectedPackage, nextStep, prevStep, canProceed, duration } = useBooking();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Choose Your Package
        </h1>
        <p className="text-white/60 text-lg">
          Select the level of service you need
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {SERVICE_PACKAGES.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;
          const totalPrice = pkg.price_per_hour * duration;

          return (
            <div
              key={pkg.id}
              className={cn(
                "relative rounded-2xl border overflow-hidden transition-all duration-300",
                pkg.is_popular
                  ? "border-[#D9FC67] ring-2 ring-[#D9FC67]/20"
                  : "border-white/10",
                isSelected && "ring-2 ring-[#D9FC67]"
              )}
            >
              {pkg.is_popular && (
                <div className="absolute top-0 right-0 bg-[#D9FC67] text-black px-4 py-1.5 text-xs font-bold rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  BEST DEAL
                </div>
              )}

              <div className={cn(
                "p-6",
                pkg.is_popular ? "bg-[#D9FC67]/10" : "bg-white/5"
              )}>
                <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-white/60 text-sm mb-4">{pkg.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {pkg.price_per_hour > 0 && (
                      <span className="text-white/50 text-lg line-through">
                        +₹{pkg.price_per_hour}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-white">
                      {pkg.price_per_hour === 0 ? "Included" : `+₹${pkg.price_per_hour}`}
                    </span>
                    {pkg.price_per_hour > 0 && (
                      <span className="text-white/50">/hour</span>
                    )}
                  </div>
                  {pkg.price_per_hour > 0 && (
                    <p className="text-white/40 text-sm mt-1">
                      Total: +₹{totalPrice.toLocaleString()} for {duration} hour{duration > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#D9FC67]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-red-400" />
                        </div>
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included ? "text-white" : "text-white/40"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "w-full py-6 text-base font-semibold transition-all",
                    isSelected
                      ? "bg-[#D9FC67] text-black hover:bg-[#c8eb5a]"
                      : pkg.is_popular
                      ? "bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {isSelected ? "Selected" : "Select & Continue"}
                </Button>
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
          Continue to Add-ons
        </Button>
      </div>
    </div>
  );
}
