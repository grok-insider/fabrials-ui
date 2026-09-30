import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AppHeader,
  AppHeaderAction,
  AppHeaderBrand,
  AppHeaderCaret,
  AppHeaderLabel,
  AppHeaderLink,
  AppHeaderNav,
  AppHeaderPlaceholder,
  BulkActions,
  BulkActionsContent,
  BulkActionsRoot,
  BulkActionsStatus,
  Item,
  ItemActions,
  ItemCheck,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemSeparator,
  ItemTitle,
  ItemUnread,
  NavSwitcher,
  NavSwitcherTrigger,
  PageHeader,
  ResizableHandle,
  SectionHeader,
  SettingsSection,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../packages/ui/src/tokens.css", import.meta.url), "utf8");

/** The declarations of the first rule whose selector list contains `selector` exactly as written (up to its closing brace). */
const rule = (selector: string, from = 0) => {
  const at = styles.indexOf(selector, from);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};
/** Everything inside `@container <name> (<condition>) { ... }` (balanced braces). */
const container = (header: string) => {
  const at = styles.indexOf(`@container ${header}`);
  assert.ok(at >= 0, `missing @container ${header}`);
  let depth = 0;
  for (let i = styles.indexOf("{", at); i < styles.length; i += 1) {
    if (styles[i] === "{") depth += 1;
    if (styles[i] === "}" && --depth === 0) return styles.slice(at, i + 1);
  }
  throw new Error("unbalanced");
};

// -------------------------------------------------------------------------------- Item

test("items: a group is a ul, an item a li inside it and a div alone, with the state hooks", () => {
  const inside = renderToStaticMarkup(
    <ItemGroup bordered aria-label="Messages">
      <Item stretch current selected unread className="row">
        <ItemContent>
          <ItemTitle render={<h3 />}>
            <ItemUnread />
            <ItemLink href="/m/1" current>Subject</ItemLink>
          </ItemTitle>
          <ItemDescription>Preview</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Star</button>
        </ItemActions>
      </Item>
    </ItemGroup>,
  );
  assert.match(inside, /^<ul data-slot="item-group" data-bordered="" class="fui-item-group" aria-label="Messages">/);
  assert.match(inside, /<li class="fui-item row" data-slot="item" data-variant="default" data-current="" data-selected="" data-unread="" data-stretch="">/);
  assert.match(inside, /<h3 class="fui-item-title" data-slot="item-title">/);
  assert.match(inside, /<a class="fui-item-link" data-slot="item-link" aria-current="true" href="\/m\/1">/);
  assert.match(inside, /<span class="fui-item-unread" data-slot="item-unread" aria-hidden="true">/);
  const alone = renderToStaticMarkup(<Item variant="outline" size="sm">x</Item>);
  assert.match(alone, /^<div class="fui-item" data-slot="item" data-variant="outline" data-size="sm">x<\/div>$/);
  assert.doesNotMatch(alone, /data-current|data-stretch|data-selected|data-unread/);
});

test("items: the link says aria-current as true for a set, page for a page, nothing otherwise", () => {
  const html = (current: boolean | "page" | "true" | undefined) => renderToStaticMarkup(<ItemLink current={current}>x</ItemLink>);
  assert.match(html(true), /aria-current="true"/);
  assert.match(html("page"), /aria-current="page"/);
  assert.doesNotMatch(html(false), /aria-current/);
  assert.doesNotMatch(html(undefined), /aria-current/);
  // A button target for a row that selects instead of navigating.
  assert.match(renderToStaticMarkup(<ItemLink render={<button type="button" aria-pressed="true" />}>x</ItemLink>), /^<button /);
});

test("items: a separator inside a group is an empty hidden li (a separator role is not allowed in a list)", () => {
  assert.match(renderToStaticMarkup(<ItemGroup><ItemSeparator /></ItemGroup>), /<li aria-hidden="true" data-slot="item-separator" class="fui-item-separator">/);
  assert.match(renderToStaticMarkup(<ItemSeparator />), /<div role="separator"/);
  assert.match(renderToStaticMarkup(<ItemCheck>x</ItemCheck>), /^<label class="fui-item-check"/);
});

test("items: the root carries only the row, the stretched target and the bar never share a pseudo-element", () => {
  const root = rule(".fui-item {");
  for (const property of ["display", "padding", "gap", "flex", "grid"]) assert.doesNotMatch(root, new RegExp(`\\b${property}\\b`), `the row root must not set ${property}`);
  assert.match(root, /min-block-size: var\(--fui-control-height-lg\)/);
  assert.match(root, /border-block-end: 1px solid var\(--border\)/);
  // The bar is the ROW's ::before; the stretched target and its ring are the LINK's ::after.
  assert.match(rule(".fui-item[data-current]::before"), /inline-size: var\(--fui-bar\)/);
  assert.match(rule(".fui-item[data-current]::before"), /background: var\(--brand-ink\)/);
  const stretch = rule(".fui-item[data-stretch] :is(.fui-item-link, .fui-item-title :is(a, button))::after");
  assert.match(stretch, /position: absolute/);
  assert.match(stretch, /inset: 0/);
  const ring = rule(".fui-item[data-stretch] :is(.fui-item-link, .fui-item-title :is(a, button)):focus-visible::after");
  assert.match(ring, /outline-offset: -2px/);
  assert.match(rule(".fui-item[data-stretch] :is(.fui-item-link, .fui-item-title :is(a, button)):focus-visible {"), /outline: 0/);
});

test("items: content and title never become a containing block, or the stretched target would shrink to them", () => {
  for (const selector of [".fui-item-content {", ".fui-item-title {", ".fui-item-description {"]) {
    const block = rule(selector);
    assert.doesNotMatch(block, /\b(position|transform|contain|filter|perspective|will-change|container)\b\s*:/, `${selector} must stay static`);
  }
  // Controls of the row sit above the stretched target.
  assert.match(rule(".fui-item-actions {"), /position: relative;\s*z-index: 1/);
  assert.match(rule(".fui-item-check {"), /position: relative;\s*z-index: 1/);
  assert.match(rule(".fui-item-check {"), /inline-size: var\(--fui-control-height-lg\)/);
});

test("items: the checked native checkbox selects the row without JavaScript, and the group does not double the last hairline", () => {
  assert.match(styles, /\.fui-item:has\(\.fui-item-check :checked\)/);
  assert.match(rule(".fui-item-group {"), /container: fui-item-group \/ inline-size/);
  assert.doesNotMatch(rule(".fui-item-group {"), /border/);
  assert.match(rule(".fui-item-group[data-bordered]"), /border-block-start/);
  assert.doesNotMatch(rule(".fui-item-group[data-bordered]"), /border-block-end/);
  // The layout of the slots is opt-in: only when a slot is a direct child.
  assert.match(styles, /\.fui-item:has\(\s*> :is\(\.fui-item-media, \.fui-item-content, \.fui-item-actions, \.fui-item-header, \.fui-item-footer\)\s*\) \{\s*display: flex/);
  assert.match(container("fui-item-group (max-width: 24rem)"), /\.fui-item > \.fui-item-actions/);
  assert.match(tokens, /--fui-bar: 2px/);
});

// ---------------------------------------------------------------------------- AppHeader

test("app header: banner, row, brand, navigation, then the command slot and actions at the end", () => {
  const html = renderToStaticMarkup(
    <AppHeader
      sticky
      className="extra"
      brand={<AppHeaderBrand href="/mail">Open Email</AppHeaderBrand>}
      navigation={<AppHeaderNav label="Workspace"><AppHeaderLink href="/mail" current>Mail</AppHeaderLink><AppHeaderLink href="/contacts">Contacts</AppHeaderLink></AppHeaderNav>}
      command={<button type="button" id="command">Commands</button>}
      actions={<AppHeaderAction id="account"><AppHeaderLabel>alex</AppHeaderLabel><AppHeaderCaret /></AppHeaderAction>}
    />,
  );
  assert.match(html, /^<header data-slot="app-header" data-sticky="" class="fui-app-header extra">/);
  const order = ["fui-app-header-inner", "fui-app-header-brand", "fui-app-header-nav", "fui-app-header-actions", "fui-app-header-command", "id=\"account\""].map((token) => html.indexOf(token));
  assert.deepEqual([...order].sort((a, b) => a - b), order, "document order: row, brand, nav, actions, command slot, then the actions");
  assert.match(html, /<nav data-slot="app-header-nav" aria-label="Workspace" class="fui-app-header-nav">/);
  assert.match(html, /class="fui-app-header-link" data-slot="app-header-link" aria-current="page" href="\/mail"/);
  assert.equal((html.match(/aria-current/g) ?? []).length, 1);
  assert.match(html, /<div class="fui-app-header-command"><button type="button" id="command">/);
  assert.doesNotMatch(renderToStaticMarkup(<AppHeader brand="x" />), /fui-app-header-command|data-sticky/);
  assert.match(renderToStaticMarkup(<AppHeaderPlaceholder />), /aria-hidden="true"/);
});

test("app header: the command slot has a DEFINITE width in every mode, never only a flex-basis (Firefox and WebKit size the actions cluster from content)", () => {
  const base = rule(".fui-app-header-command {");
  assert.match(base, /container: command \/ inline-size/);
  assert.match(base, /flex: none/);
  assert.match(base, /width: var\(--fui-control-height-lg\)/);
  assert.doesNotMatch(base, /flex-basis|flex: [^n]/);
  // Every container-query mode that touches the slot sets `width`, and none sets a basis.
  for (const [condition, width] of [["(min-width: 72rem)", "14rem"], ["(min-width: 90rem)", "18rem"], ["(min-width: 120rem)", "22rem"]] as const) {
    const block = container(`app-header ${condition}`);
    assert.match(block, /\.fui-app-header-command \{\s*width: /);
    assert.ok(block.includes(`width: ${width}`), `${condition} sets width ${width}`);
    assert.doesNotMatch(block, /flex-basis/);
  }
  const headerCss = styles.slice(styles.indexOf(".fui-app-header {"), styles.indexOf(".fui-auth {")).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(headerCss, /flex-basis/);
  // The cluster itself never shrinks, so the brand is what gives way.
  assert.match(rule(".fui-app-header-actions {"), /flex: none/);
});

test("app header: modes are container queries in rem on the header, its geometry is the frame's", () => {
  const header = rule(".fui-app-header {");
  assert.match(header, /container: app-header \/ inline-size/);
  assert.match(header, /background: var\(--background\)/);
  assert.doesNotMatch(styles.slice(styles.indexOf(".fui-app-header {"), styles.indexOf(".fui-app-header-inner")), /backdrop-filter|blur/);
  assert.match(rule(".fui-app-header-inner {"), /min-height: var\(--fui-header-height\)/);
  assert.match(rule(".fui-app-header-inner {"), /flex-wrap: nowrap/);
  for (const condition of ["(max-width: 47.99rem)", "(max-width: 30rem)", "(max-width: 24rem)", "(max-width: 19rem)"]) container(`app-header ${condition}`);
  assert.match(container("app-header (max-width: 19rem)"), /flex-wrap: wrap/);
  assert.match(container("app-header (max-width: 24rem)"), /\.fui-lockup-text/);
  // The current link's bar sits on the header hairline and is the bar token.
  assert.match(rule('.fui-app-header-link[aria-current="page"]::after'), /height: var\(--fui-bar\)/);
  assert.match(styles.slice(0, 400), /\.fui-app-header,/);
});

// ------------------------------------------------------------------------------ Sidebar

test("sidebar menu: rows render without a provider (expanded), the count is a span inside the link, size touch and depth are hooks", () => {
  const html = renderToStaticMarkup(
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="touch" isActive depth={2} render={<a href="/inbox" />}>
          <span>Inbox</span>
          <SidebarMenuBadge>12</SidebarMenuBadge>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>,
  );
  assert.match(html, /<a href="\/inbox"[^>]* class="fui-sidebar-menu-button peer\/menu-button group\/menu-button"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /--fui-sidebar-depth:2/);
  assert.match(html, /<span[^>]*data-slot="sidebar-menu-badge"[^>]*>12<\/span>/);
  const rules = rule('.fui-sidebar-menu-button[data-size="touch"] {');
  assert.match(rules, /min-block-size: var\(--fui-control-height-lg\)/);
  assert.match(rules, /border-width: var\(--fui-sidebar-inset\) 0/);
  assert.match(rules, /background-clip: padding-box/);
  // The active bar is the 2 px Stormlight ink bar everywhere, inline-start (RTL-correct).
  assert.match(rule('.fui-sidebar-menu-button[data-active]::before'), /inset-inline-start: 0/);
  assert.match(rule('.fui-sidebar-menu-button[data-active]::before'), /var\(--fui-bar\)/);
  // The name ellipsizes, not the count that follows it.
  assert.match(styles, /\.fui-sidebar-menu-button > span:has\(\+ :is\(\.fui-sidebar-menu-badge, \.fui-badge\)\)/);
});

// ------------------------------------------------------------------------------ Resizable

test("resizable handle: a hairline with a Stormlight line on hover, drag and focus, transparent when disabled", () => {
  assert.match(rule(".fui-resizable-handle {"), /inline-size: 1px/);
  assert.match(rule(".fui-resizable-handle {"), /outline: 0/);
  assert.match(rule('.fui-resizable-handle:is([data-separator="hover"], [data-separator="active"], [data-separator="focus"]) {'), /box-shadow: 0 0 0 1px var\(--ring\)/);
  assert.match(rule('.fui-resizable-handle[data-separator="disabled"]'), /background: transparent/);
  assert.match(rule('.fui-resizable-handle[aria-orientation="horizontal"]'), /block-size: 1px/);
  assert.match(styles, /forced-colors: active\) \{\s*\.fui-resizable-handle/);
  assert.equal(typeof ResizableHandle, "function");
});

// ------------------------------------------------------------------------------ NavSwitcher

test("nav switcher: the trigger is named by its words, the title and the detail, and its marks are hidden", () => {
  const html = renderToStaticMarkup(
    <NavSwitcher layout="inline">
      <NavSwitcherTrigger label="Switch mailbox" mark="A" title="ana@example.test" description="Personal" tag={<b>2</b>} />
    </NavSwitcher>,
  );
  assert.match(html, /data-layout="inline"/);
  assert.match(html, /<span class="fui-nav-switcher-mark" aria-hidden="true">A<\/span>/);
  assert.match(html, /<span class="fui-sr-only">Switch mailbox: <\/span>/);
  assert.match(html, /<span class="fui-nav-switcher-title" dir="auto">ana@example.test<\/span>/);
  assert.match(html, /<span class="fui-nav-switcher-tag"><b>2<\/b><\/span>/);
  assert.match(html, /class="[^"]*fui-nav-switcher-chevron[^"]*"[^>]*aria-hidden="true"/);
  // Block is a size container for the mark; the popover only scrolls its list.
  assert.match(rule('\n  .fui-nav-switcher-trigger[data-layout="block"] {'), /container: nav-switcher \/ inline-size/);
  assert.match(rule(".fui-nav-switcher-list {"), /overflow-y: auto/);
  assert.match(rule(".fui-popover.fui-nav-switcher-popover {"), /--sidebar-accent: var\(--accent\)/);
});

test("nav switcher: contain is on by default (markup unchanged); contain={false} marks the trigger so it makes no container", () => {
  const trigger = <NavSwitcherTrigger label="Switch mailbox" mark="A" title="ana@example.test" />;
  const base = renderToStaticMarkup(<NavSwitcher>{trigger}</NavSwitcher>);
  assert.match(base, /data-layout="block"/);
  assert.doesNotMatch(base, /data-contain/);
  assert.equal(renderToStaticMarkup(<NavSwitcher contain>{trigger}</NavSwitcher>), base);
  const open = renderToStaticMarkup(<NavSwitcher contain={false}>{trigger}</NavSwitcher>);
  assert.match(open, /data-layout="block"[^>]*data-contain="false"/);
  assert.match(rule('.fui-nav-switcher-trigger[data-layout="block"][data-contain="false"] {'), /container: none/);
  // The mark rules keep reading the name nav-switcher, on the trigger or on an ancestor the host names.
  assert.match(styles, /@container nav-switcher \(max-width: 17\.5rem\)/);
  assert.match(styles, /@container nav-switcher \(max-width: 15rem\)/);
});

// -------------------------------------------------------------------------- SettingsSection

test("settings section: the section is the size container, an inner grid answers to it, stacked opts out", () => {
  const html = renderToStaticMarkup(
    <SettingsSection title="Theme" description="Help" headingLevel={3} headingProps={{ id: "theme-title", tabIndex: -1 }} layout="stacked" id="theme">
      body
    </SettingsSection>,
  );
  assert.match(html, /<section id="theme" aria-labelledby="theme-title" aria-describedby="theme-description" data-layout="stacked" class="fui-settings-section">/);
  assert.match(html, /<div class="fui-settings-section-layout">/);
  assert.match(html, /<h3 id="theme-title" tabindex="-1" class="fui-settings-section-title">Theme<\/h3>/);
  const auto = renderToStaticMarkup(<SettingsSection title="Theme">x</SettingsSection>);
  assert.match(auto, /data-layout="auto"/);
  assert.match(auto, /aria-labelledby="[^"]+-heading"/);
  const section = rule(".fui-settings-section {");
  assert.match(section, /container: fui-settings-section \/ inline-size/);
  assert.match(section, /inline-size: 100%/); // a container with inline containment has no intrinsic width
  assert.doesNotMatch(section, /display: grid/);
  const query = container("fui-settings-section (min-width: 36rem)");
  assert.match(query, /:not\(\[data-layout="stacked"\]\) > \.fui-settings-section-layout/);
  assert.match(query, /grid-template-columns: minmax\(0, 13rem\) minmax\(0, 1fr\)/);
  assert.doesNotMatch(styles, /@media \(min-width: 768px\) \{\s*\.fui-settings-section \{/);
});

// ---------------------------------------------------------------------- Headings and tabs

test("headings: a level, a ref target and attributes on PageHeader and SectionHeader; the look does not change with the level", () => {
  assert.match(renderToStaticMarkup(<PageHeader title="Tools" />), /<h1 class="fui-page-title">Tools<\/h1>/);
  assert.match(renderToStaticMarkup(<PageHeader title="Tools" headingLevel={2} headingProps={{ id: "t", tabIndex: -1 }} />), /<h2 id="t" tabindex="-1" class="fui-page-title">/);
  assert.match(renderToStaticMarkup(<SectionHeader title="Runs" />), /<h2 class="fui-section-title">Runs<\/h2>/);
  assert.match(renderToStaticMarkup(<SectionHeader title="Runs" headingLevel={4} />), /<h4 class="fui-section-title">/);
  assert.match(styles, /\.fui-page-heading h1,\s*\.fui-page-title \{/);
  assert.match(styles, /\.fui-section-header h2,\s*\.fui-section-title,/);
  // A heading a host focuses from code shows a ring (the global rule only covers elements it can select by class prefix at zero specificity).
  assert.match(rule(":is(.fui-page-title, .fui-section-title, .fui-settings-section-title):focus-visible"), /outline: 2px solid var\(--fui-focus\)/);
});

test("SectionHeader aside: beside the title, outside the heading; without it the markup is the 0.8.0 markup", () => {
  // Captured from 0.8.0 before the change.
  assert.equal(
    renderToStaticMarkup(<SectionHeader title="Runs" description="d" actions={<i>a</i>} />),
    '<header class="fui-section-header"><div><h2 class="fui-section-title">Runs</h2><p class="fui-description">d</p></div><div class="fui-actions"><i>a</i></div></header>',
  );
  assert.equal(renderToStaticMarkup(<SectionHeader title="Runs" />), '<header class="fui-section-header"><div><h2 class="fui-section-title">Runs</h2></div></header>');
  const html = renderToStaticMarkup(<SectionHeader title="Mailboxes" aside={<b>3 of 10</b>} description="d" actions={<i>a</i>} headingLevel={3} headingProps={{ id: "h" }} />);
  assert.equal(
    html,
    '<header class="fui-section-header"><div><div class="fui-section-heading-row"><h3 id="h" class="fui-section-title">Mailboxes</h3><span class="fui-section-aside"><b>3 of 10</b></span></div><p class="fui-description">d</p></div><div class="fui-actions"><i>a</i></div></header>',
  );
  // The heading's accessible name is the title: the tag is a sibling, never inside it.
  assert.doesNotMatch(html, /<h3[^>]*>[^<]*<[^/]/);
  assert.doesNotMatch(html, /<h3[^>]*>[^<]*3 of 10/);
  // The row wraps by the header's own width and adds no containment (a size container would change every existing header).
  assert.match(rule(".fui-section-heading-row {"), /flex-wrap: wrap/);
  assert.match(rule(".fui-section-heading-row {"), /align-items: center/);
  assert.doesNotMatch(rule(".fui-section-heading-row {"), /container/);
  assert.doesNotMatch(rule(".fui-section-header {"), /container/);
});

test("BulkActions: used as one piece the markup is the 0.8.0 markup at counts 0, 2 and 0 kept mounted", () => {
  // Captured from 0.8.0 before the parts were added.
  assert.equal(renderToStaticMarkup(<BulkActions count={0}><b>x</b></BulkActions>), "");
  assert.equal(renderToStaticMarkup(<BulkActions count={2}><b>x</b></BulkActions>), "<div class=\"fui-bulk-actions\" role=\"group\" aria-label=\"Selection actions\"><span role=\"status\">2 selected</span><div class=\"fui-actions\"><b>x</b></div></div>");
  assert.equal(renderToStaticMarkup(<BulkActions count={0} keepMounted><b>x</b></BulkActions>), "<div class=\"fui-bulk-actions\" role=\"group\" aria-label=\"Selection actions\" data-empty=\"true\"><span role=\"status\">0 selected</span><div class=\"fui-actions\" hidden=\"\"><b>x</b></div></div>");
});

test("BulkActions parts: one count for a status and an actions group that sit in different places", () => {
  const layout = (count: number, keepMounted?: boolean, hidden?: boolean) =>
    renderToStaticMarkup(
      <BulkActionsRoot count={count} keepMounted={keepMounted} className="bar">
        <label>Select all</label>
        <BulkActionsStatus />
        <form>
          <BulkActionsContent hidden={hidden}>
            <button type="button">Apply</button>
          </BulkActionsContent>
        </form>
      </BulkActionsRoot>,
    );
  // 2: a plain div (no role, no bar look) around what the consumer puts in it; the status outside the group, the group labelled.
  assert.equal(
    layout(2),
    '<div class="fui-bulk-actions-root bar"><label>Select all</label><span role="status" class="fui-bulk-actions-status">2 selected</span><form><div role="group" aria-label="Selection actions" class="fui-bulk-actions-content"><button type="button">Apply</button></div></form></div>',
  );
  // 0 without keepMounted: the parts are not rendered, what else is in the root is (select-all must stay).
  assert.equal(layout(0), '<div class="fui-bulk-actions-root bar" data-empty="true"><label>Select all</label><form></form></div>');
  // 0 kept mounted: the live region exists (visually hidden by data-empty), the actions are hidden but mounted.
  assert.equal(
    layout(0, true),
    '<div class="fui-bulk-actions-root bar" data-empty="true"><label>Select all</label><span role="status" class="fui-bulk-actions-status" data-empty="true">0 selected</span><form><div role="group" aria-label="Selection actions" class="fui-bulk-actions-content" hidden=""><button type="button">Apply</button></div></form></div>',
  );
  // A layout may keep the actions closed at any count (a phone row) without unmounting them.
  assert.match(layout(3, false, true), /class="fui-bulk-actions-content" hidden=""/);
  // Words are the consumer's: the status text, the group's name.
  const custom = renderToStaticMarkup(
    <BulkActionsRoot count={1} regionLabel="Acciones de selección">
      <BulkActionsStatus>Seleccionados: 1</BulkActionsStatus>
      <BulkActionsContent id="form">x</BulkActionsContent>
    </BulkActionsRoot>,
  );
  assert.match(custom, /<span role="status" class="fui-bulk-actions-status">Seleccionados: 1<\/span>/);
  assert.match(custom, /<div role="group" aria-label="Acciones de selección" id="form" class="fui-bulk-actions-content">x<\/div>/);
  // The parts need the root (a status without a count is a bug, not an empty render).
  assert.throws(() => renderToStaticMarkup(<BulkActionsStatus />), /must be inside BulkActionsRoot/);
  assert.throws(() => renderToStaticMarkup(<BulkActionsContent>x</BulkActionsContent>), /must be inside BulkActionsRoot/);
  // CSS: the status is visually hidden at 0 without leaving the tree; a hidden group wins over the layout's display.
  assert.match(rule(".fui-bulk-actions-status[data-empty] {"), /clip-path: inset\(50%\)/);
  assert.match(rule(".fui-bulk-actions-content[hidden] {"), /display: none !important/);
  assert.doesNotMatch(styles, /\.fui-bulk-actions-root\s*\{/); // no look of its own: the layout is the consumer's
});

test("tabs: the root has a class, a strip is data-scrollable, a vertical rail has its own rules and the indicator follows the active tab", () => {
  const html = renderToStaticMarkup(
    <Tabs defaultValue="a" orientation="vertical">
      <TabsList aria-label="Sections" scrollable="narrow"><TabsTrigger value="a">A</TabsTrigger></TabsList>
    </Tabs>,
  );
  assert.match(html, /class="fui-tabs"/);
  assert.match(html, /data-scrollable="narrow"/);
  assert.match(renderToStaticMarkup(<Tabs defaultValue="a"><TabsList aria-label="s" scrollable><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>), /data-scrollable="always"/);
  assert.doesNotMatch(renderToStaticMarkup(<Tabs defaultValue="a"><TabsList aria-label="s"><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs>), /data-scrollable/);
  const rail = rule('.fui-tabs-list[data-orientation="vertical"] {');
  assert.match(rail, /flex-direction: column/);
  assert.match(rail, /border-inline-end: 1px solid var\(--sidebar-border\)/);
  assert.match(rule('.fui-tabs-list[data-orientation="vertical"] .fui-tab[data-active]'), /background: var\(--sidebar-accent\)/);
  const indicator = rule('.fui-tabs-list[data-orientation="vertical"] .fui-tabs-indicator');
  assert.match(indicator, /inset-inline-start: 0/);
  assert.match(indicator, /width: var\(--fui-bar\)/);
  assert.match(indicator, /background: var\(--brand-ink\)/);
  const strip = rule('.fui-tabs-list[data-scrollable="always"] {');
  assert.match(strip, /flex-wrap: nowrap/);
  assert.match(strip, /overflow-x: auto/);
  assert.match(strip, /scroll-snap-type: x proximity/);
  assert.match(rule('.fui-tabs-list[data-scrollable="always"] .fui-tab:focus-visible'), /outline-offset: -2px/);
  assert.match(styles, /@media \(max-width: 47\.99rem\) \{\s*\.fui-tabs-list\[data-scrollable="narrow"\]/);
  // The indicator is anchored to the active tab, so a wrapped list still underlines the right row.
  assert.match(rule(".fui-tabs-indicator {"), /top: calc\(var\(--active-tab-top\) \+ var\(--active-tab-height\) - 1px\)/);
  assert.doesNotMatch(rule(".fui-tabs-indicator {"), /bottom:/);
});
