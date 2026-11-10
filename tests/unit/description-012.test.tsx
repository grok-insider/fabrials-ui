import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SuggestionCard, SuggestionGrid } from "../../packages/ui/src/index";
import {
  DESCRIPTION_LIMIT,
  controlName,
  describesControl,
  describesPreview,
  panelOf,
  repeatsName,
} from "../../packages/ui/src/description";
import { uiStyles } from "./read-styles";

const source = (file: string) => readFileSync(new URL(`../../packages/ui/src/${file}`, import.meta.url), "utf8");
const styles = uiStyles();
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

// What a panel says beside a control, and whether saying it again helps or repeats the control's own name. The visual suite
// reads the wiring in a browser (tests/visual/behaviour-012.spec.ts); here the words are read without one.

test("a panel's words are its text, with icons, keys and hidden parts left out", () => {
  assert.deepEqual(panelOf(<>Cascade layers</>), { text: "Cascade layers", interactive: false });
  assert.deepEqual(panelOf([<strong key="a">Release 2.4</strong>, <p key="b">Nine fixes.</p>]), {
    text: "Release 2.4 Nine fixes.",
    interactive: false,
  });
  // An icon or a key is not a description; a shortcut's keys say themselves in `aria-keyshortcuts`.
  assert.deepEqual(panelOf([<span key="a" aria-hidden>⧉</span>, "Copy", <kbd key="b">⌘</kbd>, <kbd key="c">K</kbd>]), {
    text: "Copy",
    interactive: false,
  });
  // Whitespace is one space, and there is nothing to describe when there is nothing to read.
  assert.equal(panelOf(["  Fetch ", " headers  only "])?.text, "Fetch headers only");
  assert.equal(panelOf(<svg aria-hidden />), undefined);
  assert.equal(panelOf([]), undefined);
});

test("a panel with something to operate in it is a place, not a description", () => {
  assert.equal(panelOf(<a href="#open">Open the article</a>)?.interactive, true);
  assert.equal(panelOf(<button type="button">Run</button>)?.interactive, true);
  assert.equal(panelOf(<span onClick={() => undefined}>Run</span>)?.interactive, true);
  assert.equal(panelOf(<div><a href="#x">A link</a></div>)?.interactive, true);
  // A wrapper written elsewhere cannot be seen into: what it renders is not guessed at.
  const Wrapper = ({ children }: { children?: ReactNode }) => <span>{children}</span>;
  assert.equal(panelOf(<Wrapper>Hidden words</Wrapper>), undefined);
});

test("a control's name is its aria-label, else the words it shows", () => {
  assert.equal(controlName({ "aria-label": "Copy the reference", children: "⧉" }), "Copy the reference");
  assert.equal(controlName({ children: "Sync now" }), "Sync now");
  // A Base UI trigger carries the label of the element it renders.
  assert.equal(controlName({ render: <button aria-label="Copy" /> }), undefined);
  assert.equal(controlName({}, { "aria-label": "Copy" }), "Copy");
  assert.equal(controlName({}, { children: ["Mailboxes", " · 3"] }), "Mailboxes · 3");
  // Named elsewhere: this module does not follow `aria-labelledby`.
  assert.equal(controlName({ "aria-labelledby": "label-1", children: "Anything" }), undefined);
});

test("a panel that only tells the control's name again is not a description", () => {
  const copy = panelOf(<>Copy the reference</>)!;
  assert.equal(repeatsName("Copy the reference", copy), true);
  // Punctuation and case do not make two names different.
  const preview = panelOf(<>Message 3 of 6 the plan</>)!;
  assert.equal(repeatsName("Jump to message 3 of 6: the plan", preview), true);
  assert.equal(repeatsName("Copy the reference", panelOf(<>Fetch new headers only</>)!), false);
  assert.equal(repeatsName(undefined, copy), false);
  assert.equal(repeatsName("Copy", panelOf(<> </>) ?? { text: "", interactive: false }), false);
});

test("a tooltip describes its trigger unless it repeats it, and when the words cannot be read it stays silent", () => {
  const same = panelOf(<>Copy the reference</>)!;
  assert.equal(describesControl("Copy the reference", same), false);
  assert.equal(describesControl("Sync now", panelOf(<>Fetch new headers only</>)!), true);
  assert.equal(describesControl("Sync now", undefined), false);
  // A product may decide either way.
  assert.equal(describesControl("Copy the reference", same, true), true);
  assert.equal(describesControl("Sync now", panelOf(<>Fetch new headers only</>)!, false), false);
});

test("a preview card describes its trigger only while it is short text nothing can be done with", () => {
  const text = panelOf(<>Nine fixes, one new panel. Thursday.</>)!;
  assert.equal(describesPreview("Release notes 2.4", text), true);
  assert.equal(describesPreview("Release notes 2.4", panelOf(<a href="#open">Open the article</a>)!), false);
  assert.equal(describesPreview("Release notes 2.4", panelOf(<>{"x".repeat(DESCRIPTION_LIMIT + 1)}</>)!), false);
  assert.equal(describesPreview("Release notes 2.4", panelOf(<>{"x".repeat(DESCRIPTION_LIMIT)}</>)!), true);
  assert.equal(describesPreview("Release notes 2.4", undefined), false);
  assert.equal(describesPreview("Release notes 2.4", text, false), false);
  assert.equal(describesPreview("Release notes 2.4", text, true), true);
});

test("the tooltip is a role=tooltip with an id, and the trigger is described by it while it is open", () => {
  const menu = source("menu.tsx");
  assert.match(menu, /role="tooltip"/);
  assert.match(menu, /id=\{pair\?\.id\}/);
  assert.match(menu, /aria-describedby=\{describedBy\}/);
  assert.match(menu, /describesControl\(controlName\(rendered, props as Record<string, unknown>\), pair\.panel, pair\.describe\)/);
  // The id is made of letters, digits, `-` and `_` only, so `#<id>` is a selector a test (or a product) can use.
  assert.match(menu, /`fui-tooltip-\$\{reactId\.replace\(\/\[\^A-Za-z0-9_-\]\/g, ""\)\}`/);
});

test("the hover card is described by its own panel id, and the panel is not a dialog", () => {
  const card = source("hover-card.tsx");
  assert.match(card, /describesPreview\(controlName\(rendered, props as Record<string, unknown>\), pair\.panel, pair\.describe\)/);
  assert.match(card, /id=\{pair\?\.id\}/);
  assert.doesNotMatch(card, /role="dialog"/);
});

test("a submenu opens at the inline end in either direction, and its chevron turns with it", () => {
  for (const file of ["menu.tsx", "context-menu.tsx"]) {
    assert.match(source(file), /side="inline-end"/, `${file} asks for the inline end`);
    assert.doesNotMatch(source(file), /side="right"/, `${file} keeps no physical side`);
    assert.match(source(file), /data-direction=\{useDirection\(\) === "rtl" \? "rtl" : undefined\}/);
  }
  const mirror = rule(".fui-menu-submenu-icon[data-direction=\"rtl\"],");
  assert.match(mirror, /transform: scaleX\(-1\);/);
});

test("a select's list is the scroller between its keys, and the keys are not rows of it", () => {
  const select = source("select.tsx");
  // The keys are picked out of the children and put either side of the list, where Base UI draws them while they are needed.
  assert.match(select, /child\.type === SelectScrollUpButton/);
  assert.match(select, /\{up\}\s*<BaseSelect\.List className="fui-select-list">\{rows\}<\/BaseSelect\.List>\s*\{down\}/);
  assert.match(select, /data-slot="select-scroll-up"/);
  assert.match(select, /data-slot="select-scroll-down"/);
  assert.match(select, /className=\{classes\("fui-menu", "fui-select-popup", className\)\} data-slot="select-content"/);
  // The box does not scroll; the list does, bounded by the room the popup was given.
  const popup = rule(".fui-menu.fui-select-popup {");
  assert.match(popup, /overflow: hidden;/);
  assert.match(popup, /position: relative;/);
  const list = rule(".fui-select-list {");
  assert.match(list, /max-block-size: calc\(var\(--available-height, 60vh\) - 2 \* var\(--fui-space-1\)\);/);
  assert.match(list, /overflow-y: auto;/);
  // The keys sit over the ends of the list, on the menu's own surface.
  assert.match(rule(".fui-select-popup .fui-menu-scroll-arrow {"), /inset-inline: 0;/);
  assert.match(rule(".fui-select-popup .fui-menu-scroll-arrow {"), /background: var\(--fui-overlay-surface\);/);
  assert.match(rule(".fui-menu-scroll-arrow-up {"), /top: 0;/);
  assert.match(rule(".fui-menu-scroll-arrow-down {"), /bottom: 0;/);
});

test("the rule between two groups of a command list is not a child of its listbox", () => {
  const command = source("command.tsx");
  assert.match(command, /<CommandPrimitive\.Separator\s+aria-hidden/);
});

test("a suggestion row that scrolls sideways is a named tab stop, with its ring drawn inside", () => {
  const markup = renderToStaticMarkup(
    <SuggestionGrid>
      <SuggestionCard title="Summarize" />
    </SuggestionGrid>,
  );
  assert.match(markup, /<ul class="fui-suggestion-grid" style="--fui-suggestion-columns:2" aria-label="Suggestions">/);
  assert.match(markup, /<li class="fui-suggestion-grid-item">/);
  // Nothing is measured on the server: the first paint has no tab stop.
  assert.doesNotMatch(markup, /tabindex/);
  const own = renderToStaticMarkup(
    <SuggestionGrid label="Ways to start">
      <SuggestionCard title="Summarize" />
    </SuggestionGrid>,
  );
  assert.match(own, /aria-label="Ways to start"/);
  const given = renderToStaticMarkup(
    <SuggestionGrid aria-label="From the product">
      <SuggestionCard title="Summarize" />
    </SuggestionGrid>,
  );
  assert.match(given, /aria-label="From the product"/);
  const grid = source("suggestion-card.tsx");
  assert.match(grid, /tabIndex=\{useOverflowTabStop\(row\)\}/);
  assert.match(rule(".fui-suggestion-grid:focus-visible {"), /outline-offset: -2px;/);
});

test("the accounts table names its columns, and a count keeps the unit the provider gives it", () => {
  const accounts = readFileSync(new URL("../../packages/ai-ui/src/synchronized-accounts.tsx", import.meta.url), "utf8");
  assert.equal(accounts.match(/<th scope="col">/g)?.length, 3);
  assert.doesNotMatch(accounts, /<th>/);
  const providers = readFileSync(new URL("../../packages/ai-ui/src/providers.tsx", import.meta.url), "utf8");
  assert.match(providers, /text\.count\(\s*String\(Math\.round\(line\.used \?\? 0\)\),\s*line\.format\?\.kind === "count" \? line\.format\.suffix : "",\s*\)/);
});
