import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { formatLocalTime, LabelsProvider } from "@fabrials/ui";
import { CALLOUT_KINDS, EditableMessage, EditMessageAction, MarkdownCallout, MessageActions, MessageTimestamp } from "../../packages/ai-ui/src/index";
import { aiStyles } from "./read-styles";

const styles = aiStyles();

// The block this package appends, bounded: the stylesheet is a union of everyone's blocks and others come after it.
const MARKER = "/* 0.12: a callout in an answer, and a sent message edited in place */";
const start = styles.indexOf(MARKER);
assert.ok(start >= 0, "the 0.12 block carries its marker comment");
const after = styles.indexOf("\n@layer", start + 1);
const block = styles.slice(start, after === -1 ? styles.length : after);

/** The body of the `at` media query inside `scope`, braces balanced. */
function mediaBlock(at: string, scope = block) {
  const open = scope.indexOf("{", scope.indexOf(at));
  assert.ok(open >= 0, `missing ${at}`);
  let depth = 0;
  for (let position = open; position < scope.length; position += 1) {
    if (scope[position] === "{") depth += 1;
    if (scope[position] === "}" && --depth === 0) return scope.slice(open + 1, position);
  }
  throw new Error(`unbalanced ${at}`);
}

const rule = (selector: string, scope = block) => {
  const at = scope.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return scope.slice(at, scope.indexOf("}", at) + 1);
};

const forced = mediaBlock("@media (forced-colors: active)");
const print = mediaBlock("@media print");
const coarse = mediaBlock("@media (max-width: 767px), (pointer: coarse)");
const withoutMedia = block.replace(forced, "").replace(print, "").replace(coarse, "");

// --- MarkdownCallout -------------------------------------------------------------------------------------------------

test("a callout is a note, named by its title, and its body is the markdown around it", () => {
  const html = renderToStaticMarkup(
    <MarkdownCallout kind="tip">
      <p>Start from the units.</p>
    </MarkdownCallout>,
  );
  assert.match(html, /^<aside aria-labelledby="[^"]+" class="fui-callout" data-kind="tip" role="note">/);
  const id = /aria-labelledby="([^"]+)"/.exec(html)![1]!;
  // The name is the title the reader sees, not a second copy of it.
  assert.match(html, new RegExp(`<p class="fui-callout-title" dir="auto" id="${id}">`));
  assert.match(html, /Tip<\/p>/);
  assert.match(html, /<div class="fui-callout-body"><p>Start from the units.<\/p><\/div><\/aside>$/);
  // The icon is decoration beside a word, never the word.
  assert.match(html, /<span aria-hidden="true" class="fui-callout-icon"><svg aria-hidden="true"/);
});

test("every kind has its own words and its own mark, and a title of your own replaces them", () => {
  const titles = ["Note", "Tip", "Important", "Warning", "Caution", "Example", "Definition", "Summary", "Question"];
  for (const [index, kind] of CALLOUT_KINDS.entries()) {
    const html = renderToStaticMarkup(<MarkdownCallout kind={kind}>x</MarkdownCallout>);
    assert.match(html, new RegExp(`data-kind="${kind}"`), kind);
    assert.match(html, new RegExp(`</span>${titles[index]}</p>`), kind);
  }
  const own = renderToStaticMarkup(
    <MarkdownCallout kind="warning" title="Mind the gap">
      x
    </MarkdownCallout>,
  );
  assert.match(own, /<\/span>Mind the gap<\/p>/);
  assert.doesNotMatch(own, /Warning/);
  const none = renderToStaticMarkup(
    <MarkdownCallout icon={false} kind="caution">
      x
    </MarkdownCallout>,
  );
  assert.doesNotMatch(none, /fui-callout-icon/);
  const mark = renderToStaticMarkup(
    <MarkdownCallout icon={<svg data-own="" />} kind="note">
      x
    </MarkdownCallout>,
  );
  assert.match(mark, /<span aria-hidden="true" class="fui-callout-icon"><svg data-own=""><\/svg><\/span>/);
});

test("the provider's words and the component's own labels reach the titles, and an alias still names a kind", () => {
  const html = renderToStaticMarkup(
    <LabelsProvider labels={{ markdownCallout: { tip: "Truco", warning: "Atención" } }}>
      <MarkdownCallout kind="tip">x</MarkdownCallout>
      <MarkdownCallout kind="warning">x</MarkdownCallout>
      <MarkdownCallout kind="note">x</MarkdownCallout>
    </LabelsProvider>,
  );
  assert.match(html, /<\/span>Truco<\/p>/);
  assert.match(html, /<\/span>Atención<\/p>/);
  assert.match(html, /<\/span>Note<\/p>/);
  const own = renderToStaticMarkup(
    <LabelsProvider labels={{ markdownCallout: { tip: "Truco" } }}>
      <MarkdownCallout kind="tip" labels={{ tip: "Pista" }}>
        x
      </MarkdownCallout>
    </LabelsProvider>,
  );
  assert.match(own, /<\/span>Pista<\/p>/);
  // A document written for Radiant says "key-idea"; it still lands on a kind with a tone and a title.
  const alias = renderToStaticMarkup(
    <MarkdownCallout kind={"key-idea" as never}>x</MarkdownCallout>,
  );
  assert.match(alias, /data-kind="summary"/);
});

test("a callout is an aside, takes the caller's role and props, and has no body without children", () => {
  const html = renderToStaticMarkup(
    <MarkdownCallout aria-labelledby="own-title" className="extra" data-testid="t" id="plate" kind="example" role="region">
      {null}
    </MarkdownCallout>,
  );
  assert.match(html, /^<aside /);
  for (const attribute of ['aria-labelledby="own-title"', 'class="fui-callout extra"', 'data-kind="example"', 'data-testid="t"', 'id="plate"', 'role="region"']) assert.ok(html.slice(0, html.indexOf(">")) .includes(attribute), attribute);
  assert.doesNotMatch(html, /fui-callout-body/);
});

test("a title in another script decides the direction of its own row, so the mark moves with it", () => {
  const html = renderToStaticMarkup(
    <MarkdownCallout kind="tip" title="نصيحة">
      x
    </MarkdownCallout>,
  );
  assert.match(html, /<p class="fui-callout-title" dir="auto"/);
});

// --- EditableMessage -------------------------------------------------------------------------------------------------

test("the editor is a form with a named field, the two keys and a hint that says why it cannot be sent yet", () => {
  const html = renderToStaticMarkup(<EditableMessage onCancel={() => {}} onSubmit={() => {}} value="Ship the invoice." />);
  assert.match(html, /^<form class="fui-editable-message" data-slot="editable-message">/);
  assert.match(html, /<textarea [^>]*aria-label="Edit message"[^>]*dir="auto"/);
  assert.match(html, /data-autoresize=""/);
  const describedBy = /aria-describedby="([^"]+)"/.exec(html)![1]!;
  assert.match(html, new RegExp(`<p class="fui-editable-message-hint" id="${describedBy}">Change the message to send it\\.</p>`));
  assert.match(html, /<button type="button"[^>]*class="fui-button">Cancel<\/button>/);
  assert.match(html, /<button type="submit"[^>]*aria-disabled="true"[^>]*class="fui-button">Save and send<\/button>/);
  // The key that cannot be pressed is still a key: it keeps focus and says why in words.
  assert.doesNotMatch(html, /disabled=""/);
});

test("an empty draft says so, a host's hint comes first, and pending says it is sending", () => {
  const empty = renderToStaticMarkup(
    <EditableMessage hint="Sending this replaces what came after it." onCancel={() => {}} onSubmit={() => {}} value="   " />,
  );
  assert.match(empty, />Sending this replaces what came after it\. Type a message to send\.<\/p>/);
  const pending = renderToStaticMarkup(<EditableMessage onCancel={() => {}} onSubmit={() => {}} pending value="Ship it." />);
  assert.match(pending, /aria-busy="true"/);
  assert.match(pending, /<textarea [^>]*readOnly=""/);
  assert.match(pending, />Sending your message\.<\/p>/);
  assert.match(pending, /<button type="submit"[^>]*data-loading="true"/);
});

test("no consequence sentence is written in by default, and every word is a prop", () => {
  const plain = renderToStaticMarkup(<EditableMessage onCancel={() => {}} onSubmit={() => {}} value="Ship it." />);
  assert.doesNotMatch(plain, /replaces what came after/i);
  const own = renderToStaticMarkup(
    <EditableMessage cancelLabel="Descartar" hint="Reemplaza lo que vino después." label="Mensaje" maxLength={280} onCancel={() => {}} onSubmit={() => {}} value="Ship it." submitLabel="Guardar y enviar" />,
  );
  assert.match(own, /aria-label="Mensaje"/);
  assert.match(own, /maxLength="280"/);
  assert.match(own, />Guardar y enviar<\/button>/);
  assert.match(own, />Descartar<\/button>/);
  assert.match(own, />Reemplaza lo que vino después\. Change the message to send it\.<\/p>/);
  const own2 = renderToStaticMarkup(
    <EditableMessage labels={{ unchanged: "Cambia el mensaje para enviarlo." }} onCancel={() => {}} onSubmit={() => {}} value="Ship it." />,
  );
  assert.match(own2, />Cambia el mensaje para enviarlo\.<\/p>/);
});

test("the edit key of an action row is a message action with a pencil and a name", () => {
  const html = renderToStaticMarkup(
    <MessageActions>
      <EditMessageAction onClick={() => {}} />
    </MessageActions>,
  );
  assert.match(html, /class="fui-message-actions"/);
  assert.match(html, /aria-label="Edit"/);
  assert.match(html, /<svg aria-hidden="true"[^>]*><path d="M21\.174 6\.812a1 1 0 0 0-3\.986-3\.987L3\.842 16\.174/);
});

// --- MessageTimestamp -------------------------------------------------------------------------------------------------

test("the ready-made label renders exactly as it always has", () => {
  assert.equal(
    renderToStaticMarkup(<MessageTimestamp dateTime="2026-09-27T09:31:00Z" label="09:31" />),
    '<time class="fui-message-time" dateTime="2026-09-27T09:31:00Z">09:31</time>',
  );
  // With a tooltip, Base UI names the trigger with an id of its own: the rest of the markup is unchanged.
  const withDetail = renderToStaticMarkup(<MessageTimestamp className="stamp" dateTime="2026-09-27T09:31:00Z" detail="Sep 27, 2026, 9:31 AM" label="09:31" />);
  assert.match(withDetail, /^<time class="fui-message-time stamp" dateTime="2026-09-27T09:31:00Z" id="[^"]+" data-base-ui-tooltip-trigger="">09:31<\/time>$/);
});

test("a date renders through LocalTime in the reader's zone, with a hidden stand-in until the page has hydrated", () => {
  const date = "2026-09-27T09:31:00Z";
  const html = renderToStaticMarkup(<MessageTimestamp date={date} />);
  assert.match(html, /^<time data-slot="local-time" aria-hidden="true" class="fui-local-time fui-message-time" dateTime="2026-09-27T09:31:00.000Z" style="visibility:hidden">/);
  // The stand-in is the instant in UTC in English, so neither the server's zone nor its language is ever what a reader sees.
  assert.equal(html.slice(html.indexOf(">") + 1, html.lastIndexOf("</time>")), formatLocalTime(date, "message", { locale: "en", timeZone: "UTC" }));
  assert.doesNotMatch(html, /title=/);
  // A zone fixed by the host is the same text on both sides, so it is shown at once and carries the full date and time.
  const fixed = renderToStaticMarkup(<MessageTimestamp date={date} timeZone="Europe/Madrid" />);
  assert.doesNotMatch(fixed, /visibility:hidden/);
  assert.doesNotMatch(fixed, /aria-hidden/);
  assert.equal(fixed.slice(fixed.indexOf(">") + 1, fixed.lastIndexOf("</time>")), formatLocalTime(date, "message", { locale: "en", timeZone: "Europe/Madrid" }));
  assert.match(fixed, /title="[^"]*11:31[^"]*"/);
  assert.match(fixed, /sep|sept/i);
  // A format of its own, and a locale of the reader's.
  const shown = (html: string) => html.slice(html.indexOf(">") + 1, html.lastIndexOf("</time>"));
  assert.equal(shown(renderToStaticMarkup(<MessageTimestamp date={date} format="time" timeZone="Europe/Madrid" />)), formatLocalTime(date, "time", { locale: "en", timeZone: "Europe/Madrid" }));
  assert.equal(shown(renderToStaticMarkup(<MessageTimestamp date={date} format="dateTime" timeZone="Europe/Madrid" />)), formatLocalTime(date, "dateTime", { locale: "en", timeZone: "Europe/Madrid" }));
  assert.match(renderToStaticMarkup(<MessageTimestamp date={date} format="time" locale="ja-JP" timeZone="Asia/Tokyo" />), />18:31<\/time>$/);
});

test("date wins over the ready-made strings, and a value that is no date renders nothing", () => {
  const both = renderToStaticMarkup(<MessageTimestamp date="2026-09-27T09:31:00Z" dateTime="1999-01-01T00:00:00Z" format="dateTime" label="99:99" timeZone="Europe/Madrid" />);
  assert.match(both, /^{?<time data-slot="local-time" class="fui-local-time fui-message-time" dateTime="2026-09-27T09:31:00.000Z"/);
  assert.match(both, /11:31[^<]*<\/time>$/);
  assert.doesNotMatch(both, /99:99/);
  assert.equal(renderToStaticMarkup(<MessageTimestamp date="not a date" />), "");
  assert.equal(renderToStaticMarkup(<MessageTimestamp date={null} />), "");
  assert.equal(renderToStaticMarkup(<MessageTimestamp dateTime="2026-09-27T09:31:00Z" />), "");
});

// --- the stylesheet --------------------------------------------------------------------------------------------------

test("a callout is a tint of its tone with its edge, never a coloured side bar", () => {
  const callout = rule(".fui-callout {");
  assert.match(callout, /--fui-callout-tint: color-mix\(in oklab, var\(--fui-callout-tone\) var\(--fui-tint-strength\), var\(--card\)\);/);
  assert.match(callout, /--fui-callout-edge: color-mix\(in oklab, var\(--fui-callout-tone\) var\(--fui-tint-edge\), var\(--card\)\);/);
  assert.match(callout, /border: 1px solid var\(--fui-callout-edge\);/);
  assert.match(callout, /border-radius: var\(--fui-radius-plate\);/);
  assert.match(callout, /background: var\(--fui-callout-tint\);/);
  assert.doesNotMatch(block, /border-(?:inline-)?(?:left|right|start|end)\s*:/, "a callout has no side bar");
  assert.match(rule(".fui-callout-title {"), /color: var\(--fui-callout-ink\);[^}]*font-weight: var\(--fui-weight-semibold\);/);
});

test("the nine kinds share five tones, and a warning is still the loudest of the quiet ones", () => {
  const tone = (selector: string) => /--fui-callout-tone: var\((--[\w-]+)\);/.exec(rule(selector))?.[1];
  assert.equal(tone('.fui-callout[data-kind="warning"] {'), "--warning");
  assert.equal(tone('.fui-callout[data-kind="caution"] {'), "--destructive");
  assert.equal(tone('.fui-callout[data-kind="tip"],\n  .fui-callout[data-kind="summary"] {'), "--success");
  assert.equal(tone('.fui-callout[data-kind="important"],\n  .fui-callout[data-kind="definition"] {'), "--brand");
  // Note, example and question keep the neutral tone the base rule sets.
  for (const kind of ["note", "example", "question"]) assert.doesNotMatch(block, new RegExp(`data-kind="${kind}"`), kind);
  assert.match(rule(".fui-callout {"), /--fui-callout-tone: var\(--muted-foreground\);/);
});

test("the words inside keep the markdown's type: only the rhythm and the room are the callout's", () => {
  assert.match(rule(".fui-callout-body > * + * {"), /margin-block-start: var\(--fui-space-2\);/);
  assert.match(rule(".fui-callout-body > :first-child {"), /margin-block-start: 0;/);
  // A list or a code block inside is left as the answer draws it.
  assert.doesNotMatch(standalone(".fui-callout-body"), /list-style|font-family|font-size|color:/);
  assert.match(rule(".fui-callout-body :is(pre, .fui-code-block) {"), /margin-block: 0;/);
  // A bare pre keeps the answer's own well, one step smaller inside the plate.
  const well = rule(".fui-callout-body pre {");
  assert.match(well, /background: var\(--fui-code\);/);
  assert.match(well, /border-radius: var\(--fui-radius-sm\);/);
  assert.match(well, /direction: ltr;/);
  assert.match(well, /overflow-x: auto;/);
});

function standalone(selector: string) {
  const scope = block.slice(block.indexOf(selector));
  return scope.slice(0, scope.indexOf("}"));
}

test("the editor wears the bubble it replaces, so the thread does not move", () => {
  const editor = rule(".fui-editable-message {");
  assert.match(editor, /inline-size: min\(100%, 36rem\);/);
  assert.match(editor, /margin-inline-start: auto;/);
  assert.match(editor, /background: var\(--muted\);/);
  assert.match(editor, /border-radius: var\(--fui-radius-lg\);/);
  // The same corner and the same cap as the reader's own message.
  const bubble = styles.slice(styles.indexOf('.fui-chat-message[data-role="user"] > .fui-chat-message-body {'));
  assert.match(bubble.slice(0, bubble.indexOf("}")), /max-width: min\(85%, 36rem\);[^}]*border-radius: var\(--fui-radius-lg\);/);
});

test("the plate is the field: focus is a Stormlight edge and its halo, not a second ring inside", () => {
  assert.match(rule(".fui-editable-message:has(.fui-textarea:focus-visible) {"), /border-color: var\(--fui-focus\);[^}]*box-shadow: 0 0 0 3px color-mix\(in oklab, var\(--fui-focus\) 20%, transparent\);/);
  assert.match(rule(".fui-editable-message .fui-textarea:focus,\n  .fui-editable-message .fui-textarea:focus-visible {"), /outline: none;/);
});

test("every state that is only a tint keeps a form in forced colors, and a printed page keeps the words", () => {
  assert.match(rule(".fui-callout {", forced), /border-color: CanvasText;[^}]*background: Canvas;[^}]*color: CanvasText;/);
  assert.match(rule(".fui-callout-title {", forced), /color: CanvasText;/);
  assert.match(rule(".fui-editable-message {", forced), /border-color: CanvasText;[^}]*background: Canvas;/);
  assert.match(rule(".fui-editable-message-error {", forced), /border: 1px solid CanvasText;/);
  assert.doesNotMatch(forced, /var\(--/, "system colours only");
  assert.match(rule(".fui-callout {", print), /break-inside: avoid;[^}]*border-color: var\(--fui-callout-ink\);[^}]*background: none;/);
  assert.match(rule(".fui-editable-message {", print), /display: none;/);
});

test("the block is logical, on the grid, and moves only through the motion tokens", () => {
  assert.doesNotMatch(withoutMedia, /(?:^|[\s;{])(?:padding|margin|border)-(?:left|right)\s*:/);
  assert.doesNotMatch(withoutMedia, /(?:^|[\s;{])text-align:\s*(?:left|right)\s*;/);
  assert.doesNotMatch(withoutMedia, /(?:^|[\s;{])(?:left|right)\s*:/);
  for (const transition of withoutMedia.matchAll(/transition:([^;]*);/g))
    for (const part of transition[1]!.split(",")) assert.match(part, /var\(--fui-duration(?:-fast|-slow)?\)/);
  // Targets on a phone: the keys of the bar reach 44 px and the field does not zoom under a thumb.
  assert.match(rule(".fui-editable-message-bar .fui-button {", coarse), /min-block-size: 2.75rem;/);
  assert.match(rule(".fui-editable-message .fui-textarea {", coarse), /font-size: 1rem;/);
});
