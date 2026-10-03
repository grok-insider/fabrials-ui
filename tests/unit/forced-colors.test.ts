import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

// The forced-colors pass of 0.9 is one block with four groups. These tests read that block; tests/visual/forced-colors.spec.ts
// renders it in Chromium.
function forcedBlock() {
  const marker = styles.indexOf("forced colors (0.9)");
  assert.ok(marker >= 0, "the forced-colors block carries its marker comment");
  assert.equal(styles.indexOf("forced colors (0.9)", marker + 1), -1, "there is one such block");
  const open = styles.indexOf("@media (forced-colors: active) {", marker);
  let depth = 0;
  for (let at = styles.indexOf("{", open); at < styles.length; at += 1) {
    if (styles[at] === "{") depth += 1;
    if (styles[at] === "}" && --depth === 0) return styles.slice(styles.indexOf("{", open) + 1, at);
  }
  throw new Error("unbalanced block");
}

type Rule = { selectors: string[]; body: string };
function rulesOf(block: string): Rule[] {
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(",").map((selector) => selector.replace(/\s+/g, " ").trim()),
    body: match[2]!.replace(/\s+/g, " ").trim(),
  }));
}
const declared = (rules: Rule[], selector: string) => rules.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body).join(" ");

test("the block holds exactly the selectors of the four groups", () => {
  const selectors = rulesOf(forcedBlock())
    .flatMap((rule) => rule.selectors)
    .sort();
  assert.deepEqual(selectors, [
    // 1. marks that keep their colour
    ".fui-badge-dot",
    ".fui-chart-frame .recharts-surface text",
    ".fui-chart-swatch",
    ".fui-status-dot",
    ".fui-status-dot",
    ".fui-timeline-dot",
    ".fui-timeline-dot",
    // 2. fills
    ".fui-activity-cell",
    '.fui-activity-cell[data-level="1"]',
    '.fui-activity-cell[data-level="2"]',
    '.fui-activity-cell[data-level="3"]',
    '.fui-activity-cell[data-level="4"]',
    '.fui-activity-cell[data-level]:not([data-level="0"])',
    ".fui-checkbox[data-checked]",
    ".fui-checkbox[data-checked]",
    ".fui-checkbox[data-indeterminate]",
    ".fui-checkbox[data-indeterminate]",
    ".fui-meter-indicator",
    ".fui-meter-track",
    ".fui-progress",
    ".fui-progress::-moz-progress-bar",
    ".fui-progress::-webkit-progress-value",
    ".fui-radio-indicator",
    ".fui-radio[data-checked]",
    ".fui-switch-thumb",
    ".fui-switch[data-checked]",
    ".fui-switch[data-checked] .fui-switch-thumb",
    ".fui-tabs-list .fui-tabs-indicator.fui-tabs-indicator",
    '.fui-tabs-list:not([data-variant="segmented"]):not(:has(.fui-tabs-indicator)) .fui-tab[data-active]',
    '.fui-tabs-list:not([data-variant="segmented"]):not(:has(.fui-tabs-indicator)) .fui-tab[data-active]::after',
    // 3. hairlines and pressed
    ".fui-avatar",
    ".fui-badge",
    '.fui-tabs-list[data-variant="segmented"]',
    '.fui-tabs-list[data-variant="segmented"] .fui-tab[data-active]',
    '.fui-tabs-list[data-variant="segmented"] .fui-tab[data-active]::after',
    ".fui-timeline-marker",
    ".fui-toggle-group",
    ".fui-toggle[data-pressed]",
    ".fui-toggle[data-pressed]::after",
    // 4. focus
    ".fui-command-input-wrapper:focus-within",
    ".fui-input-group:has(.fui-input-group-control:focus-visible)",
  ].sort());
});

test("group 1 marks keep their own colour and get a CanvasText edge", () => {
  const rules = rulesOf(forcedBlock());
  const group = rules.find((rule) => rule.selectors.includes(".fui-chart-swatch"))!;
  assert.deepEqual(group.selectors, [".fui-chart-swatch", ".fui-badge-dot", ".fui-status-dot", ".fui-timeline-dot"]);
  assert.match(group.body, /forced-color-adjust: none;/);
  assert.match(group.body, /outline: 1px solid CanvasText;/);
  assert.match(group.body, /outline-offset: -1px;/);
  assert.match(declared(rules, ".fui-chart-frame .recharts-surface text"), /fill: CanvasText;/);
});

test("every color in the block is a system color, a mix of them, or the timeline dot's own tone", () => {
  const body = forcedBlock().replace(/\/\*[\s\S]*?\*\//g, "");
  const variables = [...body.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]);
  assert.deepEqual(variables, ["--fui-timeline-color"]);
  assert.doesNotMatch(body, /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/);
  for (const mix of body.matchAll(/color-mix\(([^)]*)\)/g)) assert.match(mix[1]!, /in srgb, Highlight \d+%, Canvas/);
});

test("pressed and active are never a Highlight fill behind a label, and never an outline", () => {
  // Chromium paints a Canvas backplate behind text over any author background unless the element opts out of forcing: a label on a
  // Highlight fill reads HighlightText on white. And an outline is the focus ring's own shape.
  const rules = rulesOf(forcedBlock());
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      if (!/\.fui-(toggle|tab)\b|\.fui-tab\b/.test(selector) || /::after$/.test(selector) || /indicator/.test(selector)) continue;
      assert.doesNotMatch(rule.body, /background: Highlight|HighlightText/, `${selector} must not fill its label's background`);
      if (/data-pressed|data-active/.test(selector)) assert.doesNotMatch(rule.body, /outline/, `${selector} must not use an outline`);
    }
  }
  const bar = declared(rules, ".fui-toggle[data-pressed]::after");
  assert.match(bar, /background: Highlight;/);
  assert.match(bar, /block-size: 3px;/);
  assert.match(declared(rules, ".fui-toggle[data-pressed]"), /position: relative;/);
});

test("HighlightText only where text or a glyph sits on a Highlight fill that is not a label", () => {
  const withText = rulesOf(forcedBlock())
    .filter((rule) => /HighlightText/.test(rule.body))
    .flatMap((rule) => rule.selectors)
    .sort();
  assert.deepEqual(withText, [".fui-checkbox[data-checked]", ".fui-checkbox[data-indeterminate]", ".fui-switch[data-checked] .fui-switch-thumb"]);
});

test("the tabs' bar outranks the vertical list's own rule, which has three classes", () => {
  // `.fui-tabs-list[data-orientation="vertical"] .fui-tabs-indicator` paints --brand-ink; a lone `.fui-tabs-indicator` would lose to
  // it and the bar would be forced to Canvas.
  assert.match(styles, /\.fui-tabs-list\[data-orientation="vertical"\] \.fui-tabs-indicator \{[^}]*background: var\(--brand-ink\)/);
  assert.ok(declared(rulesOf(forcedBlock()), ".fui-tabs-list .fui-tabs-indicator.fui-tabs-indicator").includes("background: Highlight;"));
});

test("the block comes after every component rule it overrides", () => {
  const block = styles.indexOf("forced colors (0.9)");
  for (const selector of [".fui-meter-indicator {", ".fui-switch-thumb {", ".fui-activity-cell {", ".fui-timeline-marker {", ".fui-badge {"]) {
    assert.ok(styles.lastIndexOf(selector, block) > 0 && styles.lastIndexOf(selector, block) < block, `${selector} is declared before the block`);
  }
});
