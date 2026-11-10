import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 0.12: everything that floats reads one set of tokens, so a host restyles its overlays by setting four custom properties
// instead of overriding every popup class and the toaster. This file holds the list of surfaces; tests/visual/surfaces.spec.ts
// sets the tokens in Chromium and reads each surface back.
const source = (path: string) => readFileSync(new URL(`../../packages/ui/src/${path}`, import.meta.url), "utf8");
const styles = source("styles.css");
const tokens = source("tokens.css");

/** The body of the rule whose selector list is exactly `selector` (at the start of a line, so a longer selector is not taken for it). */
function rule(selector: string) {
  const match = new RegExp(`(?:^|\\n)[ ]*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`).exec(styles);
  assert.ok(match, `missing rule ${selector}`);
  return match[1]!;
}

const OVERLAY = {
  surface: "var(--fui-overlay-surface)",
  border: "var(--fui-overlay-border)",
  shadow: "var(--fui-overlay-shadow)",
  filter: "var(--fui-overlay-filter)",
};

type Surface = { name: string; selector: string; surface: string; border: string; shadow: string; filter: string };

const SURFACES: Surface[] = [
  { name: "menu, context menu, and the lists of Select, Combobox and MultiSelect", selector: ".fui-menu", ...OVERLAY },
  { name: "popover, hover card, status popover, date picker and nav switcher", selector: ".fui-popover", ...OVERLAY },
  { name: "navigation menu", selector: ".fui-nav-menu-popup", ...OVERLAY },
  // The chart tip never had the top highlight the others carry, so its shadow keeps a default of its own.
  { name: "chart tip", selector: ".fui-chart-tip", ...OVERLAY, shadow: "var(--fui-chart-tip-shadow, var(--fui-shadow-md))" },
  {
    name: "dialog, alert dialog, sheet and command dialog",
    selector: ".fui-dialog",
    surface: "var(--fui-dialog-surface, var(--fui-overlay-surface))",
    border: "var(--fui-dialog-border, var(--fui-overlay-border))",
    shadow: "var(--fui-dialog-shadow, var(--fui-shadow-lg), var(--fui-highlight))",
    filter: "var(--fui-dialog-filter, var(--fui-overlay-filter))",
  },
  {
    name: "toast",
    selector: '.fui-toaster[data-sonner-toaster] [data-sonner-toast][data-styled="true"]',
    surface: "var(--fui-toast-surface, var(--fui-overlay-surface))",
    border: "var(--fui-toast-border, var(--fui-overlay-border))",
    shadow: "var(--fui-toast-shadow, var(--fui-overlay-shadow))",
    filter: "var(--fui-toast-filter, var(--fui-overlay-filter))",
  },
];

for (const surface of SURFACES) {
  test(`${surface.name}: surface, edge, shadow and backdrop-filter come from the overlay tokens`, () => {
    const body = rule(surface.selector);
    assert.ok(body.includes(`background: ${surface.surface};`), "background");
    assert.ok(body.includes(`border: 1px solid ${surface.border};`) || body.includes(`border-color: ${surface.border};`), "border");
    assert.ok(body.includes(`box-shadow: ${surface.shadow};`), "box-shadow");
    assert.ok(body.includes(`backdrop-filter: ${surface.filter};`), "backdrop-filter");
  });
}

test("the tokens default to what every surface drew in 0.11, on every theme scope", () => {
  const derived = tokens.slice(tokens.indexOf('[data-theme="system"] {\n  --fui-surface-inset'));
  const block = derived.slice(0, derived.indexOf("}"));
  assert.match(block, /--fui-overlay-surface: var\(--popover\);/);
  assert.match(block, /--fui-overlay-border: var\(--border\);/);
  assert.match(block, /--fui-overlay-shadow: var\(--fui-shadow-md\), var\(--fui-highlight\);/);
  assert.match(block, /--fui-overlay-filter: none;/);
  // Declared once, where --popover is in scope for each theme: a theme island computes them from its own popover.
  assert.equal(tokens.match(/--fui-overlay-surface:/g)?.length, 1);
  // The dialog, toast and chart-tip tokens are never declared: each use falls back, so one declaration by a host reaches them.
  assert.doesNotMatch(tokens.replace(/\/\*[\s\S]*?\*\//g, ""), /--fui-(dialog|toast)-(surface|border|shadow|filter):|--fui-chart-tip-shadow:/);
});

test("no rule paints a surface with --popover directly any more", () => {
  const uses = [...styles.matchAll(/^.*var\(--popover\).*$/gm)].map((match) => match[0].trim());
  assert.deepEqual(uses, [
    // A native select's option list is drawn by the browser.
    "background: var(--popover);",
    // The destructive tint of a highlighted menu item mixes into the opaque colour.
    "background: color-mix(in oklab, var(--destructive) 12%, var(--popover));",
  ]);
  assert.match(styles, /\.fui-native-select option \{\s*background: var\(--popover\);/);
});

test("the popups that share a class still do", () => {
  for (const [file, name] of [
    ["menu.tsx", "fui-menu"],
    ["context-menu.tsx", "fui-menu"],
    ["select.tsx", "fui-menu"],
    ["combobox.tsx", "fui-menu"],
    ["multi-select.tsx", "fui-menu fui-multi-select-popup"],
    ["popover.tsx", "fui-popover"],
    ["hover-card.tsx", '"fui-popover", "fui-hover-card"'],
    ["navigation-menu.tsx", "fui-nav-menu-popup"],
    ["chart.tsx", "fui-chart-tip"],
    ["dialog.tsx", '"fui-dialog"'],
    ["command.tsx", "fui-command-dialog"],
  ] as const)
    assert.ok(source(file).includes(name), `${file} draws ${name}`);
  for (const file of ["status-popover.tsx", "calendar.tsx", "nav-switcher.tsx"]) assert.match(source(file), /<PopoverContent/, file);
});

test("the command palette is the overlay surface on its own and lays no second one inside a dialog or a popover", () => {
  assert.ok(rule(".fui-command").includes("background: var(--fui-overlay-surface);"));
  assert.ok(rule(":is(.fui-dialog, .fui-popover) .fui-command").includes("background: transparent;"));
  assert.ok(
    rule(".fui-dialog.fui-command-dialog").includes("box-shadow: var(--fui-dialog-shadow, var(--fui-shadow-overlay), var(--fui-highlight));"),
  );
});

test("a dialog's fixed footer is see-through, and takes the dialog's surface only where it sticks over the scroller", () => {
  assert.doesNotMatch(rule(".fui-dialog:has(> .fui-dialog-body) > .fui-dialog-footer"), /background/);
  const short = styles.slice(styles.indexOf("A short window (a landscape phone)"));
  const sticky = short.slice(short.indexOf(".fui-dialog:has(> .fui-dialog-body) > .fui-dialog-footer {"));
  assert.match(
    sticky.slice(0, sticky.indexOf("}")),
    /position: sticky;[^}]*background: var\(--fui-dialog-surface, var\(--fui-overlay-surface\)\);\s*backdrop-filter: var\(--fui-dialog-filter, var\(--fui-overlay-filter\)\);/,
  );
});
