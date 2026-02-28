"use client";

import { useState } from "react";
import { X, Check, Calendar, Clock, MapPin, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface BookingData {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  participants: number;
  studio: {
    id: string;
    name: string;
    location: { area: string; city: string };
    cover_image: string;
  };
  package: {
    id: string;
    name: string;
    price_per_hour: number;
  } | null;
  addOns: { id: string; name: string; price: number }[];
  totalPrice: number;
  status: "confirmed" | "pending" | "completed";
  paymentId: string;
  createdAt: string;
}

interface BookingSuccessModalProps {
  booking: BookingData;
  onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
  const formatDate = () => {
    if (!booking.date) return "";
    const d = new Date(booking.date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  };

  const formatTime = () => {
    if (!booking.timeSlot) return "";
    const [hours] = booking.timeSlot.split(":");
    const hour = parseInt(hours);
    const endTime = hour + booking.duration;
    const formatHour = (h: number) => {
      if (h === 12) return "12 PM";
      if (h > 12) return `${h - 12} PM`;
      return `${h} AM`;
    };
    return `${formatHour(hour)} - ${formatHour(endTime)}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#D9FC67] to-[#B8E050] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-black">Booking Confirmed!</h2>
          <p className="text-black/70 mt-1">Your studio has been successfully booked</p>
        </div>

        <div className="p-6">
          <div className="relative h-32 rounded-xl overflow-hidden mb-4">
            <Image
              src={booking.studio.cover_image}
              alt={booking.studio.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <h3 className="text-xl font-bold text-white">{booking.studio.name}</h3>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{booking.studio.location.area}, {booking.studio.location.city}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Date</p>
                <p className="text-white text-sm font-medium">{formatDate()}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Time</p>
                <p className="text-white text-sm font-medium">{formatTime()}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Duration</p>
                <p className="text-white text-sm font-medium">{booking.duration} hour{booking.duration > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#D9FC67]" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Participants</p>
                <p className="text-white text-sm font-medium">{booking.participants} people</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Booking ID</span>
              <span className="text-white font-mono">{booking.id}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/60">Total Paid</span>
              <span className="text-xl font-bold text-[#D9FC67]">₹{booking.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full py-6 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black"
          >
            View My Bookings
          </Button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
        >
          <X className="w-5 h-5 text-black/70" />
        </button>
      </div>
    </div>
  );
}
