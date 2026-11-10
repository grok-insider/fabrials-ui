// Local calendar days as pure functions: no directive, so a Server Component can format or parse the day a form posts.
// The public ones are still exported from "./calendar"; the rest are the calendar's own arithmetic.

import { localeTag } from "./plural";

export type DateRange = { from: Date | undefined; to?: Date | undefined };
export type DateMatcher =
  | boolean
  | Date
  | Date[]
  | { before: Date }
  | { after: Date }
  | { from: Date; to: Date }
  | { dayOfWeek: number[] }
  | ((date: Date) => boolean);

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export function addMonths(date: Date, months: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), last));
}
export const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
export const compareDays = (a: Date, b: Date) => startOfDay(a).getTime() - startOfDay(b).getTime();
export const isSameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && compareDays(a, b) === 0;

/** A local calendar day as `yyyy-mm-dd` (what a form posts). */
export function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** `yyyy-mm-dd` as a local calendar day; anything else is undefined. */
export function parseISODate(value: string | null | undefined): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getMonth() === Number(match[2]) - 1 ? date : undefined;
}

export function matchesDate(date: Date, matcher: DateMatcher | DateMatcher[] | undefined): boolean {
  if (matcher === undefined) return false;
  if (Array.isArray(matcher)) return matcher.some((item) => matchesDate(date, item));
  if (typeof matcher === "boolean") return matcher;
  if (typeof matcher === "function") return matcher(date);
  if (matcher instanceof Date) return isSameDay(date, matcher);
  if ("dayOfWeek" in matcher) return matcher.dayOfWeek.includes(date.getDay());
  if ("from" in matcher && "to" in matcher) return compareDays(date, matcher.from) >= 0 && compareDays(date, matcher.to) <= 0;
  if ("before" in matcher) return compareDays(date, matcher.before) < 0;
  if ("after" in matcher) return compareDays(date, matcher.after) > 0;
  return false;
}

/** The first day of the week for a locale (0 is Sunday), from Intl's week data; the week of English (Sunday) when no locale
 * is given, so a server and a browser draw the same calendar; Monday when Intl has no data for it. */
export function firstDayOfWeek(locale?: Intl.LocalesArgument): number {
  try {
    const info = new Intl.Locale(localeTag(locale ?? "en")) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (firstDay) return firstDay % 7;
  } catch {
    // An unknown locale falls through to Monday.
  }
  return 1;
}
