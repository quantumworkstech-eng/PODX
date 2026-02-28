"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "podx_onboarding_complete";
const SELECTION_MODE_KEY = "podx_selection_mode";

function BookingContent() {
  const router = useRouter();
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

  useEffect(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(SELECTION_MODE_KEY);
    setShowOnboarding(true);
  }, []);

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

  const handleSaveBooking = () => {
    saveBookingToStorage();
  };

  const handleGoBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else if (selectionMode) {
      setShowSelectionPopup(true);
    } else if (showSelectionPopup) {
      setShowSelectionPopup(false);
      setShowOnboarding(true);
    }
  };

  const handleCitySelect = (city: string) => {
    localStorage.setItem(ONBOARDING_KEY, city);
    setSelectedCity(city);
    setShowOnboarding(false);
    setShowSelectionPopup(true);
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

  if (showOnboarding) {
    return <CitySelection onComplete={handleCitySelect} />;
  }

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

  const showBackButton = currentStep > 1 && !showPayment;

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
            ) : selectedCity ? (
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
            {selectedCity && !showBackButton && (
              <span className="text-white/60 text-sm">
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

      {!showPayment && <StepProgress />}

      <main className="pb-16">
        {renderStep()}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onSaveBooking={handleSaveBooking}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <BookingProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }>
        <BookingContent />
      </Suspense>
    </BookingProvider>
  );
}
