"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import { StepProgress } from "@/components/booking/StepProgress";
import { DateTimeStep } from "@/components/booking/DateTimeStep";
import { StudioStep } from "@/components/booking/StudioStep";
import { PackageStep } from "@/components/booking/PackageStep";
import { AddOnsStep } from "@/components/booking/AddOnsStep";
import { CheckoutStep } from "@/components/booking/CheckoutStep";
import { PaymentStep } from "@/components/booking/PaymentStep";
import { AuthModal } from "@/components/booking/AuthModal";
import { CitySelection } from "@/components/booking/CitySelection";
import { StudioOrDatePopup } from "@/components/booking/StudioOrDatePopup";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "podx_onboarding_complete";
const SELECTION_MODE_KEY = "podx_selection_mode";
const PENDING_BOOKING_KEY = "podx_pending_booking";

function BookingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const {
    currentStep,
    showAuthModal,
    showPayment,
    closeAuthModal,
    setAuthenticated,
    proceedToPayment,
    saveBookingToStorage,
    prevStep,
    selectedCity,
    setSelectedCity,
    selectionMode,
    setSelectionMode,
  } = useBooking();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Pre-fill city in CitySelection when returning user hasn't made real progress
  const [initialCity, setInitialCity] = useState<string | undefined>(undefined);

  // Hydrate from stored state on first mount
  useEffect(() => {
    setHydrated(true);

    const storedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    const storedMode = localStorage.getItem(SELECTION_MODE_KEY);
    const storedBooking = localStorage.getItem(PENDING_BOOKING_KEY);

    // Only skip city selection when user has made real booking progress:
    // both a studio AND a date are already selected (mid-booking resume).
    if (storedBooking) {
      try {
        const parsed = JSON.parse(storedBooking);
        if (parsed.selectedStudio && parsed.date) {
          if (parsed.selectedCity) setSelectedCity(parsed.selectedCity);
          if (parsed.selectionMode) setSelectionMode(parsed.selectionMode);
          return; // resume mid-booking — skip city selection
        }
      } catch {
        // ignore malformed storage
      }
    }

    // Always show city selection. Pre-fill city if previously chosen.
    if (storedOnboarding) setInitialCity(storedOnboarding);
    setShowOnboarding(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If user becomes authenticated while auth modal is open, proceed to payment
  useEffect(() => {
    if (status === "authenticated" && session && showAuthModal) {
      setAuthenticated(true);
      proceedToPayment();
    }
  }, [status, session, showAuthModal, setAuthenticated, proceedToPayment]);

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    closeAuthModal();
    proceedToPayment();
  };

  const handleGoBack = () => {
    if (showPayment) {
      prevStep();
      return;
    }
    if (currentStep > 1) {
      prevStep();
      return;
    }
    // Step 1 → back to city + mode selection
    setShowOnboarding(true);
    setShowSelectionPopup(false);
  };

  const handleCitySelect = (city: string, mode?: "studio" | "date") => {
    localStorage.setItem(ONBOARDING_KEY, city);
    setSelectedCity(city);
    if (mode) {
      localStorage.setItem(SELECTION_MODE_KEY, mode);
      setSelectionMode(mode);
      setShowOnboarding(false);
      setShowSelectionPopup(false);
    }
    // If no mode yet (shouldn't happen with new CitySelection but guard anyway)
    // just keep showing onboarding so user can pick mode
  };

  const handleSelectStudio = () => {
    localStorage.setItem(SELECTION_MODE_KEY, "studio");
    setSelectionMode("studio");
    setShowSelectionPopup(false);
  };

  const handleSelectDate = () => {
    localStorage.setItem(SELECTION_MODE_KEY, "date");
    setSelectionMode("date");
    setShowSelectionPopup(false);
  };

  const renderStep = () => {
    if (showPayment) {
      return <PaymentStep />;
    }

    if (selectionMode === "studio") {
      switch (currentStep) {
        case 1:
          return <StudioStep />;
        case 2:
          return <DateTimeStep />;
        case 3:
          return <PackageStep />;
        case 4:
          return <AddOnsStep />;
        case 5:
          return <CheckoutStep />;
        default:
          return <StudioStep />;
      }
    }

    switch (currentStep) {
      case 1:
        return <DateTimeStep />;
      case 2:
        return <StudioStep />;
      case 3:
        return <PackageStep />;
      case 4:
        return <AddOnsStep />;
      case 5:
        return <CheckoutStep />;
      default:
        return <DateTimeStep />;
    }
  };

  // Wait for hydration before showing onboarding state
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return <CitySelection onComplete={handleCitySelect} initialCity={initialCity} />;
  }

  // showSelectionPopup kept as fallback (legacy) — shouldn't trigger anymore
  if (showSelectionPopup) {
    return (
      <StudioOrDatePopup
        onSelectStudio={handleSelectStudio}
        onSelectDate={handleSelectDate}
        onBack={() => {
          setShowSelectionPopup(false);
          setShowOnboarding(true);
        }}
      />
    );
  }

  // Back button shown on every booking step so user can always go back to city selection
  const showBackButton = true;

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl font-bold tracking-tight text-white">
                  p<span className="text-[#D9FC67]">o</span>dX
                </span>
              </Link>
            )}
            {selectedCity && (
              <span className="text-white/40 text-sm hidden sm:inline">
                {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
              </span>
            )}
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              Exit Booking
            </Button>
          </Link>
        </div>
      </header>

      {!showPayment && selectionMode && <StepProgress />}

      <main className="pb-16">{renderStep()}</main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onSaveBooking={saveBookingToStorage}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <BookingProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <BookingContent />
      </Suspense>
    </BookingProvider>
  );
}
