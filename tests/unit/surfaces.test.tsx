import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  CodePanel,
  CodeTabs,
  IconButton,
  Snippet,
  StatePanel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  buttonVariants,
  overflows,
} from "../../packages/ui/src/index";
import { CodeBlock } from "../../packages/ai-ui/src/index";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const styles = read("packages/ui/src/styles.css");
const tokens = read("packages/ui/src/tokens.css");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

// ------------------------------------------------------------------- buttons

test('size="touch" is 44 px on every pointer: a fixed length, outside every pointer and width query', () => {
  const html = renderToStaticMarkup(<Button size="touch">Check</Button>);
  assert.match(html, /data-size="touch"/);
  assert.match(buttonVariants({ size: "touch" }), /fui-button-size-touch/);
  const touch = rule(':is(.fui-button[data-size="touch"], .fui-button-size-touch),');
  assert.match(touch, /min-block-size: 2\.75rem;/);
  // No token in it: compact density and a host's control heights do not shrink it.
  assert.doesNotMatch(touch, /var\(/);
  // The padding and the type are the default size's: the rule sets neither.
  assert.doesNotMatch(touch, /padding|font/);
  const at = styles.indexOf(':is(.fui-button[data-size="touch"], .fui-button-size-touch),');
  const before = styles.slice(0, at);
  assert.equal(before.lastIndexOf("@layer components {") > before.lastIndexOf("@media"), true, "not inside a media query");
});

test('an icon button of size "touch" is a 44 px square', () => {
  const html = renderToStaticMarkup(
    <IconButton label="Play" size="touch" tooltip={false}>
      <svg />
    </IconButton>,
  );
  assert.match(html, /data-size="icon-touch"/);
  assert.match(html, /aria-label="Play"/);
  assert.match(styles, /\n  :is\(\.fui-button\[data-size="icon-touch"\], \.fui-button-size-icon-touch\) \{\s*aspect-ratio: 1;\s*min-inline-size: 2\.75rem;\s*padding: 0;\s*\}/);
});

test("loadingLabel replaces the text while loading and only then", () => {
  const idle = renderToStaticMarkup(<Button loadingLabel="Saving">Save</Button>);
  assert.match(idle, />Save<\/button>/);
  assert.doesNotMatch(idle, /Saving|loadingLabel|loadinglabel/);
  const busy = renderToStaticMarkup(
    <Button loading loadingLabel="Saving">
      Save
    </Button>,
  );
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /<\/svg>Saving<\/button>/);
  assert.doesNotMatch(busy, />Save</);
  // Without a label the children stay, as before.
  assert.match(renderToStaticMarkup(<Button loading>Save</Button>), /<\/svg>Save<\/button>/);
});

// ------------------------------------------------------------------- popover

test("a popover is never taller than the room its positioner measured, and scrolls inside", () => {
  const popover = rule("\n  .fui-popover {");
  assert.match(popover, /max-block-size: var\(--available-height\);\s*overflow-y: auto;\s*overscroll-behavior: contain;/);
  // The nav switcher keeps its own limit and scrolls only its list.
  assert.match(rule(".fui-popover.fui-nav-switcher-popover {") + styles.slice(styles.indexOf("max-block-size: min(24rem, var(--available-height, 24rem));"), styles.indexOf("max-block-size: min(24rem, var(--available-height, 24rem));") + 120), /overflow: hidden;/);
});

test("the popover's close key sticks to the corner, out of the flow, on the popover's surface", () => {
  const host = rule(".fui-popover:has(> .fui-popover-close) {");
  assert.match(host, /display: flex;\s*flex-direction: column;/);
  assert.match(host, /scroll-padding-block-start: calc\(var\(--fui-popover-close-size\) \+ var\(--fui-space-2\)\);/);
  const key = rule(".fui-popover > .fui-popover-close {");
  assert.match(key, /--fui-button-bg: var\(--fui-overlay-surface\);/);
  // A sticky inset counts from the scroller's content edge: minus 6 px is 6 px inside the popover's 12 px padding.
  assert.match(key, /position: sticky;\s*inset-block-start: calc\(-1 \* var\(--fui-space-1-5\)\);/);
  assert.match(key, /order: -1;/);
  assert.match(key, /align-self: flex-end;/);
  // Its height and the gap are given back, so the content starts where it would without the key.
  assert.match(key, /margin-block: calc\(-1 \* var\(--fui-space-1-5\)\) calc\(-1 \* \(var\(--fui-popover-close-size\) - var\(--fui-space-1-5\) \+ var\(--fui-space-2\)\)\);/);
  assert.match(key, /margin-inline-end: calc\(-1 \* var\(--fui-space-1-5\)\);/);
  assert.match(rule(".fui-popover:has(> .fui-popover-close) > .fui-popover-header {"), /padding-inline-end:/);
  const source = read("packages/ui/src/popover.tsx");
  assert.match(source, /label = "Close"/);
  assert.match(source, /<PopoverPrimitive\.Close/);
});

// ------------------------------------------------------------ scroll regions

test("a scroll region has no tab stop until it is measured to overflow: the server renders none", () => {
  const table = renderToStaticMarkup(
    <Table aria-label="Accounts">
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  assert.match(table, /<div class="fui-table-scroll" role="region" aria-label="Accounts table">/);
  const panel = renderToStaticMarkup(<CodePanel code="const a = 1;" language="ts" />);
  assert.match(panel, /<pre class="fui-code-panel-body">/);
  const tabs = renderToStaticMarkup(<CodeTabs label="Install" items={[{ value: "npm", label: "npm", code: "npm i", language: "bash" }]} />);
  assert.match(tabs, /<pre class="fui-code-panel-body">/);
  const snippet = renderToStaticMarkup(<Snippet>bun add @fabrials/ui</Snippet>);
  assert.match(snippet, /<pre class="fui-snippet-code">/);
  const block = renderToStaticMarkup(<CodeBlock code="const a = 1;" language="ts" />);
  assert.match(block, /<div class="fui-code-block-body" role="region" aria-label="ts code">/);
  for (const html of [table, panel, tabs, snippet, block]) assert.doesNotMatch(html, /<(pre|div class="fui-(table-scroll|code-block-body)")[^>]*tabindex/);
});

test("overflows: more than a pixel on either axis", () => {
  const box = (scrollWidth: number, clientWidth: number, scrollHeight: number, clientHeight: number) => ({ scrollWidth, clientWidth, scrollHeight, clientHeight });
  assert.equal(overflows(box(100, 100, 40, 40)), false);
  // A fraction of a pixel rounds up to one: not an overflow anyone can scroll.
  assert.equal(overflows(box(101, 100, 40, 40)), false);
  assert.equal(overflows(box(102, 100, 40, 40)), true);
  assert.equal(overflows(box(100, 100, 42, 40)), true);
  assert.equal(overflows(box(90, 100, 30, 40)), false);
});

test("every scroll region asks the same hook", () => {
  for (const file of ["packages/ui/src/display.tsx", "packages/ui/src/code-panel.tsx", "packages/ui/src/snippet.tsx", "packages/ai-ui/src/code-block.tsx"]) {
    const text = read(file);
    assert.match(text, /useOverflowTabStop\(/, file);
    assert.doesNotMatch(text, /tabIndex=\{0\}/, file);
  }
});

// ------------------------------------------------------------ fonts, layers

test("the font stacks have a slot for a script Plex lacks, and are the stacks of 0.11 while it is unset", () => {
  const unset = (value: string) => value.replace(/var\(--fui-font-fallback, ([a-z-]+)\)/g, "$1").replace(/\s+/g, " ").trim();
  const declared = (name: string) => new RegExp(`--fui-font-${name}:([^;]+);`).exec(tokens)![1]!;
  assert.equal(unset(declared("sans")), '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif');
  assert.equal(unset(declared("display")), '"IBM Plex Sans Condensed", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif');
  assert.equal(unset(declared("mono")), '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace');
  // The slot comes after the Plex faces and before every generic family.
  for (const name of ["sans", "display", "mono"]) assert.match(declared(name), /"IBM Plex [A-Za-z ]+", var\(--fui-font-fallback, ui-(sans-serif|monospace)\), /, name);
  // The label voice is the mono stack, so it has the slot too and still follows a host's mono face.
  assert.match(tokens, /--fui-font-label: var\(--fui-font-mono\);/);
  // Never declared: an empty value would leave two commas in a row, which is no font-family at all.
  assert.doesNotMatch(tokens.replace(/\/\*[\s\S]*?\*\//g, ""), /--fui-font-fallback:/);
});

test("layers.css declares the order a Tailwind host needs, and is an export of the package", () => {
  const layers = read("packages/ui/src/layers.css").replace(/\/\*[\s\S]*?\*\//g, "").trim();
  assert.equal(layers, "@layer theme, base, components, utilities;");
  const manifest = JSON.parse(read("packages/ui/package.json")) as { exports: Record<string, unknown>; dependencies: Record<string, string> };
  assert.equal(manifest.exports["./layers.css"], "./dist/layers.css");
  assert.equal("class-variance-authority" in manifest.dependencies, false);
});

// --------------------------------------------------------------- safe areas

test("sheets, sticky headers and the toaster keep clear of the safe areas, and nothing moves where the inset is 0", () => {
  const sheet = rule('.fui-dialog:is([data-placement="start"], [data-placement="end"]) {');
  assert.match(sheet, /--fui-sheet-safe-block-start: max\(0px, calc\(env\(safe-area-inset-top, 0px\) - var\(--fui-sheet-inset-block-start, 0px\)\)\);/);
  assert.match(sheet, /--fui-sheet-safe-block-end: max\(0px, calc\(env\(safe-area-inset-bottom, 0px\) - var\(--fui-sheet-inset-block-end, 0px\)\)\);/);
  // One class of specificity (:where), so padding="none", a DialogBody layout and a host's class still decide the padding.
  assert.match(
    rule('.fui-dialog:where([data-placement="start"], [data-placement="end"]) {'),
    /padding-block: max\(var\(--fui-space-6\), var\(--fui-sheet-safe-block-start\)\) max\(var\(--fui-space-6\), var\(--fui-sheet-safe-block-end\)\);/,
  );
  assert.match(
    rule('.fui-dialog:where([data-placement="end"]:not([data-side="end"]), [data-side="end"]:dir(ltr), [data-side="start"]:dir(rtl)) {'),
    /padding-right: max\(var\(--fui-space-6\), env\(safe-area-inset-right, 0px\)\);/,
  );
  assert.match(
    rule('.fui-dialog:where([data-placement="start"]:not([data-side="start"]), [data-side="start"]:dir(ltr), [data-side="end"]:dir(rtl)) {'),
    /padding-left: max\(var\(--fui-space-6\), env\(safe-area-inset-left, 0px\)\);/,
  );
  assert.match(rule('.fui-dialog:is([data-placement="start"], [data-placement="end"]) > .fui-dialog-close {'), /top: max\(var\(--fui-space-3\), var\(--fui-sheet-safe-block-start\)\);/);
  assert.match(
    rule('.fui-dialog:is([data-placement="start"], [data-placement="end"]):has(> .fui-dialog-body) {'),
    /padding-block: var\(--fui-sheet-safe-block-start\) var\(--fui-sheet-safe-block-end\);/,
  );
  assert.match(rule(".fui-side-panel-sheet {"), /padding-block: var\(--fui-sheet-safe-block-start, 0px\) var\(--fui-sheet-safe-block-end, 0px\);/);
  assert.match(rule(".fui-site-header[data-sticky] {"), /padding-block-start: env\(safe-area-inset-top, 0px\);/);
  assert.match(rule(".fui-app-header[data-sticky] {"), /padding-block-start: env\(safe-area-inset-top, 0px\);/);
  assert.match(rule(".fui-workspace-header {"), /padding-block-start: max\(var\(--fui-space-2\), env\(safe-area-inset-top, 0px\)\);/);
  assert.match(rule('.fui-toaster[data-sonner-toaster][data-y-position="top"] {'), /top: max\(var\(--offset-top\), env\(safe-area-inset-top, 0px\)\);/);
  assert.match(rule('.fui-toaster[data-sonner-toaster][data-y-position="bottom"] {'), /bottom: max\(var\(--offset-bottom\), env\(safe-area-inset-bottom, 0px\)\);/);
  // Under 600 px Sonner places the stack with its mobile offsets; the override follows it.
  const narrow = styles.slice(styles.indexOf("@media (max-width: 600px) {\n  .fui-toaster"));
  assert.match(narrow.slice(0, 700), /top: max\(var\(--mobile-offset-top\), env\(safe-area-inset-top, 0px\)\);[\s\S]*bottom: max\(var\(--mobile-offset-bottom\), env\(safe-area-inset-bottom, 0px\)\);/);
});

// -------------------------------------------------------------- housekeeping

test("the rules nothing used are gone", () => {
  assert.doesNotMatch(styles, /\.fui-sparkline-area\b/);
  assert.doesNotMatch(styles, /\.fui-spin \{/);
});

test("the toaster does not type the props it drops", () => {
  const source = read("packages/ui/src/toaster.tsx");
  assert.match(source, /export type FabrialsToasterProps = Omit<ToasterProps, "richColors" \| "icons">;/);
  assert.match(source, /export function Toaster\(allProps: FabrialsToasterProps\)/);
});

test("on a phone the toolbar's search takes the row", () => {
  const at = styles.indexOf("@media (max-width: 40rem) {\n    .fui-collection-toolbar > .fui-search {");
  assert.ok(at > 0);
  assert.match(styles.slice(at, at + 200), /flex-basis: 100%;\s*max-inline-size: none;/);
});

test("a state panel holds children under its description, before the actions", () => {
  const html = renderToStaticMarkup(
    <StatePanel state="empty" title="No matches" description="Try a wider search." actions={<button type="button">Clear</button>}>
      <span>invoices</span>
    </StatePanel>,
  );
  assert.match(
    html,
    /<div class="fui-state-text"><h2>No matches<\/h2><p class="fui-description">Try a wider search\.<\/p><div class="fui-state-content"><span>invoices<\/span><\/div><\/div><div class="fui-actions">/,
  );
  assert.doesNotMatch(renderToStaticMarkup(<StatePanel state="empty" title="No matches" />), /fui-state-content/);
  assert.match(rule(".fui-state-content {"), /display: flex;\s*flex-wrap: wrap;\s*gap: var\(--fui-space-2\);\s*margin-block-start: var\(--fui-space-3\);/);
  assert.match(rule('.fui-state-panel[data-align="center"] .fui-state-content {'), /justify-content: center;/);
});
