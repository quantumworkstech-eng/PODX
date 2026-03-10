"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Studio } from "@/lib/types";
import { ServicePackage, AddOnService, TIME_SLOTS } from "@/lib/booking-types";

interface AppliedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
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
  showAuthModal: boolean;
  isAuthenticated: boolean;
  showPayment: boolean;
  selectedCity: string | null;
  selectionMode: "studio" | "date" | null;
  appliedCoupon: AppliedCoupon | null;
}

interface StoredBooking {
  date: string | null;
  timeSlot: string | null;
  duration: number;
  participants: number;
  selectedStudio: Studio | null;
  selectedPackage: ServicePackage | null;
  selectedAddOns: AddOnService[];
  currentStep: number;
  selectedCity: string | null;
  selectionMode: "studio" | "date" | null;
  showPayment: boolean;
}

interface BookingContextType extends BookingState {
  setDate: (date: Date | null) => void;
  setTimeSlot: (time: string | null) => void;
  setDuration: (duration: number) => void;
  setParticipants: (count: number) => void;
  setSelectedStudio: (studio: Studio | null) => void;
  setSelectedPackage: (pkg: ServicePackage | null) => void;
  addAddOn: (addOn: AddOnService) => void;
  removeAddOn: (addOnId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetBooking: () => void;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
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
}

const PENDING_BOOKING_KEY = "podx_pending_booking";
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
  showAuthModal: false,
  isAuthenticated: false,
  showPayment: false,
  selectedCity: null,
  selectionMode: null,
  appliedCoupon: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const [initialized, setInitialized] = useState(false);

  // Load from storage on mount once
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    const stored = localStorage.getItem(PENDING_BOOKING_KEY);
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
        currentStep: parsed.currentStep || 1,
        selectedCity: parsed.selectedCity,
        selectionMode: parsed.selectionMode,
        showPayment: parsed.showPayment || false,
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
      currentStep: state.currentStep,
      selectedCity: state.selectedCity,
      selectionMode: state.selectionMode,
      showPayment: state.showPayment,
    };
    localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(data));
  }, [state]);

  const loadBookingFromStorage = useCallback((): StoredBooking | null => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(PENDING_BOOKING_KEY);
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
      localStorage.removeItem(PENDING_BOOKING_KEY);
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
    setState((prev) => ({ ...prev, selectedStudio: studio }));
  }, []);

  const setSelectedPackage = useCallback((pkg: ServicePackage | null) => {
    setState((prev) => ({ ...prev, selectedPackage: pkg }));
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

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 5),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      // If on payment step, go back to checkout (step 5)
      if (prev.showPayment) {
        return { ...prev, showPayment: false, currentStep: 5 };
      }
      return { ...prev, currentStep: Math.max(prev.currentStep - 1, 1) };
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step, showPayment: false }));
  }, []);

  const resetBooking = useCallback(() => {
    clearBookingStorage();
    setState({ ...initialState, appliedCoupon: null });
  }, [clearBookingStorage]);

  const getStudioPrice = useCallback(() => {
    if (!state.selectedStudio) return 0;
    return state.selectedStudio.price_per_hour * state.duration;
  }, [state.selectedStudio, state.duration]);

  const getPackagePrice = useCallback(() => {
    if (!state.selectedPackage) return 0;
    return state.selectedPackage.price_per_hour * state.duration;
  }, [state.selectedPackage, state.duration]);

  const getAddOnsPrice = useCallback(() => {
    return state.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  }, [state.selectedAddOns]);

  const getSubtotal = useCallback(() => {
    return getStudioPrice() + getPackagePrice() + getAddOnsPrice();
  }, [getStudioPrice, getPackagePrice, getAddOnsPrice]);

  const getDiscount = useCallback(() => {
    return state.appliedCoupon?.discountAmount ?? 0;
  }, [state.appliedCoupon]);

  const getTax = useCallback(() => {
    const taxable = Math.max(0, getSubtotal() - getDiscount());
    return Math.round(taxable * TAX_RATE);
  }, [getSubtotal, getDiscount]);

  const getTotalPrice = useCallback(() => {
    return Math.max(0, getSubtotal() - getDiscount()) + getTax();
  }, [getSubtotal, getDiscount, getTax]);

  const canProceed = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        if (state.selectionMode === "studio") {
          return state.selectedStudio !== null;
        }
        return state.date !== null && state.timeSlot !== null;
      case 2:
        if (state.selectionMode === "studio") {
          return state.date !== null && state.timeSlot !== null;
        }
        return state.selectedStudio !== null;
      case 3:
        return state.selectedPackage !== null;
      case 4:
        return true;
      case 5:
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
    addAddOn,
    removeAddOn,
    nextStep,
    prevStep,
    goToStep,
    resetBooking,
    getTotalPrice,
    getSubtotal,
    getTax,
    getDiscount,
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
