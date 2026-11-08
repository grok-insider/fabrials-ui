import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ScrollArea, ScrollBar } from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

test("its name goes to the viewport, which takes focus, as a region; fade is an attribute, off by default", () => {
  const html = renderToStaticMarkup(
    <ScrollArea aria-label="Labels">
      <p>Receipts</p>
    </ScrollArea>,
  );
  const root = html.match(/<div ([^>]*data-slot="scroll-area"[^>]*)>/)![1]!;
  assert.match(root, /class="fui-scroll-area"/);
  assert.doesNotMatch(root, /aria-label/);
  const viewport = html.match(/<div ([^>]*data-slot="scroll-area-viewport"[^>]*)>/)![1]!;
  assert.match(viewport, /role="region"/);
  assert.match(viewport, /aria-label="Labels"/);
  assert.match(viewport, /class="fui-scroll-area-viewport/);
  assert.match(renderToStaticMarkup(<ScrollArea aria-labelledby="title">x</ScrollArea>), /role="region" aria-labelledby="title"|aria-labelledby="title"[^>]*role="region"/);
  assert.doesNotMatch(renderToStaticMarkup(<ScrollArea>x</ScrollArea>), /role="region"/);
  assert.doesNotMatch(html, /data-fade/);
  assert.match(renderToStaticMarkup(<ScrollArea fade>x</ScrollArea>), /data-fade="true"/);
  // A row adds its horizontal bar inside, the way shadcn does.
  assert.doesNotThrow(() =>
    renderToStaticMarkup(
      <ScrollArea>
        <div>row</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>,
    ),
  );
});

test("the thumb is round and its ink deepens over the region and under the pointer", () => {
  assert.match(rule(".fui-scrollbar-thumb {"), /--fui-scrollbar-ink: 18%;[^}]*border-radius: var\(--fui-radius-full\);[^}]*background: color-mix\(in oklab, var\(--foreground\) var\(--fui-scrollbar-ink\), transparent\);/);
  assert.match(rule(".fui-scrollbar:is([data-hovering], [data-scrolling]) > .fui-scrollbar-thumb {"), /--fui-scrollbar-ink: 30%;/);
  assert.match(rule(".fui-scrollbar > .fui-scrollbar-thumb:is(:hover, :active) {"), /--fui-scrollbar-ink: 44%;/);
  assert.match(rule(".fui-scrollbar {"), /padding: 2px;/);
});

test("while it overflows the lines keep clear of the bar", () => {
  assert.match(rule(".fui-scroll-area-viewport[data-has-overflow-y] {"), /padding-inline-end: 0\.75rem;/);
});

test("the viewport's focus ring is drawn by the region, inside its edge", () => {
  assert.match(rule(".fui-scroll-area-viewport {"), /outline: none;/);
  assert.match(rule(".fui-scroll-area:has(> .fui-scroll-area-viewport:focus-visible) {"), /outline: 2px solid var\(--fui-focus\);\s*outline-offset: -2px;/);
});

test("fade masks each edge as far as Base UI measures more behind it, at most 2rem, and turns the row around in right to left", () => {
  const fade = rule(".fui-scroll-area[data-fade] > .fui-scroll-area-viewport {");
  for (const edge of ["y-start", "y-end", "x-start", "x-end"]) {
    assert.match(fade, new RegExp(`min\\(var\\(--fui-scroll-fade\\), var\\(--scroll-area-overflow-${edge}, 0px\\)\\)`), edge);
  }
  assert.match(fade, /--fui-scroll-fade: 2rem;/);
  assert.match(fade, /mask-composite: intersect;/);
  assert.match(rule(".fui-scroll-area[data-fade] > .fui-scroll-area-viewport:dir(rtl) {"), /--fui-scroll-fade-x: to left;/);
  // A skeleton draws its lines whole.
  assert.match(rule("[data-fui-loading] > .fui-loading-content .fui-scroll-area[data-fade] > .fui-scroll-area-viewport {"), /mask-image: none !important;/);
});
