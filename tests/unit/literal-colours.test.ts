import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Components paint with tokens so a theme, a gem or a host's retint reaches every pixel. tokens.css is out of scope on purpose:
// the oklch literals there ARE the palette. A data-URI icon is a literal too (a `url()` cannot read a custom property), which is
// how NativeSelect got a fixed warm grey chevron that ignored dark mode.

const FUNCTION = "(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\\([^)]*\\)";
const LITERAL = new RegExp(`#[0-9a-fA-F]{3,8}\\b|%23[0-9a-fA-F]{3,8}\\b|\\b${FUNCTION}|data:image`, "g");

type Hit = { literal: string; property: string; selector: string };

function stripCssComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

/** The literal colours of a stylesheet, each with the property it sits in and the selector of its rule. */
function cssLiterals(source: string): Hit[] {
  const css = stripCssComments(source);
  const hits: Hit[] = [];
  for (const match of css.matchAll(LITERAL)) {
    const index = match.index!;
    const declarationStart = Math.max(css.lastIndexOf(";", index), css.lastIndexOf("{", index), css.lastIndexOf("}", index)) + 1;
    const property = css.slice(declarationStart, index).split(":")[0]!.trim();
    let depth = 0;
    let open = -1;
    for (let at = index; at >= 0; at -= 1) {
      const char = css[at];
      if (char === "}") depth += 1;
      else if (char === "{") {
        if (depth === 0) {
          open = at;
          break;
        }
        depth -= 1;
      }
    }
    const before = Math.max(css.lastIndexOf("}", open), css.lastIndexOf("{", open - 1), css.lastIndexOf(";", open)) + 1;
    hits.push({ literal: match[0], property, selector: css.slice(before, open).replace(/\s+/g, " ").trim() });
  }
  return hits;
}

/** Component source: the literals outside comments. */
function sourceLiterals(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  return [...code.matchAll(LITERAL)].map((match) => match[0]);
}

test("the detector finds each way of writing a colour and ignores comments", () => {
  const found = (css: string) => cssLiterals(css).map((hit) => hit.literal);
  assert.deepEqual(found(".a { color: #fff; }"), ["#fff"]);
  assert.deepEqual(found(".a { color: #A1B2C3D4; }"), ["#A1B2C3D4"]);
  assert.deepEqual(found(".a { color: rgb(0 0 0); }"), ["rgb(0 0 0)"]);
  assert.deepEqual(found(".a { color: rgba(0, 0, 0, .5); }"), ["rgba(0, 0, 0, .5)"]);
  assert.deepEqual(found(".a { color: hsl(10 20% 30%); }"), ["hsl(10 20% 30%)"]);
  assert.deepEqual(found(".a { color: oklch(0.5 0.1 200); }"), ["oklch(0.5 0.1 200)"]);
  assert.deepEqual(found(".a { stroke: %238e8c88; }"), ["%238e8c88"]);
  assert.deepEqual(found(`.a { background-image: url("data:image/svg+xml,%3Csvg/%3E"); }`), ["data:image"]);
  assert.deepEqual(found(".a { color: var(--foreground); border-color: color-mix(in oklab, var(--border) 50%, transparent); }"), []);
  assert.deepEqual(found("/* #fff rgb(0 0 0) */ .a { color: var(--foreground); }"), []);
  assert.deepEqual(found(".a:hover { color: var(--foreground); } #main { color: red; }"), []);
  const [hit] = cssLiterals("@layer components { @media (x) { .b, .c > .d { --fui-button-shadow: 0 1px oklch(0 0 0 / 8%); } } }");
  assert.deepEqual(hit, { literal: "oklch(0 0 0 / 8%)", property: "--fui-button-shadow", selector: ".b, .c > .d" });
  assert.deepEqual(sourceLiterals('const a = "#fff"; // #000\n/* rgb(1 2 3) */ const b = "var(--x)"; const url = "http://x.test/#nope";'), ["#fff"]);
});

// Allowed in a stylesheet: the moon, which is drawn in fixed night colours whatever the theme, and the alpha of a shadow or a
// highlight, which is always pure black or white (a shadow darkens, a highlight lights; neither is a palette colour).
function allowed(hit: Hit) {
  if (/^\.fui-moon-phase-(shadow|ring)$/.test(hit.selector)) return true;
  if (/shadow/.test(hit.property) && /^oklch\((?:0|1) 0 0 \/ \d+%\)$/.test(hit.literal)) return true;
  // @fabrials/ai-ui defines the muted syntax inks in its own sheet; they are tokens, not component paint.
  if (/^--fui-syntax-/.test(hit.property)) return true;
  return false;
}

const packages = new URL("../../packages/", import.meta.url);

for (const sheet of ["ui/src/styles.css", "ai-ui/src/styles.css"]) {
  test(`${sheet} paints with tokens: the only literal colours are the moon, shadow alphas and the syntax inks`, () => {
    const hits = cssLiterals(readFileSync(new URL(sheet, packages), "utf8")).filter((hit) => !allowed(hit));
    assert.deepEqual(
      hits.map((hit) => `${hit.selector} { ${hit.property}: … ${hit.literal} }`),
      [],
    );
  });
}

// SVG art and canvas painting cannot read a custom property, so these files keep literal colours by nature.
const artFiles = new Set(["moon-phase.tsx", "dither-canvas.tsx"]);

for (const name of ["ui", "ai-ui"]) {
  test(`@fabrials/${name} components carry no literal colour`, () => {
    const directory = new URL(`${name}/src/`, packages);
    const offenders: string[] = [];
    for (const file of readdirSync(directory)) {
      if (!file.endsWith(".tsx") || artFiles.has(file)) continue;
      const literals = sourceLiterals(readFileSync(new URL(file, directory), "utf8"));
      if (literals.length) offenders.push(`${file}: ${literals.join(", ")}`);
    }
    assert.deepEqual(offenders, []);
  });
}
