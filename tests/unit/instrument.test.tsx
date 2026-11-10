import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, CardCaption, CornerMarks, GridGuides, Meter, Stat } from "../../packages/ui/src";
import { uiStyles } from "./read-styles";

const styles = uiStyles();
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

test("plates have 12 px corners and rest on the plate elevation, which only the material block paints", () => {
  for (const selector of [".fui-card", ".fui-stat", ".fui-stat-group", ".fui-table-scroll"]) {
    const block = styles.match(new RegExp(`\\n  ${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1] ?? "";
    assert.match(block, /border-radius: var\(--fui-radius-plate\)/, selector);
    assert.doesNotMatch(block, /box-shadow/, selector);
  }
  const material = styles.slice(styles.indexOf("/* 0.10 material."));
  assert.match(material, /\.fui-card,\n  \.fui-stat,\n  \.fui-stat-group,\n  \.fui-table-scroll,\n  \.fui-code-panel \{\n    box-shadow: var\(--fui-shadow-xs\), var\(--fui-highlight\);/);
  assert.match(tokens, /--fui-radius-plate: 0\.75rem;/);
  assert.match(tokens, /--fui-font-label: var\(--fui-font-mono\);/);
});

test("a stat group is one plate: the figures are divided by soft lines short of its edges, never by boxes", () => {
  const inner = styles.match(/\n  \.fui-stat-group > \.fui-stat \{([^}]*)\}/)?.[1] ?? "";
  assert.match(inner, /border: 0;/);
  assert.match(inner, /background: transparent;/);
  assert.match(styles, /\.fui-stat-group > \.fui-stat::before \{\s*inset-block: var\(--fui-space-4\);\s*inset-inline-start: -1px;\s*width: 1px;/);
  assert.match(styles, /\.fui-stat-group > \.fui-stat::before,\n  \.fui-stat-group > \.fui-stat::after \{[^}]*background: var\(--fui-separator\);/);
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

test("data-theme=system carries exactly the dark tokens under prefers-color-scheme: dark (L6)", () => {
  const block = (from: number) => {
    const open = tokens.indexOf("{", from);
    let depth = 0;
    for (let i = open; i < tokens.length; i++) {
      if (tokens[i] === "{") depth++;
      else if (tokens[i] === "}" && --depth === 0) return tokens.slice(open + 1, i);
    }
    return "";
  };
  const decls = (body: string) => body.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("--") || line.startsWith("color-scheme"));
  const dark = decls(block(tokens.indexOf('.dark,\n[data-theme="dark"]')));
  const system = decls(block(tokens.indexOf('  [data-theme="system"] {')));
  assert.ok(dark.length > 60);
  assert.deepEqual(system, dark);
});

test("material: gradients exist only as the sheen tokens, and every theme defines the recipes", () => {
  const material = styles.slice(styles.indexOf("/* 0.10 material."), styles.indexOf('/* 0.11 "Instrument with life"'));
  assert.doesNotMatch(material.replace(/var\(--fui-sheen(-soft)?\)/g, ""), /gradient\(/);
  for (const token of ["--fui-shadow-well", "--fui-bevel", "--fui-sheen", "--fui-sheen-soft", "--fui-pressed"]) {
    assert.ok((tokens.match(new RegExp(`${token}:`, "g")) ?? []).length >= 3, token);
  }
  assert.match(tokens, /--fui-focus-halo:/);
});

test("the working light is the only light: painted from the three light tokens, in its own rules, still under reduced motion", () => {
  const life = styles.slice(styles.indexOf('/* 0.11 "Instrument with life"'));
  // Every gradient of the block is either a mask (an opaque fill whose colour does not matter) or lives in a light rule: the
  // working light, light in words, and the light Progress carries while its total is not known. One repeating pattern is not a
  // gradient of light at all: the dashes of a quiz segment that was answered wrong or skipped (0.12), one solid ink with gaps,
  // so a wrong answer reads without colour.
  const dash = /^\.fui-progress-part\[data-state="(incorrect|skipped)"\]::before$/;
  const css = life.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*gradient\([^{}]*)\}/g)) {
    const selector = match[1]!.trim();
    const body = match[2]!.replace(/linear-gradient\(var\(--foreground\) 0 0\)/g, "").replace(/\bmask:[^;]*;/g, "");
    if (!/gradient\(/.test(body)) continue;
    if (dash.test(selector)) {
      for (const colour of body.match(/var\(--[a-z0-9-]+\)/g) ?? []) assert.match(colour, /--destructive|--muted-foreground/, `${selector}: ${colour}`);
      continue;
    }
    assert.match(
      selector,
      /\.fui-working-light(-bloom)?::before|\.fui-shimmer-text\[data-tone="light"\]|^\.fui-progress-indicator\[data-indeterminate\](:dir\(rtl\))?$|^\.fui-progress-ring-light$/,
      selector,
    );
    for (const colour of body.match(/var\(--[a-z0-9-]+\)/g) ?? []) {
      assert.match(colour, /--fui-light-[123]|--fui-progress-light-[123]|--fui-light-angle|--fui-shimmer-spread|--muted-foreground/, `${selector}: ${colour}`);
    }
  }
  // Progress's light is the working light unless a tone that says an outcome paints it in its own colour.
  const progress = styles.slice(styles.indexOf("  .fui-progress {"), styles.indexOf("}", styles.indexOf("  .fui-progress {")));
  for (const n of [1, 2, 3]) assert.match(progress, new RegExp(`--fui-progress-light-${n}: var\\(--fui-light-${n}\\);`));
  assert.equal((styles.match(/--fui-progress-light-1: /g) ?? []).length, 2);
  assert.match(life, /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\.fui-working-light::before,\n    \.fui-working-light-bloom::before \{\n      animation: fui-light-turn/);
  assert.match(life, /@media \(forced-colors: active\) \{\s*\.fui-working-light \{\s*display: none;/);
  for (const scope of [":root", ".dark", '[data-theme="system"]']) assert.ok(tokens.includes(scope));
  assert.match(tokens, /--fui-light-1: var\(--gem-stormlight\);/);
});

test("an off switch keeps a light thumb on its dark track in the dark themes, and stays white on light", () => {
  assert.match(styles, /\n  \.fui-switch-thumb \{[^}]*background: var\(--fui-switch-thumb\);/);
  const values = [...tokens.matchAll(/--fui-switch-thumb: ([^;]+);/g)].map((match) => match[1]);
  // Light, dark and the dark half of data-theme="system", in that order.
  assert.deepEqual(values, [
    "var(--card)",
    "color-mix(in oklab, var(--foreground) 66%, var(--muted))",
    "color-mix(in oklab, var(--foreground) 66%, var(--muted))",
  ]);
});
