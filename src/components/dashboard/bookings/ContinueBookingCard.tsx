"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, X, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingBookingInfo {
  date: string | null;
  timeSlot: string | null;
  duration: number;
  participants: number;
  selectedStudio: {
    id: string;
    name: string;
    location: { area: string; city: string };
    cover_image: string;
  } | null;
  selectedPackage: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
  selectedAddOns: { id: string; name: string; price: number }[];
  currentStep: number;
  selectedCity: string | null;
}

const PENDING_BOOKING_KEY = "yanisa_pending_booking";

const stepNames = [
  "City Selection",
  "Date & Time",
  "Select Studio",
  "Choose Package",
  "Add-ons",
  "Checkout",
  "Payment",
];

export function ContinueBookingCard() {
  const router = useRouter();
  const [pendingBooking, setPendingBooking] = useState<PendingBookingInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PENDING_BOOKING_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.selectedStudio || parsed.date || parsed.currentStep > 0) {
          setPendingBooking(parsed);
        }
      } catch {
        setPendingBooking(null);
      }
    }
  }, []);

  const handleContinue = () => {
    router.push("/book");
  };

  const handleDiscard = () => {
    localStorage.removeItem(PENDING_BOOKING_KEY);
    setPendingBooking(null);
  };

  if (!pendingBooking) return null;

  const currentStepName = stepNames[pendingBooking.currentStep] || "Booking";
  const hasStudio = !!pendingBooking.selectedStudio;
  const hasDate = !!pendingBooking.date;
  const progress = hasStudio && hasDate ? "Almost done" : "In progress";

  return (
    <div className="bg-[#18181b] rounded-2xl border border-yellow-500/30 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Continue Your Booking</h3>
            <p className="text-white/50 text-sm">{progress} • Step {pendingBooking.currentStep + 1}</p>
          </div>
        </div>
        <button
          onClick={handleDiscard}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/40" />
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {pendingBooking.selectedStudio && (
          <div className="flex items-center gap-3">
            <img
              src={pendingBooking.selectedStudio.cover_image}
              alt={pendingBooking.selectedStudio.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{pendingBooking.selectedStudio.name}</p>
              <p className="text-white/40 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {pendingBooking.selectedStudio.location.area}, {pendingBooking.selectedStudio.location.city}
              </p>
            </div>
          </div>
        )}

        {pendingBooking.date && (
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(pendingBooking.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              {pendingBooking.timeSlot && ` at ${pendingBooking.timeSlot}`}
              {pendingBooking.duration && ` • ${pendingBooking.duration} hour${pendingBooking.duration > 1 ? "s" : ""}`}
            </span>
          </div>
        )}

        {pendingBooking.selectedPackage && (
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-sm">Package: {pendingBooking.selectedPackage.name}</span>
          </div>
        )}

        {pendingBooking.selectedAddOns.length > 0 && (
          <div className="flex items-center gap-2 text-white/70">
            <span className="text-sm">Add-ons: {pendingBooking.selectedAddOns.map(a => a.name).join(", ")}</span>
          </div>
        )}

        <div className="pt-2">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            Current: {currentStepName}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleContinue}
          className="flex-1 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold"
        >
          Continue Booking
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={handleDiscard}
          variant="outline"
          className="border-white/10 text-white/60 hover:bg-white/10"
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
