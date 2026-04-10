"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";
import { cn } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/booking-types";

interface RescheduleModalProps {
  booking: BookingData;
  onClose: () => void;
  /** Return true when reschedule persisted so the modal can close and reset UI. */
  onConfirm: (newDate: Date, newTime: string) => boolean | Promise<boolean>;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function RescheduleModal({ booking, onClose, onConfirm }: RescheduleModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const formatDateParam = useCallback((d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    if (!selectedDate || !booking.studio?.id) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    const dateParam = formatDateParam(selectedDate);
    const excludeRef = booking.dbId || booking.id;
    const exclude = excludeRef
      ? `&excludeBookingId=${encodeURIComponent(excludeRef)}`
      : "";
    setLoadingSlots(true);
    fetch(`/api/studios/${booking.studio.id}/slots?date=${dateParam}${exclude}`)
      .then((r) => r.json())
      .then((data: { bookedSlots?: string[] }) => {
        if (!cancelled) setBookedSlots(data.bookedSlots ?? []);
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, booking.studio?.id, booking.dbId, formatDateParam]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (date >= today) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < today;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const ok = await Promise.resolve(onConfirm(selectedDate, selectedTime));
      if (ok) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "Select a date";
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const isSlotBooked = (slotTime: string) => {
    // bookedSlots contains "HH:MM" labels for blocked 30-min windows.
    // A slot is unavailable if any 30-min chunk it occupies falls in bookedSlots.
    const [hStr, mStr = "00"] = slotTime.split(":");
    const startMin = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    const durationMin = Math.round((booking.duration || 1) * 60);
    for (let offset = 0; offset < durationMin; offset += 30) {
      const totalMin = startMin + offset;
      const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
      const mm = String(totalMin % 60).padStart(2, "0");
      if (bookedSlots.includes(`${hh}:${mm}`)) return true;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[min(90dvh,90vh)] flex flex-col bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl my-auto overflow-hidden">
        <div className="shrink-0 p-6 border-b border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white">Reschedule Booking</h2>
                <p className="text-white/50 text-sm truncate">{booking.studio.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 touch-pan-y">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-white font-medium">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs text-white/40 py-2">
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

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    disabled={disabled}
                    className={cn(
                      "aspect-square rounded-lg text-sm font-medium transition-all",
                      disabled
                        ? "text-white/20 cursor-not-allowed"
                        : selected
                          ? "bg-[#D9FC67] text-black"
                          : "text-white hover:bg-white/10"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/50" />
                  Select Time
                </h4>
                {loadingSlots && <Loader2 className="w-4 h-4 text-[#D9FC67] animate-spin" />}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const booked = isSlotBooked(slot.time);
                  const disabled = booked;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => !disabled && setSelectedTime(slot.time)}
                      disabled={disabled}
                      className={cn(
                        "py-3 px-2 rounded-xl text-sm font-medium transition-all relative",
                        disabled
                          ? "bg-white/5 text-white/25 cursor-not-allowed opacity-60"
                          : selectedTime === slot.time
                            ? "bg-[#D9FC67] text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {slot.time}
                      {disabled && (
                        <span className="block text-[10px] text-white/30 leading-tight">Booked</span>
                      )}
                      {selectedTime === slot.time && !disabled && (
                        <Check className="w-4 h-4 absolute -top-1 -right-1 text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-xl p-4">
              <p className="text-white text-sm mb-1">New Schedule</p>
              <p className="text-[#D9FC67] font-semibold">{formatSelectedDate()}</p>
              <p className="text-white/70 text-sm">at {selectedTime} • {booking.duration} hour{booking.duration > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/5 p-6 pt-4 bg-[#18181b]">
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Confirming..." : "Confirm Reschedule"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
