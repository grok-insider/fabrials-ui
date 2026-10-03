import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

// Recharts 3 paints the plot as svg[role=application][tabindex=0]. Its focus ring was removed outright (0.8), so a keyboard user
// could not see where focus was; the rule must only remove it for focus that is not focus-visible.
test("the chart plot loses its outline only for focus that is not focus-visible, and shows a 2 px inset ring for the keyboard", () => {
  const rules = [...styles.matchAll(/\.fui-chart-frame :is\(\.recharts-surface, \.recharts-wrapper\)([^{]*)\{([^}]*)\}/g)].map((match) => ({
    selector: match[1]!.trim(),
    body: match[2]!,
  }));
  assert.ok(rules.length >= 2, "the plot has a focus rule for each state");
  for (const rule of rules.filter((entry) => /outline:\s*none/.test(entry.body)))
    assert.equal(rule.selector, ":focus:not(:focus-visible)", "outline: none is allowed only where focus-visible does not match");
  const ring = rules.find((entry) => entry.selector === ":focus-visible");
  assert.ok(ring, "the plot has a :focus-visible rule");
  assert.match(ring.body, /outline:\s*2px solid var\(--fui-focus\)/);
  // The panels that hold a chart clip their overflow: an outer ring would be cut.
  assert.match(ring.body, /outline-offset:\s*-2px/);
});
