"use client";

import { History } from "lucide-react";

export type BookingTimelineProps = {
  createdAt?: string | null;
  updatedAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  paymentRecorded?: boolean;
  /** IST / locale-friendly formatter */
  formatDateTime?: (iso: string) => string;
};

function defaultFmt(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type Ev = { at: number; title: string; detail?: string };

export function BookingActivityTimeline({
  createdAt,
  updatedAt,
  startTime,
  endTime,
  status,
  cancelledAt,
  cancellationReason,
  paymentRecorded,
  formatDateTime = defaultFmt,
}: BookingTimelineProps) {
  const events: Ev[] = [];

  if (createdAt) {
    const ts = formatDateTime(createdAt);
    events.push({
      at: new Date(createdAt).getTime(),
      title: paymentRecorded ? "Booking placed · payment recorded" : "Booking placed",
      detail: ts,
    });
  }

  if (updatedAt && createdAt && status && status !== "cancelled") {
    const cu = new Date(createdAt).getTime();
    const uu = new Date(updatedAt).getTime();
    if (!isNaN(uu) && uu > cu + 60_000) {
      events.push({
        at: uu,
        title: "Booking updated",
        detail: `${formatDateTime(updatedAt)} · Status: ${status}`,
      });
    }
  }

  if (startTime) {
    events.push({
      at: new Date(startTime).getTime(),
      title: "Session starts",
      detail: formatDateTime(startTime),
    });
  }

  if (status === "completed" && endTime) {
    events.push({
      at: new Date(endTime).getTime(),
      title: "Session completed",
      detail: formatDateTime(endTime),
    });
  }

  if ((status === "cancelled" || cancelledAt) && cancelledAt) {
    events.push({
      at: new Date(cancelledAt).getTime(),
      title: "Booking cancelled",
      detail:
        cancellationReason?.trim()
          ? `${formatDateTime(cancelledAt)} · ${cancellationReason}`
          : formatDateTime(cancelledAt),
    });
  }

  events.sort((a, b) => a.at - b.at);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/5 mb-6">
      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-white/50" />
        Activity timeline
      </h4>
      <div className="relative pl-2">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" aria-hidden />
        <ul className="space-y-4">
          {events.map((e, idx) => (
            <li key={`${e.title}-${idx}`} className="relative flex gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D9FC67] outline outline-[3px] outline-[#18181b]" aria-hidden />
              <div className="min-w-0 pt-0.5">
                <p className="text-white font-medium text-sm">{e.title}</p>
                {e.detail && (
                  <p className="text-white/45 text-xs mt-1 leading-snug">{e.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
