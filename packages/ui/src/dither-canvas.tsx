"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import {
  containFit,
  coverFit,
  desaturate,
  ditherChannels,
  ditherLumaToRamp,
  ditherToRamp,
  hexToRgb,
  luma,
  paintField,
  paintRampField,
  seeded,
  sortByLuma,
  toneLuma,
  type BrightnessField,
  type DitherSize,
  type DitherTone,
  type Rgb,
} from "./dither";
import { DITHER_BACKGROUND } from "./dither-presets";
import { prefersReducedMotion } from "./reduced-motion";
import { colorToRgba } from "./resolve-color";
import { classes } from "./shared";
import { documentTheme, subscribeDocumentTheme, themeOf } from "./theme";

export type DitherTheme = "light" | "dark";
export type { DitherSize, DitherTone } from "./dither";

/**
 * Builds the brightness field for one paint; called again on resize and theme
 * change. `progress` runs 0 → 1 once when `reveal` is set, and is 1 otherwise.
 */
export type DitherFieldFactory = (theme: DitherTheme, size: DitherSize, progress: number) => BrightnessField;

/** Draws with Canvas 2D at the canvas's working resolution: one pixel per dither dot. */
export type DitherPaint = (context: CanvasRenderingContext2D, size: DitherSize, theme: DitherTheme) => void;

export type DitherFit = "cover" | "contain";

/** Why a picture could not be dithered: it did not load, or it came from another origin without CORS. */
export type DitherSourceError = "load" | "tainted";

export type DitherStars = {
  /** Stars per 1,000 dots. */
  density: number;
  colors?: string[];
  /** Fraction of the height stars may reach from the top (0–1). */
  reach?: number;
  seed?: number;
};

export type DitherCanvasProps = {
  /**
   * Colours, one ramp or one per theme. With `order="brightness"` (default)
   * any order, sorted dark → light. With `order="ramp"` the order is kept:
   * brightness 0 is the first colour, 255 the last. A stop named "background"
   * is the surface behind the canvas (`--fui-dither-bg`, else `--background`).
   */
  ramp: string[] | { light: string[]; dark: string[] };
  order?: "brightness" | "ramp";
  /** Milliseconds for a one-time reveal (the field gets progress 0 → 1). Skipped under reduced motion. Fields only. */
  reveal?: number;
  /** A brightness field: the brand scenes. */
  field?: DitherFieldFactory;
  /**
   * A scene the host draws itself (gradients, shapes): whatever it paints is
   * read back, and its luminance is dithered onto the ramp as a field's would
   * be. The canvas starts filled with the surface behind it, so anything left
   * unpainted is the background. Keep the function stable (memoise it) or
   * every render repaints.
   */
  paint?: DitherPaint;
  /**
   * A picture, or its address. Loaded with `crossOrigin="anonymous"`; a
   * picture that fails to load or comes from another origin without CORS
   * leaves the plain background and calls `onError`. Never throws.
   */
  source?: CanvasImageSource | string;
  /** How the picture fills the canvas. */
  fit?: DitherFit;
  /** The brightness range the picture is mapped into, so text over it keeps its contrast. */
  tone?: DitherTone;
  /** `ramp`: the picture in mono through the ramp. `channels`: each colour channel dithered to `levels` steps. */
  mode?: "ramp" | "channels";
  /** Steps per channel in `mode="channels"` (5 by default). */
  levels?: number;
  /** Drawn after the dithering, for crisp single-pixel details that the dots would swallow. */
  after?: DitherPaint;
  /** A picture that could not be dithered. Called once per source. */
  onError?: (reason: DitherSourceError) => void;
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

/** Any CSS colour (oklch, var-substituted) as RGB, read back from a 1×1 canvas. */
function cssColor(value: string): Rgb | undefined {
  const rgba = colorToRgba(value);
  return rgba && [rgba[0], rgba[1], rgba[2]];
}

/** The surface behind the canvas, which a ramp stop named "background" stands for. */
function resolveSurface(canvas: HTMLCanvasElement): Rgb {
  const style = getComputedStyle(canvas);
  const surface = style.getPropertyValue("--fui-dither-bg").trim() || style.getPropertyValue("--background").trim();
  return cssColor(surface) ?? [22, 26, 33];
}

function resolveRamp(canvas: HTMLCanvasElement, colors: string[]): Rgb[] {
  const surface = resolveSurface(canvas);
  return colors.map((color) => (color === DITHER_BACKGROUND ? surface : hexToRgb(color)));
}

/** The pixel width and height of a picture, whichever kind it is. */
function pictureSize(source: CanvasImageSource): DitherSize {
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) return { width: source.naturalWidth, height: source.naturalHeight };
  if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) return { width: source.videoWidth, height: source.videoHeight };
  const sized = source as { width?: number; height?: number };
  return { width: sized.width ?? 0, height: sized.height ?? 0 };
}

/**
 * A decorative ordered-dither background painted on a canvas: the host
 * supplies a brightness field, a scene it draws itself or a picture, and a
 * colour ramp per theme (the nearest `.dark`, `.light` or `data-theme`
 * ancestor decides; `data-theme="system"` follows the operating system).
 * Painted once, and again only when its size, the theme or its data change.
 * There is no animation loop. The parent must be positioned and isolated
 * (`position: relative; isolation: isolate`) unless `fixed` is set.
 */
export function DitherCanvas({
  ramp,
  field,
  paint: scene,
  source,
  fit = "cover",
  tone,
  mode = "ramp",
  levels = 5,
  after,
  onError,
  cell = 2,
  order = "brightness",
  reveal,
  stars,
  fixed = false,
  paintKey,
  className,
  style,
}: DitherCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef(field);
  const theme = useSyncExternalStore(subscribeDocumentTheme, documentTheme, () => "dark" as DitherTheme);
  const rampKey = JSON.stringify(ramp);
  const starsKey = JSON.stringify(stars ?? null);
  const toneKey = JSON.stringify(tone ?? null);

  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const current = themeOf(canvas);
    const colors = resolveRamp(canvas, Array.isArray(ramp) ? ramp : ramp[current]);
    const surface = resolveSurface(canvas);
    let picture: CanvasImageSource | null = null;
    let failed = false;
    let reported = false;
    let cancelled = false;

    const report = (reason: DitherSourceError) => {
      failed = true;
      if (reported) return;
      reported = true;
      onError?.(reason);
    };

    const fill = (ctx: CanvasRenderingContext2D, size: DitherSize) => {
      ctx.fillStyle = `rgb(${surface[0]},${surface[1]},${surface[2]})`;
      ctx.fillRect(0, 0, size.width, size.height);
    };

    /** Reads the pixels back and rewrites them as ramp colours (or as channel steps). */
    const ditherPicture = (ctx: CanvasRenderingContext2D, size: DitherSize, mono: boolean) => {
      const pixels = ctx.getImageData(0, 0, size.width, size.height);
      const data = pixels.data;
      if (mode === "channels" && !mono) {
        const amount = tone?.desaturate ?? 0.4;
        const contrast = tone?.contrast ?? 1;
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b] = desaturate([data[i]!, data[i + 1]!, data[i + 2]!], amount);
          data[i] = toneLuma(r, { contrast });
          data[i + 1] = toneLuma(g, { contrast });
          data[i + 2] = toneLuma(b, { contrast });
          data[i + 3] = 255;
        }
        const lo = tone?.min ?? (current === "dark" ? 6 : 182);
        const hi = tone?.max ?? (current === "dark" ? 80 : 250);
        ditherChannels(data, size.width, levels, lo, hi);
      } else {
        for (let i = 0; i < data.length; i += 4) {
          const value = toneLuma(luma([data[i]!, data[i + 1]!, data[i + 2]!]), tone);
          data[i] = data[i + 1] = data[i + 2] = value;
          data[i + 3] = 255;
        }
        if (order === "ramp") ditherLumaToRamp(data, size.width, colors);
        else ditherToRamp(data, size.width, sortByLuma(colors));
      }
      ctx.putImageData(pixels, 0, 0);
    };

    const paintPicture = (ctx: CanvasRenderingContext2D, size: DitherSize, image: CanvasImageSource) => {
      const natural = pictureSize(image);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (fit === "contain") {
        const rect = containFit(natural, size);
        ctx.drawImage(image, rect.dx, rect.dy, rect.dw, rect.dh);
      } else {
        const rect = coverFit(natural, size);
        ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, size.width, size.height);
      }
      ditherPicture(ctx, size, false);
    };

    const paint = (progress = 1) => {
      // Decoration only: a paint failure must never take the page down.
      try {
        const rect = canvas.getBoundingClientRect();
        const size = { width: Math.max(1, Math.ceil(rect.width / cell)), height: Math.max(1, Math.ceil(rect.height / cell)) };
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        if (picture) {
          try {
            delete canvas.dataset.failed;
            paintPicture(ctx, size, picture);
          } catch {
            picture = null;
            report("tainted");
            fill(ctx, size);
            canvas.dataset.failed = "";
          }
        } else if (failed) {
          fill(ctx, size);
          canvas.dataset.failed = "";
        } else if (source) {
          // Still loading: nothing is drawn, and the surface behind shows through.
          delete canvas.dataset.painted;
          return;
        } else if (scene) {
          delete canvas.dataset.failed;
          fill(ctx, size);
          ctx.save();
          scene(ctx, size, current);
          ctx.restore();
          ditherPicture(ctx, size, true);
        } else if (fieldRef.current) {
          delete canvas.dataset.failed;
          const image = ctx.createImageData(size.width, size.height);
          const brightness = fieldRef.current(current, size, progress);
          if (order === "ramp") paintRampField(image.data, size.width, size.height, brightness, colors);
          else paintField(image.data, size.width, size.height, brightness, colors);
          ctx.putImageData(image, 0, 0);
        } else {
          fill(ctx, size);
          delete canvas.dataset.failed;
        }
        if (stars && current === "dark") {
          const random = seeded(stars.seed ?? 11);
          const palette = stars.colors?.length ? stars.colors : ["#f4f7ff"];
          const count = Math.round((size.width * size.height * stars.density) / 1000);
          for (let s = 0; s < count; s++) {
            const x = Math.floor(random() * size.width);
            const y = Math.floor(Math.pow(random(), 1.4) * size.height * (stars.reach ?? 1));
            ctx.globalAlpha = 0.25 + random() * 0.6;
            ctx.fillStyle = palette[Math.floor(random() * palette.length)]!;
            ctx.fillRect(x, y, 1, 1);
          }
          ctx.globalAlpha = 1;
        }
        after?.(ctx, size, current);
        canvas.dataset.painted = "";
      } catch (error) {
        console.warn("[fabrials-ui] DitherCanvas paint failed", error);
      }
    };

    if (typeof source === "string") {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) return;
        picture = image;
        paint();
      };
      image.onerror = () => {
        if (cancelled) return;
        report("load");
        paint();
      };
      image.src = source;
    } else if (source && typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement && !(source.complete && source.naturalWidth > 0)) {
      const settled = source;
      const onLoad = () => {
        if (cancelled) return;
        picture = settled;
        paint();
      };
      const onFail = () => {
        if (cancelled) return;
        report("load");
        paint();
      };
      settled.addEventListener("load", onLoad);
      settled.addEventListener("error", onFail);
    } else if (source) {
      picture = source;
    }

    let frame = 0;
    const animate = Boolean(field) && Boolean(reveal) && !canvas.dataset.revealed && !prefersReducedMotion();
    if (animate) {
      // One orchestrated moment, then the resting picture: no loop.
      canvas.dataset.revealed = "";
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / (reveal as number));
        paint(1 - Math.pow(1 - t, 3));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      paint(0);
      frame = requestAnimationFrame(step);
    } else paint();
    let timer = 0;
    let size = `${canvas.clientWidth}x${canvas.clientHeight}`;
    const observer = new ResizeObserver(() => {
      const next = `${canvas.clientWidth}x${canvas.clientHeight}`;
      if (next === size) return;
      size = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        cancelAnimationFrame(frame);
        paint();
      }, 120);
    });
    observer.observe(canvas);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    // ramp, stars and tone are compared by value through their keys; paint, source and after by identity.
  }, [theme, cell, order, reveal, rampKey, starsKey, paintKey, scene, source, fit, toneKey, mode, levels, after, onError]);

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
