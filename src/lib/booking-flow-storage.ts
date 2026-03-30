/** Client-only keys for the marketplace booking flow */

export const BOOKING_ONBOARDING_KEY = "yanisa_onboarding_complete";
export const BOOKING_SELECTION_MODE_KEY = "yanisa_selection_mode";
export const BOOKING_PENDING_KEY = "yanisa_pending_booking";
export const BOOKING_PRESELECT_STUDIO_KEY = "yanisa_preselected_studio";

export function clearAllBookingFlowStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BOOKING_PENDING_KEY);
    localStorage.removeItem(BOOKING_ONBOARDING_KEY);
    localStorage.removeItem(BOOKING_SELECTION_MODE_KEY);
    sessionStorage.removeItem(BOOKING_PRESELECT_STUDIO_KEY);
  } catch {
    /* ignore */
  }
}
