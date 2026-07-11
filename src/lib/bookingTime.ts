/**
 * Studio bookings are wall-clock times in India (IST). Server runs in UTC on
 * many hosts — never use Date#setHours in server local TZ for booking math.
 */

export const BOOKING_TIMEZONE = "Asia/Kolkata";

/** YYYY-MM-DD from a Date in the user's local calendar (browser). */
export function formatCalendarDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calendar day in IST as YYYY-MM-DD.
 * Accepts plain YYYY-MM-DD, or any ISO string (legacy client midnight ISO).
 */
export function calendarDateInIST(dateInput: string): string {
  const s = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Parse calendar date + HH:mm slot in IST to an absolute UTC Date. */
export function parseISTDateTime(dateYYYYMMDD: string, timeSlot: string): Date {
  const [h, rawM] = timeSlot.split(":");
  const hour = parseInt(h, 10);
  const minute = rawM !== undefined ? parseInt(rawM, 10) : 0;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${dateYYYYMMDD}T${hh}:${mm}:00+05:30`);
}

export function startEndFromCalendarAndSlot(
  dateYYYYMMDD: string,
  timeSlot: string,
  durationHours: number
): { start: Date; end: Date } {
  const start = parseISTDateTime(dateYYYYMMDD, timeSlot);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start, end };
}

export function getHourInIST(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value;
  return parseInt(h ?? "0", 10);
}

export function getMinuteInIST(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    minute: "numeric",
  }).formatToParts(d);
  const m = parts.find((p) => p.type === "minute")?.value;
  return parseInt(m ?? "0", 10);
}

/** Inclusive IST day bounds for querying bookings that start on this calendar day. */
export function istDayRangeUtc(dateYYYYMMDD: string): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(`${dateYYYYMMDD}T00:00:00+05:30`);
  const dayEnd = new Date(`${dateYYYYMMDD}T23:59:59.999+05:30`);
  return { dayStart, dayEnd };
}

/**
 * True if two intervals [a0,a1) and [b0,b1) overlap (half-open on the left).
 * Touching endpoints do not overlap: [9,10) and [10,11) → false.
 */
export function intervalsOverlapHalfOpen(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0.getTime() < b1.getTime() && a1.getTime() > b0.getTime();
}

/**
 * For a calendar day in IST, return "HH:MM" strings (30-minute slots)
 * where a 30-minute slot starting at that time overlaps any booking (+ buffer after end).
 * slotMin / slotMax are in total minutes from midnight (e.g. 9*60=540 for 09:00).
 */
export function computeBookedSlotLabels(
  dateYYYYMMDD: string,
  bookings: { start_time: string; end_time: string }[],
  bufferMinutes: number,
  slotMinMinutes: number,
  slotMaxMinutes: number
): string[] {
  const blocked = new Set<string>();
  const bufferMs = bufferMinutes * 60 * 1000;
  const SLOT_DURATION_MS = 30 * 60 * 1000;

  for (let m = slotMinMinutes; m <= slotMaxMinutes; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const slotLabel = `${hh}:${mm}`;
    const slotStart = parseISTDateTime(dateYYYYMMDD, slotLabel);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MS);

    for (const b of bookings) {
      const b0 = new Date(b.start_time);
      const b1 = new Date(new Date(b.end_time).getTime() + bufferMs);
      if (intervalsOverlapHalfOpen(slotStart, slotEnd, b0, b1)) {
        blocked.add(slotLabel);
        break;
      }
    }
  }

  return Array.from(blocked).sort();
}

/**
 * @deprecated Use computeBookedSlotLabels with slotMinMinutes/slotMaxMinutes.
 * For a calendar day in IST and operating hours (e.g. 9–20), return "HH:00" strings
 * where a 1-hour slot starting at that hour overlaps any booking (+ buffer after end).
 */
export function computeBookedHourLabels(
  dateYYYYMMDD: string,
  bookings: { start_time: string; end_time: string }[],
  bufferMinutes: number,
  hourMin: number,
  hourMax: number
): string[] {
  return computeBookedSlotLabels(
    dateYYYYMMDD,
    bookings,
    bufferMinutes,
    hourMin * 60,
    hourMax * 60
  );
}

// ── Display: always use Asia/Kolkata for session wall times (avoid browser-TZ drift) ──

/** e.g. "12 Apr 2026" in IST */
export function formatSessionDateShortIST(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BOOKING_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** e.g. "Sunday, 12 April 2026" in IST */
export function formatSessionDateLongIST(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/** e.g. "Sun, Apr 12, 2026" in IST */
export function formatSessionDateWithWeekdayIST(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** YYYY-MM-DD in IST for `<input type="date">` and APIs */
export function formatSessionDateCalendarIST(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** e.g. "9:30 AM" in IST */
export function formatSessionClock12hIST(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatSessionTimeRangeIST(startIso: string, endIso: string): string {
  return `${formatSessionClock12hIST(startIso)} – ${formatSessionClock12hIST(endIso)}`;
}

/** Date + time in IST (list rows, tooltips) */
export function formatSessionDateTimeShortIST(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: BOOKING_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
