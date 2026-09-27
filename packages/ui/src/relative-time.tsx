"use client";

import { useEffect, useState, type ComponentProps } from "react";
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
  opts: { style?: RelativeTimeStyle; absoluteAfterDays?: number } = {},
): string {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.round((time - now) / 1000);
  const abs = Math.abs(seconds);
  const absoluteAfter = (opts.absoluteAfterDays ?? 30) * 86_400;
  if (abs >= absoluteAfter) return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(time);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: opts.style ?? "long" });
  if (abs < 45) return format.format(0, "second");
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === "second") return format.format(Math.round(seconds / size), unit);
  }
  return "";
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
};

/**
 * A `<time>` that reads "3 minutes ago" and keeps itself current while the
 * page is visible. The full date is in the title.
 */
export function RelativeTime({ date, locale = "en", style, absoluteAfterDays, className, title, ...props }: RelativeTimeProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") setNow(Date.now());
        schedule();
      }, refreshMs(date, Date.now()));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [date]);
  const time = new Date(date);
  const valid = Number.isFinite(time.getTime());
  return (
    <time
      data-slot="relative-time"
      dateTime={valid ? time.toISOString() : undefined}
      title={title ?? (valid ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(time) : undefined)}
      className={classes("fui-relative-time", className)}
      suppressHydrationWarning
      {...props}
    >
      {formatRelativeTime(date, now, locale, { style, absoluteAfterDays })}
    </time>
  );
}
