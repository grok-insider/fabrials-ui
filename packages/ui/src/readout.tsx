"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { prefersReducedMotion } from "./reduced-motion";
import { classes } from "./shared";

const GLYPHS = "0123456789:./-+#";
const DURATION = 240;
const FRAME = 30;

/**
 * A reading in the label voice (Plex Mono 11 px): a sync time, a version, a peak, an identifier. When `value` changes the
 * new text settles in like an instrument's display, its characters cycling for 240 ms from left to right; the first render
 * and reduced motion show it at once. Assistive technology reads the final text only. Not a live region: announce changes
 * that matter elsewhere.
 */
export function Readout({
  value,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & { value: string }) {
  const [shown, setShown] = useState(value);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      setShown(value);
      return;
    }
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let timer = 0;
    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / DURATION);
      const settled = Math.floor(progress * value.length);
      let next = value.slice(0, settled);
      for (let index = settled; index < value.length; index++) {
        const char = value[index]!;
        next += char === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setShown(progress >= 1 ? value : next);
      if (progress < 1) timer = window.setTimeout(tick, FRAME);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [value]);
  return (
    <span data-slot="readout" className={classes("fui-readout", className)} {...props}>
      <span className="fui-sr-only">{value}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
