"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import { ChevronLeft, ChevronRight, Clock, Users, Plus, Minus, Loader2 } from "lucide-react";
import { PARTICIPANT_OPTIONS, TIME_SLOTS, formatDuration } from "@/lib/booking-types";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DateTimeStep() {
  const searchParams = useSearchParams();
  const excludeBookingIdFromUrl = searchParams.get("excludeBookingId");

  const {
    date,
    timeSlot,
    duration,
    participants,
    selectedStudio,
    setDate,
    setTimeSlot,
    setDuration,
    setParticipants,
    nextStep,
    canProceed,
    selectionMode,
  } = useBooking();

  const [currentMonth, setCurrentMonth] = useState(() => {
    return date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date();
  });

  // Live booked slots fetched from the DB for the selected date + studio
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const timeSlotRef = useRef(timeSlot);
  const durationRef = useRef(duration);
  timeSlotRef.current = timeSlot;
  durationRef.current = duration;

  const formatDateParam = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Fetch live availability when date/studio/duration changes; poll + refocus for multi-user sync
  useEffect(() => {
    let cancelled = false;
    const studioId = selectedStudio?.id;

    const loadSlots = async () => {
      if (!date || !studioId) {
        setBookedSlots([]);
        return;
      }
      setIsLoadingSlots(true);
      try {
        const dateParam = formatDateParam(date);
        const exclude =
          excludeBookingIdFromUrl != null && excludeBookingIdFromUrl !== ""
            ? `&excludeBookingId=${encodeURIComponent(excludeBookingIdFromUrl)}`
            : "";
        const r = await fetch(
          `/api/studios/${studioId}/slots?date=${dateParam}${exclude}`
        );
        const data: { bookedSlots?: string[] } = await r.json();
        if (cancelled) return;
        const slots = data.bookedSlots ?? [];
        setBookedSlots(slots);

        const current = timeSlotRef.current;
        const dur = durationRef.current;
        if (current) {
          const [hStr, mStr] = current.split(":");
          const startH = parseInt(hStr, 10);
          const startM = parseInt(mStr || "0", 10);
          const totalStartMins = startH * 60 + startM;
          const totalEndMins = totalStartMins + Math.round(dur * 60);
          const blocked = [];
          for (let m = totalStartMins; m < totalEndMins; m += 30) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            blocked.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
          }
          if (blocked.some((s) => slots.includes(s))) setTimeSlot(null);
        }
      } catch {
        if (!cancelled) setBookedSlots([]);
      } finally {
        if (!cancelled) setIsLoadingSlots(false);
      }
    };

    void loadSlots();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSlots();
    }, 30_000);

    const onVis = () => {
      if (document.visibilityState === "visible") void loadSlots();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [
    date,
    selectedStudio?.id,
    formatDateParam,
    duration,
    setTimeSlot,
    excludeBookingIdFromUrl,
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();

  const getDaysInMonth = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDay: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDate >= today) {
      setDate(selectedDate);
    }
  };

  const isDateDisabled = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d < today;
  };

  const isDateSelected = (day: number) => {
    if (!date) return false;
    return (
      date.getDate() === day &&
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toDateString() === today.toDateString();
  };

  const isPrevMonthDisabled = () => {
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  };

  const formatSelectedDate = () => {
    if (!date) return "";
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Returns true when a slot button should be disabled.
  // A slot is disabled if:
  //  (a) any 30-min interval in [slotStart … slotStart+duration) overlaps a booked slot, or
  //  (b) the slot is in the past when today is selected.
  const isSlotDisabled = (slotTime: string): boolean => {
    if (!date) return false;

    const [hStr, mStr] = slotTime.split(":");
    const slotHour = parseInt(hStr, 10);
    const slotMin = parseInt(mStr || "0", 10);
    const totalStartMins = slotHour * 60 + slotMin;
    const totalEndMins = totalStartMins + Math.round(duration * 60);

    // Past-time check for today
    const isSelectedToday = date.toDateString() === now.toDateString();
    if (isSelectedToday) {
      const nowTotalMins = now.getHours() * 60 + now.getMinutes();
      if (totalEndMins <= nowTotalMins || totalStartMins <= nowTotalMins) {
        return true;
      }
    }

    // Live DB check — block if ANY 30-min slot in the entire booking window is taken
    for (let m = totalStartMins; m < totalEndMins; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      if (bookedSlots.includes(slotStr)) return true;
    }

    return false;
  };

  // Determine the reason a slot is unavailable (for the sub-label)
  const getSlotLabel = (slotTime: string): string | null => {
    if (!date) return null;

    const [hStr, mStr] = slotTime.split(":");
    const slotHour = parseInt(hStr, 10);
    const slotMin = parseInt(mStr || "0", 10);
    const totalStartMins = slotHour * 60 + slotMin;
    const totalEndMins = totalStartMins + Math.round(duration * 60);

    const isSelectedToday = date.toDateString() === now.toDateString();
    if (isSelectedToday) {
      const nowTotalMins = now.getHours() * 60 + now.getMinutes();
      if (totalEndMins <= nowTotalMins || totalStartMins <= nowTotalMins) {
        return "Past";
      }
    }

    for (let m = totalStartMins; m < totalEndMins; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const slotStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      if (bookedSlots.includes(slotStr)) return "Booked";
    }

    return null;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          When would you like to book?
        </h1>
        <p className="text-white/60 text-lg">
          Select your preferred date, time, and session details
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled()}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs text-white/40 py-2 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(day);
              const selected = isDateSelected(day);
              const todayMark = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  disabled={disabled}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all relative",
                    disabled
                      ? "text-white/20 cursor-not-allowed"
                      : selected
                      ? "bg-[#D9FC67] text-black shadow-lg shadow-[#D9FC67]/20"
                      : todayMark
                      ? "text-[#D9FC67] ring-1 ring-[#D9FC67]/50 hover:bg-white/10"
                      : "text-white hover:bg-white/10"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="text-white/30 text-xs text-center mt-4">
            Bookings can be made up to 90 days in advance
          </p>
        </div>

        <div className="space-y-6">
          {/* Duration */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Session Duration</h3>
                <p className="text-white/50 text-sm">How long do you need?</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDuration(Math.max(0.5, duration - 0.5))}
                disabled={duration <= 0.5}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white">{formatDuration(duration)}</span>
              </div>
              <button
                onClick={() => setDuration(Math.min(8, duration + 0.5))}
                disabled={duration >= 8}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Participants</h3>
                <p className="text-white/50 text-sm">How many people?</p>
              </div>
            </div>

            <div className="flex gap-3">
              {PARTICIPANT_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setParticipants(count)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-semibold transition-all",
                    participants === count
                      ? "bg-[#D9FC67] text-black shadow-lg shadow-[#D9FC67]/20"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {date ? (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#D9FC67]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Select Time Slot</h3>
                    <p className="text-white/50 text-sm">{formatSelectedDate()}</p>
                  </div>
                </div>
                {isLoadingSlots && (
                  <Loader2 className="w-4 h-4 text-[#D9FC67] animate-spin flex-shrink-0" />
                )}
              </div>

              {isLoadingSlots ? (
                /* Skeleton while fetching live availability */
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-xl bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const disabled = isSlotDisabled(slot.time);
                    const selected = timeSlot === slot.time;
                    const label = getSlotLabel(slot.time);

                    return (
                      <button
                        key={slot.time}
                        onClick={() => {
                          if (disabled) return;
                          setTimeSlot(slot.time);
                          // Advance after state is applied; avoids next step reading stale timeSlot.
                          window.setTimeout(() => nextStep(), 0);
                        }}
                        disabled={disabled}
                        className={cn(
                          "py-3 px-4 rounded-xl text-sm font-medium transition-all",
                          disabled
                            ? "bg-white/5 text-white/25 cursor-not-allowed"
                            : selected
                            ? "bg-[#D9FC67] text-black shadow-lg shadow-[#D9FC67]/20"
                            : "bg-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        {slot.time}
                        {label && (
                          <span className="block text-[10px] text-white/30 leading-tight">
                            {label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-3">
                {date.toDateString() === now.toDateString() && (
                  <p className="text-white/30 text-xs">
                    Past time slots are disabled for today
                  </p>
                )}
                {bookedSlots.length > 0 && !isLoadingSlots && (
                  <p className="text-white/30 text-xs">
                    Grey slots are already booked or reserved for cleanup
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 border-dashed p-8 flex flex-col items-center gap-3">
              <Clock className="w-8 h-8 text-white/20" />
              <p className="text-white/40 text-sm text-center">
                Select a date to see available time slots
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
