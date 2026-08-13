"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import type { PartnerBrandingBasic } from "@/context/BookingContext";
import { StepProgress } from "@/components/booking/StepProgress";
import { DateTimeStep } from "@/components/booking/DateTimeStep";
import { StudioStep } from "@/components/booking/StudioStep";
import { PackageStep } from "@/components/booking/PackageStep";
import { SetupStep } from "@/components/booking/SetupStep";
import { AddOnsStep } from "@/components/booking/AddOnsStep";
import { CheckoutStep } from "@/components/booking/CheckoutStep";
import { PaymentStep } from "@/components/booking/PaymentStep";
import { AuthModal } from "@/components/booking/AuthModal";
import { CitySelection } from "@/components/booking/CitySelection";
import { StudioOrDatePopup } from "@/components/booking/StudioOrDatePopup";
import { getStudioBySlug } from "@/lib/data";
import { bookingStepKeyAt, bookingStepNumber } from "@/lib/booking-flow-steps";
import {
  BOOKING_ONBOARDING_KEY,
  BOOKING_SELECTION_MODE_KEY,
  BOOKING_PENDING_KEY,
  BOOKING_PRESELECT_STUDIO_KEY,
} from "@/lib/booking-flow-storage";
import Link from "next/link";

/** Align with CitySelection / StudioStep: city id is slug-like, lowercased */
function cityKeyFromStudioLocation(studio: { location?: { city?: string } } | null): string | null {
  const raw = studio?.location?.city?.trim();
  if (!raw) return null;
  return raw.toLowerCase();
}

function BookingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
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
    setSelectedStudio,
    goToStep,
    setPartnerContext,
    setPartnerBranding,
    partnerBranding,
    partnerSlug,
    resetBooking,
  } = useBooking();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [initialCity, setInitialCity] = useState<string | undefined>(undefined);
  const [loadingFromUrl, setLoadingFromUrl] = useState(false);

  // Hydrate and handle URL params on first mount
  useEffect(() => {
    setHydrated(true);

    const studioParam = searchParams.get("studio");
    const partnerParam = searchParams.get("partner");
    const sourceParam = searchParams.get("source") as "marketplace" | "whitelabel" | "partner_direct" | null;

    // Handle partner context from URL
    if (partnerParam) {
      setPartnerContext(partnerParam, null, sourceParam || "whitelabel");
      // Fetch and apply partner branding
      fetch(`/api/whitelabel/${partnerParam}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.branding) {
            setPartnerBranding(data.branding as PartnerBrandingBasic);
          }
        })
        .catch(() => {/* ignore */});
    }

    // Handle "Book Now" from white-label page — studio pre-selected via URL param
    if (studioParam) {
      setLoadingFromUrl(true);
      getStudioBySlug(studioParam).then((studio) => {
        if (studio) {
          setSelectedStudio(studio);
          const ck = cityKeyFromStudioLocation(studio);
          if (ck) {
            setSelectedCity(ck);
            localStorage.setItem(BOOKING_ONBOARDING_KEY, ck);
          }
          setSelectionMode("studio");
          localStorage.setItem(BOOKING_SELECTION_MODE_KEY, "studio");
          goToStep(bookingStepNumber("studio", "setup")); // studio is picked — start at Setup
        }
      }).catch(() => {/* ignore */}).finally(() => setLoadingFromUrl(false));
      // Don't show city selection while we fetch the studio
      return;
    }

    // Handle "Book Now" from studio listing — studio pre-selected, skip to date/time
    const preselect = searchParams.get("preselect");
    if (preselect === "1") {
      const raw = sessionStorage.getItem(BOOKING_PRESELECT_STUDIO_KEY);
      if (raw) {
        try {
          const studio = JSON.parse(raw);
          // Do not remove sessionStorage here — React Strict Mode runs this effect twice;
          // removing early clears data before the second run. Each "Book Now" overwrites the key.
          setSelectedStudio(studio);
          const ck = cityKeyFromStudioLocation(studio);
          if (ck) {
            setSelectedCity(ck);
            localStorage.setItem(BOOKING_ONBOARDING_KEY, ck);
          }
          setSelectionMode("studio");
          localStorage.setItem(BOOKING_SELECTION_MODE_KEY, "studio");
          goToStep(bookingStepNumber("studio", "setup"));
          return;
        } catch {
          // fall through to normal onboarding
        }
      }
    }

    const storedOnboarding = localStorage.getItem(BOOKING_ONBOARDING_KEY);
    const storedBooking = localStorage.getItem(BOOKING_PENDING_KEY);

    if (storedBooking) {
      try {
        const parsed = JSON.parse(storedBooking);
        if (parsed.selectedStudio && parsed.date) {
          if (parsed.selectedCity) setSelectedCity(parsed.selectedCity);
          if (parsed.selectionMode) setSelectionMode(parsed.selectionMode);
          return;
        }
      } catch {
        // ignore malformed storage
      }
    }

    if (storedOnboarding) setInitialCity(storedOnboarding);
    setShowOnboarding(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user becomes authenticated while auth modal is open, proceed to payment
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
    // If partner context is active, go back to white-label page
    if (partnerSlug) {
      router.push(`/p/${partnerSlug}`);
      return;
    }
    setShowOnboarding(true);
    setShowSelectionPopup(false);
  };

  const handleCitySelect = (city: string, mode?: "studio" | "date") => {
    localStorage.setItem(BOOKING_ONBOARDING_KEY, city);
    setSelectedCity(city);
    if (mode) {
      localStorage.setItem(BOOKING_SELECTION_MODE_KEY, mode);
      setSelectionMode(mode);
      setShowOnboarding(false);
      setShowSelectionPopup(false);
    }
  };

  const handleSelectStudio = () => {
    localStorage.setItem(BOOKING_SELECTION_MODE_KEY, "studio");
    setSelectionMode("studio");
    setShowSelectionPopup(false);
  };

  const handleSelectDate = () => {
    localStorage.setItem(BOOKING_SELECTION_MODE_KEY, "date");
    setSelectionMode("date");
    setShowSelectionPopup(false);
  };

  const renderStep = () => {
    if (showPayment) {
      return <PaymentStep />;
    }

    switch (bookingStepKeyAt(selectionMode, currentStep)) {
      case "studio":
        return <StudioStep />;
      case "setup":
        return <SetupStep />;
      case "datetime":
        return <DateTimeStep />;
      case "package":
        return <PackageStep />;
      case "addons":
        return <AddOnsStep />;
      case "review":
        return <CheckoutStep />;
      default:
        return selectionMode === "studio" ? <StudioStep /> : <DateTimeStep />;
    }
  };

  if (!hydrated || loadingFromUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboarding && !partnerSlug) {
    return <CitySelection onComplete={handleCitySelect} initialCity={initialCity} />;
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

  // Partner branding colors (with fallbacks)
  const wlPrimary = partnerBranding?.primary_color || "#D9FC67";
  const wlSecondary = partnerBranding?.secondary_color || "";
  const isPartnerMode = !!partnerSlug && !!partnerBranding;

  return (
    <div className="min-h-screen bg-black">
      {/* ── Booking header ── */}
      <header
        className="border-b sticky top-0 z-50 backdrop-blur-sm"
        style={isPartnerMode ? {
          background: wlSecondary || "#0a0a0a",
          borderColor: "rgba(255,255,255,0.08)",
        } : {
          background: "rgba(0,0,0,0.8)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-center sm:justify-start gap-3">
          {/* Logo (and city) only — Back / Exit live on the step row */}
          {isPartnerMode ? (
            partnerBranding.logo_url ? (
              <img
                src={partnerBranding.logo_url}
                alt={partnerBranding.brand_name}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: wlPrimary }}>
                {partnerBranding.brand_name}
              </span>
            )
          ) : (
            <Link
              href="/"
              onClick={() => resetBooking()}
              className="flex items-center gap-2 group"
            >
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                Yanisa <span className="text-[#D9FC67]">Studios</span>
              </span>
            </Link>
          )}
          {selectedCity && !isPartnerMode && (
            <span className="text-white/40 text-sm hidden sm:inline">
              {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
            </span>
          )}
        </div>
      </header>

      {selectionMode && (
        <StepProgress
          onBack={handleGoBack}
          onExit={() => {
            resetBooking();
            router.push("/");
          }}
          showSteps={!showPayment}
        />
      )}

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
