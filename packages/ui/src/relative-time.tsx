"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { formatAbsoluteTime, formatRelativeTime, type AbsoluteTimeFormat, type RelativeTimeStyle } from "./format";
import { useLocale } from "./labels";
import { localeTag } from "./plural";
import { classes } from "./shared";

export { formatAbsoluteTime, formatRelativeTime, type AbsoluteTimeFormat, type RelativeTimeStyle } from "./format";

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
  locale: ownLocale,
  style,
  absoluteAfterDays,
  absoluteFormat,
  now,
  timeZone,
  className,
  title,
  ...props
}: RelativeTimeProps) {
  const locale = localeTag(useLocale(ownLocale));
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
