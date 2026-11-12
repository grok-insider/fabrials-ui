import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureSummary,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FileInput,
  IconButton,
  MultiSelect,
  NativeCheckbox,
  NativeRadio,
  NativeRadioGroup,
  ThemeSwitcher,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../packages/ui/src/index";
import { keyShortcutsValue } from "../../packages/ui/src/icon-tooltip";
import { uiStyles } from "./read-styles";

const styles = uiStyles();

test("icon button is named by aria-label, or by a hidden text node, never both", () => {
  const named = renderToStaticMarkup(<IconButton label="Rename" tooltip={false}><svg /></IconButton>);
  assert.match(named, /aria-label="Rename"/);
  assert.match(named, /data-size="icon-lg"/);
  assert.match(named, /data-variant="ghost"/);
  assert.doesNotMatch(named, /title=/);
  const text = renderToStaticMarkup(<IconButton label="Rename" textName tooltip={false}><svg /></IconButton>);
  assert.doesNotMatch(text, /aria-label/);
  assert.match(text, /<span class="fui-sr-only">Rename<\/span>/);
  const keyed = renderToStaticMarkup(<IconButton label="Search" shortcut={["⌘", "K"]}><svg /></IconButton>);
  assert.match(keyed, /aria-keyshortcuts="Meta\+K"/);
  assert.equal(keyShortcutsValue("Esc"), "Escape");
  assert.equal(keyShortcutsValue(undefined), undefined);
});

test("toolbar renders one named toolbar with labelled groups, separators and text-node names", () => {
  const html = renderToStaticMarkup(
    <Toolbar aria-label="Message actions" variant="bar" sticky>
      <ToolbarGroup aria-label="Reply">
        <ToolbarButton label="Reply" reveal="early" variant="secondary"><svg /></ToolbarButton>
        <ToolbarButton label="Forward" tier="low"><svg /></ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator tier="low" />
      <ToolbarButton label="More actions" tier="overflow"><svg /></ToolbarButton>
    </Toolbar>,
  );
  assert.match(html, /role="toolbar"/);
  assert.match(html, /aria-label="Message actions"/);
  assert.match(html, /aria-orientation="horizontal"/);
  assert.match(html, /data-contain=""/);
  assert.match(html, /data-sticky=""/);
  assert.match(html, /role="group"[^>]*aria-label="Reply"|aria-label="Reply"[^>]*role="group"/);
  assert.match(html, /<span class="fui-toolbar-label">Reply<\/span>/);
  assert.match(html, /data-reveal="early"/);
  assert.match(html, /data-tier="low"/);
  assert.match(html, /data-tier="overflow"/);
  assert.match(html, /role="separator"/);
  // Roving focus: no button is a tab stop of its own on the server; the toolbar hands out its one tab stop when it mounts.
  assert.equal((html.match(/tabindex="0"/g) ?? []).length, 0);
  assert.equal((html.match(/tabindex="-1"/g) ?? []).length, 3);
  const plain = renderToStaticMarkup(<Toolbar aria-label="Formatting" />);
  assert.doesNotMatch(plain, /data-contain|data-sticky/);
});

test("file input shows its own label, never the browser's, and wires the description and error to the input", () => {
  const html = renderToStaticMarkup(
    <FileInput label="Choose a file" name="attachment" accept=".pdf" fileName="report.pdf" onClear={() => undefined} description="PDF, up to 5 MB" error="The file is too large" />,
  );
  assert.match(html, /<label class="fui-button fui-button-outline fui-button-size-default fui-file-input-button" data-variant="outline" data-size="default">/);
  assert.match(html, /<input[^>]*type="file"[^>]*class="fui-sr-only"|class="fui-sr-only"[^>]*type="file"/);
  assert.match(html, /name="attachment"/);
  assert.match(html, /accept="\.pdf"/);
  assert.match(html, /aria-invalid="true"/);
  const described = html.match(/aria-describedby="([^"]+)"/)?.[1].split(" ") ?? [];
  assert.equal(described.length, 3);
  for (const id of described) assert.match(html, new RegExp(`id="${id.replace(/[:]/g, "\\$&")}"`));
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-label="Remove file"/);
  const bare = renderToStaticMarkup(<FileInput label="Choose a file" />);
  assert.doesNotMatch(bare, /fui-file-input-name|aria-describedby|Remove file/);
});

test("disclosure is a details element with a summary, chevron, count and a panel, exact on the server", () => {
  const html = renderToStaticMarkup(
    <Disclosure open>
      <DisclosureSummary count="12" chevron="start" size="lg">Conversation</DisclosureSummary>
      <DisclosurePanel>Messages</DisclosurePanel>
    </Disclosure>,
  );
  assert.match(html, /^<details data-slot="disclosure" class="fui-disclosure" open="">/);
  assert.match(html, /<summary data-slot="disclosure-summary" data-size="lg" data-chevron="start" class="fui-disclosure-summary">/);
  assert.match(html, /<svg[^>]*class="[^"]*fui-disclosure-chevron/);
  assert.match(html, /<span class="fui-disclosure-label">Conversation<\/span><span class="fui-disclosure-count">12<\/span>/);
  assert.ok(html.indexOf("fui-disclosure-chevron") < html.indexOf("Conversation"), "a start chevron comes first");
  const end = renderToStaticMarkup(<Disclosure><DisclosureSummary>More</DisclosureSummary><p>Hidden but mounted</p></Disclosure>);
  assert.ok(end.indexOf("More") < end.indexOf("fui-disclosure-chevron"));
  assert.match(end, /Hidden but mounted/);
  assert.doesNotMatch(end, /open=/);
  assert.doesNotMatch(renderToStaticMarkup(<DisclosureSummary chevron="none">Plain</DisclosureSummary>), /<svg/);
});

test("field sets are real fieldsets and legends, and radios are native inputs a disabled fieldset covers", () => {
  const html = renderToStaticMarkup(
    <FieldSet disabled>
      <FieldLegend variant="label" divider={false}>Colour</FieldLegend>
      <FieldGroup layout="columns">a</FieldGroup>
    </FieldSet>,
  );
  assert.match(html, /^<fieldset data-slot="field-set" class="fui-fieldset" disabled="">/);
  assert.match(html, /<legend data-slot="field-legend" data-variant="label" class="fui-field-legend">Colour<\/legend>/);
  assert.match(html, /data-layout="columns"/);
  const divided = renderToStaticMarkup(<FieldLegend>Emails</FieldLegend>);
  assert.match(divided, /data-variant="title" data-divider=""/);

  const group = renderToStaticMarkup(
    <NativeRadioGroup legend="Label colour" layout="grid" name="unused" disabled>
      <NativeRadio name="colour" value="red" label="Red" defaultChecked />
      <NativeRadio name="colour" value="blue" label="Blue" />
    </NativeRadioGroup>,
  );
  assert.match(group, /<fieldset[^>]*class="fui-fieldset fui-native-radio-group"/);
  assert.match(group, /<legend[^>]*>Label colour<\/legend>/);
  assert.match(group, /type="radio"[^>]*name="colour"|name="colour"[^>]*type="radio"/);
  assert.match(group, /<label class="fui-native-choice"><input class="fui-native-radio"/);
  assert.match(group, /data-layout="grid"/);
  assert.match(renderToStaticMarkup(<NativeRadioGroup legend="Hidden" hideLegend><i /></NativeRadioGroup>), /class="fui-field-legend fui-sr-only"/);
});

test("a field group's columns keep a field's width in a wide form: auto-fill, the free room at the end", () => {
  assert.match(styles, /\.fui-field-group\[data-layout="columns"\] \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, 15rem\), 1fr\)\);/);
});

test("multi-select sums up its value in the trigger: the placeholder, one name, or the first name and how many more", () => {
  const options = [
    { value: "grok", label: "Grok" },
    { value: "claude", label: "Claude Code" },
    { value: "codex", label: "Codex" },
  ];
  const render = (value: string[]) =>
    renderToStaticMarkup(<MultiSelect id="providers" label="Providers" options={options} value={value} onValueChange={() => undefined} />);
  const empty = render([]);
  assert.match(empty, /<span class="fui-multi-select-label" id="providers-label">Providers<\/span>/);
  assert.match(empty, /aria-labelledby="providers-label"/);
  assert.match(empty, /id="providers"/);
  assert.match(empty, /data-placeholder=""/);
  assert.match(empty, /<span class="fui-multi-select-first">Any<\/span>/);
  const one = render(["claude"]);
  assert.doesNotMatch(one, /data-placeholder/);
  assert.match(one, /<span class="fui-multi-select-first">Claude Code<\/span><\/span>/);
  // Several: the first in the options' order, a soft count the eye reads and words a screen reader reads.
  const several = render(["codex", "grok"]);
  assert.match(several, /<span class="fui-multi-select-first">Grok<\/span><span aria-hidden="true" class="fui-multi-select-more">\+1<\/span><span class="fui-sr-only"> and 1 more<\/span>/);
});

test("multi-select styles: as wide as its summary within 10rem and 20rem, a popup at least as wide, the checkbox's own tick", () => {
  assert.match(styles, /\.fui-multi-select \{[^}]*inline-size: fit-content;[^}]*min-inline-size: 10rem;[^}]*max-inline-size: min\(100%, 20rem\);/);
  assert.match(styles, /\.fui-menu\.fui-multi-select-popup \{[^}]*min-width: max\(10rem, var\(--anchor-width, 0px\)\);/);
  assert.match(styles, /\.fui-menu-item \.fui-checkbox\.fui-multi-select-box svg \{[^}]*color: var\(--brand-foreground\);/);
});

test("segmented plates are placed by their four edges and slide leading edge first, only without reduced motion", () => {
  assert.match(styles, /\.fui-toggle-group\[data-indicator\]::before \{\s*top: var\(--fui-toggle-y\);\s*left: var\(--fui-toggle-x\);\s*right: var\(--fui-toggle-r\);/);
  assert.match(styles, /\.fui-tabs-plate \{\s*top: var\(--active-tab-top\);\s*left: var\(--active-tab-left\);\s*right: var\(--active-tab-right\);/);
  const motion = styles.slice(styles.indexOf("@media (prefers-reduced-motion: no-preference) {", styles.indexOf("/* Data and images arriving")));
  assert.match(motion, /\[data-direction="right"\]::before,\s*\.fui-tabs-plate\[data-activation-direction="right"\] \{\s*transition-delay: 40ms, 0ms/);
  assert.match(motion, /\[data-direction="left"\]::before,\s*\.fui-tabs-plate\[data-activation-direction="left"\] \{\s*transition-delay: 0ms, 40ms/);
  const segmented = renderToStaticMarkup(
    <ToggleGroup aria-label="Range" defaultValue={["7d"]}>
      <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
    </ToggleGroup>,
  );
  assert.match(segmented, /class="fui-toggle-group"/);
});

test("native radio grid: the column floor is a custom property whose default is the old 9rem", () => {
  assert.match(styles, /\.fui-native-radio-options\[data-layout="grid"\] \{\n    column-gap: var\(--fui-space-3\);\n    grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, var\(--fui-native-radio-min, 9rem\)\), 1fr\)\);/);
  // Unused, the markup is what it was: no inline style, no extra attribute.
  const group = renderToStaticMarkup(<NativeRadioGroup legend="Colour" layout="grid"><i /></NativeRadioGroup>);
  assert.doesNotMatch(group, /style=/);
});

test("native checkbox keeps its bare markup, gains a mixed hook and an optional whole-row label", () => {
  const bare = renderToStaticMarkup(<NativeCheckbox name="a" />);
  assert.match(bare, /^<input class="fui-native-checkbox"/);
  assert.match(bare, /type="checkbox"/);
  assert.match(bare, /name="a"/);
  assert.doesNotMatch(bare, /<label|data-indeterminate/);
  const mixed = renderToStaticMarkup(<NativeCheckbox name="a" indeterminate />);
  assert.match(mixed, /data-indeterminate=""/);
  assert.doesNotMatch(mixed, /aria-checked/);
  assert.match(renderToStaticMarkup(<NativeCheckbox label="Select page" />), /<label class="fui-native-choice"><input[^>]*type="checkbox"[^>]*\/><span>Select page<\/span><\/label>/);
});

test("toggle groups and the theme switcher take a size; lg paints a whole control height and the others extend their hit area", () => {
  const group = renderToStaticMarkup(<ToggleGroup size="lg" aria-label="View"><ToggleGroupItem value="a">A</ToggleGroupItem></ToggleGroup>);
  assert.match(group, /data-size="lg"/);
  assert.match(renderToStaticMarkup(<ThemeSwitcher value="system" onValueChange={() => undefined} />), /data-size="sm"/);
  assert.match(renderToStaticMarkup(<ThemeSwitcher size="lg" value="dark" onValueChange={() => undefined} />), /data-size="lg"/);
  assert.match(styles, /\.fui-toggle-group\[data-size="lg"\] \.fui-toggle \{\s*min-height: var\(--fui-control-height-lg\);/);
});

test("loading turns native choices into neutral shapes without a tick, dash or dot", () => {
  const at = styles.indexOf(":is(.fui-native-checkbox, .fui-native-radio)");
  assert.ok(at > 0);
  assert.match(styles.slice(at, at + 400), /appearance: none !important/);
  assert.match(styles.slice(at, at + 400), /background-color: var\(--fui-skeleton-surface\) !important/);
});

test("the toolbar's targets are pinned in px, and tiers and reveals answer to a container", () => {
  assert.match(styles, /\.fui-toolbar \{\s*--fui-control-height-lg: 44px;/);
  assert.match(styles, /@container \(max-width: 33\.99rem\) \{\s*\.fui-toolbar-button\[data-tier="low"\]/);
  // Without any size container the overflow trigger stays hidden, so the low items and the menu are never both shown.
  assert.match(styles, /\.fui-toolbar-button\[data-tier="overflow"\] \{\s*display: none;\s*\}\s*@container \(max-width: 33\.99rem\)/);
  assert.match(styles, /\.fui-toolbar-button\[data-tier="overflow"\] \{\s*display: inline-flex;/);
  for (const [name, width] of [["early", "40"], ["middle", "52"], ["late", "76"]])
    assert.match(styles, new RegExp(`@container \\(min-width: ${width}rem\\) \\{\\s*\\.fui-toolbar-button\\[data-reveal="${name}"\\]`));
  assert.match(styles, /\.fui-toolbar\[data-contain\] \{\s*container: fui-toolbar \/ inline-size;\s*inline-size: 100%;/);
});

// Request 6. The cascade itself is checked in a real browser (tests/visual/structure.spec.ts); this keeps the rule that makes it work from being reworded away.
test("a toolbar's px pin out-ranks the package's own touch rule", () => {
  assert.match(styles, /\.fui-toolbar \.fui-button:is\(\[data-size\], \[class\*="fui-button-size"\]\) \{\s*min-block-size: 44px;\s*min-inline-size: 44px;/);
});

// Request 7.
test("the menu row label rule costs no specificity and skips a trailing count or tag", () => {
  assert.match(styles, /:where\(\s*\.fui-sidebar-menu-button > span:last-child:not\(\.fui-sidebar-menu-badge, \.fui-badge, \[data-slot="badge"\]\),/);
  assert.match(styles, /:where\(\.fui-sidebar-menu-sub-button > span:last-child:not\(\.fui-sidebar-menu-badge, \.fui-badge, \[data-slot="badge"\]\)\) \{/);
});

// Request 11.
test("the rows accordion is not underlined on hover", () => {
  assert.match(styles, /\.fui-accordion\[data-variant="rows"\] \.fui-accordion-trigger:hover \{\s*text-decoration: none;/);
});

test("native select: the chevron follows --muted-foreground, flips for rtl, survives disabled and gives way to the native arrow in forced colors", () => {
  const rule = (selector: string) => {
    const start = styles.indexOf(`${selector} {`);
    assert.ok(start >= 0, `${selector} has a rule`);
    return styles.slice(start, styles.indexOf("\n  }", start));
  };
  const base = rule(".fui-input.fui-native-select");
  // Two strokes of linear-gradient in the theme's secondary ink: a data URI cannot read a custom property, so the old chevron
  // was a fixed warm grey in both themes.
  assert.equal(base.match(/linear-gradient\(/g)?.length, 2);
  assert.match(base, /var\(--muted-foreground\)/);
  assert.doesNotMatch(base, /url\(/);
  assert.match(base, /background-position:\s*right 1\.25rem center,\s*right 1rem center;/);
  // The control's end is physical in background-position: rtl places it again, at the inline end (the left).
  assert.match(rule(".fui-input.fui-native-select:dir(rtl)"), /left 1rem center,\s*left 1\.25rem center;/);
  // `.fui-input:disabled { background: var(--muted) }` resets every background longhand and ties the chevron's rule at two classes:
  // the chevron's rule must come after it or a disabled select loses its chevron.
  const disabled = styles.indexOf(".fui-input:disabled,\n  .fui-input[data-disabled] {");
  assert.ok(disabled >= 0, "the input's disabled fill is where this test expects");
  assert.ok(
    styles.indexOf(".fui-input.fui-native-select {") > Math.max(disabled, styles.indexOf(".fui-input[readonly] {")),
    "the chevron's rule follows the disabled and read-only fills",
  );
  // Forced colors keep a gradient's own colors on a Canvas fill, so the browser draws its native arrow.
  assert.match(
    styles,
    /@media \(forced-colors: active\) \{\n    \.fui-input\.fui-native-select \{\n      appearance: auto;\n      background-image: none;\n    \}\n  \}/,
  );
});
