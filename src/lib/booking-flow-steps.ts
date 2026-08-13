/** Single source of truth for the booking wizard's step order.
 *
 *  Step *numbers* are 1-based and mode-dependent, so nothing outside this file
 *  should hardcode them — ask for a key instead:
 *    bookingStepNumber(selectionMode, "addons")
 */

export type BookingStepKey =
  | "studio"
  | "setup"
  | "datetime"
  | "package"
  | "addons"
  | "review";

export type BookingSelectionMode = "studio" | "date" | null;

/** Studio → Setup → Date & Time → Service → Extras → Review */
const STUDIO_FIRST_STEPS = [
  "studio",
  "setup",
  "datetime",
  "package",
  "addons",
  "review",
] as const satisfies readonly BookingStepKey[];

/** Date & Time → Studio → Setup → Service → Extras → Review */
const DATE_FIRST_STEPS = [
  "datetime",
  "studio",
  "setup",
  "package",
  "addons",
  "review",
] as const satisfies readonly BookingStepKey[];

export const TOTAL_BOOKING_STEPS = STUDIO_FIRST_STEPS.length;

export const BOOKING_STEP_TITLES: Record<BookingStepKey, string> = {
  studio: "Studio",
  setup: "Setup",
  datetime: "Date & Time",
  package: "Service",
  addons: "Extras",
  review: "Review",
};

export function bookingStepOrder(mode: BookingSelectionMode): readonly BookingStepKey[] {
  return mode === "studio" ? STUDIO_FIRST_STEPS : DATE_FIRST_STEPS;
}

/** Which screen a 1-based step number maps to. Out-of-range falls back to the first step. */
export function bookingStepKeyAt(mode: BookingSelectionMode, step: number): BookingStepKey {
  const order = bookingStepOrder(mode);
  return order[step - 1] ?? order[0];
}

/** 1-based position of a screen, for `goToStep` / progress rendering. */
export function bookingStepNumber(mode: BookingSelectionMode, key: BookingStepKey): number {
  const index = bookingStepOrder(mode).indexOf(key);
  return index === -1 ? 1 : index + 1;
}

/** Ordered `{ number, key, title }` list for the progress bar. */
export function bookingSteps(mode: BookingSelectionMode) {
  return bookingStepOrder(mode).map((key, index) => ({
    number: index + 1,
    key,
    title: BOOKING_STEP_TITLES[key],
  }));
}
