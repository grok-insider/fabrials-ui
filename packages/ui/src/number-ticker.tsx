"use client";
// Origin: Spectrum UI number ticker (beUI, Apache-2.0), copied 2026-09-22. Restyled with fui- classes in 0.4. Since 0.12 the
// columns roll on a CSS transition and there is no animation library behind it.

import { useEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type RefObject } from "react";
import { useProvidedLocale } from "./labels";
import { useReducedMotion } from "./reduced-motion";
import { formatCount } from "./plural";
import { classes } from "./shared";

const DIGIT_HEIGHT_EM = 1.1;
/** `--fui-duration-slow`, for the lengths worked out here when no `duration` is given. */
const DEFAULT_SECONDS = 0.24;
const DIGITS = Array.from({ length: 10 }, (_, n) => n);
/** One glyph per em, three decimals at most, so the stack lands exactly on its digit. */
function travel(digit: number) {
  return `translateY(-${Math.round(digit * DIGIT_HEIGHT_EM * 1000) / 1000}em)`;
}

/** Whether the element has come into view once, for a number that counts up when it is seen. */
function useInViewOnce(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!enabled || seen) return;
    if (typeof IntersectionObserver === "undefined" || !node) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, ref, seen]);
  return seen;
}

export type NumberTickerProps = Omit<ComponentProps<"span">, "children"> & {
  value: number;
  pad?: number;
  /** The length of the roll in seconds. Without it, `--fui-duration-slow` (240 ms). */
  duration?: number;
  /** With `rollIn`: how far apart the columns start, in seconds. */
  stagger?: number;
  /**
   * Count up from zero the first time it is shown. Off by default (since 0.12): a figure that is there at first render
   * shows at once, and rolls only when it changes. For the one figure of a page that is its moment, not for a dashboard.
   */
  rollIn?: boolean;
  /** With `rollIn`: wait until six tenths of it are in view (the default), or count up as soon as it is mounted. */
  startOnView?: boolean;
  prefix?: string;
  suffix?: string;
  blur?: boolean;
  digitClassName?: string;
  /**
   * The locale the number is grouped in ("12,480", "12.480"). Without one, here or from a `LabelsProvider`, the digits are
   * plain; `false` keeps them plain inside a provider.
   *
   * @deprecated `true` is the device's locale, which the server cannot know and which changes the text when the page
   * hydrates. Pass a locale, or set one in a `LabelsProvider`.
   */
  locale?: Intl.LocalesArgument | boolean;
  format?: (value: number) => string;
};

/**
 * A number that rolls to a new value like an odometer: each digit is a column of 0-9 that slides into place. The first
 * paint shows the number itself, at rest; it rolls whenever `value` changes, from wherever the digits are, in 240 ms.
 * `rollIn` also counts it up from zero the first time it is seen, the columns a little apart. Reduced motion jumps with
 * no roll. Assistive technology always reads the final number, and the digits keep their width as they turn.
 */
export function NumberTicker({
  value,
  pad,
  duration,
  stagger = 0.02,
  rollIn = false,
  startOnView = true,
  prefix,
  suffix,
  blur = false,
  className,
  digitClassName,
  locale: ownLocale,
  format,
  style,
  ...props
}: NumberTickerProps) {
  const provided = useProvidedLocale(typeof ownLocale === "boolean" ? undefined : ownLocale);
  const containerRef = useRef<HTMLSpanElement>(null);
  const inView = useInViewOnce(containerRef, rollIn && startOnView);
  const reduce = useReducedMotion();
  const armed = !rollIn || !startOnView || inView;
  const seconds = duration ?? DEFAULT_SECONDS;
  const [entered, setEntered] = useState(!rollIn);
  // Counting up: the columns are painted at zero first, one frame before they are asked to move, so the roll has
  // somewhere to start. Otherwise they are painted on their digits and stay there until the value changes.
  const [live, setLive] = useState(!rollIn);

  useEffect(() => {
    if (live) return;
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, [live]);

  const text = useMemo(() => {
    if (format) return format(value);
    const rounded = Math.round(value);
    const formatted = ownLocale === true ? rounded.toLocaleString() : ownLocale === false || !provided ? rounded.toString() : formatCount(rounded, provided);
    return pad ? formatted.padStart(pad, "0") : formatted;
  }, [value, pad, format, ownLocale, provided]);
  const glyphs = useMemo(
    () => text.split("").map((char, index, chars) => ({ char, id: `g-${chars.length - 1 - index}` })),
    [text],
  );
  const readableText = `${prefix ?? ""}${text}${suffix ?? ""}`;

  useEffect(() => {
    if (!armed || entered) return;
    const total = (seconds + glyphs.length * stagger) * 1000;
    const timer = window.setTimeout(() => setEntered(true), total);
    return () => window.clearTimeout(timer);
  }, [armed, entered, duration, stagger, glyphs.length]);

  return (
    <span
      ref={containerRef}
      className={classes("fui-ticker", className)}
      style={duration === undefined ? style : ({ "--fui-ticker-duration": `${duration * 1000}ms`, ...style } as CSSProperties)}
      {...props}
    >
      <span className="fui-sr-only">{readableText}</span>
      <span aria-hidden="true" className="fui-ticker-row">
        {prefix ? <span>{prefix}</span> : null}
        {glyphs.map(({ char, id }, index) => {
          if (!/\d/.test(char)) {
            return (
              <span key={id} className="fui-ticker-char">
                {char}
              </span>
            );
          }
          return (
            <Digit
              key={id}
              blur={blur}
              blurDuration={Math.min(seconds * 0.75, 0.32) * 1000}
              className={digitClassName}
              delay={entered || reduce ? 0 : index * stagger}
              digit={live && armed ? Number(char) : 0}
              reduce={reduce}
            />
          );
        })}
        {suffix ? <span>{suffix}</span> : null}
      </span>
    </span>
  );
}

function Digit({
  digit,
  delay,
  blur,
  blurDuration,
  reduce,
  className,
}: {
  digit: number;
  delay: number;
  blur: boolean;
  blurDuration: number;
  reduce: boolean;
  className?: string;
}) {
  const columnRef = useRef<HTMLSpanElement>(null);
  // The digit this column was last asked for: the blur is for a column that turns, not for one that is first painted.
  const shown = useRef(digit);

  useEffect(() => {
    const node = columnRef.current;
    if (shown.current === digit) return;
    shown.current = digit;
    if (reduce || !blur || !node || typeof node.animate !== "function") return;
    const fade = node.animate([{ filter: "blur(10px)" }, { filter: "blur(0px)" }], {
      duration: blurDuration,
      delay: delay * 1000,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
    return () => fade.cancel();
  }, [blur, blurDuration, delay, digit, reduce]);

  if (reduce) {
    return (
      <span className={classes("fui-ticker-digit", className)} style={{ width: "1ch" }}>
        {digit}
      </span>
    );
  }

  return (
    <span
      className={classes("fui-ticker-digit", className)}
      style={{ height: `${DIGIT_HEIGHT_EM}em`, width: "1ch", "--fui-ticker-delay": `${delay * 1000}ms` } as CSSProperties}
    >
      <span className="fui-ticker-column" ref={columnRef} style={{ transform: digit === 0 ? "none" : travel(digit) }}>
        {DIGITS.map((n) => (
          <span key={n} className="fui-ticker-glyph">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
