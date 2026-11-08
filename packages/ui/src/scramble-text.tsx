"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType } from "react";
import { classes } from "./shared";

const FRAME = 32;

function prefersReducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The text a scramble shows `progress` (0 to 1) of the way through: the characters before the settled point are the new
 * text, the rest are drawn from the new text's own letters and digits (so any script scrambles in its own glyphs, at about
 * its own width), and spaces and punctuation hold still. `random` picks from the pool; pass one for a repeatable frame.
 */
export function scrambleFrame(text: string, progress: number, random: () => number = Math.random): string {
  const chars = Array.from(text);
  const pool = [...new Set(chars.filter((char) => /[\p{L}\p{N}]/u.test(char)))];
  if (progress >= 1 || pool.length === 0) return text;
  const settled = Math.floor(Math.max(0, progress) * chars.length);
  return chars
    .map((char, index) => (index < settled || !/[\p{L}\p{N}]/u.test(char) ? char : pool[Math.floor(random() * pool.length)]!))
    .join("");
}

/**
 * Scrambles a text into place when it changes: for `duration` ms its characters cycle and settle left to right, in reading
 * order. Returns the frame to draw over the real text, or null when there is nothing to draw: on the first render, once
 * settled, and under reduced motion. Never loops.
 */
export function useScramble(text: string, duration = 320): string | null {
  const [frame, setFrame] = useState<string | null>(null);
  const previous = useRef(text);
  useEffect(() => {
    if (text === previous.current) return;
    previous.current = text;
    if (prefersReducedMotion()) {
      setFrame(null);
      return;
    }
    const start = performance.now();
    let timer = 0;
    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      setFrame(progress >= 1 ? null : scrambleFrame(text, progress));
      if (progress < 1) timer = window.setTimeout(tick, FRAME);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [text, duration]);
  return frame;
}

export type ScrambleTextProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  children: string;
  as?: ElementType;
  /** How long a new text takes to settle, in ms. 320 by default. */
  duration?: number;
};

/**
 * Text that scrambles into place when it changes, like a reading on an instrument: a status line that moves to its next
 * step, a heading that switches. The real text keeps its place and width the whole time (the scramble is drawn over it and
 * clipped to it), and it is what assistive technology reads. The first render and reduced motion show it at once.
 */
export function ScrambleText({ children, as: Component = "span", duration = 320, className, ...props }: ScrambleTextProps) {
  const frame = useScramble(children, duration);
  return (
    <Component className={classes("fui-scramble-text", className)} data-scrambling={frame !== null || undefined} {...props}>
      {children}
      {frame !== null ? (
        <span aria-hidden="true" className="fui-scramble-text-frame">
          {frame}
        </span>
      ) : null}
    </Component>
  );
}
