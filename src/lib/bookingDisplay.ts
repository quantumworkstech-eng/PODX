/**
 * ============================================================
 * bookingDisplay.ts — SINGLE SOURCE OF TRUTH for date/time display
 * ============================================================
 *
 * ALL booking dates and times displayed to the user MUST go through
 * these functions. Never use ad-hoc formatting in components.
 *
 * Why: The DB stores UTC timestamps. India is UTC+5:30 (IST).
 *      Without an explicit timeZone option the browser's local TZ
 *      is used, which gives wrong results for non-IST users and
 *      for bookings near midnight IST (where UTC date differs).
 */

const IST_TZ = "Asia/Kolkata";

/**
 * Format a UTC ISO string as a short display date in IST.
 * @example "2026-04-11T03:30:00Z" → "Sat, Apr 11, 2026"
 */
export function formatBookingDate(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: IST_TZ,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a UTC ISO string as a long display date in IST (for detail views).
 * @example "2026-04-11T03:30:00Z" → "Saturday, April 11, 2026"
 */
export function formatBookingDateLong(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: IST_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a single UTC ISO string as a 12-hour time string in IST,
 * always including minutes (zero-padded).
 * @example "2026-04-11T04:00:00Z" → "09:30 AM"
 */
export function formatBookingTime(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayPeriod = (
    parts.find((p) => p.type === "dayPeriod")?.value ?? ""
  ).toUpperCase();
  return `${hour}:${minute} ${dayPeriod}`;
}

/**
 * Format a start + end UTC ISO pair as a time range in IST.
 * @example start="…04:00Z", end="…07:00Z" → "09:30 AM – 12:30 PM"
 */
export function formatBookingTimeRange(startISO: string, endISO: string): string {
  const start = formatBookingTime(startISO);
  const end = formatBookingTime(endISO);
  if (!start && !end) return "";
  if (!end) return start;
  return `${start} – ${end}`;
}

/**
 * Derive a "HH:MM" 24-hour slot label from a UTC ISO start time in IST.
 * Used only where a slot label (e.g. "09:30") is needed for business logic.
 * @example "2026-04-11T04:00:00Z" → "09:30"
 */
export function isoToISTSlot(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  // Intl may return "24" for midnight in some environments; normalise to "00"
  return `${hour === "24" ? "00" : hour}:${minute}`;
}
