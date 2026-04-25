"use client";

import { useState } from "react";
import {
  X, Check, Calendar, Clock, MapPin, Users, Sparkles,
  ChevronRight, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatBookingDateLong, formatBookingTimeRange } from "@/lib/bookingDisplay";

interface BookingData {
  id: string;
  /** Raw UTC ISO — use for all date/time display */
  start_time?: string;
  end_time?: string;
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

interface ParticipantRow {
  name: string;
  email: string;
  phone: string;
}

interface BookingSuccessModalProps {
  booking: BookingData;
  onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
  const [step, setStep] = useState<"confirm" | "participants">("confirm");
  const [participants, setParticipants] = useState<ParticipantRow[]>(
    Array.from({ length: booking.participants }, () => ({ name: "", email: "", phone: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const formatDate = () => {
    const src = booking.start_time || booking.date;
    if (!src) return "";
    return formatBookingDateLong(src);
  };

  const formatTime = () => {
    if (booking.start_time && booking.end_time) {
      return formatBookingTimeRange(booking.start_time, booking.end_time);
    }
    if (!booking.timeSlot) return "";
    const [hoursStr, minutesStr = "00"] = booking.timeSlot.split(":");
    const hour = parseInt(hoursStr, 10);
    const minute = parseInt(minutesStr, 10);
    const totalStartMinutes = hour * 60 + minute;
    const totalEndMinutes = totalStartMinutes + Math.round(booking.duration * 60);
    const fmt = (total: number) => {
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };
    return `${fmt(totalStartMinutes)} – ${fmt(totalEndMinutes)}`;
  };

  const updateParticipant = (index: number, field: keyof ParticipantRow, value: string) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveParticipants = async () => {
    const filled = participants.filter((p) => p.name.trim() || p.email.trim());
    if (filled.length === 0) { onClose(); return; }

    setSaving(true);
    try {
      await fetch(`/api/bookings/${booking.id}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: participants }),
      });
      setSaved(true);
      setTimeout(onClose, 800);
    } catch {
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#D9FC67]/50 focus:bg-white/8 transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0f0f0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60 max-h-[90vh] flex flex-col">

        {/* ── Step 1: Booking Confirmation ──────────────────────────────── */}
        {step === "confirm" && (
          <>
            {/* Success header */}
            <div className="relative bg-gradient-to-br from-[#D9FC67] to-[#B8E050] px-6 py-8 text-center overflow-hidden flex-shrink-0">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-black/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Check className="w-8 h-8 text-black" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-black">Booking Confirmed!</h2>
                <p className="text-black/60 text-sm mt-1">Your studio session is all set 🎙</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
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
                    <span>{booking.studio.location.area}, {booking.studio.location.city}</span>
                  </div>
                </div>
              </div>

              {/* Session details grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Calendar, label: "Date", value: formatDate() },
                  { icon: Clock, label: "Time", value: formatTime() },
                  { icon: Clock, label: "Duration", value: `${booking.duration} hr${booking.duration > 1 ? "s" : ""}` },
                  { icon: Users, label: "Participants", value: `${booking.participants} people` },
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
                  <span className="text-xl font-bold text-[#D9FC67]">₹{booking.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Booking ID</span>
                  <span className="text-white/80 font-mono text-xs">{booking.id}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep("participants")}
                className="w-full py-5 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black rounded-xl"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Next: Add Participants
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Skip — Go to Dashboard
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Participant Details ────────────────────────────────── */}
        {step === "participants" && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#D9FC67]/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-[#D9FC67]" />
                </div>
                <h2 className="text-lg font-bold text-white">Who&apos;s joining?</h2>
              </div>
              <p className="text-white/40 text-xs ml-11">
                We&apos;ll send booking updates &amp; reminders directly to each participant.
              </p>
            </div>

            {/* Participant rows */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {participants.map((p, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-2.5">
                  <p className="text-[#D9FC67] text-xs font-semibold tracking-wide uppercase">
                    Participant {i + 1}
                  </p>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={p.name}
                    onChange={(e) => updateParticipant(i, "name", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={p.email}
                    onChange={(e) => updateParticipant(i, "email", e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={p.phone}
                    onChange={(e) => updateParticipant(i, "phone", e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}

              {/* Notice */}
              <div className="flex items-start gap-2 px-1 pt-1">
                <Send className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                <p className="text-white/30 text-xs leading-relaxed">
                  We&apos;ll send booking confirmations, session reminders, and any rescheduling updates
                  directly to all participants via email.
                </p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 pb-6 pt-3 border-t border-white/5 flex-shrink-0 space-y-2">
              <Button
                onClick={handleSaveParticipants}
                disabled={saving || saved}
                className="w-full py-5 text-base font-semibold bg-gradient-to-r from-[#D9FC67] to-[#B8E050] hover:from-[#E8FF8A] hover:to-[#D9FC67] text-black rounded-xl disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                ) : saved ? (
                  <><Check className="w-4 h-4 mr-2" strokeWidth={3} />Saved! Going to Dashboard…</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Save &amp; Go to Dashboard</>
                )}
              </Button>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            step === "confirm"
              ? "bg-black/20 hover:bg-black/40"
              : "bg-white/5 hover:bg-white/10"
          }`}
        >
          <X className={`w-4 h-4 ${step === "confirm" ? "text-black/70" : "text-white/50"}`} />
        </button>
      </div>
    </div>
  );
}
