import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActivityDisclosure, Sources } from "../../packages/ai-ui/src/index";
import { aiStyles } from "./read-styles";

const source = aiStyles();
const styles = source.replace(/\/\*[\s\S]*?\*\//g, "");

/** The body of the block that opens at `marker`, between its braces. */
function blockAt(css: string, marker: string, from = 0): string {
  const start = css.indexOf(marker, from);
  assert.ok(start >= 0, `missing ${marker}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let at = open; at < css.length; at += 1) {
    if (css[at] === "{") depth += 1;
    if (css[at] === "}" && --depth === 0) return css.slice(open + 1, at);
  }
  throw new Error(`unbalanced block at ${marker}`);
}

type Rule = { selectors: string[]; body: string };
function rulesOf(block: string): Rule[] {
  return [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1]!.split(/,(?![^(]*\))/).map((selector) => selector.replace(/\s+/g, " ").trim()),
    body: match[2]!.replace(/\s+/g, " ").trim(),
  }));
}
const declared = (rules: Rule[], selector: string) => {
  const bodies = rules.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.body);
  assert.ok(bodies.length > 0, `no rule for ${selector}`);
  return bodies.join(" ");
};

// The chat pieces' own block of 0.12, in the components layer, and the markdown one, in utilities.
const pieces = blockAt(source, "@layer components {\n  /* 0.12: right to left, forced colors and print for the chat pieces */").replace(/\/\*[\s\S]*?\*\//g, "");
const markdown = blockAt(source, "@layer utilities {\n  /* 0.12: markdown right to left and in print */").replace(/\/\*[\s\S]*?\*\//g, "");

// A declaration that names a side of the screen. The only one left is the streaming caret, which a script places from
// getBoundingClientRect, in the screen's own coordinates, in either direction.
const PHYSICAL_ON_PURPOSE: Record<string, string> = {
  ".fui-stream-caret { left: 0 }": "placed by script from screen coordinates (chat-message.tsx, caretPlace)",
};

const PHYSICAL = [
  /^(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)(?:-(?:width|style|color))?$/,
  /^(?:left|right)$/,
  /^border-(?:top|bottom)-(?:left|right)-radius$/,
];
const SIDED_VALUE: Record<string, RegExp> = {
  "text-align": /^(?:left|right)$/,
  float: /^(?:left|right)$/,
  clear: /^(?:left|right)$/,
  "caption-side": /^(?:left|right)$/,
  resize: /^horizontal$/,
};
// Four-value shorthands name the right and the left side by position: they are physical when the two differ.
const FOUR_SIDED = /^(?:margin|padding|inset|border-width|border-style|border-color|scroll-margin|scroll-padding)$/;

function words(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) parts.push(current);
      current = "";
    } else current += char;
  }
  if (current) parts.push(current);
  return parts;
}

function physicalDeclarations(css: string): string[] {
  const found: string[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of text.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    const selector = match[1]!.replace(/\s+/g, " ").trim();
    if (selector.startsWith("@")) continue;
    for (const declaration of match[2]!.split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 0) continue;
      const property = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).replace(/\s+/g, " ").trim();
      if (property.startsWith("--")) continue;
      const sides = FOUR_SIDED.test(property) ? words(value.replace(/\s*!important$/, "")) : [];
      const physical =
        PHYSICAL.some((pattern) => pattern.test(property)) ||
        SIDED_VALUE[property]?.test(value) ||
        (sides.length === 4 && sides[1] !== sides[3]) ||
        (property === "border-radius" && words(value.split("/")[0]!).length > 1);
      if (physical) found.push(`${selector} { ${property}: ${value} }`);
    }
  }
  return found;
}

test("the scan for physical declarations finds each kind", () => {
  const sample = `
    .a { padding-left: 1px; margin-right: 2px; border-left: 1px solid red; border-right-width: 2px; }
    .b { left: 0; right: 0; text-align: left; float: right; }
    .c { padding: 0 1px 0 2px; margin: 0 1px; inset: 0 2px 0 2px; border-radius: 4px 0 0 4px; border-top-left-radius: 2px; }
    .d { padding-inline-start: 1px; inset-inline-end: 0; text-align: start; border-radius: 4px; --fui-left: 0; }
    @keyframes k { from { left: 0; } }
  `;
  assert.deepEqual(physicalDeclarations(sample), [
    ".a { padding-left: 1px }",
    ".a { margin-right: 2px }",
    ".a { border-left: 1px solid red }",
    ".a { border-right-width: 2px }",
    ".b { left: 0 }",
    ".b { right: 0 }",
    ".b { text-align: left }",
    ".b { float: right }",
    ".c { padding: 0 1px 0 2px }",
    ".c { border-radius: 4px 0 0 4px }",
    ".c { border-top-left-radius: 2px }",
    "from { left: 0 }",
  ]);
});

test("no declaration of the ai-ui sheet names a side of the screen", () => {
  const found = physicalDeclarations(source);
  assert.deepEqual(
    found.filter((declaration) => !Object.hasOwn(PHYSICAL_ON_PURPOSE, declaration)),
    [],
    "write the logical form (padding-inline-start, inset-inline-end, text-align: start)",
  );
  for (const declaration of Object.keys(PHYSICAL_ON_PURPOSE)) assert.ok(found.includes(declaration), `${declaration} is gone: remove it from the list`);
});

test("what follows the reading direction is written from the inline start", () => {
  const rule = (selector: string) => {
    const at = styles.indexOf(selector);
    assert.ok(at >= 0, `missing rule ${selector}`);
    return styles.slice(at, styles.indexOf("}", at) + 1).replace(/\s+/g, " ");
  };
  assert.match(rule(".fui-markdown :is(ul, ol) {"), /padding-inline-start: 1\.375rem;/);
  assert.match(rule(".fui-markdown blockquote {"), /padding-inline: var\(--fui-space-4\) 0; border-inline-start: 2px solid var\(--border\);/);
  assert.match(rule('.fui-markdown :is(th, [data-streamdown="table-header-cell"]) {'), /text-align: start;/);
  assert.match(rule(".fui-activity-trigger {"), /margin-inline-start: calc\(-1 \* var\(--fui-space-2\)\);[^}]*text-align: start;/);
  assert.match(rule(".fui-activity-body {"), /margin-inline: var\(--fui-space-2\) 0; padding-inline-start: var\(--fui-space-3\); border-inline-start: 1px solid var\(--border\);/);
  assert.match(rule('.fui-chat-message:not([data-role="user"]) > .fui-message-actions {'), /margin-inline-start: calc\(-1 \* var\(--fui-space-2\)\);/);
  assert.match(rule('.fui-attachment[data-variant="grid"] .fui-attachment-remove {'), /inset-inline-end: var\(--fui-space-1-5\);/);
  assert.match(rule(".fui-voice-dot {"), /inset-inline-end: -0\.25rem;/);
  assert.match(rule(".fui-sources-preview-item + .fui-sources-preview-item {"), /margin-inline-start: -0\.25rem;/);
});

test("code and mathematics stay left to right; marks and arrows that draw a direction turn with the page", () => {
  assert.match(styles, /\.fui-markdown :is\(\[data-streamdown="inline-code"\], :not\(pre\) > code\) \{\s*direction: ltr;\s*unicode-bidi: isolate;/);
  assert.match(styles, /:is\(\.fui-code-block-body, \.fui-markdown \[data-streamdown="code-block-body"\]\) \{\s*direction: ltr;/);
  const rtl = rulesOf(markdown);
  assert.equal(declared(rtl, ".fui-markdown :is(.katex, .katex-display)"), "direction: ltr; unicode-bidi: isolate;");
  const turned = rulesOf(pieces);
  assert.equal(declared(turned, '.fui-agent-mark:is([data-variant="scan"], [data-variant="lines"], [data-variant="type"]):dir(rtl)'), "scale: -1 1;");
  assert.equal(declared(turned, ".fui-search-step-open:dir(rtl) > svg"), "scale: -1 1;");
  assert.match(declared(turned, ".fui-generation-page > span:dir(rtl)"), /repeating-linear-gradient\(270deg, currentColor 0 4px, transparent 4px 6px\)/);
  // An address reads left to right, its host before its path.
  assert.equal(declared(turned, ":is(.fui-source-card .fui-source-meta, .fui-search-result-host, .fui-search-result-path):dir(rtl)"), "direction: ltr; text-align: end;");
  assert.equal(declared(turned, ".fui-search-result-host:dir(rtl)"), "order: 1;");
});

test("the older chat pieces have a form in forced colors", () => {
  const rules = rulesOf(blockAt(pieces, "@media (forced-colors: active)"));
  assert.deepEqual(
    rules.flatMap((rule) => rule.selectors).sort(),
    [
      ".fui-activity-dot",
      ".fui-activity-icon[data-live] .fui-activity-dot::after",
      '.fui-attachment[data-status="error"]',
      '.fui-attachment[data-variant="grid"] .fui-attachment-remove:not(:focus-visible)',
      '.fui-chat-message[data-role="user"] > .fui-chat-message-body',
      ".fui-citation-chip",
      ".fui-citation-chip[data-active]::after",
      ".fui-composer:has(.fui-composer-input:focus-visible)",
      '.fui-composer-pill[data-state="on"]',
      '.fui-composer-pill[data-state="on"]::after',
      ".fui-search-step-rail::before",
      ".fui-search-step[data-live] .fui-search-step-badge",
      ".fui-source-card[data-active]",
      ".fui-source-card[data-active]::before",
      ".fui-source-number",
      ".fui-voice-dot",
      '.fui-voice-button[data-status="error"]',
      '.fui-voice-button[data-status="recording"]',
      '.fui-voice-button[data-status="recording"]::after',
    ].sort(),
  );
  // An edge where there was a fill.
  assert.match(declared(rules, ".fui-citation-chip"), /outline: 1px solid LinkText; outline-offset: -1px;/);
  assert.match(declared(rules, '.fui-chat-message[data-role="user"] > .fui-chat-message-body'), /outline: 1px solid CanvasText; outline-offset: -1px;/);
  // Pressed, recording and active: a Highlight bar on a pseudo-element.
  for (const selector of ['.fui-composer-pill[data-state="on"]::after', '.fui-voice-button[data-status="recording"]::after', ".fui-citation-chip[data-active]::after", ".fui-source-card[data-active]::before"]) {
    assert.match(declared(rules, selector), /content: ""; position: absolute;[^}]*background: Highlight;/, selector);
  }
  assert.match(declared(rules, '.fui-composer-pill[data-state="on"]'), /position: relative; border-color: Highlight;/);
  assert.match(declared(rules, ".fui-voice-dot"), /background: Highlight;/);
  assert.match(declared(rules, '.fui-attachment[data-status="error"]'), /border-style: dashed;/);
  assert.match(declared(rules, ".fui-search-step[data-live] .fui-search-step-badge"), /border-color: Highlight;/);
  // The composer's focus was a border colour and a shadow.
  assert.match(declared(rules, ".fui-composer:has(.fui-composer-input:focus-visible)"), /outline: 2px solid Highlight;/);
});

test("in forced colors a pressed or active piece is never a Highlight fill behind its label nor an outline, and every colour is a system colour", () => {
  const block = blockAt(pieces, "@media (forced-colors: active)");
  assert.doesNotMatch(block, /var\(--|#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(|color-mix\(/);
  for (const rule of rulesOf(block)) {
    for (const selector of rule.selectors) {
      if (!/data-state="on"|data-status="recording"|\[data-active\]/.test(selector) || /::(?:before|after)$/.test(selector)) continue;
      assert.doesNotMatch(rule.body, /background: Highlight|HighlightText|outline/, selector);
    }
  }
});

test("on paper a conversation has no actions and no bubble, a message keeps to one page and code wraps", () => {
  const paper = rulesOf(blockAt(pieces, "@media print"));
  assert.equal(declared(paper, ".fui-message-actions"), "display: none;");
  assert.match(declared(paper, ".fui-chat-message"), /break-inside: avoid;/);
  assert.match(declared(paper, '.fui-chat-message[data-role="user"] > .fui-chat-message-body'), /border: 0;[^}]*background: none;/);
  const code = rulesOf(blockAt(markdown, "@media print"));
  assert.match(declared(code, ".fui-code-block .fui-code-line"), /overflow-wrap: anywhere; white-space: pre-wrap;/);
  assert.match(declared(code, ':is(.fui-code-block-body, .fui-markdown [data-streamdown="code-block-body"]) pre'), /width: auto;/);
  assert.match(declared(code, ':is(.fui-code-block-body, .fui-markdown [data-streamdown="code-block-body"], .fui-markdown > pre)'), /overflow: visible;/);
});

test("the message actions brighten under the pointer only where there is one", () => {
  const hover = blockAt(styles, "@media (hover: hover) {\n    .fui-message-action.fui-button:hover");
  assert.match(hover, /\.fui-message-action\.fui-button:hover \{\s*color: var\(--foreground\);/);
  assert.equal(styles.match(/\.fui-message-action\.fui-button:hover/g)?.length, 1);
});

test("a sources and an activity trigger draw the chevron with its own class", () => {
  const sources = renderToStaticMarkup(createElement(Sources, { sources: [{ url: "https://docs.example.org/guide", title: "Guide" }] }));
  const activity = renderToStaticMarkup(createElement(ActivityDisclosure, { label: "Ran a calculation", live: false }, createElement("p", null, "Done")));
  for (const html of [sources, activity]) {
    assert.match(html, /<svg[^>]*class="fui-activity-chevron"/);
    assert.doesNotMatch(html, /fui-disclosure-chevron/);
  }
});
