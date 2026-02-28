"use client";

import Image from "next/image";
import { Calendar, Clock, MapPin, Users, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface BookingCardProps {
  booking: BookingData;
}

export function BookingCard({ booking }: BookingCardProps) {
  const formatDate = () => {
    if (!booking.date) return "";
    const d = new Date(booking.date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
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

  const getStatusColor = () => {
    switch (booking.status) {
      case "confirmed":
        return "bg-[#D9FC67]/20 text-[#D9FC67]";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const isUpcoming = () => {
    if (!booking.date) return false;
    const bookingDate = new Date(booking.date);
    return bookingDate >= new Date();
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group">
      <div className="relative h-40">
        <Image
          src={booking.studio.cover_image}
          alt={booking.studio.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute top-3 right-3">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", getStatusColor())}>
            {booking.status}
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <h3 className="text-xl font-bold text-white">{booking.studio.name}</h3>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{booking.studio.location.area}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
              <Calendar className="w-3 h-3" />
              <span>Date</span>
            </div>
            <p className="text-white font-medium text-sm">{formatDate()}</p>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
              <Clock className="w-3 h-3" />
              <span>Time</span>
            </div>
            <p className="text-white font-medium text-sm">{formatTime()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
              <Users className="w-3 h-3" />
              <span>People</span>
            </div>
            <p className="text-white font-medium text-sm">{booking.participants}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-white/50 text-xs">Total</p>
            <p className="text-white font-bold">₹{booking.totalPrice.toLocaleString()}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#D9FC67] hover:bg-[#D9FC67]/10 hover:text-[#D9FC67]"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
