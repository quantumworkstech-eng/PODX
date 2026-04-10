"use client";

import { X, Check, Calendar, Clock, MapPin, Users, Sparkles } from "lucide-react";
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
  subtotal?: number;
  tax?: number;
  status: string;
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
    return new Date(booking.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = () => {
    if (!booking.timeSlot) return "";
    const [hoursStr, minutesStr = "00"] = booking.timeSlot.split(":");
    const hour = parseInt(hoursStr, 10);
    const minute = parseInt(minutesStr, 10);
    const totalStartMinutes = hour * 60 + minute;
    const totalEndMinutes = totalStartMinutes + Math.round(booking.duration * 60);
    const formatMinutes = (total: number) => {
      const h = Math.floor(total / 60);
      const m = total % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      return m === 0 ? `${displayH} ${ampm}` : `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    return `${formatMinutes(totalStartMinutes)} – ${formatMinutes(totalEndMinutes)}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60">
        {/* Success header */}
        <div className="relative bg-gradient-to-br from-[#D9FC67] to-[#B8E050] px-6 py-8 text-center overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-black/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Check className="w-8 h-8 text-black" strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-black">Booking Confirmed!</h2>
            <p className="text-black/60 text-sm mt-1">
              Your studio session is all set 🎙
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Studio image */}
          <div className="relative h-28 rounded-xl overflow-hidden mb-5">
            <Image
              src={booking.studio.cover_image}
              alt={booking.studio.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-3">
              <h3 className="text-lg font-bold text-white">{booking.studio.name}</h3>
              <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>
                  {booking.studio.location.area}, {booking.studio.location.city}
                </span>
              </div>
            </div>
          </div>

          {/* Session details grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Calendar, label: "Date", value: formatDate() },
              { icon: Clock, label: "Time", value: formatTime() },
              {
                icon: Clock,
                label: "Duration",
                value: `${booking.duration} hr${booking.duration > 1 ? "s" : ""}`,
              },
              {
                icon: Users,
                label: "Participants",
                value: `${booking.participants} people`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#D9FC67]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#D9FC67]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/40 text-xs mb-0.5">{label}</p>
                  <p className="text-white text-xs font-medium leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment summary */}
          <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-2">
            {booking.subtotal !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">₹{booking.subtotal.toLocaleString()}</span>
              </div>
            )}
            {booking.tax !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">GST (18%)</span>
                <span className="text-white">₹{booking.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-white/60 text-sm">Total Paid</span>
              <span className="text-xl font-bold text-[#D9FC67]">
                ₹{booking.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-xs">Booking ID</span>
              <span className="text-white/80 font-mono text-xs">{booking.id}</span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full py-5 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View My Bookings
          </Button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
        >
          <X className="w-4 h-4 text-black/70" />
        </button>
      </div>
    </div>
  );
}
