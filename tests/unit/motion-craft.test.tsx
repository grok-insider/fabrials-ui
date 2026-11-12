// What moves and when, as rules of the sheet and of the components: frequent and keyed things do not move, a finger is
// followed exactly, a list does not keep its last item waiting, and data nobody chose stays inside its piece. The browser
// side of the same promises is tests/visual/motion-craft.spec.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Stat, StatGroup, avatarInitials } from "../../packages/ui/src/index";
import { uiStyles } from "./read-styles";

const styles = uiStyles();
const tokens = readFileSync(new URL("../../packages/ui/src/tokens.css", import.meta.url), "utf8");
const rule = (selector: string) => {
  const start = styles.indexOf(`${selector} {`);
  assert.ok(start >= 0, `${selector} is gone`);
  // Without its comments: several say in words what the rule no longer declares.
  return styles.slice(start, styles.indexOf("}", start) + 1).replace(/\/\*[\s\S]*?\*\//g, "");
};

test("a toast held by a finger has no transition on its transform, with enough attributes to win over the rule that sets one", () => {
  const base = '.fui-toaster[data-sonner-toaster] [data-sonner-toast] {';
  const held = '.fui-toaster[data-sonner-toaster] [data-sonner-toast][data-swiping="true"] {';
  assert.ok(styles.indexOf(held) > styles.indexOf(base), "the held rule comes after the one it overrides");
  assert.match(rule(held.slice(0, -2)), /transition-property: opacity, height, box-shadow;/);
  assert.match(rule(base.slice(0, -2)), /transform var\(--fui-duration\)/);
});

test("overlays take 150 ms, a tooltip 100, and the ones Base UI marks as instant take none", () => {
  assert.match(styles, /\.fui-menu,\s*\.fui-popover,\s*\.fui-tooltip \{\s*transition-duration: var\(--fui-duration\);/);
  assert.match(styles, /\n  \.fui-tooltip \{\s*transition-duration: var\(--fui-duration-fast\);\s*\}/);
  const instant = styles.indexOf(":is(.fui-menu, .fui-popover, .fui-tooltip)[data-instant] {");
  const leaving = styles.indexOf(":is(.fui-menu, .fui-popover, .fui-tooltip)[data-ending-style] {");
  assert.ok(instant > leaving && leaving > 0, "instant is said last, so it also wins over the exit");
  assert.match(styles.slice(instant, instant + 120), /transition-duration: 0ms;/);
});

test("a menu's row has no transition, and the rows a pointer browses keep theirs", () => {
  assert.doesNotMatch(styles, /\.fui-menu-item[^{}]*\{[^}]*transition:/);
  assert.match(styles, /\.fui-item,\s*\.fui-sidebar-menu-button \{\s*transition: background-color var\(--fui-duration-fast\)/);
});

test("the command palette only fades, in 100 ms, and its veil with it", () => {
  assert.match(
    styles,
    /\.fui-dialog\.fui-command-dialog\[data-placement="center"\]:is\(\s*\[data-starting-style\],\s*\[data-ending-style\]\s*\) \{\s*transform: translateX\(-50%\);\s*\}/,
  );
  // Coming and going: the exit is named too, or the dialog's own exit of 150 ms would outrank it.
  assert.match(
    styles,
    /\.fui-dialog\.fui-command-dialog,\s*\.fui-dialog\.fui-command-dialog\[data-ending-style\],\s*\.fui-backdrop:has\(~ \.fui-command-dialog\) \{\s*transition-duration: var\(--fui-duration-fast\);/,
  );
  // Every other veil leaves with its panel.
  assert.match(rule(".fui-backdrop[data-ending-style]"), /transition-duration: var\(--fui-duration\);/);
});

test("folding the sidebar has no transition of size, and its labels fade in 100 ms", () => {
  assert.doesNotMatch(rule("  .fui-sidebar-gap"), /transition[a-z-]*:/);
  assert.doesNotMatch(rule("  .fui-sidebar-container"), /transition[a-z-]*:/);
  assert.match(rule("  .fui-sidebar-group-label"), /transition: opacity var\(--fui-duration-fast\) var\(--fui-ease\);/);
});

test("a list's items arrive 30 ms apart up to the eighth, from a token", () => {
  assert.match(tokens, /--fui-stagger-step: 30ms;/);
  assert.match(rule("    .fui-rise"), /animation-delay: calc\(min\(var\(--fui-stagger, 0\), 8\) \* var\(--fui-stagger-step\)\);/);
  // The last item starts within the 300 ms a group may take.
  assert.ok(8 * 30 <= 300);
});

test("a key of the on-screen keyboard answers in the frame it is pressed, and the tabs' underline is quick", () => {
  assert.doesNotMatch(rule("  .fui-keyboard-key"), /transition[a-z-]*:/);
  assert.match(rule("  .fui-tabs-indicator"), /translate var\(--fui-duration-fast\) var\(--fui-ease\),\s*width var\(--fui-duration-fast\) var\(--fui-ease\);/);
});

test("a tick is drawn when Base UI says it has just been checked, never by @starting-style, which also runs on the first paint", () => {
  assert.match(styles, /\.fui-checkbox \.fui-control-indicator\[data-starting-style\],\s*\.fui-radio \.fui-radio-indicator\[data-starting-style\] \{\s*scale: 0\.6;/);
  assert.match(styles, /\.fui-checkbox \.fui-control-indicator\[data-starting-style\] svg path \{\s*stroke-dashoffset: 24;/);
  for (const block of styles.match(/@starting-style \{[\s\S]*?\n    \}/g) ?? [])
    assert.doesNotMatch(block, /\.fui-checkbox \.fui-control-indicator|\.fui-radio /, "a tick is back under @starting-style");
});

test("every field a person types into is 16 px on a phone", () => {
  const phone = styles.slice(styles.lastIndexOf("@media (max-width: 767px), (pointer: coarse) {"));
  assert.match(phone, /\.fui-number-field-input,\s*\.fui-editable-text-field \{\s*font-size: 1rem;/);
  assert.match(styles, /\.fui-input,\s*\.fui-command-input \{\s*font-size: 1rem;/);
});

test("a long figure of a Stat says how long it is, so a group can fit it; a short one and an element do not", () => {
  const html = renderToStaticMarkup(
    <StatGroup>
      <Stat label="Energy" unit="kWh" value="12,345,678.90" />
      <Stat label="Members" value={1284} />
      <Stat label="Custom" value={<b>12,345,678.90</b>} />
      <Stat label="Count" value={1234567890} />
    </StatGroup>,
  );
  const figures = html.match(/<p class="fui-stat-value"[^>]*>/g) ?? [];
  assert.deepEqual(figures, [
    '<p class="fui-stat-value" data-fit="" style="--fui-figure-ch:13">',
    '<p class="fui-stat-value">',
    '<p class="fui-stat-value">',
    '<p class="fui-stat-value" data-fit="" style="--fui-figure-ch:10">',
  ]);
  // Only inside a group, whose cells have a width of their own.
  assert.match(styles, /\.fui-stat-group > \.fui-stat:has\(> \.fui-stat-value\[data-fit\]\) \{\s*container: fui-stat \/ inline-size;/);
  assert.doesNotMatch(styles, /\n  \.fui-stat \{[^}]*container/);
});

test("what leaves uses the quick-out curve of what arrives, not one that holds it still first", () => {
  const curve = (name: string) => tokens.match(new RegExp(`${name}: (cubic-bezier\\([^)]*\\));`))?.[1];
  assert.equal(curve("--fui-ease-exit"), "cubic-bezier(0.16, 1, 0.3, 1)");
  assert.equal(curve("--fui-ease-exit"), curve("--fui-ease-out"));
  // The one exit written in script (a filter chip leaving) is the same curve.
  assert.match(readFileSync(new URL("../../packages/ui/src/filter-chip.tsx", import.meta.url), "utf8"), /easing: "cubic-bezier\(0\.16, 1, 0\.3, 1\)"/);
});

test("under reduced motion what comes over the page still fades, and nothing else moves", () => {
  // The three lengths are 0; the fade has lengths of its own, which that block does not touch.
  const reduced = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /--fui-duration-fast: 0ms;\s*--fui-duration: 0ms;\s*--fui-duration-slow: 0ms;/);
  assert.doesNotMatch(reduced, /--fui-duration-fade/);
  assert.match(tokens, /--fui-duration-fade: 150ms;\s*--fui-duration-fade-exit: 100ms;/);
  const block = styles.slice(styles.lastIndexOf("@media (prefers-reduced-motion: reduce) {"));
  const surfaces = ":root :is(.fui-menu, .fui-popover, .fui-tooltip, .fui-dialog, .fui-backdrop)";
  // Arriving: opacity only, so the place it comes from is taken in the frame it is still transparent.
  assert.ok(block.includes(`${surfaces} {\n      transition: opacity var(--fui-duration-fade) var(--fui-ease-out);`));
  // Leaving: it holds its place until the fade ends.
  const leaving = block.slice(block.indexOf(`${surfaces}[data-ending-style] {`));
  assert.match(leaving, /opacity var\(--fui-duration-fade-exit\) var\(--fui-ease-out\),\s*transform var\(--fui-duration-fade-exit\) step-end,\s*translate var\(--fui-duration-fade-exit\) step-end,\s*scale var\(--fui-duration-fade-exit\) step-end;/);
  // A sheet has no fade of its own to keep; and what Base UI marks as instant is still instant.
  assert.match(block, /:root \.fui-dialog:is\(\[data-starting-style\], \[data-ending-style\]\) \{\s*opacity: 0;/);
  assert.match(block, /:root :is\(\.fui-menu, \.fui-popover, \.fui-tooltip\)\[data-instant\] \{\s*transition-duration: 0ms;/);
  assert.ok(block.indexOf("[data-instant]") > block.indexOf("[data-ending-style]"), "instant is said last");
});

test("a term of a description list keeps the cell it always had", () => {
  assert.match(styles, /\.fui-description-term \{\s*(?:\/\*[^*]*\*\/\s*)?min-inline-size: calc\(8rem - var\(--fui-space-3\)\);\s*overflow-wrap: anywhere;/);
});

test("initials skip what follows a family name, and keep it when it is all there is", () => {
  assert.equal(avatarInitials("Christopher Alexander Montgomery III"), "CM");
  assert.equal(avatarInitials("Sammy Davis Jr."), "SD");
  assert.equal(avatarInitials("Ana Ruiz, PhD"), "AR");
  assert.equal(avatarInitials("Ada Lovelace"), "AL");
  assert.equal(avatarInitials("Malcolm X"), "MX");
  assert.equal(avatarInitials("John Paul II"), "JP");
  // A first word is always a name, and a pair is never reduced to one letter.
  assert.equal(avatarInitials("Md Rahman"), "MR");
  assert.equal(avatarInitials("Md Abdul Rahman"), "MR");
  assert.equal(avatarInitials("Henry IV"), "HI");
  assert.equal(avatarInitials("beacon@harbour.test"), "B");
});
