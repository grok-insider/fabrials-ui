import { test } from "node:test";
import assert from "node:assert/strict";
import { uiStyles } from "./read-styles";

// The pieces of @fabrials/ui whose rules were physical before 0.12. The browser spec (tests/visual/right-to-left.spec.ts)
// reads the result in a right-to-left page; this holds the declarations, so a physical one does not come back.
const styles = uiStyles();
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};
const physical = /(^|[\s;{])(left|right|margin-left|margin-right|padding-left|padding-right)\s*:|text-align:\s*(left|right)/;

test("timeline, suggestion card, files, the skip link and the bars use logical properties", () => {
  const logical: Array<[string, RegExp]> = [
    [".fui-timeline-item:not(:last-child)::before {", /inset-inline-start: calc\(var\(--fui-space-2\) \+ 0\.875rem - 0\.5px\);/],
    [".fui-timeline-actions {", /margin-inline-start: auto;/],
    ["\n  .fui-suggestion-card {", /text-align: start;/],
    ["\n  .fui-files-row {", /text-align: start;/],
    ["\n  .fui-files-row {", /padding-inline-start: calc\(var\(--fui-space-2\) \+ var\(--fui-files-depth, 0\) \* 1\.125rem\);/],
    [".fui-files-note {", /margin-inline-start: auto;/],
    [".fui-skip-link {", /inset-inline-start: var\(--fui-space-2\);/],
    ["\n  .fui-bulk-actions {", /padding: var\(--fui-space-2\);\s*padding-inline-start: var\(--fui-space-4\);/],
    [".fui-side-panel-header {", /padding: var\(--fui-space-2\);\s*padding-inline-start: var\(--fui-space-4\);/],
    [".fui-viewer-bar {", /padding: var\(--fui-space-1\) var\(--fui-space-2\);\s*padding-inline-start: var\(--fui-space-4\);/],
    ['.fui-carousel-previous[data-orientation="horizontal"] {', /inset-inline-start: -3rem;/],
    ['.fui-carousel-next[data-orientation="horizontal"] {', /inset-inline-end: -3rem;/],
  ];
  for (const [selector, declaration] of logical) {
    const body = rule(selector);
    assert.match(body, declaration, selector);
    assert.doesNotMatch(body, physical, selector);
    // No four-value padding or margin, whose second and fourth values are the physical right and left.
    assert.doesNotMatch(body, /(padding|margin): [^\s;]+ [^\s;]+ [^\s;]+ [^\s;]+;/, selector);
  }
});

test("what logical properties cannot say is placed again under :dir(rtl)", () => {
  assert.match(
    styles,
    /\.fui-pagination-step svg:dir\(rtl\),\s*\.fui-files-row:not\(\[aria-expanded="true"\]\) \.fui-files-chevron:dir\(rtl\),\s*\.fui-carousel-control\[data-orientation="horizontal"\] svg:dir\(rtl\) \{\s*transform: scaleX\(-1\);/,
  );
  assert.match(rule(".fui-switch[data-checked] .fui-switch-thumb:dir(rtl) {"), /transform: translateX\(-1rem\);/);
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: no-preference\) \{\s*\.fui-switch\[data-checked\]:active:not\(\[data-disabled\]\) \.fui-switch-thumb:dir\(rtl\) \{\s*transform: translateX\(-0\.75rem\);/,
  );
  // The loading bar of a field: the same selectors as the left-to-right rule, so it wins by :dir alone.
  assert.match(styles, /\):dir\(rtl\) \{\s*background-position: right 0\.75rem center !important;/);
  assert.match(styles, /textarea:not\(:where\(\[data-skeleton="keep"\], \[data-skeleton="keep"\] \*\)\):dir\(rtl\) \{\s*background-position: right 0\.75rem top 0\.7rem !important;/);
});

test("a command is left to right in any page, so its physical padding and copy key are right", () => {
  const at = styles.lastIndexOf(".fui-snippet-code {");
  assert.match(styles.slice(at, styles.indexOf("}", at)), /direction: ltr;/);
  assert.match(rule(".fui-snippet-copy {"), /right: 0\.375rem;/);
});
