import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  closesOnRelease,
  dragAxis,
  dragDown,
  galleryLayout,
  Image,
  ImageViewerProvider,
  isDoubleTap,
  MediaGrid,
  preloadTargets,
  unbrokenSet,
  ZoomableImage,
  type MediaGridItem,
} from "@fabrials/ui";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
// The block this package appends, so a rule of 0.10 with the same selector is not the one read.
const own = styles.slice(styles.indexOf("/* 0.12: the viewer and the gallery."));
const rule = (selector: string) => {
  const at = own.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return own.slice(at, own.indexOf("}", at) + 1);
};
const media = (query: string, last = false) => {
  const marker = `@media ${query} {`;
  const at = last ? own.lastIndexOf(marker) : own.indexOf(marker);
  assert.ok(at >= 0, `missing @media ${query}`);
  let depth = 0;
  for (let index = own.indexOf("{", at); index < own.length; index += 1) {
    if (own[index] === "{") depth += 1;
    if (own[index] === "}" && --depth === 0) return own.slice(at, index + 1);
  }
  throw new Error("unbalanced block");
};

const photo = (index: number): MediaGridItem => ({ src: `p${index}.png`, alt: `Photo ${index}` });

test("a drag down: the axis is decided once from the first ten pixels, never upward", () => {
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 3, y: 4 }), null);
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 0, y: 0 }), null);
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 5, y: 5 }), null);
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 1, y: 11 }), "y");
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 11, y: 1 }), "x");
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: -12, y: 5 }), "x");
  assert.equal(dragAxis({ x: 100, y: 100 }, { x: 100, y: -40 }), "y");
  // A diagonal exactly on the corner counts as vertical: closing is the one it can be undone from.
  assert.equal(dragAxis({ x: 0, y: 0 }, { x: 10, y: 10 }), "y");
});

test("a drag down moves the picture, fades the backdrop and shrinks it, and closes past a threshold or on a flick", () => {
  assert.deepEqual(dragDown(0, 800), { offset: 0, fade: 1, scale: 1 });
  assert.deepEqual(dragDown(-40, 800), { offset: 0, fade: 1, scale: 1 });
  assert.deepEqual(dragDown(Number.NaN, 800), { offset: 0, fade: 1, scale: 1 });
  const half = dragDown(120, 0);
  assert.equal(half.offset, 120);
  assert.equal(half.fade, 0.7);
  assert.equal(half.scale, 0.94);
  // It stops at the end of the stage: never fully transparent, never a speck.
  const whole = dragDown(4000, 800);
  assert.equal(whole.fade, 0.4);
  assert.equal(whole.scale, 0.88);
  assert.ok(half.fade > whole.fade && half.scale > whole.scale);

  assert.equal(closesOnRelease(95, 0), false);
  assert.equal(closesOnRelease(96, 0), true);
  assert.equal(closesOnRelease(150, 0), true);
  assert.equal(closesOnRelease(30, 0.9), true);
  assert.equal(closesOnRelease(23, 2), false);
  assert.equal(closesOnRelease(30, 0.5), false);
  assert.equal(closesOnRelease(-200, 1), false);
  assert.equal(closesOnRelease(Number.NaN, 1), false);
});

test("a double tap is two taps within 300 ms and 24 px", () => {
  const first = { x: 100, y: 100, time: 1000 };
  assert.equal(isDoubleTap(null, first), false);
  assert.equal(isDoubleTap(first, { x: 100, y: 100, time: 1300 }), true);
  assert.equal(isDoubleTap(first, { x: 100, y: 100, time: 1301 }), false);
  assert.equal(isDoubleTap(first, { x: 130, y: 100, time: 1200 }), false);
  assert.equal(isDoubleTap(first, { x: 120, y: 110, time: 1200 }), true);
  assert.equal(isDoubleTap(first, { x: 100, y: 100, time: 900 }), false);
});

test("the neighbours are asked for once each, the next first, never a video, never on a metered connection", () => {
  const items = [
    { src: "a.png" },
    { src: "b.png" },
    { src: "c.mp4", kind: "video" as const },
    { src: "d.png" },
  ];
  const none = new Set<string>();
  assert.deepEqual(preloadTargets(items, 0, none), ["b.png"]);
  assert.deepEqual(preloadTargets(items, 1, none), ["c.mp4", "a.png"].filter((src) => src !== "c.mp4"));
  assert.deepEqual(preloadTargets(items, 2, none), ["d.png", "b.png"]);
  assert.deepEqual(preloadTargets(items, 3, none), ["a.png"].slice(1), "no item after the last, and c.mp4 is not asked for");
  assert.deepEqual(preloadTargets(items, 1, new Set(["a.png"])), []);
  assert.deepEqual(preloadTargets(items, 0, none, true), []);
  assert.deepEqual(preloadTargets(items, null, none), []);
  assert.deepEqual(preloadTargets(items, 9, none), []);
  assert.deepEqual(preloadTargets([{ src: "a.png" }, { src: "a.png" }], 0, none), []);
});

test("a gallery: one to eight tiles, four in a square, five around a lead one, seven and eight in four columns", () => {
  const shapes = Array.from({ length: 9 }, (_, count) => galleryLayout(count, 8));
  assert.deepEqual(
    shapes.map((shape) => [shape.shown, shape.columns, shape.narrowColumns, shape.lead, shape.spanFirst]),
    [
      [0, 1, 1, false, false],
      [1, 1, 1, false, false],
      [2, 2, 2, false, false],
      [3, 3, 2, false, true],
      [4, 2, 2, false, false],
      [5, 4, 2, true, true],
      [6, 3, 2, false, false],
      [7, 4, 2, false, true],
      [8, 4, 2, false, false],
    ],
  );
  assert.equal(galleryLayout(12, 8).shown, 8);
  assert.equal(galleryLayout(12, 8).hidden, 4);
  assert.equal(galleryLayout(12, 4).shown, 4);
  assert.deepEqual(galleryLayout(6, 0), { ...galleryLayout(6, 1), shown: 1 });
  assert.equal(galleryLayout(Number.NaN).shown, 0);
  assert.equal(galleryLayout(-3).shown, 0);
  assert.equal(galleryLayout(5, Number.NaN).shown, 5);
});

test("the set that loses a broken picture keeps the order and the place of each one", () => {
  const items = [photo(1), photo(2), photo(3), photo(4)];
  assert.deepEqual(unbrokenSet(items, new Set()), { items, indexes: [0, 1, 2, 3] });
  const dropped = unbrokenSet(items, new Set(["p2.png", "p4.png"]));
  assert.deepEqual(
    dropped.items.map((item) => item.alt),
    ["Photo 1", "Photo 3"],
  );
  assert.deepEqual(dropped.indexes, [0, 2]);
  assert.deepEqual(unbrokenSet(items, new Set(items.map((item) => item.src))), { items: [], indexes: [] });
});

test("a gallery says how many tiles it has, names its group and tells the viewer its own shape", () => {
  const html = renderToStaticMarkup(<MediaGrid layout="gallery" items={[1, 2, 3, 4, 5].map(photo)} caption="Five pictures" footer="Photos: Ada Rivera" />);
  assert.match(html, /^<figure class="fui-media" role="group" aria-label="Five pictures">/);
  assert.match(html, /data-slot="media-grid" data-count="5" data-layout="gallery" data-columns="4" data-lead=""/);
  assert.match(html, /<figcaption class="fui-media-footer">Photos: Ada Rivera<\/figcaption>/);
  const two = renderToStaticMarkup(<MediaGrid layout="gallery" items={[photo(1), photo(2)]} />);
  assert.match(two, /data-columns="2"/);
  assert.doesNotMatch(two, /data-lead/);
  assert.match(renderToStaticMarkup(<MediaGrid layout="gallery" items={[1, 2, 3].map(photo)} />), /data-span-first=""/);
  // The mosaic a post shows is unchanged: no wrapper, no gallery attributes.
  const grid = renderToStaticMarkup(<MediaGrid items={[photo(1), photo(2)]} />);
  assert.match(grid, /^<div data-slot="media-grid" data-count="2" class="fui-media-grid"/);
});

test("a line over a tile goes with its picture, and a tile that is a button describes itself with it", () => {
  const items = [{ ...photo(1), caption: "Harbour at dusk", credit: "Ada Rivera" }];
  const still = renderToStaticMarkup(<MediaGrid layout="gallery" items={items} />);
  assert.match(still, /<span id="[^"]+-tile-0" class="fui-media-grid-caption" dir="auto">/);
  assert.match(still, /class="fui-media-grid-caption-text">Harbour at dusk</);
  assert.match(still, /class="fui-media-grid-credit">Ada Rivera</);
  const pressable = renderToStaticMarkup(<MediaGrid layout="gallery" items={items} onOpen={() => undefined} />);
  assert.match(pressable, /aria-describedby="[^"]+-tile-0"/);
  assert.match(pressable, /id="[^"]+-tile-0"/);
  // A "+N" tile says the count in its name and carries no line of its own.
  const many = renderToStaticMarkup(<MediaGrid layout="gallery" max={2} items={[1, 2, 3].map((index) => ({ ...photo(index), caption: "C" }))} onOpen={() => undefined} />);
  assert.match(many, /aria-label="Photo 2 \(2 of 3\), 1 more"/);
  assert.match(many, /\+1/);
});

test("all of them broken: the grid says so through its empty slot", () => {
  const html = renderToStaticMarkup(<MediaGrid layout="gallery" hideBroken items={[]} empty={<p>No pictures are available.</p>} />);
  assert.match(html, /class="fui-media-grid-empty"><p>No pictures are available.<\/p>/);
  assert.match(html, /data-count="0"/);
});

test("a picture that opens the viewer is a button with a name; outside a provider it is not a control", () => {
  const alone = renderToStaticMarkup(<ZoomableImage src="a.png" alt="A harbour at dusk" ratio="4 / 3" />);
  assert.doesNotMatch(alone, /<button/);
  assert.match(alone, /<img [^>]*alt="A harbour at dusk"/);
  const provider = renderToStaticMarkup(
    <ImageViewerProvider label="Photos">
      <ZoomableImage src="a.png" alt="A harbour at dusk" ratio="4 / 3" />
    </ImageViewerProvider>,
  );
  assert.match(provider, /<div class="fui-zoomable"><div data-slot="image"/);
  assert.match(provider, /<button type="button" class="fui-image-frame fui-image-action" aria-label="Open A harbour at dusk">/);
  assert.match(renderToStaticMarkup(<Image src="a.png" alt="A pier" onPress={() => undefined} pressLabel="Open the pier" />), /aria-label="Open the pier"/);
});

test("the viewer clears the safe areas with max(), so nothing moves where the inset is zero", () => {
  const viewer = rule(".fui-viewer {");
  assert.match(viewer, /padding-block-start: max\(0px, env\(safe-area-inset-top, 0px\)\);/);
  assert.match(viewer, /padding-block-end: max\(0px, env\(safe-area-inset-bottom, 0px\)\);/);
  assert.match(viewer, /padding-inline-start: max\(0px, env\(safe-area-inset-left, 0px\)\);/);
  assert.match(viewer, /padding-inline-end: max\(0px, env\(safe-area-inset-right, 0px\)\);/);
});

test("a drag down and a caption on focus are rules of the stylesheet, and motion answers only where it may", () => {
  assert.match(rule(".fui-viewer[data-drag-close]:not([data-zoomed]) .fui-viewer-stage {"), /touch-action: none;/);
  assert.match(rule(".fui-viewer[data-dragging] .fui-viewer-canvas,"), /translate: 0 var\(--fui-viewer-drag, 0px\);/);
  assert.match(media("(hover: hover)", true), /button\.fui-media-grid-tile:is\(:hover, :focus-visible\) > \.fui-media-grid-caption \{\s*opacity: 1;/);
  assert.doesNotMatch(own.replace(media("(prefers-reduced-motion: no-preference)"), ""), /transition:/);
  assert.match(rule(".fui-viewer-under {"), /filter: blur\(6px\);/);
  assert.match(own, /@container \(max-width: 30rem\) \{[\s\S]*?data-span-first\][\s\S]*?grid-column: span 2;/);
});

test("every state that is only a fill has a form in forced colors", () => {
  const forced = media("(forced-colors: active)");
  assert.match(forced, /\.fui-media-grid-caption \{[^}]*border-block-start: 1px solid CanvasText;[^}]*background: Canvas;[^}]*color: CanvasText;/);
  assert.match(forced, /\.fui-viewer-dot \{[^}]*border: 1px solid CanvasText;[^}]*background: Canvas;/);
  assert.match(forced, /\.fui-viewer-dot\[data-current\] \{[^}]*background: CanvasText;/);
  assert.match(forced, /\.fui-viewer-source \{[^}]*color: LinkText;/);
});
