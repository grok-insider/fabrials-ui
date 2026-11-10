import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Announcer,
  ariaKeyshortcuts,
  Bdi,
  CHART_TOKENS,
  dirOf,
  ErrorBoundary,
  ErrorBoundaryFallback,
  ForeignText,
  formatLocalTime,
  HOTKEY_CONTROLS,
  interpolate,
  isControlTarget,
  isolate,
  isTypingTarget,
  LocalTime,
  localTimeIso,
  matchHotkey,
  parseHotkey,
  resolveColor,
  scriptDirection,
  useAnnounce,
  useElementSize,
  useHydrated,
  useResolvedTokens,
  type HotkeyEvent,
} from "../../packages/ui/src/index";
import { copyImage, copyText, downloadFile, ExportError, fileStem, serializeSvg, svgToPng } from "@fabrials/ui/export";
import { uiStyles } from "./read-styles";

const source = (file: string) => readFileSync(new URL(`../../packages/ui/src/${file}`, import.meta.url), "utf8");
const styles = uiStyles();

// --- LocalTime -------------------------------------------------------------------------------------------------------

const sent = new Date("2026-09-27T07:31:00Z");
const now = new Date("2026-09-27T12:00:00Z");

test("a label follows the zone it is given, not the machine's", () => {
  // The bug this exists for: the server (UTC) said 07:31 and the reader in Spain should have seen 09:31.
  assert.equal(formatLocalTime(sent, "message", { now, timeZone: "UTC", locale: "en-GB" }), "07:31");
  assert.equal(formatLocalTime(sent, "message", { now, timeZone: "Europe/Madrid", locale: "en-GB" }), "09:31");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "Asia/Tokyo", locale: "en-GB" }), "16:31");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "Asia/Kolkata", locale: "en-GB" }), "13:01");
  // The hour is written the locale's way.
  assert.equal(formatLocalTime(sent, "time", { timeZone: "UTC", locale: "en" }), "7:31 AM");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "UTC", locale: "fr" }), "07:31");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "UTC", locale: "es" }), "07:31");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "UTC", locale: "ja" }), "07:31");
});

test("the message stamp is the time today, gains the date on another day and the year in another year", () => {
  const lateNight = new Date("2026-09-26T23:30:00Z");
  // Still today in Madrid (01:30 on the 27th), yesterday in UTC.
  assert.equal(formatLocalTime(lateNight, "message", { now, timeZone: "Europe/Madrid", locale: "en-GB" }), "01:30");
  assert.match(formatLocalTime(lateNight, "message", { now, timeZone: "UTC", locale: "en-GB" }), /^26 Sept?,? (at )?23:30$/);
  assert.equal(formatLocalTime(lateNight, "message", { now, timeZone: "UTC", locale: "en" }), "Sep 26, 11:30 PM");
  assert.equal(formatLocalTime("2025-01-02T10:00:00Z", "message", { now, timeZone: "UTC", locale: "en" }), "Jan 2, 2025, 10:00 AM");
  // The clock may be a number.
  assert.equal(formatLocalTime(sent, "message", { now: now.getTime(), timeZone: "UTC", locale: "en-GB" }), "07:31");
});

test("the date formats, and the year of a short date only when it is not this year", () => {
  assert.equal(formatLocalTime(sent, "date", { timeZone: "UTC", locale: "en" }), "Sep 27, 2026");
  assert.equal(formatLocalTime(sent, "dateTime", { timeZone: "UTC", locale: "en" }), "Sep 27, 2026, 7:31 AM");
  assert.equal(formatLocalTime(sent, undefined, { timeZone: "UTC", locale: "en" }), "Sep 27, 2026, 7:31 AM");
  assert.equal(formatLocalTime(sent, "shortDate", { now, timeZone: "UTC", locale: "en" }), "Sep 27");
  assert.equal(formatLocalTime("2025-01-02T10:00:00Z", "shortDate", { now, timeZone: "UTC", locale: "en" }), "Jan 2, 2025");
  // New Year's Eve in UTC is already next year in Tokyo: "this year" is the zone's.
  const eve = "2026-12-31T20:00:00Z";
  assert.equal(formatLocalTime(eve, "shortDate", { now, timeZone: "UTC", locale: "en" }), "Dec 31");
  assert.equal(formatLocalTime(eve, "shortDate", { now, timeZone: "Asia/Tokyo", locale: "en" }), "Jan 1, 2027");
});

test("a locale changes the words and the order, options pass through and their own zone wins", () => {
  assert.equal(formatLocalTime(sent, "date", { timeZone: "UTC", locale: "es" }), "27 sept 2026");
  assert.equal(formatLocalTime(sent, "date", { timeZone: "UTC", locale: "fr" }), "27 sept. 2026");
  assert.match(formatLocalTime(sent, "date", { timeZone: "UTC", locale: "ar-EG" }), /٢٠٢٦/);
  assert.equal(formatLocalTime(sent, { weekday: "long", hour: "numeric", hour12: false }, { timeZone: "UTC", locale: "en" }), "Sunday, 07");
  assert.equal(formatLocalTime(sent, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }, { timeZone: "UTC", locale: "en-GB" }), "16:31");
  // No locale is English, whatever the runtime's language: the text a server prints is the text the reader gets.
  assert.equal(formatLocalTime(sent, "date", { timeZone: "UTC" }), "Sep 27, 2026");
  assert.equal(formatLocalTime(sent, "time", { timeZone: "UTC" }), "7:31 AM");
});

test("an empty or invalid value is no text and no instant", () => {
  for (const value of [null, undefined, "", "not a date", Number.NaN]) {
    assert.equal(formatLocalTime(value, "date"), "");
    assert.equal(localTimeIso(value), null);
  }
  assert.equal(localTimeIso("2026-09-27T07:31:00Z"), "2026-09-27T07:31:00.000Z");
  assert.equal(localTimeIso(sent.getTime()), "2026-09-27T07:31:00.000Z");
});

test("on the server LocalTime is a hidden stand-in of the same shape, with the instant in dateTime and no server time in view", () => {
  const html = renderToStaticMarkup(<LocalTime value={sent} format="dateTime" className="stamp" />);
  assert.match(html, /^<time [^>]*>Sep 27, 2026, 7:31 AM<\/time>$/);
  const attributes = html.match(/^<time ([^>]*)>/)![1]!;
  assert.match(attributes, /dateTime="2026-09-27T07:31:00.000Z"/i);
  assert.match(attributes, /style="visibility:hidden"/);
  assert.match(attributes, /aria-hidden="true"/);
  assert.match(attributes, /class="fui-local-time stamp"/);
  assert.match(attributes, /data-slot="local-time"/);
  // The tooltip would be the server's zone too.
  assert.doesNotMatch(attributes, /title=/);
  // A style of the caller's survives next to the hiding.
  assert.match(renderToStaticMarkup(<LocalTime value={sent} style={{ color: "inherit" }} />), /style="color:inherit;visibility:hidden"/);
  // A locale the server knows shapes the stand-in too.
  assert.match(renderToStaticMarkup(<LocalTime value={sent} format="date" locale="es" />), /visibility:hidden[^>]*>27 sept 2026</);
  assert.equal(renderToStaticMarkup(<LocalTime value={null} />), "");
  assert.equal(renderToStaticMarkup(<LocalTime value="nonsense" />), "");
});

test("with a zone LocalTime is deterministic: rendered at once, visible, titled with the full date in that zone", () => {
  const html = renderToStaticMarkup(<LocalTime value={sent} format="time" timeZone="Europe/Madrid" locale="en-GB" prefix="Sent " />);
  assert.match(html, />Sent 09:31<\/time>$/);
  assert.doesNotMatch(html, /visibility|aria-hidden/);
  assert.match(html, /title="Sunday, 27 September 2026 at 09:31:00 CEST"/);
  // English unless told otherwise, so the server and the browser print the same words.
  assert.match(renderToStaticMarkup(<LocalTime value={sent} format="date" timeZone="UTC" />), />Sep 27, 2026</);
  assert.match(renderToStaticMarkup(<LocalTime value={sent} format="date" timeZone="UTC" locale="es" />), />27 sept 2026</);
  // A zone inside the options counts as well.
  assert.doesNotMatch(renderToStaticMarkup(<LocalTime value={sent} format={{ hour: "2-digit", timeZone: "UTC" }} />), /visibility/);
  assert.doesNotMatch(renderToStaticMarkup(<LocalTime value={sent} timeZone="UTC" title={false} />), /title=/);
  assert.match(renderToStaticMarkup(<LocalTime value={sent} timeZone="UTC" title="When it was sent" />), /title="When it was sent"/);
  assert.match(renderToStaticMarkup(<LocalTime value={sent} timeZone="UTC" titleFormat="date" />), /title="Sep 27, 2026"/);
  assert.match(renderToStaticMarkup(<LocalTime value={sent} format="message" now={now} timeZone="UTC" />), />7:31 AM</);
  assert.match(renderToStaticMarkup(<LocalTime value={sent} format="message" now={now} timeZone="UTC" locale="en-GB" />), />07:31</);
});

test("a local time keeps its digits in columns and on one line", () => {
  assert.match(styles, /\/\* 0\.12: foundations \*\/\s*\.fui-local-time \{\s*font-variant-numeric: tabular-nums;\s*white-space: nowrap;\s*\}/);
});

test("useHydrated is false on the server", () => {
  const Probe = () => <i>{String(useHydrated())}</i>;
  assert.equal(renderToStaticMarkup(<Probe />), "<i>false</i>");
});

// --- Hotkeys ---------------------------------------------------------------------------------------------------------

const press = (key: string, extra: Partial<HotkeyEvent> = {}): HotkeyEvent => ({ key, ...extra });

test("a hotkey parses to its key and modifiers, whatever the case, the aliases or a plus as the key", () => {
  assert.deepEqual(parseHotkey("mod+k"), { key: "k", mod: true, ctrl: false, meta: false, alt: false, shift: false });
  assert.deepEqual(parseHotkey("Ctrl+Alt+Delete"), { key: "delete", mod: false, ctrl: true, meta: false, alt: true, shift: false });
  assert.deepEqual(parseHotkey(" Shift + ? "), { key: "?", mod: false, ctrl: false, meta: false, alt: false, shift: true });
  assert.equal(parseHotkey("Space").key, " ");
  assert.equal(parseHotkey("Esc").key, "escape");
  assert.equal(parseHotkey("ArrowLeft").key, "arrowleft");
  assert.equal(parseHotkey("left").key, "arrowleft");
  assert.equal(parseHotkey("+").key, "+");
  assert.deepEqual(parseHotkey("shift++"), { key: "+", mod: false, ctrl: false, meta: false, alt: false, shift: true });
  assert.equal(parseHotkey("mod+plus").key, "+");
  assert.equal(parseHotkey("cmd+option+p").meta && parseHotkey("cmd+option+p").alt, true);
  assert.equal(parseHotkey("").key, "");
});

test("plain keys match by name, and a modifier the hotkey does not list makes it another key press", () => {
  assert.equal(matchHotkey(press("Enter"), "Enter"), true);
  assert.equal(matchHotkey(press("Enter"), "enter"), true);
  assert.equal(matchHotkey(press(" "), "Space"), true);
  assert.equal(matchHotkey(press("ArrowLeft"), "ArrowLeft"), true);
  assert.equal(matchHotkey(press("ArrowRight"), "ArrowLeft"), false);
  assert.equal(matchHotkey(press("Escape"), "Esc"), true);
  for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"] as const) {
    assert.equal(matchHotkey(press("Enter", { [modifier]: true }), "Enter"), false, `Enter with ${modifier}`);
    assert.equal(matchHotkey(press(" ", { [modifier]: true }), "Space"), false, `Space with ${modifier}`);
  }
  for (const modifier of ["ctrlKey", "metaKey", "altKey"] as const) {
    assert.equal(matchHotkey(press("1", { [modifier]: true }), "1"), false, `1 with ${modifier}`);
    assert.equal(matchHotkey(press("k", { [modifier]: true }), "k"), false, `k with ${modifier}`);
  }
  assert.equal(matchHotkey(press("Enter", { shiftKey: true }), "shift+Enter"), true);
  assert.equal(matchHotkey(press("Enter"), "shift+Enter"), false);
  assert.equal(matchHotkey(press("Enter"), ""), false);
});

test("mod is Ctrl or ⌘; a named modifier is exactly that one", () => {
  assert.equal(matchHotkey(press("k", { ctrlKey: true }), "mod+k"), true);
  assert.equal(matchHotkey(press("k", { metaKey: true }), "mod+k"), true);
  assert.equal(matchHotkey(press("k"), "mod+k"), false);
  assert.equal(matchHotkey(press("k", { ctrlKey: true, altKey: true }), "mod+k"), false);
  assert.equal(matchHotkey(press("K", { ctrlKey: true, shiftKey: true }), "mod+k"), false);
  assert.equal(matchHotkey(press("K", { ctrlKey: true, shiftKey: true }), "mod+shift+k"), true);
  assert.equal(matchHotkey(press("k", { metaKey: true }), "ctrl+k"), false);
  assert.equal(matchHotkey(press("k", { ctrlKey: true }), "ctrl+k"), true);
  assert.equal(matchHotkey(press("k", { ctrlKey: true, metaKey: true }), "ctrl+k"), false);
  assert.equal(matchHotkey(press("p", { metaKey: true, altKey: true }), "cmd+option+p"), true);
});

test("letters compare Shift, and match their physical key when the layout types another script", () => {
  assert.equal(matchHotkey(press("k"), "k"), true);
  assert.equal(matchHotkey(press("K", { shiftKey: true }), "k"), false);
  assert.equal(matchHotkey(press("K", { shiftKey: true }), "shift+k"), true);
  // Caps Lock: an upper-case letter without Shift is still the letter.
  assert.equal(matchHotkey(press("K"), "k"), true);
  // A Cyrillic layout types «л» on the K key.
  assert.equal(matchHotkey(press("л", { code: "KeyK", ctrlKey: true }), "mod+k"), true);
  assert.equal(matchHotkey(press("л", { code: "KeyK" }), "k"), true);
  assert.equal(matchHotkey(press("л", { code: "KeyL" }), "k"), false);
  // On Dvorak the K key types «t»: a Latin letter is what it says.
  assert.equal(matchHotkey(press("t", { code: "KeyK" }), "k"), false);
  // A dead key is not a letter of another script.
  assert.equal(matchHotkey(press("Dead", { code: "KeyK" }), "k"), false);
});

test("a digit or a symbol is the character the layout produced, however it was reached", () => {
  assert.equal(matchHotkey(press("1"), "1"), true);
  // A French keyboard types 1 with Shift.
  assert.equal(matchHotkey(press("1", { shiftKey: true, code: "Digit1" }), "1"), true);
  // And its unshifted key types «&», which is not 1.
  assert.equal(matchHotkey(press("&", { code: "Digit1" }), "1"), false);
  assert.equal(matchHotkey(press("2"), "1"), false);
  // Shift listed with a digit means the physical chord.
  assert.equal(matchHotkey(press("!", { shiftKey: true, code: "Digit1" }), "shift+1"), true);
  assert.equal(matchHotkey(press("1"), "shift+1"), false);
  // "?" is Shift+/ on a US keyboard and a key of its own elsewhere.
  assert.equal(matchHotkey(press("?", { shiftKey: true }), "shift+?"), true);
  assert.equal(matchHotkey(press("?", { shiftKey: true }), "?"), true);
  assert.equal(matchHotkey(press("?"), "shift+?"), true);
  assert.equal(matchHotkey(press("/"), "?"), false);
  assert.equal(matchHotkey(press("+", { shiftKey: true }), "shift++"), true);
  assert.equal(matchHotkey(press("+", { ctrlKey: true, shiftKey: true }), "mod+plus"), true);
  // AltGr reports Ctrl and Alt on Windows: the character it types is the key.
  const altGr = { ctrlKey: true, altKey: true, getModifierState: (key: string) => key === "AltGraph" };
  assert.equal(matchHotkey(press("@", altGr), "@"), true);
  assert.equal(matchHotkey(press("@", { ctrlKey: true, altKey: true }), "@"), false);
  assert.equal(matchHotkey(press("q", altGr), "q"), false);
});

type Fake = { tag: string; attributes: Record<string, string>; isContentEditable?: boolean; closest: (selector: string) => Fake | null };

/** The top-level parts of a selector list. */
function parts(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let from = 0;
  for (let at = 0; at < list.length; at += 1) {
    const char = list[at];
    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    else if (char === "," && depth === 0) {
      out.push(list.slice(from, at).trim());
      from = at + 1;
    }
  }
  return [...out, list.slice(from).trim()];
}

/** Enough of CSS for the selectors the guards use: a tag, attributes, `:not()` and `:is()`. Anything else throws. */
function matches(element: Pick<Fake, "tag" | "attributes">, list: string): boolean {
  return parts(list).some((part) => {
    let rest = part;
    const name = /^[a-z]+/.exec(rest)?.[0];
    if (name) {
      if (element.tag !== name) return false;
      rest = rest.slice(name.length);
    }
    while (rest) {
      if (rest.startsWith("[")) {
        const end = rest.indexOf("]");
        const [attribute, value] = rest.slice(1, end).split("=");
        const actual = element.attributes[attribute!];
        if (value === undefined ? actual === undefined : actual !== value.replace(/"/g, "")) return false;
        rest = rest.slice(end + 1);
        continue;
      }
      const pseudo = /^:(not|is)\(/.exec(rest);
      if (!pseudo) throw new Error(`the fake element cannot match ${part}`);
      let depth = 1;
      let end = pseudo[0].length;
      for (; depth > 0; end += 1) depth += rest[end] === "(" ? 1 : rest[end] === ")" ? -1 : 0;
      const inside = matches(element, rest.slice(pseudo[0].length, end - 1));
      if (pseudo[1] === "not" ? inside : !inside) return false;
      rest = rest.slice(end);
    }
    return true;
  });
}

/** A stand-in for an element with no ancestors, so the guards run where there is no DOM. */
function element(tag: string, attributes: Record<string, string> = {}, isContentEditable?: boolean): Fake {
  const self: Fake = { tag, attributes, isContentEditable, closest: (selector) => (matches(self, selector) ? self : null) };
  return self;
}
const input = (type?: string) => element("input", type === undefined ? {} : { type });
const role = (name: string) => element("div", { role: name });

test("typing targets are fields, selects, editable regions and the ARIA text roles; buttons and checkboxes are not", () => {
  for (const type of [undefined, "text", "search", "email", "number", "password", "radio", "range", "date"]) assert.equal(isTypingTarget(input(type)), true, `input ${type}`);
  for (const type of ["button", "submit", "reset", "checkbox", "file", "image", "color"]) assert.equal(isTypingTarget(input(type)), false, `input ${type}`);
  assert.equal(isTypingTarget(element("textarea")), true);
  assert.equal(isTypingTarget(element("select")), true);
  for (const name of ["textbox", "combobox", "searchbox", "spinbutton"]) assert.equal(isTypingTarget(role(name)), true, name);
  for (const name of ["button", "radio", "tab", "listbox"]) assert.equal(isTypingTarget(role(name)), false, name);
  assert.equal(isTypingTarget(element("button")), false);
  assert.equal(isTypingTarget(element("div")), false);
  // An editable region: the browser's own answer where there is one, the attribute where there is not.
  assert.equal(isTypingTarget(element("div", {}, true)), true);
  assert.equal(isTypingTarget(element("div", { contenteditable: "" }, false)), false);
  assert.equal(isTypingTarget(element("div", { contenteditable: "" })), true);
  assert.equal(isTypingTarget(element("div", { contenteditable: "plaintext-only" })), true);
  assert.equal(isTypingTarget(element("div", { contenteditable: "false" })), false);
  // What is not an element: the document, the window, nothing.
  for (const target of [null, undefined, {}, "input", 1]) assert.equal(isTypingTarget(target), false);
});

test("controls that answer Enter and Space themselves, or a selector of the caller's", () => {
  for (const name of ["button", "summary"]) assert.equal(isControlTarget(element(name)), true, name);
  assert.equal(isControlTarget(element("a", { href: "/" })), true);
  assert.equal(isControlTarget(element("a")), false);
  for (const type of ["button", "submit", "checkbox", "file"]) assert.equal(isControlTarget(input(type)), true, `input ${type}`);
  for (const type of [undefined, "text", "radio"]) assert.equal(isControlTarget(input(type)), false, `input ${type}`);
  for (const name of ["button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "option"]) assert.equal(isControlTarget(role(name)), true, name);
  assert.equal(isControlTarget(element("div")), false);
  assert.equal(isControlTarget(null), false);
  assert.equal(isControlTarget(element("div"), "div"), true);
  assert.equal(isControlTarget(element("button"), "a[href], summary"), false);
  // Radiant's lesson screen: Enter on a radio drawn as a button goes on, Enter on any other button presses it.
  assert.equal(isControlTarget(element("button", { role: "radio" }), 'a[href], summary, button:not([role="radio"])'), false);
  assert.match(HOTKEY_CONTROLS, /^a\[href\], area\[href\], button, summary, /);
});

test("aria-keyshortcuts spells a hotkey for assistive technology: mod is both chords", () => {
  assert.equal(ariaKeyshortcuts("mod+k"), "Control+K Meta+K");
  assert.equal(ariaKeyshortcuts("mod+shift+p"), "Control+Shift+P Meta+Shift+P");
  assert.equal(ariaKeyshortcuts("shift+?"), "Shift+?");
  assert.equal(ariaKeyshortcuts("1"), "1");
  assert.equal(ariaKeyshortcuts("Space"), "Space");
  assert.equal(ariaKeyshortcuts("arrowleft"), "ArrowLeft");
  assert.equal(ariaKeyshortcuts("esc"), "Escape");
  assert.equal(ariaKeyshortcuts("ctrl+alt+delete"), "Control+Alt+Delete");
  assert.equal(ariaKeyshortcuts("mod+plus"), "Control+Plus Meta+Plus");
  assert.equal(ariaKeyshortcuts("cmd+enter"), "Meta+Enter");
  assert.equal(ariaKeyshortcuts(""), "");
});

test("the hook listens on the document, checks composition, handled keys, the island and the scope, and cleans up", () => {
  const hook = source("use-hotkeys.ts");
  assert.match(hook, /^"use client";/);
  assert.match(hook, /event\.isComposing \|\| event\.keyCode === 229 \|\| event\.defaultPrevented/);
  assert.match(hook, /const ISLAND = '\[data-hotkeys="off"\]';/);
  assert.match(hook, /target\?\.closest\(ISLAND\)/);
  assert.match(hook, /!root \|\| !target \|\| !root\.contains\(target\)/);
  assert.match(hook, /document\.addEventListener\("keydown", onKeyDown\);\s*return \(\) => document\.removeEventListener\("keydown", onKeyDown\);/);
  // The pure half carries no directive, so a server module can import the matcher.
  assert.doesNotMatch(source("hotkeys.ts"), /"use client"/);
});

// --- Size, hydration, tokens: what a server render can show -----------------------------------------------------------

test("before it is measured an element is 0 by 0, and tokens are empty on the server", () => {
  const Size = () => {
    const { ref, width, height } = useElementSize<HTMLDivElement>();
    return <div ref={ref}>{`${width}x${height}`}</div>;
  };
  assert.equal(renderToStaticMarkup(<Size />), "<div>0x0</div>");
  const Tokens = () => {
    const tokens = useResolvedTokens(CHART_TOKENS);
    return <i>{JSON.stringify(tokens)}</i>;
  };
  assert.equal(renderToStaticMarkup(<Tokens />), "<i>{&quot;theme&quot;:&quot;light&quot;,&quot;colors&quot;:{},&quot;fontSans&quot;:&quot;&quot;,&quot;fontMono&quot;:&quot;&quot;}</i>");
  assert.deepEqual([...CHART_TOKENS], ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"]);
  // No DOM, no colour, and no throw.
  assert.equal(resolveColor("oklch(0.5 0.1 200)"), undefined);
  assert.equal(resolveColor(""), undefined);
});

test("the chart measures its frame through useElementSize, as whole pixels of clientWidth", () => {
  const chart = source("chart.tsx");
  assert.match(chart, /useElementSize<HTMLDivElement>\(undefined, \{ measure: frameSize \}\)/);
  assert.match(chart, /const frameSize = \(element: HTMLElement\) => \(\{ width: Math\.round\(element\.clientWidth\), height: 0 \}\);/);
  assert.doesNotMatch(chart, /new ResizeObserver/);
});

// --- ErrorBoundary ---------------------------------------------------------------------------------------------------

test("the default fallback is an inline error that names the part and offers to try again", () => {
  const html = renderToStaticMarkup(<ErrorBoundaryFallback reset={() => {}} />);
  const root = html.match(/^<div ([^>]*)>/)![1]!;
  assert.match(root, /role="alert"/);
  assert.match(root, /data-state="error"/);
  assert.match(root, /data-variant="inline"/);
  assert.match(root, /data-size="sm"/);
  assert.match(root, /data-slot="error-boundary-fallback"/);
  assert.match(html, /<h3>This part could not be shown<\/h3>/);
  assert.match(html, /<p class="fui-description">Something went wrong while drawing it\. The rest of the page still works\.<\/p>/);
  assert.match(html, /<button[^>]*data-variant="secondary"[^>]*>Try again<\/button>/);
});

test("its words and its heading level are the host's; without reset there is no button", () => {
  const html = renderToStaticMarkup(
    <ErrorBoundaryFallback reset={() => {}} headingLevel={2} labels={{ title: "No se pudo mostrar el diagrama", description: "", retry: "Reintentar" }} />,
  );
  assert.match(html, /<h2>No se pudo mostrar el diagrama<\/h2>/);
  assert.doesNotMatch(html, /fui-description/);
  assert.match(html, />Reintentar<\/button>/);
  assert.doesNotMatch(renderToStaticMarkup(<ErrorBoundaryFallback />), /<button/);
});

test("a boundary that has caught nothing renders its children and nothing else", () => {
  assert.equal(
    renderToStaticMarkup(
      <ErrorBoundary resetKey="a" fallback={<p>Broken</p>}>
        <p>Fine</p>
      </ErrorBoundary>,
    ),
    "<p>Fine</p>",
  );
});

test("a caught error shows the fallback in each of its forms, and a new resetKey gives the children another go", () => {
  const error = new Error("boom");
  const failed = ErrorBoundary.getDerivedStateFromError(error);
  assert.deepEqual(failed, { failed: true, error });
  assert.equal(ErrorBoundary.getDerivedStateFromProps({ resetKey: "a" }, { failed: true, error, resetKey: "a" }), null);
  assert.deepEqual(ErrorBoundary.getDerivedStateFromProps({ resetKey: "b" }, { failed: true, error, resetKey: "a" }), { failed: false, error: undefined, resetKey: "b" });
  // NaN is the same key as NaN.
  assert.equal(ErrorBoundary.getDerivedStateFromProps({ resetKey: Number.NaN }, { failed: true, error, resetKey: Number.NaN }), null);

  const render = (props: ConstructorParameters<typeof ErrorBoundary>[0]) => {
    const boundary = new ErrorBoundary(props);
    boundary.state = { failed: true, error, resetKey: props.resetKey };
    return renderToStaticMarkup(<>{boundary.render()}</>);
  };
  assert.match(render({ children: <p>Fine</p> }), /This part could not be shown[\s\S]*Try again/);
  assert.match(render({ labels: { retry: "Again" } }), />Again<\/button>/);
  assert.equal(render({ fallback: <p>Broken</p> }), "<p>Broken</p>");
  assert.equal(render({ fallback: null }), "");
  assert.equal(render({ fallback: ({ error: caught }) => <p>{String(caught)}</p> }), "<p>Error: boom</p>");
});

// --- Bidi and ForeignText --------------------------------------------------------------------------------------------

test("the direction of a language: its script when the tag names one, else the language, else the country", () => {
  for (const lang of ["ar", "AR", "ar-EG", "arz", "ary", "he", "iw", "he-IL", "fa", "fa-AF", "ur", "ps", "sd", "ug", "yi", "dv", "ckb", "syr", "nqo", "ks", "pnb"]) assert.equal(dirOf(lang), "rtl", lang);
  for (const lang of ["en", "es", "fr", "de", "ja", "zh-Hant", "hi", "tr", "ku", "az", "uz", "pa", "ms", "kk", "ha", "sw", "und", "x-private"]) assert.equal(dirOf(lang), "ltr", lang);
  // A script subtag decides, either way.
  for (const lang of ["az-Arab", "ku-Arab-IQ", "pa-Arab", "ff-Adlm", "und-Hebr", "ms-Arab", "uz-Arab-AF", "en-Thaa", "syr-Syrc", "man-Nkoo"]) assert.equal(dirOf(lang), "rtl", lang);
  for (const lang of ["ar-Latn", "he-Latn", "fa-Cyrl", "ur-Deva", "ku-Latn-IQ", "sd-Deva"]) assert.equal(dirOf(lang), "ltr", lang);
  // The country decides where the language is written two ways.
  for (const lang of ["pa-PK", "az-IR", "ku-IQ", "uz-AF", "kk-CN"]) assert.equal(dirOf(lang), "rtl", lang);
  for (const lang of ["pa-IN", "az-AZ", "ku-TR", "uz-UZ", "sd-IN"]) assert.equal(dirOf(lang), "ltr", lang);
  // Underscores, extensions and nonsense.
  assert.equal(dirOf("ar_EG"), "rtl");
  assert.equal(dirOf("ar-u-nu-latn"), "rtl");
  assert.equal(dirOf("en-u-ca-hebr"), "ltr");
  assert.equal(dirOf("en-x-arab"), "ltr");
  for (const lang of ["", null, undefined, "   "]) assert.equal(dirOf(lang), "ltr");
});

test("the direction of a text is that of its first letter; digits, punctuation and emoji have none", () => {
  assert.equal(scriptDirection("Hello"), "ltr");
  assert.equal(scriptDirection("مرحبا"), "rtl");
  assert.equal(scriptDirection("שלום"), "rtl");
  assert.equal(scriptDirection("ܫܠܡܐ"), "rtl");
  assert.equal(scriptDirection("ދިވެހި"), "rtl");
  assert.equal(scriptDirection("𞤀𞤣𞤤𞤢𞤥"), "rtl");
  assert.equal(scriptDirection("こんにちは"), "ltr");
  assert.equal(scriptDirection("Привет"), "ltr");
  assert.equal(scriptDirection("123 مرحبا"), "rtl");
  assert.equal(scriptDirection("«¿ 42 — hola?»"), "ltr");
  assert.equal(scriptDirection("(٣) abc"), "ltr");
  assert.equal(scriptDirection("PDF مرحبا"), "ltr");
  for (const text of ["", "42", "…", "٣٤", "🙂", " - / "]) assert.equal(scriptDirection(text), undefined, JSON.stringify(text));
});

test("isolate wraps a string in first-strong isolate marks, and leaves nothing as nothing", () => {
  assert.equal(isolate("تقرير.pdf"), "\u2068تقرير.pdf\u2069");
  assert.equal(isolate("report.pdf"), "\u2068report.pdf\u2069");
  assert.equal(isolate(""), "");
  assert.equal(`Imported ${isolate("ملف")} (3)`, "Imported \u2068ملف\u2069 (3)");
});

test("ForeignText is a bdi with the language and its direction", () => {
  assert.equal(renderToStaticMarkup(<ForeignText lang="ar">مرحبا</ForeignText>), '<bdi data-slot="foreign-text" lang="ar" dir="rtl">مرحبا</bdi>');
  assert.equal(renderToStaticMarkup(<ForeignText lang="es">¿Cómo estás?</ForeignText>), '<bdi data-slot="foreign-text" lang="es" dir="ltr">¿Cómo estás?</bdi>');
  // The language wins over the look of the text: an Arabic word quoted in Latin letters is still left to right only if said so.
  assert.match(renderToStaticMarkup(<ForeignText lang="ar-Latn">marhaban</ForeignText>), /lang="ar-Latn" dir="ltr"/);
  assert.match(renderToStaticMarkup(<ForeignText lang="ar" dir="ltr">٣ + ٤</ForeignText>), /lang="ar" dir="ltr"/);
  // No language: the first letter of a string, else the browser decides.
  assert.equal(renderToStaticMarkup(<ForeignText>שלום</ForeignText>), '<bdi data-slot="foreign-text" dir="rtl">שלום</bdi>');
  assert.match(renderToStaticMarkup(<ForeignText>hello</ForeignText>), /dir="ltr"/);
  assert.match(renderToStaticMarkup(<ForeignText>42</ForeignText>), /dir="auto"/);
  assert.match(
    renderToStaticMarkup(
      <ForeignText>
        <em>שלום</em>
      </ForeignText>,
    ),
    /dir="auto"/,
  );
  // Another element still isolates, because it carries dir; the rest passes through.
  assert.equal(
    renderToStaticMarkup(
      <ForeignText as="q" lang="he" className="quote" title="Hebrew">
        שלום
      </ForeignText>,
    ),
    '<q data-slot="foreign-text" class="quote" title="Hebrew" lang="he" dir="rtl">שלום</q>',
  );
  assert.equal(renderToStaticMarkup(<Bdi>Ana</Bdi>), '<bdi data-slot="bdi" dir="auto">Ana</bdi>');
  assert.match(renderToStaticMarkup(<Bdi dir="rtl" className="name">علي</Bdi>), /class="name" dir="rtl"/);
  // Hook-free and without a directive: a Server Component renders them.
  assert.doesNotMatch(source("foreign-text.tsx"), /"use client"|\buse[A-Z]\w*\(/);
  assert.doesNotMatch(source("bidi.ts"), /"use client"|from "react"/);
});

test("interpolate puts nodes where the translation has placeholders, keyed, and leaves unknown ones as written", () => {
  const html = (nodes: ReturnType<typeof interpolate>) => renderToStaticMarkup(<p>{nodes}</p>);
  assert.equal(
    html(interpolate("The word {word} means {meaning}.", { word: <ForeignText lang="ar">كتاب</ForeignText>, meaning: <em>book</em> })),
    '<p>The word <bdi data-slot="foreign-text" lang="ar" dir="rtl">كتاب</bdi> means <em>book</em>.</p>',
  );
  // The translation decides the order.
  assert.equal(html(interpolate("{meaning} هو معنى {word}", { word: <b>kitāb</b>, meaning: <em>book</em> })), "<p><em>book</em> هو معنى <b>kitāb</b></p>");
  // A string comes from outside the sentence: it is isolated. A number is not.
  assert.equal(html(interpolate("Imported {name} ({count})", { name: "تقرير.pdf", count: 3 })), "<p>Imported <bdi>تقرير.pdf</bdi> (3)</p>");
  // Unknown placeholders and stray braces stay.
  assert.equal(html(interpolate("{greeting}, {name}! {} { name } {0}", { name: "Ana" })), "<p>{greeting}, <bdi>Ana</bdi>! {} { name } {0}</p>");
  // A slot that is empty takes its placeholder with it; one used twice appears twice.
  assert.equal(html(interpolate("a{x}b{y}c{z}", { x: null, y: false, z: "" })), "<p>abc</p>");
  assert.equal(html(interpolate("{x} and {x}", { x: <i>x</i> })), "<p><i>x</i> and <i>x</i></p>");
  assert.equal(html(interpolate("{list}", { list: [<i key="a">a</i>, <i key="b">b</i>] })), "<p><i>a</i><i>b</i></p>");
  assert.deepEqual(interpolate("No placeholders", { x: "y" }), ["No placeholders"]);
  assert.deepEqual(interpolate("", {}), []);
  // Inherited names are not slots.
  assert.equal(html(interpolate("{toString} {constructor}", {})), "<p>{toString} {constructor}</p>");
  const keys = interpolate("{x}{y}{x}", { x: <i>x</i>, y: "y" }).map((node) => (typeof node === "object" && node && "key" in node ? node.key : null));
  assert.deepEqual(keys, ["x:0", "y:1", "x:2"]);
});

// --- Export ----------------------------------------------------------------------------------------------------------

test("a file stem keeps the letters and digits of any language and nothing else", () => {
  assert.equal(fileStem("Krebs cycle", "diagram"), "krebs-cycle");
  assert.equal(fileStem("  Q3 / Revenue: “final” (v2).svg  ", "chart"), "q3-revenue-final-v2-svg");
  assert.equal(fileStem("تقرير المبيعات ٢٠٢٦", "report"), "تقرير-المبيعات-٢٠٢٦");
  assert.equal(fileStem("مَدْرَسَة", "word"), "مَدْرَسَة");
  assert.equal(fileStem("売上レポート 2026年", "report"), "売上レポート-2026年");
  assert.equal(fileStem("Отчёт о продажах", "report"), "отчёт-о-продажах");
  assert.equal(fileStem("Crème brûlée №5", "recipe"), "crème-brûlée-no5");
  assert.equal(fileStem("हिन्दी पाठ", "lesson"), "हिन्दी-पाठ");
  // Full-width forms fold to the plain ones.
  assert.equal(fileStem("ＡＢＣ　１２３", "x"), "abc-123");
  // Emoji, with their joiners and selectors, leave no trace.
  assert.equal(fileStem("🚀 Launch ❤️ plan 👩‍👩‍👧", "plan"), "launch-plan");
  assert.equal(fileStem("1️⃣ first", "x"), "1-first");
  // Paths and what a shell or a file system would trip on.
  assert.equal(fileStem("../../etc/passwd", "file"), "etc-passwd");
  assert.equal(fileStem("C:\\Users\\ana\\notes.txt", "file"), "c-users-ana-notes-txt");
  assert.equal(fileStem("a\u0000b\nc\td", "file"), "a-b-c-d");
  assert.equal(fileStem("--draft--", "file"), "draft");
  assert.equal(fileStem("...", "file"), "file");
  assert.equal(fileStem("con", "file"), "con-file");
  assert.equal(fileStem("COM1", "file"), "com1-file");
  assert.equal(fileStem("console", "file"), "console");
  // Nothing left: the fallback.
  for (const title of ["", "   ", "🙂🙂", "/// ???", null, undefined]) assert.equal(fileStem(title, "untitled"), "untitled");
});

test("a file stem is capped by characters, never mid-pair, and does not end on a separator", () => {
  assert.equal(fileStem("a".repeat(100), "x").length, 60);
  assert.equal(fileStem("word ".repeat(30), "x", 10), "word-word");
  assert.equal(fileStem("word ".repeat(30), "x", 9), "word-word");
  // Characters outside the basic plane count once each.
  assert.equal(fileStem("𞤀𞤣𞤤𞤢𞤥 𞤆𞤵𞤤𞤢𞤪", "x", 3), "𞤢𞤣𞤤");
  assert.equal(Array.from(fileStem("𠮷".repeat(80), "x")).length, 60);
});

test("the export functions say clearly that they need a browser", async () => {
  assert.throws(() => downloadFile("a.txt", "a"), (error: unknown) => error instanceof ExportError && error.code === "no-dom" && /downloadFile needs a browser/.test(error.message));
  assert.throws(() => serializeSvg({} as SVGSVGElement), (error: unknown) => error instanceof ExportError && error.code === "no-dom");
  for (const call of [() => svgToPng("<svg/>"), () => copyImage("x.png"), () => copyText("x")]) {
    await assert.rejects(call, (error: unknown) => error instanceof ExportError && error.code === "no-dom" && error.name === "ExportError");
  }
});

test("the export module has no directive, reads no network and is a subpath of its own", () => {
  const module = source("export.ts");
  assert.doesNotMatch(module, /"use client"/);
  assert.doesNotMatch(module, /\bfetch\(|XMLHttpRequest/);
  const manifest = JSON.parse(readFileSync(new URL("../../packages/ui/package.json", import.meta.url), "utf8")) as { exports: Record<string, unknown> };
  assert.deepEqual(manifest.exports["./export"], { types: "./dist/export.d.ts", import: "./dist/export.js" });
  const build = readFileSync(new URL("../../scripts/build.mjs", import.meta.url), "utf8");
  assert.match(build, /export: resolve\(directory, "src\/export\.ts"\)/);
});

test("the pure modules carry no client directive, and the ones with hooks do (the build marks a module by its source)", () => {
  for (const file of ["time-format.ts", "hotkeys.ts", "export.ts", "resolve-color.ts", "bidi.ts", "foreign-text.tsx"])
    assert.doesNotMatch(source(file), /^"use client"/, file);
  for (const file of ["use-hotkeys.ts", "use-hydrated.ts", "local-time.tsx", "use-element-size.ts", "error-boundary.tsx", "use-resolved-tokens.ts", "announcer.tsx"])
    assert.match(source(file), /^"use client";/, file);
});

// --- Announcer -------------------------------------------------------------------------------------------------------

test("the announcer renders one polite and one assertive region, always in the page and only clipped", () => {
  const Child = () => {
    useAnnounce();
    return <p>Page</p>;
  };
  const html = renderToStaticMarkup(
    <Announcer>
      <Child />
    </Announcer>,
  );
  assert.equal(
    html,
    '<p>Page</p><div data-slot="announcer" data-live="polite" class="fui-sr-only" role="status" aria-live="polite" aria-atomic="true"></div><div data-slot="announcer" data-live="assertive" class="fui-sr-only" role="alert" aria-live="assertive" aria-atomic="true"></div>',
  );
  const clipped = styles.slice(styles.indexOf(".fui-sr-only {"), styles.indexOf("}", styles.indexOf(".fui-sr-only {")));
  assert.match(clipped, /position: absolute;[\s\S]*width: 1px;[\s\S]*height: 1px;[\s\S]*overflow: hidden;[\s\S]*clip: rect\(0, 0, 0, 0\);/);
  assert.doesNotMatch(clipped, /display: none|visibility: hidden/);
  // Without a provider the hook still returns a function, and calling it where there is no page does nothing.
  let announce: ReturnType<typeof useAnnounce> | undefined;
  const Alone = () => {
    announce = useAnnounce();
    return null;
  };
  renderToStaticMarkup(<Alone />);
  assert.equal(typeof announce, "function");
  assert.doesNotThrow(() => announce!("Saved"));
});
