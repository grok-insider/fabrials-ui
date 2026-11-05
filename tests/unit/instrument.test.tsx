import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, CardCaption, CornerMarks, GridGuides, Meter, Stat } from "../../packages/ui/src";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../packages/ui/src/tokens.css", import.meta.url), "utf8");

test("corner marks wrap their child and add four decorative crosses that never take focus", () => {
  const html = renderToStaticMarkup(
    <CornerMarks>
      <Card>Plate</Card>
    </CornerMarks>,
  );
  assert.match(html, /^<div data-slot="corner-marks" class="fui-corner-marks"><section/);
  const marks = html.match(/<span aria-hidden="true" class="fui-corner-mark" data-corner="[a-z-]+"><\/span>/g) ?? [];
  assert.equal(marks.length, 4);
  for (const corner of ["top-start", "top-end", "bottom-start", "bottom-end"]) assert.ok(html.includes(`data-corner="${corner}"`));
  assert.doesNotMatch(html, /tabindex/);
});

test("grid guides are hidden from assistive technology and draw one column per guide", () => {
  const html = renderToStaticMarkup(<GridGuides columns={6} />);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /--fui-guide-columns:6/);
  assert.equal((html.match(/<span><\/span>/g) ?? []).length, 6);
});

test("a ruler meter keeps the meter role and inks its ticks up to the value", () => {
  const html = renderToStaticMarkup(<Meter variant="ruler" label="Quota" value={25} ticks={20} />);
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuenow="25"/);
  assert.match(html, /data-variant="ruler"/);
  assert.equal((html.match(/fui-meter-tick-on/g) ?? []).length, 6);
  assert.equal((html.match(/class="fui-meter-tick"/g) ?? []).length, 15);
  assert.equal((html.match(/fui-meter-mark/g) ?? []).length, 1);
  assert.doesNotMatch(html, /fui-meter-indicator/);
  const empty = renderToStaticMarkup(<Meter variant="ruler" label="Quota" value={0} ticks={20} />);
  assert.equal((empty.match(/fui-meter-tick-on/g) ?? []).length, 0);
});

test("a stat can carry a ruler with its own accessible name, and drops it while loading", () => {
  const html = renderToStaticMarkup(<Stat label="Unread" value="6,102" meter={{ value: 21, label: "21% unread" }} />);
  assert.match(html, /aria-label="21% unread"/);
  assert.match(html, /fui-stat-meter/);
  const loading = renderToStaticMarkup(<Stat label="Unread" value="6,102" loading meter={{ value: 21, label: "21% unread" }} />);
  assert.doesNotMatch(loading, /fui-stat-meter/);
});

test("the card caption is a slot in the label voice", () => {
  const html = renderToStaticMarkup(<CardCaption>Fig. 1</CardCaption>);
  assert.equal(html, '<div data-slot="card-caption" class="fui-card-caption">Fig. 1</div>');
  assert.match(styles, /\.fui-card-caption \{[^}]*font-family: var\(--fui-font-label\)/);
});

test("plates are square and flat: cards, stats and tables use the plate radius and no resting shadow", () => {
  for (const selector of [".fui-card", ".fui-stat", ".fui-stat-group", ".fui-table-scroll"]) {
    const block = styles.match(new RegExp(`\\n  ${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1] ?? "";
    assert.match(block, /border-radius: var\(--fui-radius-plate\)/, selector);
    assert.doesNotMatch(block, /box-shadow/, selector);
  }
  assert.match(tokens, /--fui-radius-plate: 0;/);
  assert.match(tokens, /--fui-font-label: var\(--fui-font-mono\);/);
});

test("labels, table heads and axis text use the label voice", () => {
  for (const selector of [".fui-stat-label", ".fui-description-term", ".fui-eyebrow"]) {
    const block = styles.match(new RegExp(`\\n  ${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1] ?? "";
    assert.match(block, /font-family: var\(--fui-font-label\)/, selector);
  }
  const chart = readFileSync(new URL("../../packages/ui/src/chart.tsx", import.meta.url), "utf8");
  assert.equal((chart.match(/fontFamily: "var\(--fui-font-label\)"/g) ?? []).length, 2);
});

test("corner marks and the ruler keep a form in forced colors, and the guides step aside", () => {
  const forced = styles.slice(styles.indexOf("/* 0.10: Instrument"));
  assert.match(forced, /@media \(forced-colors: active\)[\s\S]*\.fui-corner-mark::before,[\s\S]*background: CanvasText/);
  assert.match(forced, /\.fui-meter-tick-on \{\s*fill: CanvasText;/);
  assert.match(forced, /\.fui-grid-guides \{\s*display: none;/);
});

test("chart series default to dither: Stormlight first, then ink, and solid hues on request", async () => {
  const { SeriesChart } = await import("../../packages/ui/src");
  const data = [{ day: "Mon", a: 1, b: 2, c: 3 }];
  const series = [{ key: "a" }, { key: "b" }, { key: "c", color: "var(--chart-4)" }];
  const html = renderToStaticMarkup(<SeriesChart data={data} xKey="day" series={series} caption="Test" />);
  assert.match(html, /<svg aria-hidden="true" focusable="false" class="fui-chart-swatch"[^>]*><rect width="10" height="10" fill="url\(#fui-dither-[\w-]+-a\)"/);
  assert.match(html, /fill="url\(#fui-dither-[\w-]+-b\)"/);
  assert.match(html, /<span aria-hidden="true" class="fui-chart-swatch" style="background:var\(--chart-4\)"/);
  const solid = renderToStaticMarkup(<SeriesChart data={data} xKey="day" series={series} caption="Test" texture="solid" />);
  assert.doesNotMatch(solid, /fui-dither-/);
  assert.match(solid, /background:var\(--chart-1\)/);
});
