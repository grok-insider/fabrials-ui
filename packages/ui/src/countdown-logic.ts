/**
 * The arithmetic of a countdown. Every time is passed in, so this runs on a server and is tested without timers.
 *
 * Whoever set the deadline owns the clock (usually a server). The screen measures how far its own clock is from that one
 * when an answer arrives (`clockOffset`) and reads `deadline - now` corrected by it, every time: nothing is counted down,
 * so a tab that slept, a slow phone or a clock set back cannot gain or lose time.
 */

export type CountdownTone = "calm" | "low" | "urgent";

/** A moment: a `Date`, milliseconds since the epoch, or an ISO string. `null` (or a string that does not parse) is no deadline. */
export type CountdownDeadline = Date | number | string | null | undefined;

/** Seconds left at or under which the tone changes. */
export type CountdownThresholds = { low?: number; urgent?: number };

/** `auto` is `4:59` and `1:04:59` from an hour up; `mm:ss` pads the minutes and never shows hours; `h:mm:ss` always does. */
export type CountdownFormat = "auto" | "mm:ss" | "h:mm:ss";

/** The moments a screen reader is told about, in seconds left. The end (0) is always one. */
export const COUNTDOWN_MARKS: readonly number[] = [600, 300, 120, 60];

export const COUNTDOWN_THRESHOLDS = { low: 300, urgent: 60 } as const;

/** The deadline in milliseconds since the epoch, or `null` when there is none. */
export function deadlineTime(deadline: CountdownDeadline): number | null {
  if (deadline === null || deadline === undefined) return null;
  const time = deadline instanceof Date ? deadline.getTime() : typeof deadline === "number" ? deadline : Date.parse(deadline);
  return Number.isFinite(time) ? time : null;
}

/** The server's time minus the browser's, in milliseconds, at the moment an answer arrived. 0 when the server gave no usable time. */
export function clockOffset(serverNow: CountdownDeadline, receivedAt: number): number {
  const server = deadlineTime(serverNow);
  return server === null ? 0 : server - receivedAt;
}

/** Milliseconds until the deadline on the deadline's own clock, never negative; `null` without a deadline (nothing is invented). */
export function remainingMs(deadline: CountdownDeadline, offset: number, localNow: number): number | null {
  const closes = deadlineTime(deadline);
  if (closes === null) return null;
  return Math.max(0, closes - (localNow + offset));
}

/** Whole seconds to show, rounded up: the clock reads 0:00 only when the time is really up. */
export function wholeSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/**
 * The mark passed between two readings (in seconds), or `null`. The end is a mark: crossing it gives 0. Crossing several at
 * once (a tab that slept) gives the smallest, so only the latest news is spoken. A first reading crosses nothing.
 */
export function crossedMark(previous: number | null, current: number, marks: readonly number[] = COUNTDOWN_MARKS): number | null {
  if (previous === null) return null;
  let crossed: number | null = null;
  for (const mark of [...marks, 0]) {
    if (previous > mark && current <= mark && (crossed === null || mark < crossed)) crossed = mark;
  }
  return crossed;
}

/** How the clock looks with this many seconds left. It only ever changes the look, never the behaviour. */
export function toneOf(seconds: number, thresholds: CountdownThresholds = COUNTDOWN_THRESHOLDS): CountdownTone {
  const urgent = thresholds.urgent ?? COUNTDOWN_THRESHOLDS.urgent;
  const low = thresholds.low ?? COUNTDOWN_THRESHOLDS.low;
  if (seconds <= urgent) return "urgent";
  if (seconds <= low) return "low";
  return "calm";
}

/**
 * A duration as a clock, in the digits of `locale`: `4:59`, `1:04:59`, `٤:٥٩`. It rounds up by default, as a countdown
 * must (`round: "down"` for time that has passed). The separator is a colon in every locale; pin the element `dir="ltr"`.
 */
export function formatCountdown(
  ms: number,
  locale: Intl.LocalesArgument = "en",
  { format = "auto", round = "up" }: { format?: CountdownFormat; round?: "up" | "down" } = {},
): string {
  const total = Math.max(0, round === "up" ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const plain = new Intl.NumberFormat(locale, { useGrouping: false });
  const padded = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const seconds = padded.format(total % 60);
  if (format === "mm:ss") return `${padded.format(Math.floor(total / 60))}:${seconds}`;
  const hours = Math.floor(total / 3600);
  if (format === "auto" && hours === 0) return `${plain.format(Math.floor(total / 60))}:${seconds}`;
  return `${plain.format(hours)}:${padded.format(Math.floor((total % 3600) / 60))}:${seconds}`;
}
