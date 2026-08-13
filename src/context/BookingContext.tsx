"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Studio, StudioSetupOption } from "@/lib/types";
import { ServicePackage, AddOnService, TIME_SLOTS } from "@/lib/booking-types";
import {
  BOOKING_PENDING_KEY,
  clearAllBookingFlowStorage,
} from "@/lib/booking-flow-storage";
import { TOTAL_BOOKING_STEPS, bookingStepKeyAt } from "@/lib/booking-flow-steps";

interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

export interface PartnerBrandingBasic {
  brand_name: string;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  button_text_color: string;
  background_color: string;
  text_color: string;
  partner_id?: string;
}

interface BookingState {
  currentStep: number;
  date: Date | null;
  timeSlot: string | null;
  duration: number;
  participants: number;
  selectedStudio: Studio | null;
  selectedPackage: ServicePackage | null;
  selectedAddOns: AddOnService[];
  selectedSetup: StudioSetupOption | null;
  showAuthModal: boolean;
  isAuthenticated: boolean;
  showPayment: boolean;
  selectedCity: string | null;
  selectionMode: "studio" | "date" | null;
  appliedCoupon: AppliedCoupon | null;
  // White-label partner context
  partnerSlug: string | null;
  partnerId: string | null;
  bookingSource: "marketplace" | "whitelabel" | "partner_direct" | null;
  partnerBranding: PartnerBrandingBasic | null;
  // Tax invoice
  gstNumber: string;
  bookingNote: string;
}

interface StoredBooking {
  date: string | null;
  timeSlot: string | null;
  duration: number;
  participants: number;
  selectedStudio: Studio | null;
  selectedPackage: ServicePackage | null;
  selectedAddOns: AddOnService[];
  selectedSetup?: StudioSetupOption | null;
  currentStep: number;
  selectedCity: string | null;
  selectionMode: "studio" | "date" | null;
  showPayment: boolean;
  // White-label partner context
  partnerSlug: string | null;
  partnerId: string | null;
  bookingSource: "marketplace" | "whitelabel" | "partner_direct" | null;
  bookingNote?: string;
}

interface BookingContextType extends BookingState {
  setDate: (date: Date | null) => void;
  setTimeSlot: (time: string | null) => void;
  setDuration: (duration: number) => void;
  setParticipants: (count: number) => void;
  setSelectedStudio: (studio: Studio | null) => void;
  setSelectedPackage: (pkg: ServicePackage | null) => void;
  setSelectedSetup: (setup: StudioSetupOption | null) => void;
  addAddOn: (addOn: AddOnService) => void;
  removeAddOn: (addOnId: string) => void;
  toggleAddOn: (addOn: AddOnService) => void;
  updateAddOnQty: (addOnId: string, qty: number) => void;
  /** Drop selections not in this id set (e.g. studio’s available add-ons changed). */
  pruneAddOnsToIds: (allowedIds: Set<string>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetBooking: () => void;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getConvenienceFee: () => number;
  getStudioPrice: () => number;
  getPackagePrice: () => number;
  getAddOnsPrice: () => number;
  canProceed: () => boolean;
  availableTimeSlots: typeof TIME_SLOTS;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setAuthenticated: (value: boolean) => void;
  proceedToPayment: () => void;
  saveBookingToStorage: () => void;
  loadBookingFromStorage: () => StoredBooking | null;
  getPendingBookingInfo: () => StoredBooking | null;
  clearBookingStorage: () => void;
  setSelectedCity: (city: string | null) => void;
  setSelectionMode: (mode: "studio" | "date") => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  setGstNumber: (gst: string) => void;
  setBookingNote: (note: string) => void;
  // White-label partner context
  setPartnerContext: (slug: string | null, partnerId: string | null, source: "marketplace" | "whitelabel" | "partner_direct" | null) => void;
  setPartnerBranding: (branding: PartnerBrandingBasic | null) => void;
}

const TAX_RATE = 0.18; // 18% GST

const initialState: BookingState = {
  currentStep: 1,
  date: null,
  timeSlot: null,
  duration: 1,
  participants: 1,
  selectedStudio: null,
  selectedPackage: null,
  selectedAddOns: [],
  selectedSetup: null,
  showAuthModal: false,
  isAuthenticated: false,
  showPayment: false,
  selectedCity: null,
  selectionMode: null,
  appliedCoupon: null,
  partnerSlug: null,
  partnerId: null,
  bookingSource: null,
  partnerBranding: null,
  gstNumber: "",
  bookingNote: "",
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const [initialized, setInitialized] = useState(false);

  // Load from storage on mount once
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("fresh") === "1") {
        clearAllBookingFlowStorage();
        sp.delete("fresh");
        const qs = sp.toString();
        const path = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", path);
        return;
      }
      // Listing / landing "Book Now" applies preselect in BookingContent. If we restore
      // pending booking here we run after that effect and overwrite currentStep back to 1.
      if (sp.get("preselect") === "1" || sp.get("studio")) {
        return;
      }
    }

    const stored = localStorage.getItem(BOOKING_PENDING_KEY);
    if (!stored) return;

    try {
      const parsed: StoredBooking = JSON.parse(stored);
      // Only restore if there's meaningful booking data
      if (!parsed.selectedStudio && !parsed.date) return;

      setState((prev) => ({
        ...prev,
        date: parsed.date ? new Date(parsed.date) : null,
        timeSlot: parsed.timeSlot,
        duration: parsed.duration || 1,
        participants: parsed.participants || 1,
        selectedStudio: parsed.selectedStudio,
        selectedPackage: parsed.selectedPackage,
        selectedAddOns: parsed.selectedAddOns || [],
        selectedSetup: parsed.selectedSetup || null,
        currentStep: parsed.currentStep || 1,
        selectedCity: parsed.selectedCity,
        selectionMode: parsed.selectionMode,
        showPayment: parsed.showPayment || false,
        partnerSlug: parsed.partnerSlug || null,
        partnerId: parsed.partnerId || null,
        bookingSource: parsed.bookingSource || null,
        bookingNote: parsed.bookingNote || "",
      }));
    } catch {
      // Corrupt storage — ignore
    }
  }, [initialized]);

  const saveBookingToStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const data: StoredBooking = {
      date: state.date ? state.date.toISOString() : null,
      timeSlot: state.timeSlot,
      duration: state.duration,
      participants: state.participants,
      selectedStudio: state.selectedStudio,
      selectedPackage: state.selectedPackage,
      selectedAddOns: state.selectedAddOns,
      selectedSetup: state.selectedSetup,
      currentStep: state.currentStep,
      selectedCity: state.selectedCity,
      selectionMode: state.selectionMode,
      showPayment: state.showPayment,
      partnerSlug: state.partnerSlug,
      partnerId: state.partnerId,
      bookingSource: state.bookingSource,
      bookingNote: state.bookingNote,
    };
    localStorage.setItem(BOOKING_PENDING_KEY, JSON.stringify(data));
  }, [state]);

  const loadBookingFromStorage = useCallback((): StoredBooking | null => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(BOOKING_PENDING_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  const getPendingBookingInfo = useCallback((): StoredBooking | null => {
    return loadBookingFromStorage();
  }, [loadBookingFromStorage]);

  const clearBookingStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(BOOKING_PENDING_KEY);
    }
  }, []);

  const setDate = useCallback((date: Date | null) => {
    setState((prev) => ({ ...prev, date, timeSlot: null }));
  }, []);

  const setTimeSlot = useCallback((time: string | null) => {
    setState((prev) => ({ ...prev, timeSlot: time }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  const setParticipants = useCallback((participants: number) => {
    setState((prev) => ({ ...prev, participants }));
  }, []);

  const setSelectedStudio = useCallback((studio: Studio | null) => {
    setState((prev) => ({
      ...prev,
      selectedStudio: studio,
      selectedSetup: studio?.id === prev.selectedStudio?.id ? prev.selectedSetup : null,
    }));
  }, []);

  const setSelectedPackage = useCallback((pkg: ServicePackage | null) => {
    setState((prev) => ({ ...prev, selectedPackage: pkg }));
  }, []);

  const setSelectedSetup = useCallback((setup: StudioSetupOption | null) => {
    setState((prev) => ({ ...prev, selectedSetup: setup }));
  }, []);

  const addAddOn = useCallback((addOn: AddOnService) => {
    setState((prev) => {
      if (prev.selectedAddOns.find((a) => a.id === addOn.id)) {
        return prev;
      }
      return { ...prev, selectedAddOns: [...prev.selectedAddOns, addOn] };
    });
  }, []);

  const removeAddOn = useCallback((addOnId: string) => {
    setState((prev) => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.filter((a) => a.id !== addOnId),
    }));
  }, []);

  const toggleAddOn = useCallback((addOn: AddOnService) => {
    // Block adding out-of-stock addons
    if (addOn.maxQty != null && addOn.maxQty <= 0) return;
    setState((prev) => {
      const exists = prev.selectedAddOns.some((a) => a.id === addOn.id);
      if (exists) {
        return {
          ...prev,
          selectedAddOns: prev.selectedAddOns.filter((a) => a.id !== addOn.id),
        };
      }
      return { ...prev, selectedAddOns: [...prev.selectedAddOns, { ...addOn, qty: 1 }] };
    });
  }, []);

  const updateAddOnQty = useCallback((addOnId: string, qty: number) => {
    setState((prev) => {
      if (qty <= 0) {
        return { ...prev, selectedAddOns: prev.selectedAddOns.filter((a) => a.id !== addOnId) };
      }
      return {
        ...prev,
        selectedAddOns: prev.selectedAddOns.map((a) => {
          if (a.id !== addOnId) return a;
          const clampedQty = a.maxQty != null ? Math.min(qty, a.maxQty) : qty;
          return { ...a, qty: clampedQty };
        }),
      };
    });
  }, []);

  const pruneAddOnsToIds = useCallback((allowedIds: Set<string>) => {
    setState((prev) => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.filter((a) => allowedIds.has(a.id)),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_BOOKING_STEPS),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      // If on payment step, go back to the review step
      if (prev.showPayment) {
        return { ...prev, showPayment: false, currentStep: TOTAL_BOOKING_STEPS };
      }
      return { ...prev, currentStep: Math.max(prev.currentStep - 1, 1) };
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step, showPayment: false }));
  }, []);

  const resetBooking = useCallback(() => {
    clearAllBookingFlowStorage();
    setState({ ...initialState, appliedCoupon: null });
  }, []);

  const getStudioPrice = useCallback(() => {
    return 0;
  }, []);

  const getPackagePrice = useCallback(() => {
    if (!state.selectedPackage) return 0;
    return state.selectedPackage.price_per_hour * state.duration;
  }, [state.selectedPackage, state.duration]);

  const getAddOnsPrice = useCallback(() => {
    return state.selectedAddOns.reduce((sum, addOn) => sum + addOn.price * (addOn.qty ?? 1), 0);
  }, [state.selectedAddOns]);

  const getSubtotal = useCallback(() => {
    return getPackagePrice() + getAddOnsPrice();
  }, [getPackagePrice, getAddOnsPrice]);

  const getDiscount = useCallback(() => {
    return state.appliedCoupon?.discountAmount ?? 0;
  }, [state.appliedCoupon]);

  const getTax = useCallback(() => {
    const taxable = Math.max(0, getSubtotal() - getDiscount());
    return Math.round(taxable * TAX_RATE);
  }, [getSubtotal, getDiscount]);

  const getConvenienceFee = useCallback(() => {
    const preConvenience = Math.max(0, getSubtotal() - getDiscount()) + getTax();
    return Math.ceil(preConvenience * 0.02);
  }, [getSubtotal, getDiscount, getTax]);

  const getTotalPrice = useCallback(() => {
    return Math.max(0, getSubtotal() - getDiscount()) + getTax() + getConvenienceFee();
  }, [getSubtotal, getDiscount, getTax, getConvenienceFee]);

  const canProceed = useCallback(() => {
    switch (bookingStepKeyAt(state.selectionMode, state.currentStep)) {
      case "studio":
        return state.selectedStudio !== null;
      case "datetime":
        return state.date !== null && state.timeSlot !== null;
      case "package":
        return state.selectedPackage !== null;
      // Setup and extras are advanced from within their own screens.
      case "setup":
      case "addons":
        return true;
      case "review":
        return (
          state.selectedStudio !== null &&
          state.selectedPackage !== null &&
          state.date !== null &&
          state.timeSlot !== null
        );
      default:
        return false;
    }
  }, [
    state.currentStep,
    state.date,
    state.timeSlot,
    state.selectedStudio,
    state.selectedPackage,
    state.selectionMode,
  ]);

  const openAuthModal = useCallback(() => {
    setState((prev) => ({ ...prev, showAuthModal: true }));
  }, []);

  const closeAuthModal = useCallback(() => {
    setState((prev) => ({ ...prev, showAuthModal: false }));
  }, []);

  const setAuthenticated = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isAuthenticated: value, showAuthModal: false }));
  }, []);

  const proceedToPayment = useCallback(() => {
    setState((prev) => ({ ...prev, showPayment: true, showAuthModal: false }));
  }, []);

  const setSelectedCity = useCallback((city: string | null) => {
    setState((prev) => ({ ...prev, selectedCity: city }));
  }, []);

  const setSelectionMode = useCallback((mode: "studio" | "date") => {
    setState((prev) => ({ ...prev, selectionMode: mode }));
  }, []);

  const setAppliedCoupon = useCallback((coupon: AppliedCoupon | null) => {
    setState((prev) => ({ ...prev, appliedCoupon: coupon }));
  }, []);

  const setGstNumber = useCallback((gst: string) => {
    setState((prev) => ({ ...prev, gstNumber: gst }));
  }, []);

  const setBookingNote = useCallback((note: string) => {
    setState((prev) => ({ ...prev, bookingNote: note }));
  }, []);

  const setPartnerContext = useCallback(
    (slug: string | null, partnerId: string | null, source: "marketplace" | "whitelabel" | "partner_direct" | null) => {
      setState((prev) => ({ ...prev, partnerSlug: slug, partnerId, bookingSource: source }));
    },
    []
  );

  const setPartnerBranding = useCallback((branding: PartnerBrandingBasic | null) => {
    setState((prev) => ({
      ...prev,
      partnerBranding: branding,
      partnerId: branding?.partner_id ?? prev.partnerId,
    }));
  }, []);

  // Auto-save whenever booking state changes (debounced)
  useEffect(() => {
    if (!initialized) return;
    const hasBookingData = state.selectedStudio || state.date || state.currentStep > 1;
    if (!hasBookingData) return;

    const timeoutId = setTimeout(() => {
      saveBookingToStorage();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [state, saveBookingToStorage, initialized]);

  const value: BookingContextType = {
    ...state,
    setDate,
    setTimeSlot,
    setDuration,
    setParticipants,
    setSelectedStudio,
    setSelectedPackage,
    setSelectedSetup,
    addAddOn,
    removeAddOn,
    toggleAddOn,
    updateAddOnQty,
    pruneAddOnsToIds,
    nextStep,
    prevStep,
    goToStep,
    resetBooking,
    getTotalPrice,
    getSubtotal,
    getTax,
    getDiscount,
    getConvenienceFee,
    getStudioPrice,
    getPackagePrice,
    getAddOnsPrice,
    canProceed,
    availableTimeSlots: TIME_SLOTS,
    openAuthModal,
    closeAuthModal,
    setAuthenticated,
    proceedToPayment,
    saveBookingToStorage,
    loadBookingFromStorage,
    getPendingBookingInfo,
    clearBookingStorage,
    setSelectedCity,
    setSelectionMode,
    setAppliedCoupon,
    setGstNumber,
    setBookingNote,
    setPartnerContext,
    setPartnerBranding,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
