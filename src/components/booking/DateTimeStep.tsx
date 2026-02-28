"use client";

import { useState } from "react";
import { useBooking } from "@/context/BookingContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Users, Plus, Minus } from "lucide-react";
import { DURATION_OPTIONS, PARTICIPANT_OPTIONS, TIME_SLOTS } from "@/lib/booking-types";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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
    canProceed 
  } = useBooking();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
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
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selectedDate < today;
  };

  const isDateSelected = (day: number) => {
    if (!date) return false;
    return (
      date.getDate() === day &&
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const formatSelectedDate = () => {
    if (!date) return "";
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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
              <div key={day} className="text-center text-sm text-white/50 py-2">
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
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all",
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

        <div className="space-y-6">
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
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white">{duration}</span>
                <span className="text-white/60 ml-2">hour{duration > 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={() => setDuration(Math.min(4, duration + 1))}
                disabled={duration >= 4}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

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
                      ? "bg-[#D9FC67] text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {date && (
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
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium transition-all",
                      !slot.available
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : timeSlot === slot.time
                        ? "bg-[#D9FC67] text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-10 py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Studio Selection
        </Button>
      </div>
    </div>
  );
}
