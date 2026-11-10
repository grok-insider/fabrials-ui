import { test } from "node:test";
import assert from "node:assert/strict";
import { minifyStyles } from "../../scripts/build.mjs";

// What ships is the sheet minified, and a product's screens must not notice: no target is set, so nothing is lowered,
// prefixed or reordered. These are the constructs the library depends on, each written the way a browser needs it.
const sheet = `@layer components {
  @property --fui-probe {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 0%;
  }
  .fui-probe {
    --fui-probe-ink: oklch(0.62 0.14 255);
    inset-inline-start: 1px;
    color: color-mix(in oklab, var(--fui-probe-ink) 40%, transparent);
    animation: fui-probe 1s steps(4);
  }
  .fui-probe:has(> .fui-probe-part) {
    padding-inline-end: 2px;
  }
  @container (min-width: 20rem) {
    .fui-probe {
      margin-inline-start: 1rem;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    .fui-probe:hover {
      transform: scale(1.01);
    }
  }
  @keyframes fui-probe {
    50% {
      padding-inline-start: 1px;
    }
  }
}
`;

const minified = minifyStyles(sheet, "probe.css");

test("the minified sheet keeps the constructs the library is written with", () => {
  for (const construct of [
    "@layer components",
    "@property --fui-probe",
    'syntax:"<percentage>"',
    "oklch(",
    "color-mix(",
    ":has(",
    "inset-inline-start:",
    "padding-inline-end:",
    "margin-inline-start:",
    // A width query written as a range: the form every browser of the documented baseline reads.
    "@container (width>=20rem)",
    "@media (prefers-reduced-motion:no-preference)",
    "@keyframes fui-probe",
    "--fui-probe-ink:",
  ])
    assert.ok(minified.includes(construct), `the minified sheet lost ${construct}`);
});

test("the minified sheet lowers nothing and prefixes nothing", () => {
  assert.doesNotMatch(minified, /-webkit-|-moz-/);
  assert.doesNotMatch(minified, /\brgba?\(/, "oklch was lowered to rgb");
  assert.doesNotMatch(minified, /\bmargin-left|\bpadding-left|\bleft:/, "a logical property became physical");
  assert.doesNotMatch(minified, /@supports/, "a fallback block was invented");
});

test("the minified sheet keeps the order of two rules that share a selector", () => {
  // A later rule that sets another property does not replace the earlier one: both survive, in place.
  const text = minifyStyles(
    ".fui-once{color:red}.fui-other{color:blue}.fui-once{background:gold}",
    "probe.css",
  );
  assert.equal(text, ".fui-once{color:red}.fui-other{color:#00f}.fui-once{background:gold}");
});

test("a licence notice written /*! keeps its place and ordinary comments go", () => {
  const text = minifyStyles("/* written for a reader */\n/*! Recipes adapted from Radix Themes (MIT) */\n.fui-x{color:red}", "probe.css");
  assert.ok(text.startsWith("/*! Recipes adapted from Radix Themes (MIT) */"));
  assert.doesNotMatch(text, /written for a reader/);
});

test("sizes: the minified sheet is smaller and still closes every block", () => {
  assert.ok(minified.length < sheet.length);
  let depth = 0;
  for (const character of minified.replace(/\/\*[\s\S]*?\*\//g, "")) {
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    assert.ok(depth >= 0);
  }
  assert.equal(depth, 0);
});
