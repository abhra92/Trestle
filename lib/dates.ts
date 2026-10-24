const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  const start = parseISODate(from);
  const end = parseISODate(to);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function formatDate(value: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = parseISODate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(date);
}

export function formatWeekday(value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
}

export function isWeekend(value: string): boolean {
  const date = parseISODate(value);
  if (!date) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function daysUntil(value: string, now: Date = new Date()): number {
  return daysBetween(todayISO(now), value);
}
