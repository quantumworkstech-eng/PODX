"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  Building2,
  User,
  UserCheck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { calendarDateInIST } from "@/lib/bookingTime";
import {
  addDaysIST,
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  eventPositionPercent,
  layoutOverlappingEvents,
  minutesSinceMidnightIST,
  mondayOfWeekIST,
  weekDayStringsFromMonday,
} from "@/lib/partnerCalendarLayout";

export type PartnerCalendarBooking = {
  id: string;
  dbId?: string;
  date: string;
  endDate: string;
  studioId?: string;
  studio: { id?: string; name: string; city?: string };
  customer: { name: string; email?: string };
  /** Studio owner (partner) — admin calendar */
  partnerName?: string;
  partnerEmail?: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  package: { name: string } | null;
  totalPrice?: number;
};

type ViewMode = "day" | "week";

const HOUR_ROWS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i
);

function formatHourLabel(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr} ${ampm}`;
}

function formatRangeIST(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function statusStyle(status: PartnerCalendarBooking["status"]): {
  bg: string;
  border: string;
  text: string;
  faded?: boolean;
} {
  switch (status) {
    case "confirmed":
      return {
        bg: "bg-[#D9FC67]/20",
        border: "border-[#D9FC67]/50",
        text: "text-[#D9FC67]",
      };
    case "pending":
      return {
        bg: "bg-amber-400/15",
        border: "border-amber-400/40",
        text: "text-amber-300",
      };
    case "cancelled":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-300/90",
        faded: true,
      };
    case "completed":
      return {
        bg: "bg-blue-500/15",
        border: "border-blue-400/35",
        text: "text-blue-300",
      };
    default:
      return {
        bg: "bg-white/10",
        border: "border-white/20",
        text: "text-white",
      };
  }
}

function StatusIcon({ status }: { status: PartnerCalendarBooking["status"] }) {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    case "pending":
      return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
    case "cancelled":
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <CheckCircle className="w-3.5 h-3.5 text-blue-400" />;
  }
}

type StudioOpt = { id: string; name: string };

export function PartnerBookingsCalendar({
  bookings,
  studios,
  audience = "partner",
  onNavigateUpcoming,
}: {
  /** Ignored when audience is admin (data is loaded from /api/admin/bookings/calendar). */
  bookings?: PartnerCalendarBooking[];
  /** Partner: list of studios. If omitted or empty, studios are derived from bookings. */
  studios?: StudioOpt[];
  /** Partner / client / admin dashboards */
  audience?: "partner" | "client" | "admin";
  /** Client: e.g. switch dashboard section to upcoming bookings */
  onNavigateUpcoming?: () => void;
}) {
  const [adminBookings, setAdminBookings] = useState<PartnerCalendarBooking[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const partnerOrClientBookings = useMemo(() => bookings ?? [], [bookings]);

  const studioOptions = useMemo(() => {
    const src = audience === "admin" ? adminBookings : partnerOrClientBookings;
    if (studios && studios.length > 0) return studios;
    const m = new Map<string, string>();
    for (const b of src) {
      const sid = b.studioId || b.studio?.id;
      if (sid) m.set(sid, b.studio.name);
    }
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [studios, partnerOrClientBookings, adminBookings, audience]);

  const todayIst = useMemo(() => calendarDateInIST(new Date().toISOString()), []);
  const [selectedDay, setSelectedDay] = useState(todayIst);
  const [view, setView] = useState<ViewMode>("day");
  const [studioFilter, setStudioFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detail, setDetail] = useState<PartnerCalendarBooking | null>(null);

  const weekMonday = useMemo(() => mondayOfWeekIST(selectedDay), [selectedDay]);
  const weekDays = useMemo(() => weekDayStringsFromMonday(weekMonday), [weekMonday]);

  useEffect(() => {
    if (audience !== "admin") return;
    const from = view === "day" ? selectedDay : weekMonday;
    const to = view === "day" ? selectedDay : addDaysIST(weekMonday, 6);
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setAdminLoading(true);
    });
    fetch(`/api/admin/bookings/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.json())
      .then((d: { bookings?: PartnerCalendarBooking[] }) => {
        if (!cancelled) setAdminBookings(d.bookings || []);
      })
      .catch(() => {
        if (!cancelled) setAdminBookings([]);
      })
      .finally(() => {
        if (!cancelled) setAdminLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [audience, view, selectedDay, weekMonday]);

  const sourceBookings = audience === "admin" ? adminBookings : partnerOrClientBookings;

  const filtered = useMemo(() => {
    return sourceBookings.filter((b) => {
      if (studioFilter !== "all") {
        const sid = b.studioId || b.studio?.id;
        if (sid !== studioFilter) return false;
      }
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      const d = calendarDateInIST(b.date);
      if (view === "day") return d === selectedDay;
      return weekDays.includes(d);
    });
  }, [sourceBookings, studioFilter, statusFilter, view, selectedDay, weekDays]);

  const shiftDay = (delta: number) => {
    setSelectedDay((d) => {
      const base = new Date(`${d}T12:00:00+05:30`);
      const ms = base.getTime() + delta * 86400000;
      return calendarDateInIST(new Date(ms).toISOString());
    });
  };

  const shiftWeek = (delta: number) => {
    setSelectedDay((d) => {
      const base = new Date(`${d}T12:00:00+05:30`);
      const ms = base.getTime() + delta * 7 * 86400000;
      return calendarDateInIST(new Date(ms).toISOString());
    });
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D9FC67]/10">
              <CalendarIcon className="w-5 h-5 text-[#D9FC67]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Calendar View</h2>
              <p className="text-white/40 text-sm">
                {audience === "client"
                  ? "Your bookings"
                  : audience === "admin"
                    ? "All platform bookings"
                    : "Bookings"}{" "}
                in IST · {view === "day" ? "Day" : "Week"} view
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setView("day")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  view === "day" ? "bg-[#D9FC67] text-black" : "bg-transparent text-white/60 hover:bg-white/5"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Day
              </button>
              <button
                type="button"
                onClick={() => setView("week")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-l border-white/10",
                  view === "week" ? "bg-[#D9FC67] text-black" : "bg-transparent text-white/60 hover:bg-white/5"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Week
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:items-center">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white border border-white/10 rounded-lg h-9 w-9"
              onClick={() => (view === "day" ? shiftDay(-1) : shiftWeek(-1))}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [&::-webkit-calendar-picker-indicator]:invert"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white border border-white/10 rounded-lg h-9 w-9"
              onClick={() => (view === "day" ? shiftDay(1) : shiftWeek(1))}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/10 text-white/70 hover:bg-white/5 text-xs"
              onClick={() => setSelectedDay(todayIst)}
            >
              Today
            </Button>
          </div>

          {studioOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/30 shrink-0" />
              <select
                value={studioFilter}
                onChange={(e) => setStudioFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-w-[140px]"
              >
                <option value="all">All studios</option>
                {studioOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white lg:ml-auto"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {view === "week" && (
          <p className="text-white/35 text-xs">
            Week of{" "}
            <span className="text-white/60">
              {new Date(`${weekMonday}T12:00:00+05:30`).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </div>

      <div className="p-2 sm:p-4 relative">
        {audience === "admin" && adminLoading && (
          <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {filtered.length === 0 && !(audience === "admin" && adminLoading) ? (
          <div className="py-16 text-center px-4">
            <CalendarIcon className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/45 text-sm">No bookings for this {view === "day" ? "day" : "week"}.</p>
            {audience === "client" ? (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onNavigateUpcoming && (
                  <button
                    type="button"
                    onClick={() => onNavigateUpcoming()}
                    className="text-sm font-medium text-[#D9FC67] hover:text-[#E8FF8A] underline underline-offset-2"
                  >
                    View upcoming bookings
                  </button>
                )}
                <Link
                  href="/book"
                  className="text-sm font-medium text-white/60 hover:text-white/90"
                >
                  Book a session
                </Link>
              </div>
            ) : audience === "admin" ? (
              <Link
                href="/admin/bookings"
                className="inline-flex mt-4 text-sm font-medium text-[#D9FC67] hover:text-[#E8FF8A]"
              >
                Open bookings list
              </Link>
            ) : (
              <Link
                href="/partner/bookings"
                className="inline-flex mt-4 text-sm font-medium text-[#D9FC67] hover:text-[#E8FF8A]"
              >
                View upcoming bookings
              </Link>
            )}
          </div>
        ) : view === "day" ? (
          <DayColumn
            bookings={filtered.filter((b) => calendarDateInIST(b.date) === selectedDay)}
            onSelectBooking={setDetail}
            showCustomerOnBlock={audience === "partner"}
            audience={audience}
          />
        ) : (
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 gap-0">
            <TimeRuler compact />
            {weekDays.map((dayYmd) => (
              <div
                key={dayYmd}
                className="min-w-[100px] sm:min-w-[130px] flex-1 border-l border-white/10 first:border-l-0 pl-1"
              >
                <div className="text-center pb-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    {new Date(`${dayYmd}T12:00:00+05:30`).toLocaleDateString("en-IN", {
                      weekday: "short",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(`${dayYmd}T12:00:00+05:30`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
                <DayColumn
                  bookings={filtered.filter((b) => calendarDateInIST(b.date) === dayYmd)}
                  onSelectBooking={setDetail}
                  hideTimeRuler
                  compact
                  showCustomerOnBlock={audience === "partner"}
                  audience={audience}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <StatusIcon status={detail?.status ?? "confirmed"} />
              Booking {detail?.id}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white/40 text-xs">Studio</p>
                  <p className="text-white font-medium">{detail.studio.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white/40 text-xs">Time</p>
                  <p className="text-white font-medium">
                    {formatRangeIST(new Date(detail.date), new Date(detail.endDate))}
                  </p>
                </div>
              </div>
              {(audience === "partner" || audience === "admin") && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs">{audience === "admin" ? "Client" : "Customer"}</p>
                    <p className="text-white font-medium">{detail.customer.name}</p>
                    {detail.customer.email && (
                      <p className="text-white/35 text-xs mt-0.5">{detail.customer.email}</p>
                    )}
                  </div>
                </div>
              )}
              {audience === "admin" && (detail.partnerName || detail.partnerEmail) && (
                <div className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-violet-400/80 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs">Partner (studio owner)</p>
                    <p className="text-white font-medium">{detail.partnerName || "—"}</p>
                    {detail.partnerEmail && (
                      <p className="text-white/35 text-xs mt-0.5">{detail.partnerEmail}</p>
                    )}
                  </div>
                </div>
              )}
              {detail.package && (
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs">Package</p>
                    <p className="text-white font-medium">{detail.package.name}</p>
                  </div>
                </div>
              )}
              <div className="pt-2 flex gap-2">
                {audience === "client" ? (
                  <>
                    {onNavigateUpcoming && (
                      <Button
                        type="button"
                        className="flex-1 bg-[#D9FC67] hover:bg-[#E8FF8A] text-black text-sm"
                        onClick={() => {
                          setDetail(null);
                          onNavigateUpcoming();
                        }}
                      >
                        View upcoming
                      </Button>
                    )}
                    <Link href="/book" className="flex-1">
                      <Button variant="outline" className="w-full border-white/15 text-white hover:bg-white/5 text-sm">
                        Book again
                      </Button>
                    </Link>
                  </>
                ) : audience === "admin" ? (
                  <Link href="/admin/bookings" className="flex-1">
                    <Button className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black text-sm">Open bookings admin</Button>
                  </Link>
                ) : (
                  <Link href="/partner/bookings" className="flex-1">
                    <Button className="w-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black text-sm">Open in Bookings</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimeRuler({ compact }: { compact?: boolean }) {
  const rowH = compact ? 40 : 48;
  return (
    <div className="w-12 sm:w-14 flex-shrink-0 pr-2 text-right">
      {HOUR_ROWS.map((h) => (
        <div key={h} className="text-[10px] sm:text-xs text-white/35 leading-none" style={{ height: rowH }}>
          {formatHourLabel(h)}
        </div>
      ))}
    </div>
  );
}

function DayColumn({
  bookings,
  onSelectBooking,
  hideTimeRuler,
  compact,
  showCustomerOnBlock = true,
  audience = "partner",
}: {
  bookings: PartnerCalendarBooking[];
  onSelectBooking: (b: PartnerCalendarBooking) => void;
  hideTimeRuler?: boolean;
  compact?: boolean;
  /** Partner shows customer name on wide blocks; client hides */
  showCustomerOnBlock?: boolean;
  audience?: "partner" | "client" | "admin";
}) {
  const laidOut = useMemo(() => {
    const withMs = bookings.map((b) => {
      const start = new Date(b.date);
      const end = new Date(b.endDate);
      return {
        booking: b,
        id: b.id,
        startMs: start.getTime(),
        endMs: end.getTime(),
        start,
        end,
      };
    });
    const visible = withMs.filter((e) => {
      const sm = minutesSinceMidnightIST(e.start);
      const em = minutesSinceMidnightIST(e.end);
      const winStart = CALENDAR_START_HOUR * 60;
      const winEnd = CALENDAR_END_HOUR * 60;
      return em > winStart && sm < winEnd;
    });
    return layoutOverlappingEvents(visible);
  }, [bookings]);

  const rowH = compact ? 40 : 48;
  const gridMinH = HOUR_ROWS.length * rowH;

  const body = (
    <div className="flex" style={{ minHeight: gridMinH }}>
      {!hideTimeRuler && <TimeRuler compact={compact} />}
      <div
        className={cn(
          "flex-1 relative border-l border-white/10 bg-black/20 rounded-lg overflow-hidden",
          hideTimeRuler && "border-l-0"
        )}
        style={{ minHeight: gridMinH }}
      >
        {HOUR_ROWS.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-white/5 pointer-events-none"
            style={{ top: `${(i / HOUR_ROWS.length) * 100}%` }}
          />
        ))}

        {laidOut.map((item) => {
          const b = item.booking;
          const st = statusStyle(b.status);
          const { top, height } = eventPositionPercent(item.start, item.end);
          if (height <= 0) return null;
          const widthPct = 100 / item.colCount;
          const leftPct = (item.col / item.colCount) * 100;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBooking(b)}
              className={cn(
                "absolute rounded-lg border px-1.5 py-1 text-left shadow-md transition-transform hover:scale-[1.02] hover:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FC67]/50 overflow-hidden",
                st.bg,
                st.border,
                st.faded && "opacity-70"
              )}
              style={{
                top: `${top}%`,
                height: `${height}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                minHeight: 28,
              }}
              title={
                audience === "admin"
                  ? `${b.studio.name} · ${formatRangeIST(item.start, item.end)} · Partner: ${b.partnerName || "—"} · Client: ${b.customer.name}`
                  : `${b.studio.name} · ${formatRangeIST(item.start, item.end)}${showCustomerOnBlock ? ` · ${b.customer.name}` : ""}`
              }
            >
              <p className={cn("text-[10px] sm:text-xs font-semibold truncate leading-tight", st.text)}>
                {b.studio.name}
              </p>
              <p className="text-[9px] sm:text-[10px] text-white/70 truncate leading-tight">
                {formatRangeIST(item.start, item.end)}
              </p>
              {b.package && (
                <p className="text-[9px] text-white/50 truncate hidden sm:block">{b.package.name}</p>
              )}
              {audience === "admin" && (
                <>
                  <p className="text-[9px] text-violet-300/90 truncate leading-tight">
                    P: {b.partnerName || "—"}
                  </p>
                  <p className="text-[9px] text-cyan-300/90 truncate leading-tight">
                    C: {b.customer.name}
                  </p>
                </>
              )}
              {!compact && showCustomerOnBlock && audience !== "admin" && (
                <p className="text-[9px] text-white/45 truncate hidden md:block">{b.customer.name}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return body;
}
