import type { Currency } from "./catalog";

const LOCALE: Partial<Record<Currency, string>> = {
  INR: "en-IN",
  EUR: "de-DE",
  AED: "en-AE",
};

export function formatMoney(amount: number, currency: Currency): string {
  const whole = Math.abs(amount % 1) < 0.005;
  return new Intl.NumberFormat(LOCALE[currency] ?? "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: whole ? 0 : 2,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatDayGap(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}
