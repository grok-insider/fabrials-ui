// Origin: Fabrials, 0.12 (from Radiant's features/core/export and its chat's copy-image). Import it from
// "@fabrials/ui/export". No directive, and nothing here reads the network: the functions work on what is already in the
// page. They need a browser, and say so (`ExportError`) when called without one.

import { resolveColor } from "./resolve-color";

export type ExportErrorCode =
  /** Called where there is no document (a server, a worker). */
  | "no-dom"
  /** The browser lacks the API (no image clipboard, no canvas). */
  | "unsupported"
  /** The browser refused: no permission, no user gesture, a picture from another origin. */
  | "refused"
  /** The input could not be drawn (a broken SVG, a picture that does not load). */
  | "invalid";

export class ExportError extends Error {
  readonly code: ExportErrorCode;
  constructor(code: ExportErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExportError";
    this.code = code;
  }
}

function needDom(what: string): void {
  if (typeof document === "undefined" || typeof window === "undefined") throw new ExportError("no-dom", `${what} needs a browser: call it from an event handler or an effect.`);
}

/** Saves text or a blob as a file through a temporary link. `type` is the MIME type of text (default plain text, UTF-8). */
export function downloadFile(name: string, data: Blob | string, type = "text/plain;charset=utf-8"): void {
  needDom("downloadFile");
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The download reads the URL after the click returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const WINDOWS_DEVICES = /^(?:con|prn|aux|nul|com\d|lpt\d)$/;

/**
 * A file name (without extension) from a title in any script: letters and digits of every language stay, everything else
 * (punctuation, slashes, emoji, control characters) becomes one hyphen, and the result is lower case and at most
 * `maxLength` characters. `fallback` when nothing is left.
 */
export function fileStem(title: string | null | undefined, fallback: string, maxLength = 60): string {
  const words = (title ?? "")
    .normalize("NFKC")
    .replace(/[\uFE00-\uFE0F\u200B-\u200F\u2060-\u206F]/g, "")
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}\p{Mn}\p{Mc}]*/gu);
  const stem = Array.from((words ?? []).join("-")).slice(0, maxLength).join("").replace(/-+$/, "");
  if (!stem) return fallback;
  return WINDOWS_DEVICES.test(stem) ? `${stem}-${fallback}` : stem;
}

/** What a renderer outside the page needs written on each element: there, no stylesheet and no custom property apply. */
const PAINT = [
  "fill",
  "stroke",
  "color",
  "stop-color",
  "flood-color",
  "lighting-color",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "stop-opacity",
  "flood-opacity",
  "fill-rule",
  "clip-rule",
  "stroke-width",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "paint-order",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "visibility",
] as const;

const COLOURS = new Set(["fill", "stroke", "color", "stop-color", "flood-color", "lighting-color"]);

/**
 * A computed paint in plain sRGB where it is a colour (the browser writes it back as `rgb()`), so `oklch()` and
 * `color-mix()` never reach a program that cannot read them; `none`, `url(#gradient)` and `context-fill` stay as they are.
 */
function portable(property: string, value: string): string {
  if (!COLOURS.has(property) || /^(?:none|context-|url\()/.test(value)) return value;
  const paint = /^(url\([^)]*\))\s+(.+)$/.exec(value);
  if (paint) return `${paint[1]} ${resolveColor(paint[2]!) ?? paint[2]}`;
  return resolveColor(value) ?? value;
}

export type SerializeSvgOptions = {
  /** A colour painted behind the drawing: any CSS colour, a `var(--token)` included. Default: none (transparent). */
  background?: string;
  /** The size written on the root, in CSS pixels. Default: the size the drawing has on screen. */
  width?: number;
  height?: number;
};

/**
 * A drawing on the page as a standalone SVG document: a copy with the computed paint written on every element (colours in
 * plain sRGB), so token colours and stylesheet rules survive in a file, an `<img>` or another program. The page's web
 * fonts and the HTML inside a `foreignObject` do not travel with it.
 */
export function serializeSvg(svg: SVGSVGElement, { background, width, height }: SerializeSvgOptions = {}): string {
  needDom("serializeSvg");
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const sources = [svg, ...svg.querySelectorAll("*")];
  const copies = [copy, ...copy.querySelectorAll("*")];
  sources.forEach((element, index) => {
    const target = copies[index];
    if (!(element instanceof SVGElement) || !(target instanceof SVGElement)) return;
    const computed = getComputedStyle(element);
    if (computed.display === "none") target.style.setProperty("display", "none");
    for (const property of PAINT) {
      const value = computed.getPropertyValue(property);
      if (value) target.style.setProperty(property, portable(property, value));
    }
  });
  const box = svg.getBoundingClientRect();
  const view = svg.viewBox.baseVal;
  const drawn = { width: width ?? (Math.round(box.width) || view?.width || 300), height: height ?? (Math.round(box.height) || view?.height || 150) };
  if (!copy.getAttribute("viewBox")) copy.setAttribute("viewBox", `0 0 ${drawn.width} ${drawn.height}`);
  copy.setAttribute("width", String(drawn.width));
  copy.setAttribute("height", String(drawn.height));
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Sizes set in CSS would win over the attributes once the drawing stands alone.
  for (const property of ["width", "height", "min-width", "min-height", "max-width", "max-height", "inline-size", "block-size"]) copy.style.removeProperty(property);
  const fill = background ? (resolveColor(background, svg) ?? background) : undefined;
  if (fill) {
    const [x = "0", y = "0", w = "100%", h = "100%"] = copy.getAttribute("viewBox")!.trim().split(/[\s,]+/);
    const sheet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    for (const [name, value] of Object.entries({ x, y, width: w, height: h, fill })) sheet.setAttribute(name, value);
    copy.insertBefore(sheet, copy.firstChild);
  }
  return new XMLSerializer().serializeToString(copy);
}

function load(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ExportError("invalid", "The picture could not be loaded."));
    image.src = src;
  });
}

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ExportError("invalid", "The picture could not be encoded as PNG."))), "image/png");
    } catch (cause) {
      // A picture from another origin without CORS taints the canvas, and the browser will not read it back.
      reject(new ExportError("refused", "The browser will not read this picture back: it comes from another origin.", { cause }));
    }
  });
}

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const context = canvas.getContext("2d");
  if (!context) throw new ExportError("unsupported", "This browser has no 2D canvas.");
  return [canvas, context];
}

export type SvgToPngOptions = {
  /** Device pixels per CSS pixel of the drawing. Default 2, sharp on a dense screen. */
  scale?: number;
  /** Painted behind the drawing; a PNG without it is transparent. Any CSS colour, a `var(--token)` included. */
  background?: string;
};

/**
 * An SVG as a PNG blob, `scale` times its size. An element goes through `serializeSvg` first, so it looks as it does on
 * the page; a string is drawn as written and takes its size from `width` and `height`, else from its `viewBox`.
 */
export async function svgToPng(svg: string | SVGSVGElement, { scale = 2, background }: SvgToPngOptions = {}): Promise<Blob> {
  needDom("svgToPng");
  const source = typeof svg === "string" ? svg : serializeSvg(svg);
  const root = new DOMParser().parseFromString(source, "image/svg+xml").documentElement;
  if (root.localName !== "svg") throw new ExportError("invalid", "The text is not an SVG document.");
  const view = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const width = Number.parseFloat(root.getAttribute("width") ?? "") || view?.[2] || 0;
  const height = Number.parseFloat(root.getAttribute("height") ?? "") || view?.[3] || 0;
  if (width && height) {
    root.setAttribute("width", String(width));
    root.setAttribute("height", String(height));
  }
  if (!root.getAttribute("xmlns")) root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const image = await load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(root))}`);
  const [canvas, context] = canvasOf((width || image.naturalWidth || 300) * scale, (height || image.naturalHeight || 150) * scale);
  const fill = background ? resolveColor(background, typeof svg === "string" ? undefined : svg) : undefined;
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return toPng(canvas);
}

async function pngOf(source: string | Blob): Promise<Blob> {
  if (typeof source !== "string" && source.type === "image/png") return source;
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const image = await load(url, typeof source === "string" && !/^(?:data|blob):/i.test(source));
    const [canvas, context] = canvasOf(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, 0, 0);
    return await toPng(canvas);
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

/**
 * Puts a picture on the clipboard as PNG, the one format every browser writes: a blob of another type, or the address of a
 * picture, is redrawn through a canvas first. Call it from the click itself. It rejects with an `ExportError`:
 * `unsupported` where the browser has no image clipboard, `refused` when it says no (permission, or a picture from
 * another origin that does not allow reading), `invalid` when the picture does not load.
 */
export async function copyImage(source: string | Blob): Promise<void> {
  needDom("copyImage");
  if (typeof ClipboardItem === "undefined" || typeof navigator.clipboard?.write !== "function") throw new ExportError("unsupported", "This browser cannot copy pictures to the clipboard.");
  const png = pngOf(source);
  // Safari takes the clipboard only inside the click, so the item is made now and its blob arrives later.
  png.catch(() => {});
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
  } catch (cause) {
    const failed = await png.then(
      () => null,
      (error: unknown) => error,
    );
    if (failed instanceof ExportError) throw failed;
    throw new ExportError("refused", "The browser did not allow the copy.", { cause });
  }
}

/** Puts text on the clipboard; where the clipboard API is missing or refuses (an insecure page), through a hidden field. */
export async function copyText(text: string): Promise<void> {
  needDom("copyText");
  try {
    if (typeof navigator.clipboard?.writeText !== "function") throw new ExportError("unsupported", "No clipboard API.");
    await navigator.clipboard.writeText(text);
  } catch (cause) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.setAttribute("aria-hidden", "true");
    field.style.cssText = "position:fixed;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none";
    const focused = document.activeElement;
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    if (!copied) throw new ExportError("refused", "The browser did not allow the copy.", { cause });
  }
}
