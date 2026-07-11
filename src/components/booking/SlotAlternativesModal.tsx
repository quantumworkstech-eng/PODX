"use client";

import { X, Clock, ChevronLeft, ChevronRight, Check, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface SlotAlternativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  studioName: string;
  onSelectAlternative: (date: Date, time: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SlotAlternativesModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  studioName,
  onSelectAlternative,
}: SlotAlternativesModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [selectedDateState, setSelectedDateState] = useState<Date | null>(selectedDate);
  const [alternativeSlots, setAlternativeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const generateAlternativeSlots = () => {
      const slots: TimeSlot[] = [
        { time: "09:00", available: Math.random() > 0.3 },
        { time: "10:00", available: Math.random() > 0.3 },
        { time: "11:00", available: Math.random() > 0.3 },
        { time: "12:00", available: Math.random() > 0.3 },
        { time: "14:00", available: Math.random() > 0.3 },
        { time: "15:00", available: Math.random() > 0.3 },
        { time: "16:00", available: Math.random() > 0.3 },
        { time: "17:00", available: Math.random() > 0.3 },
        { time: "18:00", available: Math.random() > 0.3 },
        { time: "19:00", available: Math.random() > 0.3 },
      ];
      return slots;
    };
    setAlternativeSlots(generateAlternativeSlots());
  }, [selectedDate]);

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

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDateState) return false;
    return (
      selectedDateState.getDate() === day &&
      selectedDateState.getMonth() === currentMonth.getMonth() &&
      selectedDateState.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    setSelectedDateState(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const availableSlots = alternativeSlots.filter(s => s.available);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Slot Not Available
          </h2>
          <p className="text-white/60 text-sm">
            The selected time slot is not available for {studioName}. Here are some alternatives:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-3">Select Different Date</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
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
                  <div key={day} className="text-center text-xs text-white/40 py-1">
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
                      onClick={() => !disabled && handleDateSelect(day)}
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
          </div>

          <div>
            <h3 className="text-sm font-medium text-white/80 mb-3">Available Times for This Date</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        if (selectedDateState) {
                          onSelectAlternative(selectedDateState, slot.time);
                          onClose();
                        }
                      }}
                      className="py-2 px-3 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-[#D9FC67] hover:text-black transition-colors"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-4">No available slots</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-white/80 mb-3">Same Day Alternatives</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const prevDay = new Date(selectedDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    onSelectAlternative(prevDay, selectedTime);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#D9FC67] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Yesterday</p>
                      <p className="text-white/40 text-xs">
                        {DAYS[(selectedDate.getDay() - 1 + 7) % 7]}, {selectedDate.getDate() - 1} {MONTHS[selectedDate.getMonth()]}
                      </p>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-[#D9FC67]" />
                </button>

                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    onSelectAlternative(nextDay, selectedTime);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#D9FC67] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Tomorrow</p>
                      <p className="text-white/40 text-xs">
                        {DAYS[(selectedDate.getDay() + 1) % 7]}, {selectedDate.getDate() + 1} {MONTHS[selectedDate.getMonth()]}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </div>
                  <Check className="w-4 h-4 text-[#D9FC67]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
