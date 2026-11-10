import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSearch,
  SidebarTrigger,
  useIsMobile,
  useMediaQuery,
} from "../../packages/ui/src/index";
import { sidebarEdge, sidebarTooltipSide } from "../../packages/ui/src/sidebar-side";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const source = readFileSync(new URL("../../packages/ui/src/sidebar.tsx", import.meta.url), "utf8");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};
/** The whole sidebar section and the 0.12 block, where a physical declaration must not come back. */
const sidebarRules = () => {
  const from = styles.indexOf("/* ---------------------------------------------------------------- sidebar */");
  const to = styles.indexOf("/* --------------------------------------------------------------- command */");
  assert.ok(from >= 0 && to > from);
  return styles.slice(from, to);
};

function Probe() {
  return (
    <span data-mobile={String(useIsMobile())} data-narrow={String(useMediaQuery("(max-width: 10px)"))} data-wide={String(useMediaQuery("(min-width: 10px)", true))} />
  );
}

test("the media hooks answer the server value on the server: false, or what the caller says", () => {
  const html = renderToStaticMarkup(<Probe />);
  assert.match(html, /data-mobile="false"/);
  assert.match(html, /data-narrow="false"/);
  assert.match(html, /data-wide="true"/);
  const hook = readFileSync(new URL("../../packages/ui/src/use-media-query.ts", import.meta.url), "utf8");
  assert.match(hook, /useSyncExternalStore\(/);
  assert.match(hook, /\(max-width: \$\{breakpoint - 1\}px\)/);
  // The sidebar reads the same hook: no effect that flips a state after the first paint.
  assert.match(source, /import \{ useIsMobile \} from "\.\/use-media-query"/);
  assert.doesNotMatch(source, /matchMedia/);
});

test("a sidebar's edge: left and right are physical, start and end follow the direction, and the tooltip opens away from it", () => {
  assert.deepEqual(
    (["left", "right", "start", "end"] as const).map((side) => [sidebarEdge(side, "ltr"), sidebarEdge(side, "rtl")]),
    [["left", "left"], ["right", "right"], ["left", "right"], ["right", "left"]],
  );
  assert.deepEqual(
    (["left", "right", "start", "end"] as const).map((side) => [sidebarTooltipSide(side, "ltr"), sidebarTooltipSide(side, "rtl")]),
    [["right", "right"], ["left", "left"], ["right", "left"], ["left", "right"]],
  );
  assert.equal(sidebarTooltipSide("left"), "right");
  assert.match(source, /side=\{sidebarTooltipSide\(place\?\.side \?\? "left", direction\)\}/);
  assert.doesNotMatch(source, /side="right"/);
});

test("markup: the side is on the sidebar and its container, the Tailwind marker classes are gone, the new parts have their slots", () => {
  const html = renderToStaticMarkup(
    <SidebarProvider navigationKey="/inbox">
      <Sidebar side="end" collapsible="icon">
        <SidebarHeader>
          <SidebarClose />
          <SidebarSearch aria-label="Search projects" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Inbox">
                <span>Inbox</span>
              </SidebarMenuButton>
              <SidebarMenuAction aria-label="More for Inbox" />
              <SidebarMenuBadge>12</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarTrigger />
    </SidebarProvider>,
  );
  assert.match(html, /<div[^>]*class="fui-sidebar-wrapper"/);
  assert.match(html, /class="fui-sidebar group peer"[^>]*data-side="end"/);
  assert.match(html, /data-slot="sidebar-container"[^>]*data-side="end"|data-side="end"[^>]*class="fui-sidebar-container"/);
  assert.match(html, /<li[^>]*class="fui-sidebar-menu-item"/);
  assert.match(html, /class="fui-sidebar-menu-button"/);
  assert.doesNotMatch(html, /group\/|peer\//);
  assert.doesNotMatch(source, /group\/|peer\//);
  // The close key belongs to the phone sheet: on the desktop (and on the server) it draws nothing.
  assert.doesNotMatch(html, /sidebar-close/);
  const search = html.match(/<input[^>]*data-slot="sidebar-search"[^>]*>/)![0];
  assert.match(search, /type="search"/);
  assert.match(search, /dir="auto"/);
  assert.match(search, /aria-label="Search projects"/);
  assert.match(html, /class="fui-search-input fui-sidebar-search"[^>]*data-size="sm"/);
  assert.match(html, /<svg[^>]*class="[^"]*fui-sidebar-trigger-icon/);
});

test("the provider closes the phone sheet when the navigation key changes, and imports no router", () => {
  assert.match(source, /navigationKey\?: unknown;/);
  assert.match(source, /if \(!Object\.is\(seenNavigationKey, navigationKey\)\) \{\s*setSeenNavigationKey\(navigationKey\);\s*setOpenMobile\(false\);/);
  assert.doesNotMatch(source, /from "next|react-router|usePathname/);
  // The sheet's close key: a part for the header, or a default one in its own row; off unless asked for.
  assert.match(source, /sheetCloseButton = false/);
  assert.match(source, /if \(!place\?\.sheet\) return null;/);
  assert.match(source, /label=\{label \?\? place\.closeLabel\}/);
  assert.match(source, /const defaultCloseLabel = "Close navigation";/);
});

test("the focus ring is drawn inside every row and both action keys, where the scroll area cannot clip it", () => {
  const ring = styles.match(/\.fui-sidebar-menu-button:focus-visible,\s*\.fui-sidebar-menu-sub-button:focus-visible,\s*\.fui-sidebar-menu-action:focus-visible,\s*\.fui-sidebar-group-action:focus-visible,\s*\.fui-sidebar-group-label:focus-visible \{([^}]*)\}/);
  assert.ok(ring, "missing the inside ring rule");
  assert.match(ring[1]!, /outline-offset: -2px;/);
  assert.match(rule('.fui-sidebar-menu-button[data-size="touch"]:focus-visible {'), /outline-offset: calc\(-1 \* \(var\(--fui-sidebar-inset\) \+ 2px\)\);/);
});

test("the action and the floating count are centred on the row, whatever its height, at the inline end", () => {
  const item = rule(".fui-sidebar-menu-item {");
  assert.match(item, /position: relative;/);
  assert.match(item, /display: grid;/);
  assert.match(item, /grid-template-columns: minmax\(0, 1fr\);/);
  for (const selector of ["\n  .fui-sidebar-menu-action {", "\n  .fui-sidebar-menu-badge {"]) {
    const part = rule(selector);
    assert.match(part, /position: absolute;/);
    assert.match(part, /grid-area: 1 \/ 1 \/ 2 \/ 2;/);
    assert.match(part, /top: calc\(50% - 0\.625rem\);/);
    assert.match(part, /inset-inline-end: var\(--fui-space-1\);/);
  }
  assert.match(rule(".fui-sidebar-group-action {"), /inset-inline-end: var\(--fui-space-4\);/);
  // The per-size offsets are gone with the fixed top.
  assert.doesNotMatch(styles, /\.fui-sidebar-menu-button\[data-size="(sm|lg)"\] ~ \.fui-sidebar-menu-action/);
  const coarse = styles.match(/@media \(pointer: coarse\) \{\s*\.fui-sidebar-menu-action::after,\s*\.fui-sidebar-group-action::after \{([^}]*)\}/);
  assert.ok(coarse, "missing the coarse-pointer target of the action keys");
  assert.match(coarse[1]!, /inset: calc\(\(100% - var\(--fui-control-height-lg\)\) \/ 2\);/);
});

test("every side has its edge, border, off-canvas offset and rail; the sidebar section has no physical inset left but the two physical sides", () => {
  assert.match(rule('.fui-sidebar-container[data-side="start"] {'), /inset-inline-start: 0;/);
  assert.match(rule('.fui-sidebar-container[data-side="end"] {'), /inset-inline-end: 0;/);
  assert.match(rule('.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="start"] {'), /border-inline-end:/);
  assert.match(rule('.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="end"] {'), /border-inline-start:/);
  // A physical side keeps its border on the inner edge in a right-to-left page too.
  assert.match(rule('.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="left"] {'), /border-right:/);
  assert.match(rule('.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="right"] {'), /border-left:/);
  assert.match(rule('.fui-sidebar[data-collapsible="offcanvas"] .fui-sidebar-container[data-side="start"] {'), /inset-inline-start: calc\(var\(--sidebar-width\) \* -1\);/);
  assert.match(rule('.fui-sidebar[data-collapsible="offcanvas"] .fui-sidebar-container[data-side="end"] {'), /inset-inline-end: calc\(var\(--sidebar-width\) \* -1\);/);
  assert.match(rule(".fui-sidebar-rail {"), /inset-inline-end: -0\.5rem;/);
  assert.match(rule('.fui-sidebar[data-side="end"] .fui-sidebar-rail {'), /inset-inline: -0\.5rem auto;/);
  assert.match(rule('.fui-sidebar[data-side="left"] .fui-sidebar-rail {'), /right: -0\.5rem;/);
  assert.match(rule('.fui-sidebar[data-side="right"] .fui-sidebar-rail {'), /left: -0\.5rem;/);
  const sub = rule(".fui-sidebar-menu-sub {");
  assert.match(sub, /margin-inline-start: 1\.125rem;/);
  assert.match(sub, /padding-inline-start: 0\.625rem;/);
  const physical = [...sidebarRules().matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => /(^|[\s;])(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/.test(body!))
    .map(([, selector]) => selector!.replace(/\/\*[\s\S]*?\*\//g, "").trim().replace(/\s+/g, " "));
  assert.deepEqual(physical, [
    '.fui-sidebar-container[data-side="left"]',
    '.fui-sidebar-container[data-side="right"]',
    '.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="left"]',
    '.fui-sidebar[data-variant="sidebar"] .fui-sidebar-container[data-side="right"]',
    '.fui-sidebar[data-collapsible="offcanvas"] .fui-sidebar-container[data-side="left"]',
    '.fui-sidebar[data-collapsible="offcanvas"] .fui-sidebar-container[data-side="right"]',
    '.fui-sidebar[data-side="left"] .fui-sidebar-rail',
    '.fui-sidebar[data-side="right"] .fui-sidebar-rail',
    ".fui-sidebar-rail::after",
  ]);
});

test("the current row reads four tokens whose fallbacks are what it has always drawn; forced colors shows the bar whatever the token says", () => {
  const active = rule(".fui-sidebar-menu-button[data-active] {");
  assert.match(active, /background: var\(--fui-sidebar-active\);/);
  assert.match(active, /box-shadow: var\(--fui-sidebar-active-shadow, var\(--fui-shadow-xs\), var\(--fui-highlight\)\);/);
  assert.match(active, /color: var\(--fui-sidebar-active-ink, var\(--sidebar-accent-foreground\)\);/);
  assert.match(rule(".fui-sidebar-menu-button[data-active] svg {"), /color: var\(--fui-sidebar-active-icon, var\(--fui-sidebar-active-ink, var\(--sidebar-accent-foreground\)\)\);/);
  assert.match(rule(".fui-sidebar-menu-button[data-active]::before {"), /background: var\(--fui-sidebar-active-bar, var\(--brand-ink\)\);/);
  assert.match(
    rule('.fui-sidebar-menu-button[data-size="touch"][data-active] {'),
    /box-shadow: var\(\s*--fui-sidebar-active-shadow,\s*inset 0 0 0 1px color-mix\(in oklab, var\(--foreground\) 7%, transparent\),\s*var\(--fui-highlight\)\s*\);/,
  );
  assert.match(rule('.fui-sidebar-menu-button[data-size="touch"][data-active] svg {'), /color: var\(--fui-sidebar-active-icon, var\(--muted-foreground\)\);/);
  assert.match(styles, /@media \(forced-colors: active\) \{\s*\.fui-sidebar-menu-button\[data-active\]::before \{\s*background: Highlight;/);
});

test("the sheet's close row, the search and the trigger's icon", () => {
  assert.match(rule(".fui-sidebar-sheet-bar {"), /justify-content: flex-end;/);
  assert.match(rule(".fui-sidebar-search .fui-input {"), /background: var\(--background\);\s*box-shadow: none;/);
  assert.match(rule('.fui-sidebar[data-collapsible="icon"] .fui-sidebar-search {'), /display: none;/);
  assert.match(rule(".fui-sidebar-trigger-icon:dir(rtl) {"), /transform: scaleX\(-1\);/);
});
