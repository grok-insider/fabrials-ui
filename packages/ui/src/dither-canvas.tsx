"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { hexToRgb, paintField, seeded, type BrightnessField } from "./dither";
import { classes } from "./shared";

export type DitherTheme = "light" | "dark";

/** Builds the brightness field for one paint; called again on resize and theme change. */
export type DitherFieldFactory = (theme: DitherTheme, size: { width: number; height: number }) => BrightnessField;

export type DitherStars = {
  /** Stars per 1,000 dots. */
  density: number;
  colors?: string[];
  /** Fraction of the height stars may reach from the top (0–1). */
  reach?: number;
  seed?: number;
};

export type DitherCanvasProps = {
  /** Colours dark → light (any order; sorted by brightness). One ramp, or one per theme. */
  ramp: string[] | { light: string[]; dark: string[] };
  field: DitherFieldFactory;
  /** CSS pixels per dither dot. */
  cell?: number;
  /** Crisp single-dot stars on top, only where the theme is dark. */
  stars?: DitherStars;
  /** Pin to the viewport instead of the nearest positioned ancestor. */
  fixed?: boolean;
  /** Changing it repaints (use for data-driven fields). */
  paintKey?: string | number;
  className?: string;
  style?: CSSProperties;
};

function readTheme(): DitherTheme {
  const root = document.documentElement;
  return root.classList.contains("dark") || root.dataset.theme === "dark" ? "dark" : "light";
}

/** The theme where the canvas sits: a `.dark` subtree (e.g. an always-dark sign-in scene) wins over the root. */
function themeOf(element: Element): DitherTheme {
  return element.closest('.dark, [data-theme="dark"]') ? "dark" : element.closest('[data-theme="light"]') ? "light" : readTheme();
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  return () => observer.disconnect();
}

/**
 * A decorative ordered-dither background painted on a canvas: the host
 * supplies a brightness field and a colour ramp per theme (the nearest
 * `.dark`/`data-theme` ancestor decides, then the document root). Painted
 * once, and again only when its size, the theme or `paintKey` change. There
 * is no animation loop. The parent must be positioned and isolated
 * (`position: relative; isolation: isolate`) unless `fixed` is set.
 */
export function DitherCanvas({ ramp, field, cell = 2, stars, fixed = false, paintKey, className, style }: DitherCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef(field);
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark" as DitherTheme);
  const rampKey = JSON.stringify(ramp);
  const starsKey = JSON.stringify(stars ?? null);

  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const current = themeOf(canvas);
    const colors = (Array.isArray(ramp) ? ramp : ramp[current]).map(hexToRgb);
    const paint = () => {
      // Decoration only: a paint failure must never take the page down.
      try {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.ceil(rect.width / cell));
        const height = Math.max(1, Math.ceil(rect.height / cell));
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const image = ctx.createImageData(width, height);
        paintField(image.data, width, height, fieldRef.current(current, { width, height }), colors);
        ctx.putImageData(image, 0, 0);
        if (stars && current === "dark") {
          const random = seeded(stars.seed ?? 11);
          const palette = stars.colors?.length ? stars.colors : ["#f4f7ff"];
          const count = Math.round((width * height * stars.density) / 1000);
          for (let s = 0; s < count; s++) {
            const x = Math.floor(random() * width);
            const y = Math.floor(Math.pow(random(), 1.4) * height * (stars.reach ?? 1));
            ctx.globalAlpha = 0.25 + random() * 0.6;
            ctx.fillStyle = palette[Math.floor(random() * palette.length)]!;
            ctx.fillRect(x, y, 1, 1);
          }
          ctx.globalAlpha = 1;
        }
        canvas.dataset.painted = "";
      } catch (error) {
        console.warn("[fabrials-ui] DitherCanvas paint failed", error);
      }
    };
    paint();
    let timer = 0;
    let size = `${canvas.clientWidth}x${canvas.clientHeight}`;
    const observer = new ResizeObserver(() => {
      const next = `${canvas.clientWidth}x${canvas.clientHeight}`;
      if (next === size) return;
      size = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 120);
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
    // ramp and stars are compared by value through their keys.
  }, [theme, cell, rampKey, starsKey, paintKey]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      data-slot="dither-canvas"
      data-fixed={fixed || undefined}
      className={classes("fui-dither-canvas", className)}
      style={style}
    />
  );
}
