"use client";
// Origin: Spectrum UI number ticker (beUI, Apache-2.0), copied 2026-09-22. Restyled with fui- classes in 0.4. Since 0.12 the
// columns roll on a CSS transition and there is no animation library behind it.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties, type RefObject } from "react";
import { useProvidedLocale } from "./labels";
import { formatCount } from "./plural";
import { classes } from "./shared";

const DIGIT_HEIGHT_EM = 1.1;
const DIGITS = Array.from({ length: 10 }, (_, n) => n);
const REDUCED = "(prefers-reduced-motion: reduce)";

/** One glyph per em, three decimals at most, so the stack lands exactly on its digit. */
function travel(digit: number) {
  return `translateY(-${Math.round(digit * DIGIT_HEIGHT_EM * 1000) / 1000}em)`;
}

function subscribe(onChange: () => void) {
  const query = typeof matchMedia === "function" ? matchMedia(REDUCED) : null;
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

// Asked from the browser only: the server cannot know, and a guess would not match the first paint it sent.
function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => typeof matchMedia === "function" && matchMedia(REDUCED).matches,
    () => false,
  );
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
  duration?: number;
  stagger?: number;
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
 * A number that rolls to its value like an odometer: each digit is a column of 0-9 that slides into place, the columns a
 * little apart. It rolls once when it is first seen (or at once with `startOnView={false}`) and again whenever `value`
 * changes, from wherever the digits are; the first paint shows the number at rest and reduced motion jumps with no roll.
 * Assistive technology always reads the final number, and the digits keep their width as they turn.
 */
export function NumberTicker({
  value,
  pad,
  duration = 0.9,
  stagger = 0.04,
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
  const inView = useInViewOnce(containerRef, startOnView);
  const reduce = useReducedMotion();
  const armed = !startOnView || inView;
  const [entered, setEntered] = useState(false);
  // The columns are painted at rest first, one frame before they are asked to move, so the roll has somewhere to start.
  const [live, setLive] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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
    const total = (duration + glyphs.length * stagger) * 1000;
    const timer = window.setTimeout(() => setEntered(true), total);
    return () => window.clearTimeout(timer);
  }, [armed, entered, duration, stagger, glyphs.length]);

  return (
    <span
      ref={containerRef}
      className={classes("fui-ticker", className)}
      style={{ "--fui-ticker-duration": `${duration * 1000}ms`, ...style } as CSSProperties}
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
              blurDuration={Math.min(duration * 0.75, 0.32) * 1000}
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

  useEffect(() => {
    const node = columnRef.current;
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
