"use client";
// Origin: Radiant's exam timer (the behaviour only). 0.12.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { AlarmClock, Clock3, Hourglass, TimerOff } from "lucide-react";
import {
  COUNTDOWN_MARKS,
  crossedMark,
  deadlineTime,
  formatCountdown,
  remainingMs,
  toneOf,
  wholeSeconds,
  type CountdownDeadline,
  type CountdownFormat,
  type CountdownThresholds,
  type CountdownTone,
} from "./countdown-logic";
import { useLocale } from "./labels";
import { classes } from "./shared";
import { subscribeTick } from "./ticker";

const subscribeToNothing = () => () => {};

export type UseCountdownOptions = {
  /** The deadline's clock minus this device's, in ms (`clockOffset(serverNow, Date.now())` when an answer arrives). */
  offset?: number;
  /** Seconds left at which `crossed` changes, for one announcement each. The end (0) is always a mark. */
  marks?: readonly number[];
  /** How often the clock is read, in ms. Every countdown that asks for the same tick shares one timer. */
  tick?: number;
  /** `remainingMs` is rounded up to this many ms, and the hook renders when that changes: once a second by default. */
  precision?: number;
  thresholds?: CountdownThresholds;
  /** A fixed "now" in ms: the countdown holds still at it (a paused clock, a story, a test) and reads the same on a server. */
  now?: number;
};

export type CountdownState = {
  /** Time left, rounded up to `precision`. `null` without a deadline and before the browser's clock is known. */
  remainingMs: number | null;
  /** Whole seconds left, rounded up: 0 means the time is up. */
  seconds: number | null;
  done: boolean;
  tone: CountdownTone;
  /** The mark passed most recently while this was watching (0 for the end), else `null`. Speak it once when it changes. */
  crossed: number | null;
};

/**
 * Counts to a deadline. Each reading is `deadline - now` (never a count), corrected by `offset`; it wakes with the page.
 * On a server and while hydrating there is no clock yet, so everything is `null` and `done` is false.
 */
export function useCountdown(
  deadline: CountdownDeadline,
  { offset = 0, marks = COUNTDOWN_MARKS, tick = 250, precision = 1000, thresholds, now }: UseCountdownOptions = {},
): CountdownState {
  const closes = deadlineTime(deadline);
  const step = Math.max(1, precision);
  const read = (at: number) => {
    const left = remainingMs(closes, offset, at);
    return left === null ? null : Math.ceil(left / step) * step;
  };
  const frozen = now !== undefined;
  const subscribe = useCallback(
    (onChange: () => void) => (frozen ? subscribeToNothing() : subscribeTick(tick, onChange)),
    [frozen, tick],
  );
  const left = useSyncExternalStore(
    subscribe,
    () => read(now ?? Date.now()),
    () => (now === undefined ? null : read(now)),
  );
  const seconds = left === null ? null : wholeSeconds(left);

  // A value derived from a changing input is kept by adjusting state while rendering. A new deadline starts clean: no mark
  // is crossed between two deadlines.
  const [heard, setHeard] = useState<{ closes: number | null; seconds: number | null; crossed: number | null }>({ closes, seconds, crossed: null });
  let current = heard;
  if (heard.closes !== closes) current = { closes, seconds, crossed: null };
  else if (heard.seconds !== seconds)
    current = { closes, seconds, crossed: seconds === null ? heard.crossed : (crossedMark(heard.seconds, seconds, marks) ?? heard.crossed) };
  if (current !== heard) setHeard(current);

  return {
    remainingMs: left,
    seconds,
    done: seconds === 0,
    tone: seconds === null ? "calm" : toneOf(seconds, thresholds),
    crossed: current.crossed,
  };
}

export type CountdownLabels = {
  /** The time left in words: read in place of the digits, and spoken once at each mark. `left(300)` is "5 minutes left". */
  left: (seconds: number, locale: Intl.LocalesArgument) => string;
  /** Shown and spoken when the time is up. */
  done: string;
};

const englishPlural = new Intl.PluralRules("en");
const unit = (count: number, one: string, other: string) => `${count} ${englishPlural.select(count) === "one" ? one : other}`;

function leftInEnglish(total: number) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [
    hours ? unit(hours, "hour", "hours") : "",
    minutes ? unit(minutes, "minute", "minutes") : "",
    seconds || total === 0 ? unit(seconds, "second", "seconds") : "",
  ].filter(Boolean);
  return `${parts.join(" ")} left`;
}

const defaultLabels: CountdownLabels = { left: leftInEnglish, done: "Time is up" };

const toneIcons = { calm: Clock3, low: Hourglass, urgent: AlarmClock };

export type CountdownProps = Omit<ComponentProps<"div">, "children" | "role"> &
  Pick<UseCountdownOptions, "offset" | "marks" | "now"> & {
    deadline: CountdownDeadline;
    /** The timer's name. Shown before the clock unless `hideLabel`. */
    label?: string;
    hideLabel?: boolean;
    /** How the clock is written, or a function of the whole seconds left. */
    format?: CountdownFormat | ((seconds: number, locale: Intl.LocalesArgument) => string);
    /** Overrides the tone the thresholds give. */
    tone?: CountdownTone;
    /** Seconds left at or under which the tone is `low` (300) and `urgent` (60). */
    thresholds?: CountdownThresholds;
    /** Called once per deadline when the time is up, also when it had already passed on mount. */
    onDone?: () => void;
    labels?: Partial<CountdownLabels>;
    /** The digits of the clock. English digits by default, so a server and a browser write the same. */
    locale?: Intl.LocalesArgument;
    size?: "sm" | "md";
    /** Shown before the browser's clock is known and without a deadline. */
    placeholder?: string;
  };

/**
 * A clock that counts to a deadline. The ticking digits are a `timer`, which is never read out as it changes; a hidden
 * polite region speaks only when a mark is passed ("5 minutes left") and when the time is up. The tone changes the tint,
 * the edge and the icon, with no flashing.
 */
export function Countdown({
  deadline,
  offset,
  marks,
  now,
  label = "Time left",
  hideLabel = false,
  format = "auto",
  tone: toneOverride,
  thresholds,
  onDone,
  labels,
  locale: ownLocale,
  size = "md",
  placeholder = "--:--",
  className,
  ...props
}: CountdownProps) {
  const locale = useLocale(ownLocale);
  const text = { ...defaultLabels, ...labels };
  const { seconds, done, tone: measured, crossed } = useCountdown(deadline, { offset, marks, now, thresholds });
  const tone = toneOverride ?? measured;
  const closes = deadlineTime(deadline);

  const latest = useRef(onDone);
  useEffect(() => {
    latest.current = onDone;
  });
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (!done || closes === null || fired.current === closes) return;
    fired.current = closes;
    latest.current?.();
  }, [done, closes]);

  const clock =
    seconds === null ? placeholder : typeof format === "function" ? format(seconds, locale) : formatCountdown(seconds * 1000, locale, { format });
  const spoken = seconds === null ? "" : done ? text.done : text.left(seconds, locale);
  const message = crossed === null ? "" : crossed === 0 ? text.done : text.left(crossed, locale);
  const Icon = done ? TimerOff : toneIcons[tone];

  return (
    <div
      data-slot="countdown"
      {...props}
      className={classes("fui-countdown", className)}
      data-tone={tone}
      data-size={size}
      data-done={done || undefined}
    >
      <span aria-label={label} className="fui-countdown-timer" role="timer">
        <Icon aria-hidden className="fui-countdown-icon" />
        {hideLabel ? null : (
          <span aria-hidden className="fui-countdown-label">
            {done ? text.done : label}
          </span>
        )}
        <span className="fui-sr-only">{spoken}</span>
        <span aria-hidden className="fui-countdown-clock" dir="ltr">
          {clock}
        </span>
      </span>
      <span aria-live="polite" className="fui-sr-only" role="status">
        {message}
      </span>
    </div>
  );
}
