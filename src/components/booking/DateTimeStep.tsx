"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Users, Plus, Minus } from "lucide-react";
import { PARTICIPANT_OPTIONS, TIME_SLOTS } from "@/lib/booking-types";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DateTimeStep() {
  const {
    date,
    timeSlot,
    duration,
    participants,
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

  // Filter out past time slots when today is selected
  const isSlotDisabled = (slotTime: string, slotAvailable: boolean) => {
    if (!slotAvailable) return true;
    if (!date) return false;

    const isSelectedToday = date.toDateString() === now.toDateString();
    if (!isSelectedToday) return false;

    const [slotHour] = slotTime.split(":").map(Number);
    const endHour = slotHour + duration;
    // Disable if the slot would end before or at current time, with 15min buffer
    return endHour <= now.getHours() || (slotHour <= now.getHours() && now.getMinutes() > 0);
  };

  const nextStepLabel =
    selectionMode === "studio" ? "Continue to Package" : "Continue to Studio";

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
                onClick={() => setDuration(Math.max(1, duration - 1))}
                disabled={duration <= 1}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white">{duration}</span>
                <span className="text-white/60 ml-2">hour{duration > 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={() => setDuration(Math.min(8, duration + 1))}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#D9FC67]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Select Time Slot</h3>
                  <p className="text-white/50 text-sm">{formatSelectedDate()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const disabled = isSlotDisabled(slot.time, slot.available);
                  const selected = timeSlot === slot.time;
                  const isPast = !slot.available;

                  return (
                    <button
                      key={slot.time}
                      onClick={() => !disabled && setTimeSlot(slot.time)}
                      disabled={disabled}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-medium transition-all relative",
                        disabled
                          ? "bg-white/5 text-white/25 cursor-not-allowed"
                          : selected
                          ? "bg-[#D9FC67] text-black shadow-lg shadow-[#D9FC67]/20"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {slot.time}
                      {isPast && (
                        <span className="block text-[10px] text-white/30 leading-tight">Booked</span>
                      )}
                      {!isPast && disabled && (
                        <span className="block text-[10px] text-white/30 leading-tight">Past</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {date.toDateString() === now.toDateString() && (
                <p className="text-white/30 text-xs mt-3 text-center">
                  Past time slots are disabled for today
                </p>
              )}
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

      <div className="mt-10 flex justify-center">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
        >
          {nextStepLabel}
        </Button>
      </div>
    </div>
  );
}
