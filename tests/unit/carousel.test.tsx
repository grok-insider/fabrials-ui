import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, DirectionProvider } from "../../packages/ui/src/index";
import { carouselKeyMove, carouselNameProblem, carouselOffKey, carouselOwnsKey } from "../../packages/ui/src/carousel-logic";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const source = readFileSync(new URL("../../packages/ui/src/carousel.tsx", import.meta.url), "utf8");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

test("a row answers Left and Right, the other way round in right to left; a column answers Up and Down; Home and End in both", () => {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageDown", "a", " "];
  assert.deepEqual(
    keys.map((key) => carouselKeyMove(key, "horizontal", "ltr")),
    ["previous", "next", null, null, "first", "last", null, null, null],
  );
  assert.deepEqual(
    keys.map((key) => carouselKeyMove(key, "horizontal", "rtl")),
    ["next", "previous", null, null, "first", "last", null, null, null],
  );
  for (const direction of ["ltr", "rtl"] as const) {
    assert.deepEqual(
      keys.map((key) => carouselKeyMove(key, "vertical", direction)),
      [null, null, "previous", "next", "first", "last", null, null, null],
    );
  }
  assert.equal(carouselKeyMove("ArrowRight", "horizontal"), "next");
});

test("a key belongs to the carousel only from the region itself or its own two keys", () => {
  // The helper reads the DOM through closest(): a stand-in with the same shape is enough here; the browser spec drives the real thing.
  class Fake {
    constructor(
      private slot: string | null,
      private parent: Fake | null = null,
      private off = false,
    ) {}
    closest(selector: string): Fake | null {
      const wanted = selector.split(",").map((part) => ({ slot: part.match(/data-slot="([^"]+)"/)?.[1], off: part.includes('[aria-disabled="true"]') }));
      if (wanted.some((part) => part.slot === this.slot && (!part.off || this.off))) return this;
      return this.parent ? this.parent.closest(selector) : null;
    }
  }
  const previous = globalThis.Element;
  globalThis.Element = Fake as unknown as typeof Element;
  try {
    const root = new Fake("carousel");
    const el = (node: Fake) => node as unknown as Element;
    assert.equal(carouselOwnsKey(el(root), el(root)), true);
    assert.equal(carouselOwnsKey(el(new Fake("carousel-next", root)), el(root)), true);
    assert.equal(carouselOwnsKey(el(new Fake(null, new Fake("carousel-previous", root))), el(root)), true);
    // A field, a link or a slider in a slide keeps its arrows.
    assert.equal(carouselOwnsKey(el(new Fake(null, new Fake("carousel-item", root))), el(root)), false);
    // The keys of a carousel nested in a slide are not the outer one's.
    const inner = new Fake("carousel", new Fake("carousel-item", root));
    assert.equal(carouselOwnsKey(el(new Fake("carousel-next", inner)), el(root)), false);
    assert.equal(carouselOwnsKey(el(new Fake("carousel-next", inner)), el(inner)), true);
    assert.equal(carouselOwnsKey(null, el(root)), false);
    // An off key cancels its own keys (Base UI): only there is a cancelled event still the carousel's.
    assert.equal(carouselOffKey(el(new Fake("carousel-next", root, true))), true);
    assert.equal(carouselOffKey(el(new Fake(null, new Fake("carousel-previous", root, true)))), true);
    assert.equal(carouselOffKey(el(new Fake("carousel-next", root))), false);
    assert.equal(carouselOffKey(el(root)), false);
    assert.equal(carouselOffKey(null), false);
  } finally {
    globalThis.Element = previous;
  }
});

test("a region nobody named is a development warning", () => {
  assert.match(carouselNameProblem({})!, /Carousel: the region has no name/);
  assert.equal(carouselNameProblem({ "aria-label": "Reports" }), null);
  assert.equal(carouselNameProblem({ "aria-labelledby": "reports-title" }), null);
  assert.match(carouselNameProblem({ "aria-label": "" })!, /aria-label or aria-labelledby/);
  assert.match(source, /if \(nameProblem && inDevelopment\(\)\) console\.warn\(nameProblem\)/);
});

test("markup: a named region that takes focus, two keys named by labels that stay focusable when off, slides as groups", () => {
  const html = renderToStaticMarkup(
    <Carousel aria-label="Reports" labels={{ next: "Siguiente" }}>
      <CarouselContent>
        <CarouselItem>One</CarouselItem>
        <CarouselItem aria-label="The second">Two</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>,
  );
  const root = html.match(/<div ([^>]*data-slot="carousel"[^>]*)>/)![1]!;
  assert.match(root, /role="region"/);
  assert.match(root, /aria-roledescription="carousel"/);
  assert.match(root, /aria-label="Reports"/);
  assert.match(root, /tabindex="0"/);
  assert.match(root, /data-orientation="horizontal"/);
  assert.equal([...html.matchAll(/role="group" aria-roledescription="slide"/g)].length, 2);
  // Places are known once Embla has mounted: the server names no slide, and a slide's own name is kept.
  assert.doesNotMatch(html, /aria-label="1 of 2"/);
  assert.match(html, /aria-label="The second"/);
  const previous = html.match(/<button[^>]*data-slot="carousel-previous"[^>]*>.*?<\/button>/s)![0];
  assert.match(previous, /Previous slide<\/span>/);
  assert.match(previous, /aria-disabled="true"/);
  assert.doesNotMatch(previous, / disabled=""/);
  const next = html.match(/<button[^>]*data-slot="carousel-next"[^>]*>.*?<\/button>/s)![0];
  assert.match(next, /Siguiente<\/span>/);
  assert.doesNotMatch(html, /Next slide/);
  assert.match(renderToStaticMarkup(<Carousel aria-label="Notes" orientation="vertical" />), /data-orientation="vertical"/);
  assert.match(renderToStaticMarkup(<Carousel aria-label="Notes" tabIndex={-1} />), /tabindex="-1"/);
  assert.doesNotThrow(() =>
    renderToStaticMarkup(
      <DirectionProvider direction="rtl">
        <Carousel aria-label="التقارير" />
      </DirectionProvider>,
    ),
  );
});

test("keys are heard on the way up, never captured; Embla gets the direction and no duration under reduced motion", () => {
  assert.doesNotMatch(source, /onKeyDownCapture/);
  assert.match(source, /onKeyDown=\{handleKeyDown\}/);
  assert.match(source, /if \(!carouselOwnsKey\(event\.target, event\.currentTarget\)\) return/);
  assert.match(source, /event\.altKey \|\| event\.ctrlKey \|\| event\.metaKey \|\| event\.shiftKey/);
  assert.match(source, /if \(event\.defaultPrevented && !carouselOffKey\(event\.target\)\) return/);
  assert.match(source, /const direction = useDirection\(\)/);
  assert.match(source, /direction,\s*\.\.\.opts,/);
  assert.match(source, /useMediaQuery\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(source, /\.\.\.\(reducedMotion \? \{ duration: 0 \} : null\)/);
  assert.match(source, /api\.scrollTo\(move === "first" \? 0 : api\.scrollSnapList\(\)\.length - 1\)/);
  assert.match(source, /aria-label=\{!named && index && count \? labels\.slide\(index, count\) : undefined\}/);
});

test("the keys sit at the inline start and end, their chevrons turn in right to left, and the region's ring is inside the viewport", () => {
  assert.match(rule('.fui-carousel-previous[data-orientation="horizontal"] {'), /inset-inline-start: -3rem;/);
  assert.match(rule('.fui-carousel-next[data-orientation="horizontal"] {'), /inset-inline-end: -3rem;/);
  assert.match(styles, /\.fui-carousel-control\[data-orientation="horizontal"\] svg:dir\(rtl\) \{\s*transform: scaleX\(-1\);/);
  assert.match(rule(".fui-carousel:focus-visible {"), /outline: none;/);
  assert.match(rule(".fui-carousel:focus-visible > .fui-carousel-viewport {"), /outline: 2px solid var\(--fui-focus\);\s*outline-offset: -2px;/);
});
