"use client";

import { useState } from "react";
import { X, Calendar, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData } from "../bookings/UpcomingBookings";
import { cn } from "@/lib/utils";

interface RescheduleModalProps {
  booking: BookingData;
  onClose: () => void;
  onConfirm: (newDate: Date, newTime: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIME_SLOTS = [
  { time: "09:00", available: true },
  { time: "10:00", available: true },
  { time: "11:00", available: false },
  { time: "12:00", available: true },
  { time: "14:00", available: true },
  { time: "15:00", available: true },
  { time: "16:00", available: false },
  { time: "17:00", available: true },
  { time: "18:00", available: true },
  { time: "19:00", available: true },
];

export function RescheduleModal({ booking, onClose, onConfirm }: RescheduleModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      setIsSubmitting(true);
      setTimeout(() => {
        onConfirm(selectedDate, selectedTime);
      }, 500);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9FC67]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reschedule Booking</h2>
                <p className="text-white/50 text-sm">{booking.studio.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-6">
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
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/50" />
                Select Time
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "py-3 px-2 rounded-xl text-sm font-medium transition-all relative",
                      !slot.available
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : selectedTime === slot.time
                        ? "bg-[#D9FC67] text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {slot.time}
                    {selectedTime === slot.time && (
                      <Check className="w-4 h-4 absolute -top-1 -right-1 text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-[#D9FC67]/10 border border-[#D9FC67]/20 rounded-xl p-4 mb-6">
              <p className="text-white text-sm mb-1">New Schedule</p>
              <p className="text-[#D9FC67] font-semibold">{formatSelectedDate()}</p>
              <p className="text-white/70 text-sm">at {selectedTime} • {booking.duration} hour{booking.duration > 1 ? "s" : ""}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
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
