// Origin: Fabrials, 0.12 (the reading DitherCanvas did privately, and Radiant's renderer theme). No directive: browser-only
// functions that return `undefined` where there is no DOM.

export type Rgba = [red: number, green: number, blue: number, alpha: number];

let pixel: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (pixel === undefined) pixel = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  return pixel;
}

/**
 * A CSS colour the canvas can parse (a hex, `oklch()`, `color-mix()` of literals) as bytes, read back from a 1×1 canvas.
 * A value the canvas cannot parse reads as black; `undefined` only for an empty value or where there is no canvas.
 */
export function colorToRgba(value: string): Rgba | undefined {
  const probe = context();
  if (!probe || !value) return undefined;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = probe.getImageData(0, 0, 1, 1).data;
  return [red!, green!, blue!, alpha!];
}

/** Whether the canvas takes `value` as a colour: an unparsable one leaves the fill it had. */
function parses(probe: CanvasRenderingContext2D, value: string): boolean {
  probe.fillStyle = "#000";
  probe.fillStyle = value;
  const onBlack = probe.fillStyle;
  probe.fillStyle = "#fff";
  probe.fillStyle = value;
  return probe.fillStyle === onBlack;
}

const hex = (byte: number) => byte.toString(16).padStart(2, "0");

const resolved = new Map<string, string | undefined>();

function literalToHex(value: string): string | undefined {
  if (resolved.has(value)) return resolved.get(value);
  const probe = context();
  if (!probe) return undefined;
  const rgba = parses(probe, value) ? colorToRgba(value) : undefined;
  const result = rgba ? `#${hex(rgba[0])}${hex(rgba[1])}${hex(rgba[2])}${rgba[3] < 255 ? hex(rgba[3]) : ""}` : undefined;
  if (resolved.size > 512) resolved.clear();
  resolved.set(value, result);
  return result;
}

/** What only an element can answer: a custom property, the current colour, the scheme. */
const CONTEXTUAL = /var\(|currentcolor|light-dark\(|\bfrom\b/i;

/**
 * Any CSS colour as `#rrggbb` (`#rrggbbaa` when it is not opaque), for canvases and for renderers that draw their own SVG
 * and parse only hex. `oklch()`, `color-mix()` and named colours resolve as written; a `var(--token)`, `currentColor` or
 * `light-dark()` resolves as `element` (default: the page's root) computes it, so pass the element the colour is for when
 * a part of the page has its own theme. `undefined` for a value that is not a colour, and where there is no DOM.
 */
export function resolveColor(value: string, element?: Element | null): string | undefined {
  const text = value.trim();
  if (!text || typeof document === "undefined") return undefined;
  if (!CONTEXTUAL.test(text)) return literalToHex(text);
  const holder = element ?? document.documentElement;
  // A custom property alone is read from the element's style; nothing is added to the page.
  const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(text)?.[1];
  if (token) {
    const declared = getComputedStyle(holder).getPropertyValue(token).trim();
    if (!declared) return undefined;
    if (!CONTEXTUAL.test(declared)) return literalToHex(declared);
  }
  const host = holder instanceof HTMLElement && holder.isConnected ? holder : document.body;
  if (!host) return undefined;
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = text;
  if (!probe.style.color) return undefined;
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return computed ? literalToHex(computed) : undefined;
}
