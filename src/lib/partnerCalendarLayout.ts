import { calendarDateInIST, getHourInIST, getMinuteInIST } from "@/lib/bookingTime";

/** Visible grid: 7:00 – 22:00 IST (15 hours). */
export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 22;

export function minutesSinceMidnightIST(d: Date): number {
  return getHourInIST(d) * 60 + getMinuteInIST(d);
}

export function visibleMinutesSpan(): number {
  return (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
}

/** Top % and height % within the day column (0–100). Clamps to visible window. */
export function eventPositionPercent(
  start: Date,
  end: Date
): { top: number; height: number } {
  const startMin = minutesSinceMidnightIST(start);
  const endMin = minutesSinceMidnightIST(end);
  const winStart = CALENDAR_START_HOUR * 60;
  const winEnd = CALENDAR_END_HOUR * 60;
  const span = winEnd - winStart;

  const clampedStart = Math.max(startMin, winStart);
  const clampedEnd = Math.min(endMin, winEnd);
  if (clampedEnd <= winStart || clampedStart >= winEnd) {
    return { top: 0, height: 0 };
  }
  const top = ((clampedStart - winStart) / span) * 100;
  const height = Math.max(((clampedEnd - clampedStart) / span) * 100, 0.8);
  return { top, height };
}

export type LayoutInput = {
  id: string;
  startMs: number;
  endMs: number;
};

export type LaidOut<T extends LayoutInput> = T & {
  col: number;
  colCount: number;
};

function overlaps(a: LayoutInput, b: LayoutInput): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

/** Union–find clusters of mutually overlapping (transitively) events. */
function clusterEvents<T extends LayoutInput>(events: T[]): T[][] {
  const n = events.length;
  if (n === 0) return [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlaps(events[i], events[j])) union(i, j);
    }
  }
  const map = new Map<number, T[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!map.has(r)) map.set(r, []);
    map.get(r)!.push(events[i]);
  }
  return [...map.values()];
}

/** Greedy column assignment inside one cluster; equal-width columns. */
function layoutCluster<T extends LayoutInput>(cluster: T[]): LaidOut<T>[] {
  const sorted = [...cluster].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const colEnds: number[] = [];
  const placed: { ev: T; col: number }[] = [];

  for (const e of sorted) {
    let col = colEnds.findIndex((end) => end <= e.startMs);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(e.endMs);
    } else {
      colEnds[col] = e.endMs;
    }
    placed.push({ ev: e, col });
  }

  const colCount = Math.max(1, colEnds.length);
  return placed.map(({ ev, col }) => ({
    ...ev,
    col,
    colCount,
  }));
}

export function layoutOverlappingEvents<T extends LayoutInput>(events: T[]): LaidOut<T>[] {
  if (events.length === 0) return [];
  const clusters = clusterEvents(events);
  const out: LaidOut<T>[] = [];
  for (const c of clusters) {
    out.push(...layoutCluster(c));
  }
  return out;
}

const IST_SHORT_WEEKDAY_ORDER: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Monday = 0 … Sunday = 6 in Asia/Kolkata for this calendar day. */
export function istWeekdayMon0(yyyymmdd: string): number {
  const dt = new Date(`${yyyymmdd}T12:00:00+05:30`);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(dt);
  return IST_SHORT_WEEKDAY_ORDER[short] ?? 0;
}

export function mondayOfWeekIST(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T12:00:00+05:30`);
  const mon = istWeekdayMon0(yyyymmdd);
  const ms = d.getTime() - mon * 86400000;
  return calendarDateInIST(new Date(ms).toISOString());
}

export function addDaysIST(yyyymmdd: string, days: number): string {
  const d = new Date(`${yyyymmdd}T12:00:00+05:30`);
  const ms = d.getTime() + days * 86400000;
  return calendarDateInIST(new Date(ms).toISOString());
}

export function weekDayStringsFromMonday(mondayYmd: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIST(mondayYmd, i));
}
