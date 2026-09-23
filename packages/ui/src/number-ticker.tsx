"use client";
// Origin: Spectrum UI number ticker (beUI, Apache-2.0), copied 2026-09-22. Restyled with fui- classes in 0.4.

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { classes } from "./shared";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const DIGIT_HEIGHT_EM = 1.1;
const DIGITS = Array.from({ length: 10 }, (_, n) => n);

export type NumberTickerProps = {
  value: number;
  pad?: number;
  duration?: number;
  stagger?: number;
  startOnView?: boolean;
  prefix?: string;
  suffix?: string;
  blur?: boolean;
  className?: string;
  digitClassName?: string;
  locale?: boolean;
  format?: (value: number) => string;
};

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
  locale,
  format,
}: NumberTickerProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.6 });
  const [armed, setArmed] = useState(!startOnView);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (startOnView && inView) setArmed(true);
  }, [startOnView, inView]);

  const text = useMemo(() => {
    if (format) return format(value);
    const rounded = Math.round(value);
    const formatted = locale ? rounded.toLocaleString() : rounded.toString();
    return pad ? formatted.padStart(pad, "0") : formatted;
  }, [value, pad, format, locale]);
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
    <span ref={containerRef} className={classes("fui-ticker", className)}>
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
              digit={armed ? Number(char) : 0}
              delay={entered ? 0 : index * stagger}
              duration={duration}
              blur={blur}
              className={digitClassName}
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
  duration,
  blur,
  className,
}: {
  digit: number;
  delay: number;
  duration: number;
  blur: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const columnRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce || !blur || !columnRef.current || !Number.isFinite(digit)) return;
    const node = columnRef.current;
    const controls = animate(
      node,
      { filter: ["blur(10px)", "blur(0px)"] },
      { duration: Math.min(duration * 0.75, 0.32), delay, ease: EASE_OUT },
    );
    return () => {
      controls.stop();
      node.style.filter = "blur(0px)";
    };
  }, [blur, delay, digit, duration, reduce]);

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
      style={{ height: `${DIGIT_HEIGHT_EM}em`, width: "1ch" }}
    >
      <motion.span
        ref={columnRef}
        initial={{ y: 0 }}
        animate={{ y: `-${digit * DIGIT_HEIGHT_EM}em` }}
        transition={reduce ? { duration: 0 } : { duration, delay, ease: EASE_OUT }}
        className="fui-ticker-column"
      >
        {DIGITS.map((n) => (
          <span key={n} className="fui-ticker-glyph">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
