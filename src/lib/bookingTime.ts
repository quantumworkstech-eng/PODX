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
  const blocked = new Set<string>();
  const bufferMs = bufferMinutes * 60 * 1000;

  for (let H = hourMin; H <= hourMax; H++) {
    const hh = `${String(H).padStart(2, "0")}:00`;
    const slotStart = parseISTDateTime(dateYYYYMMDD, hh);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

    for (const b of bookings) {
      const b0 = new Date(b.start_time);
      const b1 = new Date(new Date(b.end_time).getTime() + bufferMs);
      if (intervalsOverlapHalfOpen(slotStart, slotEnd, b0, b1)) {
        blocked.add(hh);
        break;
      }
    }
  }

  return Array.from(blocked).sort();
}
