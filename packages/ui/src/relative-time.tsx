"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { classes } from "./shared";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

export type RelativeTimeStyle = "long" | "short" | "narrow";

/**
 * "3 minutes ago" in the given locale. Under 45 seconds reads as "now";
 * beyond `absoluteAfterDays` it becomes a date.
 */
export function formatRelativeTime(
  date: Date | string | number,
  now: number,
  locale: string,
  opts: { style?: RelativeTimeStyle; absoluteAfterDays?: number; timeZone?: string } = {},
): string {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.round((time - now) / 1000);
  const abs = Math.abs(seconds);
  const absoluteAfter = (opts.absoluteAfterDays ?? 30) * 86_400;
  if (abs >= absoluteAfter) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: opts.timeZone }).format(time);
  }
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: opts.style ?? "long" });
  if (abs < 45) return format.format(0, "second");
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === "second") return format.format(Math.round(seconds / size), unit);
  }
  return "";
}

/**
 * Options for `Intl.DateTimeFormat`, or a function that picks them per date: a row that drops the year when it is this
 * year needs the clock (`now`) to decide, and the caller owns that rule.
 */
export type AbsoluteTimeFormat =
  | Intl.DateTimeFormatOptions
  | ((date: Date, now: number) => Intl.DateTimeFormatOptions);

/**
 * A date as an absolute, deterministic string ("29 Sept, 09:41"). It reads no clock unless the format is a function,
 * which receives `opts.now` (default: the current time). Returns "" for an invalid date. Pass a `timeZone` (in the
 * format or in `opts`) for a string that is the same on the server and in the browser.
 */
export function formatAbsoluteTime(
  date: Date | string | number,
  locale: string,
  format: AbsoluteTimeFormat,
  opts: { now?: number; timeZone?: string } = {},
): string {
  const value = new Date(date);
  if (!Number.isFinite(value.getTime())) return "";
  const options = typeof format === "function" ? format(value, opts.now ?? Date.now()) : format;
  return new Intl.DateTimeFormat(locale, { timeZone: opts.timeZone, ...options }).format(value);
}

/** How long until the text can change: seconds for recent times, minutes later. */
function refreshMs(date: Date | string | number, now: number): number {
  const abs = Math.abs(now - new Date(date).getTime());
  if (abs < 60_000) return 5_000;
  if (abs < 3_600_000) return 30_000;
  return 300_000;
}

export type RelativeTimeProps = Omit<ComponentProps<"time">, "children" | "dateTime"> & {
  date: Date | string | number;
  locale?: string;
  style?: RelativeTimeStyle;
  absoluteAfterDays?: number;
  /**
   * Deterministic mode: print the date with these `Intl.DateTimeFormat` options (or a function that picks them per date)
   * instead of "3 minutes ago". No timer runs, so a list renders the same tomorrow and in a screenshot.
   */
  absoluteFormat?: AbsoluteTimeFormat;
  /**
   * The clock. A number is a fixed instant and stops the timer (tests, screenshots, a server-anchored render); a function
   * is read at every tick (a clock anchored to the server's time). Default: the device clock.
   */
  now?: number | (() => number);
  /**
   * The zone dates are printed in, also in the `title` and in the absolute fallback of a far date. Without it the
   * browser's zone is used, which differs from the server's: it is REQUIRED whenever a deterministic time (`absoluteFormat`
   * or a fixed `now`) is server-rendered, or React reports a mismatch (the title is zone-dependent even when the text is not).
   */
  timeZone?: string;
};

/**
 * A `<time>` that reads "3 minutes ago" and keeps itself current while the page is visible. The full date is in the
 * title. With `absoluteFormat` or a fixed `now` it is deterministic and does not tick; give it a `timeZone` and the
 * server and the browser print the same text (hydration-exact, no warning suppressed).
 */
export function RelativeTime({
  date,
  locale = "en",
  style,
  absoluteAfterDays,
  absoluteFormat,
  now,
  timeZone,
  className,
  title,
  ...props
}: RelativeTimeProps) {
  const [tick, setTick] = useState(() => (typeof now === "function" ? now() : (now ?? Date.now())));
  const clock = useRef(now);
  useEffect(() => {
    clock.current = now;
  });
  const fixed = typeof now === "number";
  const live = absoluteFormat === undefined && !fixed;
  useEffect(() => {
    if (!live) return;
    const read = () => {
      const source = clock.current;
      return typeof source === "function" ? source() : Date.now();
    };
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") setTick(read());
        schedule();
      }, refreshMs(date, read()));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") setTick(read());
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [date, live]);
  const current = fixed ? now : tick;
  const time = new Date(date);
  const valid = Number.isFinite(time.getTime());
  const formatZone = typeof absoluteFormat === "function" ? (valid ? absoluteFormat(time, current).timeZone : undefined) : absoluteFormat?.timeZone;
  const zone = timeZone ?? formatZone;
  const exact = absoluteFormat !== undefined || zone !== undefined;
  const text =
    absoluteFormat !== undefined
      ? formatAbsoluteTime(date, locale, absoluteFormat, { now: current, timeZone })
      : formatRelativeTime(date, current, locale, { style, absoluteAfterDays, timeZone });
  return (
    <time
      data-slot="relative-time"
      data-mode={live ? "live" : "fixed"}
      dateTime={valid ? time.toISOString() : undefined}
      title={
        title ??
        (valid
          ? new Intl.DateTimeFormat(locale, exact ? { dateStyle: "full", timeStyle: "long", timeZone: zone } : { dateStyle: "medium", timeStyle: "short" }).format(time)
          : undefined)
      }
      className={classes("fui-relative-time", className)}
      suppressHydrationWarning={live || undefined}
      {...props}
    >
      {text}
    </time>
  );
}
