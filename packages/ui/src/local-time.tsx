"use client";
// Origin: Fabrials, 0.12 (from Radiant's local-time).

import type { ComponentProps, ReactNode } from "react";
import { classes } from "./shared";
import { formatLocalTime, localTimeIso, type LocalTimeFormat, type LocalTimeValue } from "./time-format";
import { useHydrated } from "./use-hydrated";

const FULL: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "long" };

export type LocalTimeProps = Omit<ComponentProps<"time">, "children" | "dateTime" | "title" | "prefix"> & {
  value: LocalTimeValue;
  /** A named format or `Intl.DateTimeFormat` options. */
  format?: LocalTimeFormat;
  /** Default: the reader's own locale, or "en" when `timeZone` fixes the zone. */
  locale?: Intl.LocalesArgument;
  /**
   * Fixes the zone. The text is then the same on the server and in the browser, so it is rendered at once, with no
   * stand-in. Without it the reader's zone is used, which only the browser knows.
   */
  timeZone?: string;
  /** The clock `message` and `shortDate` compare with: a fixed one for tests and screenshots. Default: the device clock. */
  now?: Date | number;
  /** Words before the time ("Sent "), inside the same element. */
  prefix?: ReactNode;
  /** The tooltip: text of your own, or `false` for none. Default: the full date and time, in `titleFormat`. */
  title?: string | false;
  titleFormat?: LocalTimeFormat;
};

/**
 * A `<time>` in the reader's zone and locale. A server does not know either, so until the page has hydrated it renders a
 * hidden stand-in of the same shape (the same instant in UTC, in `locale` or English): nothing moves when the real text
 * arrives and the server's time is never shown. Renders nothing for an empty or invalid value.
 */
export function LocalTime({ value, format = "dateTime", locale, timeZone, now, prefix, title, titleFormat = FULL, className, style, ...props }: LocalTimeProps) {
  const hydrated = useHydrated();
  const iso = localTimeIso(value);
  if (!iso) return null;
  const fixed = (timeZone ?? (typeof format === "string" ? undefined : format.timeZone)) !== undefined;
  const shown = fixed || hydrated;
  const options = shown ? { locale: locale ?? (fixed ? "en" : undefined), timeZone, now } : { locale: locale ?? "en", timeZone: "UTC", now };
  return (
    <time
      data-slot="local-time"
      {...props}
      aria-hidden={shown ? props["aria-hidden"] : true}
      className={classes("fui-local-time", className)}
      dateTime={iso}
      style={shown ? style : { ...style, visibility: "hidden" }}
      // `message` and `shortDate` read the clock, and the server's is a moment behind the browser's: at midnight they differ.
      suppressHydrationWarning={(now === undefined && (format === "message" || format === "shortDate")) || undefined}
      title={title === false ? undefined : (title ?? (shown ? formatLocalTime(value, titleFormat, options) : undefined))}
    >
      {prefix}
      {formatLocalTime(value, format, options)}
    </time>
  );
}
