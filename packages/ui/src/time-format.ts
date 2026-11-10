// Origin: Fabrials, 0.12 (from Radiant's lib/time-format). No directive: a Server Component can call it.

export type LocalTimeValue = Date | string | number | null | undefined;

export type LocalTimeFormatName =
  /** "09:31" ("9:31 AM" in a 12-hour locale). */
  | "time"
  /** "09:31" today, "Sep 26, 09:31" another day, "Sep 26, 2025, 09:31" another year: the stamp of a message. */
  | "message"
  /** "Sep 27, 2026, 9:31 AM": tables and tooltips. */
  | "dateTime"
  /** "Sep 27, 2026". */
  | "date"
  /** "Sep 27", with the year only when it is not this year. */
  | "shortDate";

export type LocalTimeFormat = LocalTimeFormatName | Intl.DateTimeFormatOptions;

export type LocalTimeOptions = {
  /** English by default, so a server and a browser write the same text; pass the reader's language for theirs. */
  locale?: Intl.LocalesArgument;
  /** An IANA zone ("Europe/Madrid"). Default: the runtime's own zone. */
  timeZone?: string;
  /** The clock `message` and `shortDate` compare with. Default: the current time. */
  now?: Date | number;
};

function toDate(value: LocalTimeValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The calendar day of `date` in `timeZone`, as "2026-09-27". */
function dayKey(date: Date, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const clocks = new Map<string, Intl.DateTimeFormatOptions>();

/** "09:31" where the day has 24 hours, "9:31 AM" where it has 12: two digits would read "09:31 AM". */
function clockOf(locale: Intl.LocalesArgument): Intl.DateTimeFormatOptions {
  const key = String(locale ?? "");
  let clock = clocks.get(key);
  if (!clock) {
    const cycle = new Intl.DateTimeFormat(locale ?? "en", { hour: "numeric" }).resolvedOptions().hourCycle;
    clock = { hour: cycle === "h12" || cycle === "h11" ? "numeric" : "2-digit", minute: "2-digit" };
    clocks.set(key, clock);
  }
  return clock;
}

function optionsFor(date: Date, format: LocalTimeFormat, locale: Intl.LocalesArgument, timeZone: string | undefined, now: Date): Intl.DateTimeFormatOptions {
  if (typeof format !== "string") return format;
  const clock = clockOf(locale);
  if (format === "time") return clock;
  if (format === "dateTime") return { dateStyle: "medium", timeStyle: "short" };
  if (format === "date") return { dateStyle: "medium" };
  const day = dayKey(date, timeZone);
  const today = dayKey(now, timeZone);
  const year: Intl.DateTimeFormatOptions = day.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" };
  if (format === "shortDate") return { month: "short", day: "numeric", ...year };
  return day === today ? clock : { month: "short", day: "numeric", ...year, ...clock };
}

/** The ISO instant of a value, or `null` when it is empty or not a date. */
export function localTimeIso(value: LocalTimeValue): string | null {
  return toDate(value)?.toISOString() ?? null;
}

/**
 * A date as text in a given zone and locale, English when no locale is given. Pure: the zone, the locale and the clock
 * are parameters, so the caller decides where it runs (a server prints its own zone unless told another). Returns "" for
 * an empty or invalid value. `format` is a named format or `Intl.DateTimeFormat` options, whose own `timeZone` wins.
 */
export function formatLocalTime(value: LocalTimeValue, format: LocalTimeFormat = "dateTime", { locale = "en", timeZone, now }: LocalTimeOptions = {}): string {
  const date = toDate(value);
  if (!date) return "";
  const clock = toDate(now) ?? new Date();
  return new Intl.DateTimeFormat(locale, { timeZone, ...optionsFor(date, format, locale, timeZone, clock) }).format(date);
}
