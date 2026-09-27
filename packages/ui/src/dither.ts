/**
 * Ordered (Bayer 8×8) dithering for decorative backgrounds: brightness onto
 * a short colour ramp, or per-channel quantisation that keeps hues. Pure and
 * server-safe (no DOM), so hosts and tests can use it without React. The
 * canvas component is DitherCanvas.
 */

export type Rgb = [number, number, number];

/** 8×8 Bayer thresholds, normalised to (0, 1). */
export const BAYER_8 = (() => {
  const m = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ];
  return Float32Array.from(m.flat(), (v) => (v + 0.5) / 64);
})();

/** Bayer thresholds as integer ranks 0–63, for the per-pixel comparison. */
const BAYER_RANK = Uint8Array.from(BAYER_8, (v) => Math.floor(v * 64));

export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Linear mix of two #rrggbb colours, `t` of the way from `a` to `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v + (y[i]! - v) * t) as Rgb);
}

/** Integer brightness 0–255, weighted toward green like the eye. */
export function luma([r, g, b]: Rgb): number {
  return (r * 2 + g * 5 + b) >> 3;
}

export function sortByLuma(colors: Rgb[]): Rgb[] {
  return [...colors].sort((a, b) => luma(a) - luma(b));
}

/**
 * Rewrites RGBA pixels in place: each pixel's brightness picks a spot on the
 * ramp (sorted dark → light) and the Bayer threshold decides between the two
 * neighbouring ramp colours. Output is opaque and uses ramp colours only.
 */
export function ditherToRamp(data: Uint8ClampedArray, width: number, ramp: Rgb[]): void {
  if (ramp.length < 2) throw new Error("ditherToRamp needs at least two colours");
  const levels = ramp.map(luma);
  const last = ramp.length - 1;
  // Per brightness: the lower ramp step and how far toward the next (0–64),
  // so the hot loop is two table reads and a compare.
  const lower = new Uint8Array(256);
  const toward = new Uint8Array(256);
  for (let v = 0, step = 0; v < 256; v++) {
    while (step < last - 1 && v >= levels[step + 1]!) step++;
    const span = levels[step + 1]! - levels[step]!;
    lower[v] = step;
    toward[v] = span > 0 ? Math.max(0, Math.min(64, Math.round(((v - levels[step]!) / span) * 64))) : 0;
  }
  // Ramp colours as whole opaque pixels, in the platform's byte order.
  const packed = new Uint32Array(ramp.length);
  new Uint8Array(packed.buffer).set(ramp.flatMap(([r, g, b]) => [r, g, b, 255]));
  const pixels = new Uint32Array(data.buffer, data.byteOffset, data.length >> 2);
  const height = pixels.length / width;
  for (let y = 0, p = 0, i = 0; y < height; y++) {
    const row = (y & 7) << 3;
    for (let x = 0; x < width; x++, p++, i += 4) {
      const v = (data[i]! * 2 + data[i + 1]! * 5 + data[i + 2]!) >> 3;
      pixels[p] = packed[lower[v]! + (toward[v]! > BAYER_RANK[row | (x & 7)]! ? 1 : 0)]!;
    }
  }
}

/**
 * Per-channel ordered dithering for images that keep their hues: each
 * channel is mapped into `lo…hi` (0–255), then quantised to `levels` evenly
 * spaced values, with the Bayer threshold choosing between the two nearest.
 */
export function ditherChannels(data: Uint8ClampedArray, width: number, levels: number, lo: number, hi: number): void {
  const steps = Math.max(2, Math.round(levels)) - 1;
  const span = hi - lo;
  const lower = new Uint8Array(256);
  const toward = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const t = (v / 255) * steps;
    const base = Math.min(steps - 1, Math.floor(t));
    lower[v] = base;
    toward[v] = Math.round((t - base) * 64);
  }
  const value = Uint8Array.from({ length: steps + 1 }, (_, k) => Math.round(lo + (span * k) / steps));
  const height = data.length / 4 / width;
  for (let y = 0, i = 0; y < height; y++) {
    const row = (y & 7) << 3;
    for (let x = 0; x < width; x++, i += 4) {
      const rank = BAYER_RANK[row | (x & 7)]!;
      for (let c = 0; c < 3; c++) {
        const v = data[i + c]!;
        data[i + c] = value[lower[v]! + (toward[v]! > rank ? 1 : 0)]!;
      }
      data[i + 3] = 255;
    }
  }
}

/** Small deterministic PRNG (mulberry32): the same seed paints the same picture. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 32-bit seed from any string (an id, a handle). */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type BrightnessField = (u: number, v: number) => number;

/**
 * Renders a brightness field (0–1 at unit coordinates) into RGBA pixels on
 * the ramp's luma range, dithered onto the ramp. Pure: DitherCanvas calls it
 * with ImageData, tests with a plain array.
 */
export function paintField(data: Uint8ClampedArray, width: number, height: number, field: BrightnessField, ramp: Rgb[]): void {
  const sorted = sortByLuma(ramp);
  const low = luma(sorted[0]!);
  const span = luma(sorted[sorted.length - 1]!) - low;
  for (let y = 0, i = 0; y < height; y++) {
    const v = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x++, i += 4) {
      const b = field(width > 1 ? x / (width - 1) : 0, v);
      const g = Math.round(low + span * Math.min(1, Math.max(0, Number.isFinite(b) ? b : 0)));
      data[i] = data[i + 1] = data[i + 2] = g;
      data[i + 3] = 255;
    }
  }
  ditherToRamp(data, width, sorted);
}

/**
 * Like `paintField`, but the ramp keeps its order: field 0 is `ramp[0]` (the
 * surface behind the canvas) and 1 is the last colour (the brightest light).
 * Brand scenes use it because in the light theme the "light" is darker than
 * the background, which a brightness-sorted ramp cannot express.
 */
export function paintRampField(data: Uint8ClampedArray, width: number, height: number, field: BrightnessField, ramp: Rgb[]): void {
  if (ramp.length < 2) throw new Error("paintRampField needs at least two colours");
  const last = ramp.length - 1;
  for (let y = 0, i = 0; y < height; y++) {
    const row = (y & 7) << 3;
    const v = height > 1 ? y / (height - 1) : 0;
    for (let x = 0; x < width; x++, i += 4) {
      const b = field(width > 1 ? x / (width - 1) : 0, v);
      const t = Math.min(1, Math.max(0, Number.isFinite(b) ? b : 0)) * last;
      const lo = Math.min(last - 1, Math.floor(t));
      const [r, g, bl] = ramp[t - lo > BAYER_8[row | (x & 7)]! ? lo + 1 : lo]!;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = bl;
      data[i + 3] = 255;
    }
  }
}

export * from "./dither-presets";
