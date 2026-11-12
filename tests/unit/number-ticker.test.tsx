import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { LabelsProvider, NumberTicker } from "../../packages/ui/src/index";
import { uiStyles } from "./read-styles";

const styles = uiStyles();
const source = readFileSync(new URL("../../packages/ui/src/number-ticker.tsx", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../../packages/ui/package.json", import.meta.url), "utf8"));

/** The rules this component reads: from its own marker to the next block of the sheet, never to the end of the file. */
const start = styles.indexOf("/* ---------------------------------------------------------------- ticker */");
assert.ok(start >= 0, "the ticker block is gone");
const end = styles.indexOf("/* ---", start + 10);
const block = styles.slice(start, end === -1 ? styles.length : end);
const media = /@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n  \}/;
const motion = block.match(media)?.[1] ?? "";
const still = block.replace(media, "");

const html = (element: React.ReactElement) => renderToStaticMarkup(element);
const GLYPHS = Array.from({ length: 10 }, (_, n) => `<span class="fui-ticker-glyph">${n}</span>`).join("");
const digit = (delay: number, transform = "none") =>
  `<span class="fui-ticker-digit" style="height:1.1em;width:1ch;--fui-ticker-delay:${delay}ms"><span class="fui-ticker-column" style="transform:${transform}">${GLYPHS}</span></span>`;
const row = (inner: string) => `<span aria-hidden="true" class="fui-ticker-row">${inner}</span>`;
const read = (element: React.ReactElement) => html(element).match(/<span class="fui-sr-only">([^<]*)</)?.[1];

test("the first paint is the number itself, each column on its digit, and the number is what is read", () => {
  // No length of its own: the roll takes the token's 240 ms, and nothing under reduced motion.
  assert.equal(
    html(<NumberTicker value={7} />),
    `<span class="fui-ticker"><span class="fui-sr-only">7</span>${row(digit(0, "translateY(-7.7em)"))}</span>`,
  );
  // A figure that is there at first render shows at once: the columns are on 1, 2, 4, 8 and 0, with no delay to count up by.
  const shown = html(<NumberTicker value={12480} locale="en" />);
  assert.deepEqual(shown.match(/transform:[^"]+/g), ["transform:translateY(-1.1em)", "transform:translateY(-2.2em)", "transform:translateY(-4.4em)", "transform:translateY(-8.8em)", "transform:none"]);
  assert.deepEqual([...new Set(shown.match(/--fui-ticker-delay:\d+ms/g))], ["--fui-ticker-delay:0ms"]);
  // The words around it are read, and the columns are not.
  assert.equal(read(<NumberTicker prefix="$" value={42} suffix=" kg" />), "$42 kg");
  assert.match(html(<NumberTicker prefix="$" value={42} suffix=" kg" />), /<span>\$<\/span>/);
});

test("asked to count up, the first paint is a row of zeros, each column a little after the one before", () => {
  // Every column is a stack of 0-9 at rest: the paint never guesses a position the browser would then jump from.
  assert.equal(
    html(<NumberTicker rollIn value={73} />),
    `<span class="fui-ticker"><span class="fui-sr-only">73</span>${row(digit(0) + digit(20))}</span>`,
  );
  assert.doesNotMatch(html(<NumberTicker rollIn startOnView={false} value={12480} locale="en" />), /translateY/);
  assert.equal(read(<NumberTicker rollIn value={73} />), "73", "what is read is the number, never the zeros");
});

test("the length, the stagger and the width ride on custom properties, and groups stay plain characters", () => {
  const one = html(<NumberTicker duration={1.4} locale="en" rollIn stagger={0.1} startOnView={false} value={48_210} />);
  assert.match(one, /^<span class="fui-ticker" style="--fui-ticker-duration:1400ms">/);
  assert.match(one, /--fui-ticker-delay:0ms/);
  assert.match(one, /--fui-ticker-delay:100ms/);
  assert.match(one, /--fui-ticker-delay:400ms/);
  assert.match(one, /<span class="fui-ticker-char">,<\/span>/);
  assert.equal(one.match(/fui-ticker-digit/g)?.length, 5, "five digits, and the comma is not one of them");
  assert.equal(read(<NumberTicker locale="en" value={48_210} />), "48,210");
  assert.equal(read(<NumberTicker locale="de" value={48_210} />), "48.210");
  assert.equal(read(<NumberTicker pad={4} value={42} />), "0042");
  assert.equal(read(<NumberTicker format={(value) => value.toFixed(2)} value={12.5} />), "12.50");
  assert.equal(read(<NumberTicker startOnView={false} value={-3} />), "-3");
});

test("a locale with its own digits writes them, and they are not the columns that turn", () => {
  const arabic = html(<NumberTicker locale="ar-EG" value={12480} />);
  assert.equal(read(<NumberTicker locale="ar-EG" value={12480} />), "١٢٬٤٨٠");
  assert.doesNotMatch(arabic, /fui-ticker-digit/);
  for (const char of "١٢٬٤٨٠") assert.ok(arabic.includes(`<span class="fui-ticker-char">${char}</span>`), `${char} is a plain character`);
  // The provider's locale still wins over nothing, and `false` keeps them plain inside one.
  assert.equal(read(<LabelsProvider locale="de"><NumberTicker value={12480} /></LabelsProvider>), "12.480");
  assert.equal(read(<LabelsProvider locale="de"><NumberTicker locale={false} value={12480} /></LabelsProvider>), "12480");
});

test("it takes the props of the span it is, and its class names merge", () => {
  const merged = html(
    <NumberTicker className="big" data-slot="total" digitClassName="x" id="total" style={{ color: "red" }} value={5} />,
  );
  assert.match(merged, /^<span class="fui-ticker big" style="color:red" data-slot="total" id="total">/);
  assert.match(merged, /<span class="fui-ticker-digit x" style="height:1.1em;width:1ch;--fui-ticker-delay:0ms">/);
  assert.match(html(<NumberTicker duration={0.5} style={{ color: "red" }} value={5} />), /style="--fui-ticker-duration:500ms;color:red"/);
});

test("the roll is one transition of the column, written only for people who allow motion, with the house ease and the tokens", () => {
  assert.match(block, /\.fui-ticker \{[^}]*font-variant-numeric: tabular-nums;/);
  assert.match(block, /\.fui-ticker-digit \{[^}]*overflow: hidden;[^}]*height: 1\.1em;[^}]*width: 1ch;/);
  assert.match(block, /\.fui-ticker-glyph \{[^}]*height: 1\.1em;/);
  assert.match(block, /\.fui-ticker-column \{[^}]*position: absolute;[^}]*inset-inline: 0;/);
  assert.match(
    motion,
    /\.fui-ticker-column \{\s*transition: transform var\(--fui-ticker-duration, var\(--fui-duration-slow\)\) var\(--fui-ease-out\) var\(--fui-ticker-delay, 0ms\);/,
  );
  // Nothing moves for anyone else, and nothing here loops: a finished roll leaves no animation behind.
  assert.doesNotMatch(still, /transition:|animation:/);
  assert.doesNotMatch(block, /animation:/);
});

test("no animation library reaches it: the package declares none and the module imports only React and its neighbours", () => {
  for (const name of ["motion", "framer-motion", "react-spring", "@react-spring/web", "gsap"]) assert.equal(manifest.dependencies[name], undefined, `${name} is back`);
  const specifiers = [...source.matchAll(/from "([^"]+)"/g)].map((match) => match[1]!);
  assert.ok(specifiers.length > 0);
  for (const specifier of specifiers) assert.ok(specifier === "react" || specifier.startsWith("./"), `unexpected import ${specifier}`);
  assert.match(source, /"use client"/);
});
