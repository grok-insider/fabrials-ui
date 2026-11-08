import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const rule = (selector: string, from = 0) => {
  const at = styles.indexOf(selector, from);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};
const attribute = (html: string, name: string) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];

test("a bare bar: one progressbar named by aria-label, 0 to 100 by default, a track and its fill", () => {
  const html = renderToStaticMarkup(<Progress aria-label="Quota used" value={42} />);
  assert.match(html, /^<div [^>]*role="progressbar"/);
  assert.equal(attribute(html, "class"), "fui-progress");
  assert.equal(attribute(html, "data-slot"), "progress");
  assert.equal(attribute(html, "data-tone"), "neutral");
  assert.equal(attribute(html, "aria-label"), "Quota used");
  assert.equal(attribute(html, "aria-valuemax"), "100");
  assert.equal(attribute(html, "aria-valuenow"), "42");
  assert.equal(attribute(html, "aria-valuetext"), "42%");
  assert.match(html, /<div data-progressing="" data-slot="progress-track" class="fui-progress-track"><div [^>]*width:42%[^>]*data-slot="progress-indicator" class="fui-progress-indicator"/);
  assert.doesNotMatch(html, /fui-progress-label|fui-progress-value|fui-progress-hint|data-size|data-variant/);
  // A fraction keeps working with its own max.
  assert.equal(attribute(renderToStaticMarkup(<Progress aria-label="Sync" max={1} value={0.4} />), "aria-valuetext"), "40%");
});

test("without a value it is indeterminate: no value for assistive technology and no width on the fill", () => {
  for (const html of [renderToStaticMarkup(<Progress aria-label="Counting" />), renderToStaticMarkup(<Progress aria-label="Counting" value={null} />)]) {
    assert.match(html, /data-indeterminate=""/);
    assert.equal(attribute(html, "aria-valuenow"), undefined);
    assert.equal(attribute(html, "aria-valuetext"), "indeterminate progress");
    assert.match(html, /<div data-indeterminate="" data-slot="progress-indicator" class="fui-progress-indicator"><\/div>/);
  }
});

test("label, value and hint: the label names it, the value is hidden from assistive technology, the hint describes it", () => {
  const html = renderToStaticMarkup(<Progress hint="1,204 of 1,940 messages" label="Indexing headers" value={62} aria-describedby="note" />);
  assert.match(html, /<span [^>]*role="presentation"[^>]*class="fui-progress-label">Indexing headers<\/span>/);
  const value = html.match(/<span ([^>]*class="fui-progress-value")>62%<\/span>/);
  assert.ok(value, "the value is a span with the formatted value");
  assert.match(value[1], /aria-hidden="true"/);
  const hint = html.match(/<p class="fui-progress-hint" id="([^"]+)">1,204 of 1,940 messages<\/p>/);
  assert.ok(hint, "the hint is a paragraph with an id");
  assert.equal(attribute(html, "aria-describedby"), `note ${hint[1]}`);
  // The parts come in reading order: label, value, track, hint.
  assert.ok(html.indexOf("fui-progress-label") < html.indexOf("fui-progress-value"));
  assert.ok(html.indexOf("fui-progress-value") < html.indexOf("fui-progress-track"));
  assert.ok(html.indexOf("fui-progress-track") < html.indexOf("fui-progress-hint"));
});

test("the value shows with a label and inside a large ring, and showValue says otherwise", () => {
  const shows = (element: React.ReactElement) => /fui-progress-value/.test(renderToStaticMarkup(element));
  assert.equal(shows(<Progress aria-label="x" value={10} />), false);
  assert.equal(shows(<Progress label="x" value={10} />), true);
  assert.equal(shows(<Progress label="x" showValue={false} value={10} />), false);
  assert.equal(shows(<Progress aria-label="x" showValue value={10} />), true);
  assert.equal(shows(<Progress aria-label="x" size="lg" value={10} variant="ring" />), true);
  assert.equal(shows(<Progress aria-label="x" value={10} variant="ring" />), false);
});

test("the value is written in English unless the page says otherwise, so the server and the browser agree", () => {
  assert.match(renderToStaticMarkup(<Progress label="x" value={62} />), />62%</);
  assert.match(renderToStaticMarkup(<Progress label="x" locale="fr" value={62} />), />62\u00a0%</);
  assert.match(renderToStaticMarkup(<Progress format={{ style: "unit", unit: "megabyte" }} label="x" max={600} value={240} />), />240 MB</);
});

test("size, tone and variant are attributes on the root; the default size writes none", () => {
  const html = renderToStaticMarkup(<Progress aria-label="x" size="lg" tone="danger" value={48} />);
  assert.equal(attribute(html, "data-size"), "lg");
  assert.equal(attribute(html, "data-tone"), "danger");
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" size="default" value={1} />), /data-size/);
  assert.equal(attribute(renderToStaticMarkup(<Progress aria-label="x" value={1} variant="ring" />), "data-variant"), "ring");
});

test("steps cut the track into segments, each filled by its share of the value", () => {
  const html = renderToStaticMarkup(<Progress aria-label="Steps" max={4} steps={4} value={2.5} />);
  assert.match(html, /class="fui-progress-track" data-steps="4"|data-steps="4"[^>]*class="fui-progress-track"/);
  const fills = [...html.matchAll(/class="fui-progress-segment"[^>]*style="--i:(\d+);--fill:([\d.]+)"/g)].map((match) => [Number(match[1]), Number(match[2])]);
  assert.deepEqual(fills, [
    [0, 1],
    [1, 1],
    [2, 0.5],
    [3, 0],
  ]);
  assert.equal((html.match(/data-filled="true"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /fui-progress-indicator/);
  // No segments without a value, on a ring, under two steps; never more than 48.
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" steps={4} />), /fui-progress-segment/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" steps={4} value={2} variant="ring" />), /fui-progress-segment/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" steps={1} value={2} />), /fui-progress-segment/);
  assert.equal((renderToStaticMarkup(<Progress aria-label="x" steps={500} value={2} />).match(/fui-progress-segment/g) ?? []).length, 48);
});

test("a ring closes clockwise by its dash offset; it draws no fill at 0 and its light without a value", () => {
  const html = renderToStaticMarkup(<Progress aria-label="Upload" value={40} variant="ring" />);
  assert.match(html, /class="fui-progress-track fui-progress-ring" style="--fui-progress-ring-size:24px;--fui-progress-ring-stroke:2.5px"/);
  assert.match(html, /<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">/);
  assert.match(html, /<circle class="fui-progress-ring-track" cx="12" cy="12" pathLength="100" r="10.75" stroke-width="2.5"><\/circle>/);
  assert.match(html, /<circle class="fui-progress-ring-fill"[^>]*style="stroke-dashoffset:60"/);
  assert.doesNotMatch(html, /fui-progress-ring-light/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" value={0} variant="ring" />), /fui-progress-ring-fill/);
  const unknown = renderToStaticMarkup(<Progress aria-label="x" size="lg" variant="ring" />);
  assert.match(unknown, /viewBox="0 0 48 48"/);
  assert.match(unknown, /<span aria-hidden="true" class="fui-progress-ring-light"><\/span>/);
  assert.match(renderToStaticMarkup(<Progress aria-label="x" size="sm" value={1} variant="ring" />), /viewBox="0 0 16 16"/);
});

test("shadcn's parts: the label and value go before the track Progress draws, and a function child writes the value", () => {
  const html = renderToStaticMarkup(
    <Progress getAriaValueText={(_, value) => `${value} of 3,000 messages`} max={3000} value={1204}>
      <ProgressLabel>Importing</ProgressLabel>
      <ProgressValue>{(_, value) => `${value?.toLocaleString("en")} of 3,000`}</ProgressValue>
    </Progress>,
  );
  assert.equal(attribute(html, "aria-valuetext"), "1204 of 3,000 messages");
  assert.match(html, /class="fui-progress-label">Importing<\/span><span [^>]*class="fui-progress-value">1,204 of 3,000<\/span><div [^>]*class="fui-progress-track"/);
  // The track and indicator are exported under shadcn's names with the same classes.
  assert.equal(typeof ProgressTrack, "function");
  assert.equal(typeof ProgressIndicator, "function");
});

test("progress styles: tones, sizes, segments and a ring from tokens; the light only moves without reduced motion", () => {
  assert.match(rule(".fui-progress {"), /--fui-progress-fill: var\(--chart-1\);[^}]*--fui-progress-thickness: 0\.375rem;/);
  assert.match(rule('.fui-progress[data-size="sm"] {'), /--fui-progress-thickness: 0\.25rem;/);
  assert.match(rule('.fui-progress[data-size="lg"] {'), /--fui-progress-thickness: 0\.5rem;/);
  assert.match(rule(".fui-progress-track {"), /height: var\(--fui-progress-thickness\);[^}]*border-radius: var\(--fui-radius-full\);[^}]*background: var\(--muted\);/);
  assert.match(rule(".fui-progress-indicator {"), /transition: width var\(--fui-duration-slow\) var\(--fui-ease\);/);
  // Held still (the base rule) it is a dashed line in the light; the sweep lives only in a no-preference block.
  assert.match(rule(".fui-progress-indicator[data-indeterminate] {"), /repeating-linear-gradient\(/);
  const sweep = styles.indexOf("animation: fui-progress-sweep ");
  assert.ok(sweep > 0);
  assert.ok(styles.lastIndexOf("@media (prefers-reduced-motion: no-preference) {", sweep) > styles.lastIndexOf("}\n}", sweep), "the sweep sits in a no-preference block");
  assert.match(rule(".fui-progress-segment::before {"), /width: calc\(var\(--fill, 0\) \* 100%\);[^}]*transition: width var\(--fui-duration-slow\) var\(--fui-ease\) calc\(var\(--i, 0\) \* 40ms\);/);
  assert.match(rule(".fui-progress-ring-fill {"), /stroke-dasharray: 100;[^}]*transition: stroke-dashoffset/);
  // An outcome tone paints work of unknown length in its own colour.
  assert.match(rule('.fui-progress:is([data-tone="success"], [data-tone="warning"], [data-tone="danger"]) {'), /--fui-progress-light-1: var\(--fui-progress-fill\);/);
});

test("in a skeleton the track is one neutral shape and the segments' fills are not drawn", () => {
  const list = styles.slice(styles.indexOf("Controls that carry their own fill become one solid"), styles.indexOf("A native checkbox or radio has no CSS box"));
  assert.equal((list.match(/\.fui-progress-track,/g) ?? []).length, 2);
  assert.match(styles, /\[data-fui-loading\] > \.fui-loading-content \.fui-progress-segment::before \{\s*background: transparent !important;/);
});

test("forced colors: the light holds still as a dashed line in Highlight, and the ring keeps its two strokes", () => {
  const after = styles.indexOf("0.11: Progress in motion");
  const block = styles.slice(styles.indexOf("@media (forced-colors: active) {", after));
  assert.match(block, /\.fui-progress-indicator\[data-indeterminate\] \{[^}]*forced-color-adjust: none;[^}]*repeating-linear-gradient\(90deg, Highlight[^}]*animation: none;/);
  assert.match(block, /\.fui-progress-ring-light \{\s*display: none;/);
});
