/*
 * In-page helpers for the skeleton suite. `installProbe` is serialised into
 * every page with addInitScript, so it must not reference anything outside
 * its own body. It exposes `window.__lqa`.
 */

export type Box = { d: string; x: number; y: number; w: number; h: number };
export type Line = { d: string; x: number; y: number; w: number; h: number; font: number; text: string; bone: Rgb };
export type Rgb = [number, number, number];
export type Rect = { x: number; y: number; w: number; h: number };
export type LineSample = Line & { centre: Rgb; run: number; deltaE: number };
export type Shape = { d: string; x: number; y: number; w: number; h: number; surface: Rgb };
export type ShapeSample = Shape & { worst: Rgb; deltaE: number };
export type ChromaReport = { max: number; at: [number, number]; count: number; rgb: Rgb };
export type InkLeak = { d: string; what: string; color: string };

export type Probe = {
  boxes(): Box[];
  pause(): number;
  stageRect(): Rect;
  lines(): Line[];
  /** For each line from the last lines() call: is it still where it was? */
  unmoved(): boolean[];
  /** Visible filled shapes (buttons, badges, switches…), viewport coordinates; call with loading off. */
  shapes(): Shape[];
  ink(): InkLeak[];
  skeleton(): Rgb;
  whoAt(x: number, y: number): string;
  analyse(
    png: string,
    lines: Line[],
    shapes: Shape[],
    region: Rect,
    tolerance: number,
  ): Promise<{ samples: LineSample[]; shapes: ShapeSample[]; chroma: ChromaReport }>;
  pulses(): { running: number; total: number };
  /**
   * Pixel statistics of two same-size PNGs: the share whose lightness differs
   * by more than `lightness` (OKLab L; colour and antialiasing aside), and how
   * uniform `b` is (largest ΔE from its mean).
   */
  compare(a: string, b: string, lightness: number): Promise<{ differ: number; spread: number; mean: Rgb }>;
  mutateText(value: string): number;
  restoreText(): void;
  duplicateRows(): number;
  removeDuplicates(): void;
  narrow(px: number | null): void;
  positioned(on: boolean): void;
};

declare global {
  interface Window {
    __lqa: Probe;
  }
}

export function installProbe() {
  const stage = () => {
    const found = document.querySelector<HTMLElement>(".docs-preview-stage");
    if (!found) throw new Error("No .docs-preview-stage on the page");
    return found;
  };
  const content = () => {
    const found = stage().querySelector<HTMLElement>(":scope > .fui-loading > .fui-loading-content");
    if (!found) throw new Error("No Loading content inside the preview stage");
    return found;
  };
  const describe = (el: Element) => {
    const parts: string[] = [];
    for (let node: Element | null = el, i = 0; node && i < 3; node = node.parentElement, i += 1) {
      const cls = [...node.classList].filter((c) => !c.includes(":")).slice(0, 2).join(".");
      parts.unshift(`${node.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`);
      if (node.classList.contains("docs-preview-stage")) break;
    }
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    return `${parts.join(" > ")}${text ? ` "${text}"` : ""}`;
  };
  // Controls the skeleton paints as one solid shape (mirrors styles.css).
  const FILLED = [
    ".fui-button",
    ".fui-badge",
    ".fui-filter-chip",
    ".fui-combobox-chip",
    ".fui-toggle",
    ".fui-avatar",
    ".fui-kbd",
    ".fui-status-dot",
    ".fui-switch",
    ".fui-checkbox",
    ".fui-radio",
    ".fui-nav-tab-count",
    ".fui-sidebar-menu-badge",
    '[data-skeleton="fill"]',
  ].join(",");
  // Things painted as one shape (or kept, or hidden) in the skeleton: their text has no bar.
  const NO_BAR = [
    "svg",
    "input",
    "textarea",
    "select",
    "option",
    "script",
    "style",
    "template",
    ".fui-button",
    ".fui-badge",
    ".fui-filter-chip",
    ".fui-combobox-chip",
    ".fui-toggle",
    ".fui-avatar",
    ".fui-kbd",
    ".fui-status-dot",
    ".fui-nav-tab-count",
    ".fui-sidebar-menu-badge",
    "[data-skeleton]",
  ].join(",");

  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const oklab = ([r8, g8, b8]: number[]): [number, number, number] => {
    const r = toLinear(r8!);
    const g = toLinear(g8!);
    const b = toLinear(b8!);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  };
  const deltaE = (a: number[], b: number[]) => {
    const x = oklab(a);
    const y = oklab(b);
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };
  const alpha = (color: string) => {
    if (color === "transparent") return 0;
    const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
    if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
    const rgba = color.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\)$/);
    if (rgba) return Number(rgba[1]);
    return 1;
  };
  const clipRects = (el: Element) => {
    // Where `el`'s content can show: the stage, intersected with `el` and every
    // ancestor that clips (overflow, clip-path, paint containment, or the
    // legacy `clip` of visually hidden text, which shows nothing at all).
    const s = stage();
    let r = s.getBoundingClientRect();
    let box = { l: r.left + s.clientLeft, t: r.top + s.clientTop, r: r.left + s.clientLeft + s.clientWidth, b: r.top + s.clientTop + s.clientHeight };
    for (let node: Element | null = el; node && node !== s; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.clip && cs.clip !== "auto" && (cs.position === "absolute" || cs.position === "fixed")) return { l: 0, t: 0, r: 0, b: 0 };
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.clipPath !== "none" || cs.contain.includes("paint")) {
        r = node.getBoundingClientRect();
        box = { l: Math.max(box.l, r.left), t: Math.max(box.t, r.top), r: Math.min(box.r, r.right), b: Math.min(box.b, r.bottom) };
      }
    }
    return box;
  };
  const toRgb = (color: string): Rgb => {
    const holder = document.createElement("i");
    holder.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;visibility:hidden";
    holder.style.color = color;
    document.body.append(holder);
    const resolved = getComputedStyle(holder).color;
    holder.remove();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = resolved;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r!, g!, b!];
  };
  const bones = new Map<string, Rgb>();
  /** The bone colour where `el` is: a `.dark` island inside a light page has its own. */
  const boneFor = (el: Element, token = "--fui-skeleton") => {
    const value = getComputedStyle(el).getPropertyValue(token).trim();
    if (!bones.has(value)) bones.set(value, toRgb(value));
    return bones.get(value)!;
  };
  const effectiveOpacity = (el: Element) => {
    let o = 1;
    for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) o *= Number(getComputedStyle(node).opacity);
    return o;
  };

  const saved: [Text, string][] = [];
  let measured: { node: Text; index: number; x: number; y: number }[] = [];
  const clones: Element[] = [];

  const probe: Probe = {
    boxes() {
      const s = stage();
      return [s, ...s.querySelectorAll("*")].map((el) => {
        const r = el.getBoundingClientRect();
        return { d: describe(el), x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
      });
    },
    /**
     * Stops motion so a measurement is repeatable: CSS transitions are run to
     * their end (a host's `transition: color`, even 0.01 ms under reduced
     * motion, would otherwise hold the pre-toggle colour), everything else is
     * paused where it is.
     */
    pause() {
      const running = document.getAnimations();
      for (const animation of running) {
        try {
          if (animation instanceof CSSTransition) animation.finish();
          else animation.pause();
        } catch {
          /* already finished */
        }
      }
      return running.length;
    },
    /** The stage's visible rect in viewport coordinates. */
    stageRect() {
      const r = stage().getBoundingClientRect();
      const x = Math.max(0, r.left);
      const y = Math.max(0, r.top);
      return { x, y, w: Math.min(innerWidth, r.right) - x, h: Math.min(innerHeight, r.bottom) - y };
    },
    /**
     * Every line of visible text that should become a bar, in viewport
     * coordinates. Call it with loading off: hit testing then tells whether
     * something covers the line (inert content is not hit).
     */
    lines() {
      const out: Line[] = [];
      measured = [];
      const walker = document.createTreeWalker(content(), NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        if (!node.data.trim()) continue;
        const parent = node.parentElement;
        if (!parent || parent.closest(NO_BAR)) continue;
        const cs = getComputedStyle(parent);
        if (cs.visibility !== "visible" || cs.display === "none") continue;
        // Skipped content (a closed <details>, content-visibility) has rects but paints nothing.
        if (!parent.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
        if (effectiveOpacity(parent) < 0.99) continue;
        const clip = clipRects(parent);
        const range = document.createRange();
        range.selectNodeContents(node);
        const font = parseFloat(cs.fontSize);
        for (const [index, r] of [...range.getClientRects()].entries()) {
          if (r.height < font * 0.6) continue;
          // Truncated text shows a bar up to the clip edge: sample the visible part.
          const left = Math.max(r.left, clip.l, 0);
          const right = Math.min(r.right, clip.r, innerWidth);
          if (right - left < 6) continue;
          const cx = (left + right) / 2;
          const cy = r.top + r.height / 2;
          // The bar is 0.8 em tall around the strike position: all of it must be visible.
          if (cy - font * 0.5 < Math.max(clip.t, 0) || cy + font * 0.5 > Math.min(clip.b, innerHeight)) continue;
          // Something else on top (or nothing rendered here) means there is no bar to see.
          const hit = document.elementFromPoint(cx, cy);
          const through = cs.pointerEvents === "none" && !!hit?.contains(parent);
          if (!hit || (hit !== parent && !parent.contains(hit) && !through)) continue;
          out.push({
            d: describe(parent),
            x: left,
            y: r.top,
            w: right - left,
            h: r.height,
            font,
            text: node.data.trim().slice(0, 30),
            bone: boneFor(parent),
          });
          measured.push({ node, index, x: r.left, y: r.top });
        }
      }
      return out;
    },
    unmoved() {
      return measured.map(({ node, index, x, y }) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const r = range.getClientRects()[index];
        return !!r && Math.abs(r.left - x) < 1 && Math.abs(r.top - y) < 1;
      });
    },
    shapes() {
      const out: Shape[] = [];
      for (const el of content().querySelectorAll(FILLED)) {
        // A filled shape inside another is painted over by nothing: the outer one is judged.
        if (el.parentElement?.closest(FILLED) || el.closest('[data-skeleton]:not([data-skeleton="fill"])')) continue;
        if (!el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true, opacityProperty: true })) continue;
        if (effectiveOpacity(el) < 0.99) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const clip = clipRects(el);
        if (r.left < clip.l || r.right > clip.r || r.top < clip.t || r.bottom > clip.b) continue;
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) continue;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || (hit !== el && !el.contains(hit))) continue;
        out.push({ d: describe(el), x: r.left, y: r.top, w: r.width, h: r.height, surface: boneFor(el, "--fui-skeleton-surface") });
      }
      return out;
    },
    /** Elements and pseudo-elements that still paint text ink while loading. */
    ink() {
      const leaks: InkLeak[] = [];
      for (const el of content().querySelectorAll("*")) {
        if (el.closest('[data-skeleton="keep"], [data-skeleton="hide"], [data-skeleton="block"], svg')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== "visible") continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Not rendered (a closed <details>): paints nothing, whatever its computed colour.
        if (!el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        const field = el.matches("input, textarea, select");
        if (hasText || field) {
          const fill = cs.getPropertyValue("-webkit-text-fill-color") || cs.color;
          if (alpha(cs.color) > 0 && alpha(fill) > 0) leaks.push({ d: describe(el), what: "text", color: cs.color });
          else if (alpha(fill) > 0) leaks.push({ d: describe(el), what: "text fill", color: fill });
          if (cs.textShadow !== "none") leaks.push({ d: describe(el), what: "text-shadow", color: cs.textShadow });
          const stroke = parseFloat(cs.getPropertyValue("-webkit-text-stroke-width") || "0");
          if (stroke > 0 && alpha(cs.getPropertyValue("-webkit-text-stroke-color")) > 0)
            leaks.push({ d: describe(el), what: "text stroke", color: cs.getPropertyValue("-webkit-text-stroke-color") });
        }
        for (const pseudo of ["::before", "::after", "::marker"] as const) {
          if (pseudo === "::marker" && cs.display !== "list-item") continue;
          const ps = getComputedStyle(el, pseudo);
          const value = ps.content;
          if (pseudo !== "::marker" && (!value || value === "none" || value === "normal" || value === '""')) continue;
          if (pseudo !== "::marker" && !/["']\s*\S/.test(value) && !/counter/.test(value)) continue;
          if (pseudo === "::marker" && (cs.listStyleType === "none" || !cs.listStyleType)) continue;
          const fill = ps.getPropertyValue("-webkit-text-fill-color") || ps.color;
          if (ps.visibility === "visible" && alpha(ps.color) > 0 && alpha(fill) > 0)
            leaks.push({ d: `${describe(el)}${pseudo}`, what: `generated text ${value.slice(0, 20)}`, color: ps.color });
        }
      }
      return leaks;
    },
    /** The page's bone colour as sRGB. */
    skeleton() {
      return boneFor(content());
    },
    /** The deepest element of the Loading content under a viewport point (inert content is not hit-testable). */
    whoAt(x, y) {
      let found: Element | null = null;
      for (const el of content().querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && x >= r.left && x < r.right && y >= r.top && y < r.bottom) found = el;
      }
      return found ? describe(found) : "(the stage itself)";
    },
    async analyse(png, lines, shapes, region, tolerance) {
      const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(bitmap, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      const at = (x: number, y: number): Rgb => {
        const i = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
        return [data[i]!, data[i + 1]!, data[i + 2]!];
      };
      const samples = lines.map((line) => {
        const x = Math.round(line.x + line.w / 2);
        const y = Math.round(line.y + line.h / 2);
        const centre = at(x, y);
        const close = (py: number) => deltaE(at(x, py), line.bone) <= tolerance;
        let run = 0;
        if (close(y)) {
          run = 1;
          for (let py = y - 1; py >= 0 && close(py); py -= 1) run += 1;
          for (let py = y + 1; py < height && close(py); py += 1) run += 1;
        }
        return { ...line, centre, run, deltaE: deltaE(centre, line.bone) };
      });
      // A filled shape is one colour: sample a grid over its middle, clear of corners and borders.
      const shaped = shapes.map((shape) => {
        let worst: Rgb = at(Math.round(shape.x + shape.w / 2), Math.round(shape.y + shape.h / 2));
        let most = deltaE(worst, shape.surface);
        for (const fx of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])
          for (const fy of [0.3, 0.5, 0.7]) {
            const pixel = at(Math.round(shape.x + shape.w * fx), Math.round(shape.y + shape.h * fy));
            const d = deltaE(pixel, shape.surface);
            if (d > most) {
              most = d;
              worst = pixel;
            }
          }
        return { ...shape, worst, deltaE: most };
      });
      const chroma: ChromaReport = { max: 0, at: [0, 0], count: 0, rgb: [0, 0, 0] };
      const x0 = Math.round(region.x);
      const y0 = Math.round(region.y);
      for (let y = y0; y < Math.min(height, y0 + Math.round(region.h)); y += 1) {
        for (let x = x0; x < Math.min(width, x0 + Math.round(region.w)); x += 1) {
          const i = (y * width + x) * 4;
          const lab = oklab([data[i]!, data[i + 1]!, data[i + 2]!]);
          const c = Math.hypot(lab[1], lab[2]);
          if (c > 0.03) chroma.count += 1;
          if (c > chroma.max) {
            chroma.max = c;
            chroma.at = [x, y];
            chroma.rgb = [data[i]!, data[i + 1]!, data[i + 2]!];
          }
        }
      }
      return { samples, shapes: shaped, chroma };
    },
    async compare(a, b, lightness) {
      const decode = async (png: string) => {
        const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      };
      const [x, y] = await Promise.all([decode(a), decode(b)]);
      // Two pixels in from every edge: an element screenshot of a box at a
      // fractional position carries a row of whatever is next to it.
      const width = Math.min(x.width, y.width);
      const height = Math.min(x.height, y.height);
      const inner: number[] = [];
      for (let py = 2; py < height - 2; py += 1)
        for (let px = 2; px < width - 2; px += 1) inner.push(py * width + px);
      const at = (image: ImageData, i: number): Rgb => {
        const o = (Math.floor(i / width) * image.width + (i % width)) * 4;
        return [image.data[o]!, image.data[o + 1]!, image.data[o + 2]!];
      };
      let differ = 0;
      const sum = [0, 0, 0];
      for (const i of inner) {
        const q = at(y, i);
        if (Math.abs(oklab(at(x, i))[0] - oklab(q)[0]) > lightness) differ += 1;
        sum[0] += q[0];
        sum[1] += q[1];
        sum[2] += q[2];
      }
      const mean = sum.map((v) => Math.round(v / Math.max(1, inner.length))) as Rgb;
      let spread = 0;
      for (const i of inner) spread = Math.max(spread, deltaE(at(y, i), mean));
      return { differ: differ / Math.max(1, inner.length), spread, mean };
    },
    pulses() {
      const inside = document.getAnimations().filter((a) => {
        const effect = a.effect as KeyframeEffect | null;
        const target = effect?.target;
        return (
          target instanceof Element &&
          content().contains(target) &&
          (a as CSSAnimation).animationName === "fui-loading-pulse"
        );
      });
      return { running: inside.filter((a) => a.playState === "running").length, total: inside.length };
    },
    mutateText(value) {
      probe.restoreText();
      const walker = document.createTreeWalker(content(), NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        if (!node.data.trim() || node.parentElement?.closest("script, style, template")) continue;
        saved.push([node, node.data]);
      }
      for (const [node] of saved) node.data = value;
      return saved.length;
    },
    restoreText() {
      for (const [node, data] of saved.splice(0)) node.data = data;
    },
    duplicateRows() {
      probe.removeDuplicates();
      const rows = content().querySelectorAll('li, tr, [role="row"], [role="listitem"], [role="option"], [role="menuitem"], [role="treeitem"]');
      for (const row of rows) {
        const copy = row.cloneNode(true) as Element;
        copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        copy.removeAttribute("id");
        row.after(copy);
        clones.push(copy);
      }
      return clones.length;
    },
    removeDuplicates() {
      for (const copy of clones.splice(0)) copy.remove();
    },
    narrow(px) {
      const preview = content().querySelector<HTMLElement>(".fui-preview") ?? (content().firstElementChild as HTMLElement);
      preview.style.maxWidth = px === null ? "" : `${px}px`;
    },
    /**
     * Adds an absolutely and a fixed positioned element with no positioned
     * ancestor inside the preview, where host content often has them (skip
     * links, visually hidden inputs, floating actions). Paint-only CSS cannot
     * move them; anything that makes an ancestor their containing block does.
     */
    positioned(on) {
      for (const el of document.querySelectorAll("[data-lqa-positioned]")) el.remove();
      if (!on) return;
      const preview = content().querySelector<HTMLElement>(".fui-preview") ?? (content().firstElementChild as HTMLElement);
      const deep = [...preview.querySelectorAll<HTMLElement>("div, section, article, p")].find(
        (el) => getComputedStyle(el).position === "static" && el.getBoundingClientRect().width > 0,
      );
      const add = (parent: HTMLElement, css: string, text: string) => {
        const el = document.createElement("span");
        el.dataset.lqaPositioned = "";
        el.textContent = text;
        el.style.cssText = css;
        parent.append(el);
      };
      add(preview, "position:absolute;left:12px;top:12px", "Absolute");
      add(preview, "position:fixed;right:24px;bottom:24px", "Fixed");
      if (deep) add(deep, "position:absolute;right:4px;top:4px", "Nested");
    },
  };
  window.__lqa = probe;
}
