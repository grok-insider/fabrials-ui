import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

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
  assert.match(styles, /\.fui-toggle-group\[data-size="lg"\] \.fui-toggle \{\s*min-height: var\(--fui-control-height\);/);
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
