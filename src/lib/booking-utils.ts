import { TIME_SLOTS, TimeSlot } from "./booking-types";

const STUDIO_AVAILABILITY: Record<string, Record<string, string[]>> = {
  studio_1: {
    "2026-02-24": ["09:00", "11:00", "14:00", "16:00"],
    "2026-02-25": ["09:00", "10:00", "12:00", "15:00", "17:00"],
    "2026-02-26": ["09:00", "13:00", "14:00", "18:00"],
    "2026-02-27": ["10:00", "11:00", "15:00", "16:00"],
    "2026-02-28": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  },
  studio_2: {
    "2026-02-24": ["10:00", "12:00", "13:00", "15:00"],
    "2026-02-25": ["09:00", "11:00", "13:00", "16:00"],
    "2026-02-26": ["10:00", "11:00", "12:00", "17:00"],
    "2026-02-27": ["09:00", "14:00", "15:00", "17:00"],
    "2026-02-28": ["11:00", "12:00", "13:00", "14:00", "16:00"],
  },
  studio_3: {
    "2026-02-24": ["09:00", "10:00", "15:00", "16:00", "17:00"],
    "2026-02-25": ["10:00", "14:00", "15:00"],
    "2026-02-26": ["09:00", "11:00", "12:00", "13:00", "16:00"],
    "2026-02-27": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"],
    "2026-02-28": ["15:00", "16:00", "17:00", "18:00"],
  },
  studio_4: {
    "2026-02-24": ["11:00", "12:00", "14:00"],
    "2026-02-25": ["09:00", "10:00", "11:00", "12:00", "13:00"],
    "2026-02-26": ["15:00", "16:00", "17:00"],
    "2026-02-27": ["09:00", "17:00", "18:00"],
    "2026-02-28": ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
  },
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getAvailableSlotsForStudio(
  studioId: string,
  date: Date | null
): TimeSlot[] {
  if (!date) {
    return TIME_SLOTS.map((slot) => ({ ...slot, available: true }));
  }

  const dateKey = getDateKey(date);
  const availableTimes = STUDIO_AVAILABILITY[studioId]?.[dateKey] || [];

  return TIME_SLOTS.map((slot) => ({
    ...slot,
    available: availableTimes.includes(slot.time),
  }));
}

export function getAvailableSlotCount(
  studioId: string,
  date: Date | null
): number {
  if (!date) return TIME_SLOTS.length;
  
  const slots = getAvailableSlotsForStudio(studioId, date);
  return slots.filter((s) => s.available).length;
}
