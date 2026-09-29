import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AuthLayout,
  Badge,
  BulkActions,
  CommandOption,
  CommandOptionList,
  CommandTrigger,
  DescriptionList,
  DialogBody,
  DialogFooter,
  StatusPopover,
} from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

/** The declarations of the first rule whose selector is written exactly as `selector` (up to its closing brace). */
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

// ------------------------------------------------------------------ Dialog

test("dialog parts: body and footer carry their hooks, and the footer has no slot or Close outside a DialogContent", () => {
  assert.equal(
    renderToStaticMarkup(<DialogBody scroll={false} padding="none">x</DialogBody>),
    '<div class="fui-dialog-body" data-scroll="false" data-padding="none">x</div>',
  );
  assert.equal(renderToStaticMarkup(<DialogBody>x</DialogBody>), '<div class="fui-dialog-body">x</div>');
  // no context (server output, an alert dialog): the footer is only its children
  assert.equal(renderToStaticMarkup(<DialogFooter>go</DialogFooter>), '<div class="fui-dialog-footer">go</div>');
});

test("the fixed layout is opt-in: only a direct DialogBody switches it on, and it is a size container for the footer", () => {
  const fixed = rule(".fui-dialog:has(> .fui-dialog-body) {");
  assert.match(fixed, /container: fui-dialog \/ inline-size/);
  assert.match(fixed, /display: flex/);
  assert.match(fixed, /overflow: hidden/);
  assert.match(rule(".fui-dialog-body {"), /overflow-y: auto/);
  const header = rule(".fui-dialog:has(> .fui-dialog-body) > .fui-dialog-header {");
  assert.match(header, /flex: none/);
  assert.match(header, /border-block-end: 1px solid var\(--border\)/);
  // no rule outside a :has(> .fui-dialog-body) or [data-size] scope changes the plain dialog's padding
  assert.match(rule(".fui-dialog {"), /padding: var\(--fui-space-6\)/);
});

test("the footer wraps under 34rem: the ink action keeps its place, last, on a full row; the rest share rows; 44 px targets", () => {
  const wrap = container("fui-dialog (max-width: 34rem)");
  assert.match(wrap, /\.fui-dialog-footer > \.fui-button\[data-variant="default"\]/);
  assert.doesNotMatch(wrap, /order:/); // visual order is the DOM (tab) order: Close, the others, the ink action last
  assert.match(wrap, /flex-basis: 100%/);
  assert.match(styles, /\.fui-dialog:has\(> \.fui-dialog-body\) > \.fui-dialog-footer > \.fui-button/);
  assert.match(styles, /min-block-size: var\(--fui-control-height-lg\)/);
});

test("a short window scrolls the dialog as a whole and keeps only the footer; a phone keeps the safe areas", () => {
  const at = styles.indexOf("@media (max-height: 30rem) {\n    .fui-dialog:has(> .fui-dialog-body) {");
  assert.ok(at > 0);
  const block = styles.slice(at, at + 700);
  assert.match(block, /position: sticky/);
  assert.match(block, /inset-block-end: 0/);
  assert.match(styles, /padding-block-end: max\(var\(--fui-space-3\), env\(safe-area-inset-bottom, 0px\)\)/);
});

test("sizes: settings is 62 by 42rem (72 by 48 from 100rem), wide 46rem, and the big ones are the whole screen below 48rem", () => {
  assert.match(rule('.fui-dialog[data-size="settings"] {'), /width: min\(62rem, calc\(100vw - 3rem\)\)/);
  assert.match(rule('.fui-dialog[data-size="settings"] {'), /height: min\(42rem, calc\(100dvh - 3rem\)\)/);
  assert.match(styles, /@media \(min-width: 100rem\) \{\s*\.fui-dialog\[data-size="settings"\] \{\s*width: min\(72rem, calc\(100vw - 6rem\)\);\s*height: min\(48rem, calc\(100dvh - 6rem\)\)/);
  assert.match(rule('.fui-dialog[data-size="wide"] {'), /width: min\(46rem, calc\(100vw - 2rem\)\)/);
  const phone = styles.slice(styles.indexOf("@media (max-width: 47.99rem) {\n    .fui-dialog[data-placement=\"center\"]:is("));
  assert.match(phone.slice(0, 600), /\[data-size="full-narrow"\]/);
  assert.match(phone.slice(0, 700), /height: 100dvh/);
});

test("a kept-mounted overlay is hidden with display none, which beats any rule that sets display", () => {
  const hidden = rule(".fui-dialog[hidden],");
  for (const selector of [".fui-backdrop[hidden]", ".fui-positioner[hidden]", ".fui-popover[hidden]", ".fui-menu[hidden]"]) assert.ok(hidden.includes(selector), selector);
  assert.match(hidden, /display: none !important/);
});

test("the corner close is a logical inset (right to left)", () => {
  assert.match(rule(".fui-dialog-close {"), /inset-inline-end: var\(--fui-space-3\)/);
  assert.doesNotMatch(rule(".fui-dialog-close {"), /right:/);
});

// ------------------------------------------------------- Command trigger, rows

test("CommandTrigger: server markup is exact (Ctrl), the key hint is aria-hidden, the shortcut is derived and constant", () => {
  const html = renderToStaticMarkup(<CommandTrigger label="Search or run a command" keys={["mod", "K"]} />);
  assert.match(html, /aria-label="Search or run a command"/);
  assert.match(html, /aria-keyshortcuts="Control\+K Meta\+K"/);
  assert.match(html, /<kbd class="fui-kbd-group fui-command-trigger-keys" aria-hidden="true"><kbd class="fui-kbd">Ctrl<\/kbd><kbd class="fui-kbd">K<\/kbd><\/kbd>/);
  assert.match(html, /class="fui-button fui-command-trigger"/);
  assert.match(html, /data-variant="secondary"/);
  assert.match(html, /<span class="fui-command-trigger-label">Search or run a command<\/span>/);
  const compact = renderToStaticMarkup(<CommandTrigger label="Search" name="Search or run a command" compact shortcut={false} keys={["mod", "K"]} />);
  assert.match(compact, /data-compact="true"/);
  assert.match(compact, /aria-label="Search or run a command"/);
  assert.doesNotMatch(compact, /aria-keyshortcuts/);
  assert.doesNotMatch(renderToStaticMarkup(<CommandTrigger label="Go" />), /fui-command-trigger-keys/);
  // a sequence is not a chord: the word between the keys, and no aria-keyshortcuts (it cannot express steps)
  const sequence = renderToStaticMarkup(<CommandTrigger label="Go" keys={["G", "K"]} sequence />);
  assert.match(sequence, /data-sequence="true"/);
  assert.match(sequence, /<kbd class="fui-kbd">G<\/kbd><span class="fui-kbd-separator">then<\/span><kbd class="fui-kbd">K<\/kbd>/);
  assert.doesNotMatch(sequence, /aria-keyshortcuts/);
});

test("the launcher goes icon-only inside a container named command, and hides the key hint on coarse pointers", () => {
  const narrow = container("command (max-width: 11.99rem)");
  assert.match(narrow, /\.fui-command-trigger-label/);
  assert.match(narrow, /display: none/);
  assert.match(rule(".fui-button.fui-command-trigger {"), /--fui-button-border: var\(--fui-control-border\)/);
  assert.match(styles, /@media \(pointer: coarse\) \{\s*\.fui-command-trigger-keys \{\s*display: none/);
});

test("CommandOption: role, selection, disabled and the slots", () => {
  const html = renderToStaticMarkup(
    <CommandOptionList aria-label="Commands">
      <CommandOption id="a" label="Go to Inbox" detail="12 unread" group="Navigation" active icon={<svg />} keys={<kbd>G</kbd>} />
      <CommandOption id="b" label="Archive" disabled reason="Select a message first." />
    </CommandOptionList>,
  );
  assert.match(html, /^<ul role="listbox" tabindex="-1" class="fui-command-options" aria-label="Commands">/);
  assert.match(html, /<li role="option" aria-selected="true" aria-disabled="false" data-active="true" data-icon="" class="fui-command-item fui-command-option" id="a">/);
  assert.match(html, /<li role="option" aria-selected="false" aria-disabled="true" class="fui-command-item fui-command-option" id="b">/);
  assert.match(html, /<span class="fui-command-detail" dir="auto">12 unread<\/span>/);
  assert.match(html, /<span class="fui-command-option-group" dir="auto">Navigation<\/span>/);
  assert.match(html, /<span class="fui-command-reason" dir="auto">Select a message first\.<\/span>/);
  assert.match(html, /<span class="fui-command-option-keys"><kbd>G<\/kbd><\/span>/);
});

test("command rows: the active alias has the fill and the 2 px bar, a disabled row is muted but not inert, cmdk keeps its own", () => {
  const selector = '.fui-command-item:is([data-selected="true"], [data-active], [aria-selected="true"])';
  assert.ok(styles.includes(selector + " {"));
  assert.ok(styles.includes(selector + "::before {"));
  const bar = rule(selector + "::before {");
  assert.match(bar, /inline-size: var\(--fui-bar\)/);
  assert.match(bar, /background: var\(--brand-ink\)/);
  const soft = rule('.fui-command-item[aria-disabled="true"]:not([data-disabled="true"]) {');
  assert.match(soft, /cursor: not-allowed/);
  assert.doesNotMatch(soft, /pointer-events/);
  assert.match(rule('.fui-command-item[data-disabled="true"] {'), /pointer-events: none/);
  const narrow = container("fui-command-options (max-width: 31.99rem)");
  assert.match(narrow, /\.fui-command-option-main \{\s*display: contents/);
});

test("the command dialog follows DESIGN.md: 6 px, overlay shadow and highlight, one top for placement and height", () => {
  const dialog = rule(".fui-dialog.fui-command-dialog {");
  assert.match(dialog, /--fui-command-top: min\(14dvh, 9rem\)/);
  assert.match(dialog, /max-height: calc\(100dvh - var\(--fui-command-top\) - 1\.5rem\)/);
  assert.match(dialog, /border-radius: var\(--fui-radius-lg\)/);
  assert.match(dialog, /box-shadow: var\(--fui-shadow-overlay\), var\(--fui-highlight\)/);
  assert.match(rule('.fui-dialog.fui-command-dialog[data-placement="center"] {'), /top: var\(--fui-command-top\)/);
});

// ------------------------------------------------------------------- Accordion

test("accordion rows: a heading at the level, the tags and the chevron outside the trigger, the trigger described by them", () => {
  const html = renderToStaticMarkup(
    <Accordion variant="rows" defaultValue={["a"]}>
      <AccordionItem value="a">
        <AccordionTrigger headingLevel={2} icon={<svg />} aside={<Badge>3</Badge>}>
          Reminders
        </AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  assert.match(html, /data-variant="rows"/);
  assert.match(html, /<div class="fui-accordion-head"><h2 [^>]*tabindex="-1" class="fui-accordion-header"/);
  const trigger = html.slice(html.indexOf("<button"), html.indexOf("</button>"));
  assert.match(trigger, /aria-describedby="([^"]+)"/);
  assert.doesNotMatch(trigger, /fui-accordion-chevron/);
  assert.doesNotMatch(trigger, />3</);
  assert.match(html, /<span id="[^"]+" class="fui-accordion-aside">/);
  assert.match(html, /<\/h2><span id="[^"]+" class="fui-accordion-aside">.*<\/span><svg [^>]*fui-accordion-chevron/);
  assert.match(html, /<span class="fui-accordion-title">Reminders<\/span>/);
});

test("the default accordion keeps its markup: no head wrapper, the chevron inside the trigger", () => {
  const html = renderToStaticMarkup(
    <Accordion>
      <AccordionItem value="a">
        <AccordionTrigger>Plain</AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  assert.doesNotMatch(html, /fui-accordion-head"|data-variant="rows"|tabindex="-1"/);
  assert.match(html, /<button[^>]*>Plain<svg [^>]*fui-accordion-chevron/);
});

test("rows are a 44 px target that stretches over the row, with the ring drawn inside on the pseudo-element", () => {
  assert.match(rule(".fui-accordion-head {"), /min-block-size: var\(--fui-control-height-lg\)/);
  assert.match(rule(".fui-accordion-head .fui-accordion-trigger::after {"), /inset: 0/);
  assert.match(rule(".fui-accordion-head .fui-accordion-trigger:focus-visible::after {"), /outline-offset: -2px/);
  assert.match(rule(".fui-accordion-aside {"), /pointer-events: none/);
  assert.match(rule('.fui-accordion[data-variant="rows"] .fui-accordion-item[data-open] > .fui-accordion-head::before {'), /inline-size: var\(--fui-bar\)/);
  assert.match(rule('.fui-accordion[data-variant="rows"] .fui-accordion-panel {'), /transition: none/);
});

// ----------------------------------------------------------------- Bulk actions

test("BulkActions: nothing at 0 by default; with keepMounted the region is there, marked empty, with hidden actions and a status", () => {
  assert.equal(renderToStaticMarkup(<BulkActions count={0}>x</BulkActions>), "");
  const kept = renderToStaticMarkup(<BulkActions count={0} keepMounted>x</BulkActions>);
  assert.equal(kept, '<div class="fui-bulk-actions" role="group" aria-label="Selection actions" data-empty="true"><span role="status">0 selected</span><div class="fui-actions" hidden="">x</div></div>');
  const some = renderToStaticMarkup(<BulkActions count={2} keepMounted>x</BulkActions>);
  assert.doesNotMatch(some, /data-empty|hidden/);
  // an empty, kept region leaves the layout but not the accessibility tree: it is clipped, not display: none
  const empty = rule(".fui-bulk-actions[data-empty] {");
  assert.match(empty, /clip-path: inset\(50%\)/);
  assert.doesNotMatch(empty, /display: none/);
});

// ------------------------------------------------------------------- AuthLayout

test("AuthLayout: the corner actions come after the card, the alignment is an attribute only when explicit", () => {
  const html = renderToStaticMarkup(
    <AuthLayout title="Sign in" actions={<button>Menu</button>} aside={<div>storm</div>}>
      <button>Go</button>
    </AuthLayout>,
  );
  assert.ok(html.indexOf("Go") < html.indexOf("Menu"));
  assert.match(html, /<div class="fui-auth-actions"><button>Menu<\/button><\/div><\/div>$/);
  assert.doesNotMatch(html, /data-align/);
  assert.match(renderToStaticMarkup(<AuthLayout title="t" align="center">x</AuthLayout>), /data-align="center"/);
  assert.match(renderToStaticMarkup(<AuthLayout title="t" align="start">x</AuthLayout>), /data-align="start"/);
});

test("AuthLayout CSS: with an aside the card anchors to the inline start from 1024 px (DESIGN.md), and the corner is a logical, safe-area inset", () => {
  assert.match(rule(".fui-auth-actions {"), /inset-inline-end: max\(var\(--fui-page-padding\), env\(safe-area-inset-right, 0px\)\)/);
  assert.match(rule(".fui-auth {"), /position: relative/);
  assert.match(styles, /\.fui-auth\[data-aside\]:not\(\[data-align\]\) \.fui-auth-main \{\s*justify-items: start/);
  assert.match(rule('.fui-auth[data-align="start"] .fui-auth-main {'), /justify-items: start/);
});

// ------------------------------------------------------------ Status, description

test("StatusPopover: an icon trigger is named by title and description, a labelled one by title and label; attention is a status ink", () => {
  const icon = renderToStaticMarkup(<StatusPopover title="Permissions" description="Some actions are unavailable." icon={<svg />} attention="warning" />);
  assert.match(icon, /<span class="fui-status-popover" data-attention="warning">/);
  assert.match(icon, /aria-label="Permissions: Some actions are unavailable\."/);
  assert.match(icon, /title="Some actions are unavailable\."/);
  const label = renderToStaticMarkup(<StatusPopover title="Sync" description="Up to date." icon={<svg />} label="Synced" compact attention />);
  assert.match(label, /data-attention="danger" data-compact="true"/);
  assert.match(label, /<span class="fui-sr-only">Sync: <\/span><span class="fui-sr-only">Synced<\/span>/);
  assert.match(rule('.fui-status-popover[data-attention="danger"] {'), /color: var\(--fui-danger-ink\)/);
  assert.match(rule('.fui-status-popover[data-attention="warning"] {'), /color: var\(--fui-warning-ink\)/);
});

test("DescriptionList layout auto follows its own width: stacked under 30rem, a 8 to 11rem term column from it", () => {
  assert.match(renderToStaticMarkup(<DescriptionList layout="auto">x</DescriptionList>), /data-layout="auto"/);
  assert.match(rule('.fui-description-list[data-layout="auto"] {'), /container: fui-description-list \/ inline-size/);
  const wide = container("fui-description-list (min-width: 30rem)");
  assert.match(wide, /grid-template-columns: minmax\(8rem, 11rem\) minmax\(0, 1fr\)/);
});

test("the new rules use tokens only: no literal colour in the 0.8 overlay blocks", () => {
  for (const marker of ["/* -------------------------------------------- 0.8: dialog sizes and parts */", "/* ---------------------------------- 0.8: the launcher and rows that are not cmdk's */", "/* ---------------------------------------------- 0.8: status popover trigger */"]) {
    const at = styles.indexOf(marker);
    assert.ok(at >= 0, marker);
    const block = styles.slice(at, at + 9000);
    assert.doesNotMatch(block.slice(0, block.indexOf("*/", 10) + 4 + 4000), /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/);
  }
});
