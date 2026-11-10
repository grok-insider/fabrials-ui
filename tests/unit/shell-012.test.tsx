import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DitherCanvas,
  EditableText,
  OnScreenKeyboard,
  SidebarAccount,
  SidebarInset,
  SidebarInsetContent,
  SidebarInsetHeader,
  SidebarProvider,
} from "../../packages/ui/src/index";
import { backspaceAtCaret, backspaceAtCaretWithoutSegmenter, insertAtCaret } from "../../packages/ui/src/caret";
import { commitDecision } from "../../packages/ui/src/editable-text-logic";
import { neighbourKey, type KeyBox } from "../../packages/ui/src/key-nav";
import {
  containFit,
  coverFit,
  desaturate,
  ditherLumaToRamp,
  ditherToRamp,
  luma,
  toneLuma,
  type Rgb,
} from "../../packages/ui/src/dither";
import { uiStyles } from "./read-styles";

const styles = uiStyles();
const BLOCK_MARK = "/* 0.12: the shell pieces";
const block = styles.slice(styles.lastIndexOf("@layer components {", styles.indexOf(BLOCK_MARK)));
const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const at = block.search(new RegExp(`(?:^|\\n)  ${escaped} \\{`));
  assert.ok(at >= 0, `missing rule ${selector}`);
  const open = block.indexOf("{", at);
  return block.slice(at, block.indexOf("}", open) + 1);
};
/** The body of the first `@media (…)` block that follows `after` in the 0.12 block. */
const media = (query: string, after = "") => {
  const start = block.indexOf(`@media ${query} {`, after ? block.indexOf(after) : 0);
  assert.ok(start >= 0, `missing @media ${query}`);
  let depth = 0;
  for (let at = block.indexOf("{", start); at < block.length; at += 1) {
    if (block[at] === "{") depth += 1;
    if (block[at] === "}" && --depth === 0) return block.slice(start, at + 1);
  }
  throw new Error("unbalanced block");
};
const attribute = (html: string, name: string) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];

// ------------------------------------------------------------------------------------------------------------- the caret

test("a key goes in at the caret, replacing what was selected", () => {
  assert.deepEqual(insertAtCaret("hola", 2, 2, "l"), { value: "holla", caret: 3 });
  assert.deepEqual(insertAtCaret("hola", 1, 3, "ey"), { value: "heya", caret: 3 });
  assert.deepEqual(insertAtCaret("abc", 0, 0, "x"), { value: "xabc", caret: 1 });
  assert.deepEqual(insertAtCaret("abc", 3, 3, "!"), { value: "abc!", caret: 4 });
  assert.deepEqual(insertAtCaret("", null, null, "x"), { value: "x", caret: 1 });
  assert.deepEqual(insertAtCaret("abc", null, null, "x"), { value: "abcx", caret: 4 });
  // A selection given backwards, or outside the text, is clamped.
  assert.deepEqual(insertAtCaret("abc", 3, 1, "-"), { value: "a-", caret: 2 });
  assert.deepEqual(insertAtCaret("abc", 9, 12, "-"), { value: "abc-", caret: 4 });
  assert.deepEqual(insertAtCaret("كِتَاب", 0, 0, "و"), { value: "وكِتَاب", caret: 1 });
});

test("backspace takes the selection, or a whole cluster: a letter keeps its marks", () => {
  assert.deepEqual(backspaceAtCaret("hola", 4, 4), { value: "hol", caret: 3 });
  assert.deepEqual(backspaceAtCaret("hello", 1, 4), { value: "ho", caret: 1 });
  assert.deepEqual(backspaceAtCaret("abc", 0, 0), { value: "abc", caret: 0 });
  assert.deepEqual(backspaceAtCaret("", 0, 0), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaret("abc", null, null), { value: "ab", caret: 2 });
  // A letter with a vowel mark is one cluster: both go.
  assert.deepEqual(backspaceAtCaret("بَ", 2, 2), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaret("كِتَاب", 6, 6), { value: "كِتَا", caret: 5 });
  // A caret inside a cluster deletes that cluster.
  assert.deepEqual(backspaceAtCaret("بَ", 1, 1), { value: "", caret: 0 });
  // A joined emoji, a surrogate pair and a variation selector each stay whole.
  assert.deepEqual(backspaceAtCaret("👨‍👩‍👧", 8, 8), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaret("a😀", 3, 3), { value: "a", caret: 1 });
  assert.deepEqual(backspaceAtCaret("❤️", 2, 2), { value: "", caret: 0 });
});

test("backspace without Intl.Segmenter walks back over marks, joiners and surrogate pairs", () => {
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("hola", 4, 4), { value: "hol", caret: 3 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("hello", 1, 4), { value: "ho", caret: 1 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("abc", 0, 0), { value: "abc", caret: 0 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("بَ", 2, 2), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("بَ", 1, 1), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("كِتَاب", 6, 6), { value: "كِتَا", caret: 5 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("👨‍👩‍👧", 8, 8), { value: "", caret: 0 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("a😀", 3, 3), { value: "a", caret: 1 });
  assert.deepEqual(backspaceAtCaretWithoutSegmenter("❤️", 2, 2), { value: "", caret: 0 });
  // Both roads agree wherever a cluster is made of marks.
  for (const [value, caret] of [["بَ", 2], ["كِتَاب", 6], ["a😀", 3], ["👨‍👩‍👧", 8], ["", 0]] as const)
    assert.deepEqual(backspaceAtCaretWithoutSegmenter(value, caret, caret), backspaceAtCaret(value, caret, caret), value);
});

// -------------------------------------------------------------------------------------------------------- the picture

test("cover crops the overflow evenly; contain letterboxes the whole picture", () => {
  assert.deepEqual(coverFit({ width: 320, height: 200 }, { width: 100, height: 100 }), { sx: 60, sy: 0, sw: 200, sh: 200 });
  assert.deepEqual(coverFit({ width: 100, height: 100 }, { width: 200, height: 100 }), { sx: 0, sy: 25, sw: 100, sh: 50 });
  assert.deepEqual(coverFit({ width: 100, height: 100 }, { width: 100, height: 100 }), { sx: 0, sy: 0, sw: 100, sh: 100 });
  assert.deepEqual(containFit({ width: 320, height: 200 }, { width: 100, height: 100 }), { dx: 0, dy: 18.75, dw: 100, dh: 62.5 });
  assert.deepEqual(containFit({ width: 100, height: 100 }, { width: 200, height: 100 }), { dx: 50, dy: 0, dw: 100, dh: 100 });
  // A picture with no size, or a box with none, draws nothing rather than throwing.
  assert.deepEqual(coverFit({ width: 0, height: 0 }, { width: 10, height: 10 }), { sx: 0, sy: 0, sw: 0, sh: 0 });
  assert.deepEqual(containFit({ width: 10, height: 10 }, { width: 0, height: 10 }), { dx: 0, dy: 0, dw: 0, dh: 0 });
});

test("a tone maps brightness into a readable range", () => {
  assert.equal(toneLuma(0), 0);
  assert.equal(toneLuma(255), 255);
  assert.equal(toneLuma(128), 128);
  assert.equal(toneLuma(0, { min: 40, max: 210 }), 40);
  assert.equal(toneLuma(255, { min: 40, max: 210 }), 210);
  assert.equal(toneLuma(128, { min: 40, max: 210 }), 125);
  // Contrast stretches around the middle, and clamps at both ends.
  assert.equal(toneLuma(170, { contrast: 2 }), 212);
  assert.equal(toneLuma(255, { contrast: 2 }), 255);
  assert.equal(toneLuma(0, { contrast: 2 }), 0);
  assert.equal(toneLuma(85, { contrast: 2 }), 42);
  assert.equal(toneLuma(128, { contrast: 0 }), 128);
  assert.equal(toneLuma(Number.NaN), 0);
  assert.equal(toneLuma(-20, { min: 10, max: 20 }), 10);
  assert.equal(toneLuma(999, { min: 10, max: 20 }), 20);
});

test("desaturate pulls a colour toward its own grey", () => {
  assert.deepEqual(desaturate([200, 100, 50], 1), [118, 118, 118]);
  assert.deepEqual(desaturate([200, 100, 50], 0), [200, 100, 50]);
  assert.deepEqual(desaturate([200, 100, 50], 0.5), [159, 109, 84]);
  assert.deepEqual(desaturate([200, 100, 50], 2), [118, 118, 118]);
  assert.deepEqual(desaturate([200, 100, 50], Number.NaN), [200, 100, 50]);
});

test("luma reads a colour or three channels alike", () => {
  assert.equal(luma([100, 100, 100]), 100);
  assert.equal(luma(100, 100, 100), 100);
  assert.equal(luma(255, 0, 0), 63);
  assert.equal(luma([255, 255, 255]), 255);
});

test("a picture dithered onto a ramp by position uses the ramp's colours and nothing else", () => {
  const ramp: Rgb[] = [
    [0, 0, 0],
    [255, 255, 255],
  ];
  const grey = (values: number[]) => {
    const data = new Uint8ClampedArray(values.length * 4);
    values.forEach((value, at) => {
      data[at * 4] = data[at * 4 + 1] = data[at * 4 + 2] = value;
      data[at * 4 + 3] = 255;
    });
    return data;
  };
  const pixelsOf = (data: Uint8ClampedArray) =>
    [...data.values()].reduce<Rgb[]>((all, value, at) => {
      if (at % 4 === 0) all.push([value, data[at + 1]!, data[at + 2]!]);
      return all;
    }, []);
  // The ends of the ramp are the ends of the picture.
  const ends = grey([0, 255, 0, 255]);
  ditherLumaToRamp(ends, 4, ramp);
  assert.deepEqual(pixelsOf(ends), [[0, 0, 0], [255, 255, 255], [0, 0, 0], [255, 255, 255]]);
  // Halfway, the Bayer threshold decides per dot: both colours appear, and no third one.
  const mid = grey(new Array<number>(64).fill(128));
  ditherLumaToRamp(mid, 8, ramp);
  assert.deepEqual([...new Set(pixelsOf(mid).map((pixel) => pixel.join(",")))].sort(), ["0,0,0", "255,255,255"]);
  // And two colours are the least it takes: one is a mistake, not a picture.
  assert.throws(() => ditherLumaToRamp(grey([0]), 1, [[0, 0, 0]]), /at least two/);
  // The brightness path keeps the same promise: ramp colours only.
  const bright = grey([90, 140, 200, 250]);
  ditherToRamp(bright, 4, ramp);
  for (const [r] of pixelsOf(bright)) assert.ok(r === 0 || r === 255, String(r));
});

// ------------------------------------------------------------------------------------------------ the keyboard's geometry

/** Three rows of three keys, 32 px square, 8 px apart. */
const GRID: KeyBox[] = Array.from({ length: 9 }, (_, at) => ({
  x: (at % 3) * 40,
  y: Math.floor(at / 3) * 40,
  width: 32,
  height: 32,
}));

test("the arrows take the focus by what is on screen", () => {
  assert.equal(neighbourKey(GRID, 4, "up"), 1);
  assert.equal(neighbourKey(GRID, 4, "down"), 7);
  assert.equal(neighbourKey(GRID, 4, "previous"), 3);
  assert.equal(neighbourKey(GRID, 4, "next"), 5);
  assert.equal(neighbourKey(GRID, 0, "previous"), -1);
  assert.equal(neighbourKey(GRID, 8, "next"), -1);
  assert.equal(neighbourKey(GRID, 0, "up"), -1);
  assert.equal(neighbourKey(GRID, 8, "down"), -1);
  // Home and End stay in the key's own row.
  assert.equal(neighbourKey(GRID, 7, "home"), 6);
  assert.equal(neighbourKey(GRID, 6, "end"), 8);
  assert.equal(neighbourKey(GRID, 6, "home"), -1);
  // A key with the same centre does not count as the key below it.
  assert.equal(neighbourKey([{ x: 0, y: 0, width: 32, height: 32 }, { x: 0, y: 0, width: 32, height: 32 }], 0, "down"), -1);
  assert.equal(neighbourKey([], 0, "down"), -1);
});

test("the key below is the one nearest the middle, not the next in the markup", () => {
  // A bottom row with a space bar in the middle and a key each side; the key above the bar's right half finds the bar.
  const rows: KeyBox[] = [
    { x: 0, y: 0, width: 40, height: 32 },
    { x: 48, y: 0, width: 40, height: 32 },
    { x: 0, y: 40, width: 36, height: 32 },
    { x: 44, y: 40, width: 140, height: 32 },
  ];
  assert.equal(neighbourKey(rows, 0, "down"), 2);
  assert.equal(neighbourKey(rows, 1, "down"), 3);
  assert.equal(neighbourKey(rows, 3, "up"), 1);
  assert.equal(neighbourKey(rows, 2, "next"), 3);
});

// -------------------------------------------------------------------------------------------------- the commit decision

test("a title that did not change, or came out empty, calls nobody", () => {
  assert.deepEqual(commitDecision("  hola  ", "hola"), { kind: "unchanged" });
  assert.deepEqual(commitDecision("hola", "hola"), { kind: "unchanged" });
  assert.deepEqual(commitDecision("", "hola"), { kind: "empty" });
  assert.deepEqual(commitDecision("   ", "hola"), { kind: "empty" });
  assert.deepEqual(commitDecision("", ""), { kind: "empty" });
  assert.deepEqual(commitDecision("  nuevo ", "hola"), { kind: "commit", value: "nuevo" });
  assert.deepEqual(commitDecision("hola!", "hola"), { kind: "commit", value: "hola!" });
  assert.deepEqual(commitDecision("  كتاب  ", "كتاب"), { kind: "unchanged" });
});

// ------------------------------------------------------------------------------------------------------- the markup

function account(extra = "") {
  return renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarAccount email="ada@harbour.test" name="Ada Lovelace">
        <a href="#settings">Settings</a>
      </SidebarAccount>
      {extra}
    </SidebarProvider>,
  );
}

test("the account row is one named button with the picture, the name and the second line", () => {
  const html = account();
  assert.match(html, /data-slot="sidebar-account-trigger"/);
  assert.equal(attribute(html, "aria-label"), "Account menu for Ada Lovelace");
  assert.equal(attribute(html, "type"), "button");
  assert.match(html, /data-slot="avatar"/);
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /ada@harbour\.test/);
  assert.match(html, /fui-sidebar-account-chevron/);
  // The name takes its own direction and the row is not the current page.
  assert.match(html, /class="fui-sidebar-account-name" dir="auto"/);
  assert.doesNotMatch(html, /data-active/);
  // Closed: no menu in the markup.
  assert.doesNotMatch(html, /fui-menu/);
});

test("the account row without a name says it is an account, and takes the current row's plate when asked", () => {
  const empty = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarAccount />
    </SidebarProvider>,
  );
  assert.equal(attribute(empty, "aria-label"), "Account menu for Account");
  const active = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarAccount active email="beacon@harbour.test" name="Beacon Operations" />
    </SidebarProvider>,
  );
  assert.match(active, /data-active="true"/);
  // With no second line to add, the email is not repeated under the name.
  assert.equal((active.match(/beacon@harbour\.test/g) ?? []).length, 1);
});

test("the labels of the account row are the host's", () => {
  const html = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarAccount email="ada@harbour.test" labels={{ trigger: (name) => `Menú de ${name}` }} name="Ada" />
    </SidebarProvider>,
  );
  assert.equal(attribute(html, "aria-label"), "Menú de Ada");
});

test("the bar names the app, and its title is a heading only when asked", () => {
  const plain = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarInset>
        <SidebarInsetHeader title="Reports" triggerLabel="Open the navigation" />
      </SidebarInset>
    </SidebarProvider>,
  );
  assert.match(plain, /data-slot="sidebar-inset-header"/);
  assert.equal(attribute(plain, "data-visibility"), "mobile");
  assert.match(plain, /<span class="fui-sidebar-inset-title" dir="auto">Reports<\/span>/);
  assert.match(plain, /<span class="fui-sr-only">Open the navigation<\/span>/);
  assert.match(plain, /data-slot="sidebar-inset-header-actions"/);

  const heading = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarInset>
        <SidebarInsetHeader headingLevel={1} title="Reports" visibility="always" />
      </SidebarInset>
    </SidebarProvider>,
  );
  assert.match(heading, /<h1 class="fui-sidebar-inset-title" dir="auto">Reports<\/h1>/);
  assert.equal(attribute(heading, "data-visibility"), "always");
});

test("a framed inset scrolls inside, and its skip link goes to the content part", () => {
  const html = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarInset frame skipLabel="Skip to content">
        <SidebarInsetHeader title="Reports" />
        <SidebarInsetContent>the reports</SidebarInsetContent>
      </SidebarInset>
    </SidebarProvider>,
  );
  assert.match(html, /data-frame="true"/);
  assert.match(html, /class="fui-skip-link" href="#main-content"/);
  assert.match(html, /data-slot="sidebar-inset-content" id="main-content" tabindex="-1"/);
  const plain = renderToStaticMarkup(
    <SidebarProvider keyboardShortcut={false} persist={false}>
      <SidebarInset>nothing</SidebarInset>
    </SidebarProvider>,
  );
  assert.doesNotMatch(plain, /fui-skip-link|data-frame/);
});

test("a title renamed in place shows the text, or the field, or that a commit is still going", () => {
  const display = renderToStaticMarkup(<EditableText label="Rename chat" onCommit={() => undefined} value="Harbour" />);
  assert.match(display, /class="fui-editable-text-value" dir="auto"/);
  assert.match(display, /Harbour/);
  assert.doesNotMatch(display, /<input/);

  const editing = renderToStaticMarkup(<EditableText defaultEditing label="Rename chat" onCommit={() => undefined} value="Harbour" />);
  assert.match(editing, /<input[^>]*aria-label="Rename chat"/);
  assert.match(editing, /value="Harbour"/);
  assert.match(editing, /data-editing="true"/);

  const pending = renderToStaticMarkup(<EditableText label="Rename chat" onCommit={() => undefined} pending value="Harbour" />);
  assert.match(pending, /data-pending="true"/);
  assert.match(pending, /aria-busy="true"/);
  assert.match(pending, /role="status"/);
  assert.match(pending, /Saving/);
});

test("the pencil is a named key, and the text is a tab stop only when it starts the edit itself", () => {
  const withTrigger = renderToStaticMarkup(<EditableText label="Rename chat" onCommit={() => undefined} showTrigger triggerLabel="Rename the chat" value="Harbour" />);
  assert.match(withTrigger, /aria-label="Rename the chat"/);
  assert.match(withTrigger, /data-slot="editable-text-trigger"/);
  assert.match(withTrigger, /tabindex="-1"/);
  const byDouble = renderToStaticMarkup(<EditableText label="Rename chat" onCommit={() => undefined} startOn="doubleClick" value="Harbour" />);
  assert.match(byDouble, /tabindex="0"/);
});

test("the keyboard is one toolbar with one tab stop and a name for every key", () => {
  const html = renderToStaticMarkup(
    <OnScreenKeyboard
      dir="rtl"
      label="Arabic keyboard"
      rows={[
        [{ value: "ض" }, { value: "ص", name: "sad" }],
        [{ value: " ", kind: "space", width: 4 }, { value: "", kind: "backspace" }],
      ]}
    />,
  );
  assert.match(html, /role="toolbar"/);
  assert.equal(attribute(html, "aria-label"), "Arabic keyboard");
  assert.match(html, /dir="rtl"/);
  assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
  assert.equal((html.match(/tabindex="-1"/g) ?? []).length, 3);
  assert.match(html, /aria-label="sad"/);
  assert.match(html, /aria-label="Space"/);
  assert.match(html, /aria-label="Backspace"/);
  assert.match(html, /data-kind="space"/);
  assert.match(html, /--fui-key-width:4/);
  // The one tab stop is the first key, and the glyph is not read twice.
  assert.match(html, /data-key-index="0"[^>]*tabindex="0"/);
  assert.match(html, /<span aria-hidden="true" class="fui-keyboard-key-glyph" dir="rtl">ض<\/span>/);
});

test("a dither canvas is an empty, hidden canvas until it paints", () => {
  const html = renderToStaticMarkup(<DitherCanvas ramp={["background", "#111827"]} paint={() => undefined} />);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /data-slot="dither-canvas"/);
  assert.match(html, /class="fui-dither-canvas"/);
  assert.doesNotMatch(html, /data-painted|data-failed/);
  assert.doesNotMatch(html, /width=|height=/);
});

// ------------------------------------------------------------------------------------------------------- the styles

test("the stylesheet carries the shell block, once", () => {
  assert.ok(styles.indexOf(BLOCK_MARK) >= 0, "the block carries its marker");
  assert.equal(styles.indexOf(BLOCK_MARK, styles.indexOf(BLOCK_MARK) + 1), -1, "there is one such block");
  assert.ok(styles.trimEnd().endsWith("}"), "the block is closed");
});

test("the account row is 44 px, 48 px on a phone, and the folded sidebar keeps only the picture", () => {
  assert.match(rule(".fui-sidebar-account-trigger"), /min-block-size: var\(--fui-control-height-lg\);/);
  assert.match(media("(max-width: 767px)"), /\.fui-sidebar-account-trigger \{\n      min-block-size: 3rem;/);
  assert.match(rule('.fui-sidebar[data-collapsible="icon"] :is(.fui-sidebar-account-text, .fui-sidebar-account-chevron)'), /display: none;/);
  assert.match(rule('.fui-sidebar[data-collapsible="icon"] .fui-sidebar-account-trigger'), /inline-size: 2.5rem;/);
  assert.match(rule(".fui-sidebar-account-trigger:focus-visible"), /outline-offset: -2px;/);
  assert.match(rule(".fui-sidebar-account-trigger[data-active]"), /background: var\(--fui-sidebar-active\);/);
  assert.match(rule(".fui-sidebar-account-trigger[data-popup-open]"), /background: color-mix\(in oklab, var\(--sidebar-foreground\) 8%, transparent\);/);
  assert.match(rule(".fui-sidebar-account-email"), /text-overflow: ellipsis;/);
  // A plate is a fill and a shadow: in system colours it is an edge.
  assert.match(media("(forced-colors: active)", ".fui-sidebar-account-trigger[data-active]"), /\.fui-sidebar-account-trigger\[data-active\] \{[^}]*outline: 2px solid Highlight;/);
});

test("the inset's header is 56 px with the safe area above it, and hides below the phone width unless asked", () => {
  assert.match(rule(".fui-sidebar-inset-header"), /min-block-size: calc\(3\.5rem \+ env\(safe-area-inset-top, 0px\)\);/);
  assert.match(rule(".fui-sidebar-inset-header"), /padding-block-start: env\(safe-area-inset-top, 0px\);/);
  assert.match(rule(".fui-sidebar-inset-header"), /border-block-end: 1px solid var\(--border\);/);
  assert.match(rule(".fui-sidebar-inset-title"), /text-overflow: ellipsis;/);
  assert.match(rule(".fui-sidebar-inset-title"), /margin: 0;/);
  assert.match(media("(min-width: 768px)"), /\.fui-sidebar-inset-header\[data-visibility="mobile"\] \{\n      display: none;/);
  // The bar does not blur.
  assert.doesNotMatch(rule(".fui-sidebar-inset-header"), /backdrop-filter/);
  assert.match(rule(".fui-sidebar-inset-framed"), /block-size: 100dvh;/);
  assert.match(rule(".fui-sidebar-inset-framed"), /overflow: hidden;/);
  assert.match(rule(".fui-sidebar-inset-content"), /overflow-y: auto;/);
  assert.match(rule(".fui-sidebar-inset-content"), /overscroll-behavior: contain;/);
});

test("the keyboard's keys never shrink past their floor, and give way to the gaps first", () => {
  assert.match(rule(".fui-keyboard-key"), /min-inline-size: 2rem;/);
  assert.match(rule(".fui-keyboard-key"), /min-block-size: 2rem;/);
  assert.match(rule(".fui-keyboard-row"), /gap: min\(1cqi, var\(--fui-space-1\)\);/);
  assert.match(rule(".fui-keyboard"), /container-type: inline-size;/);
  assert.match(media("(pointer: coarse)"), /min-block-size: 2.75rem;/);
  assert.match(rule(".fui-keyboard-key:focus-visible"), /outline: 2px solid var\(--fui-focus\);/);
  assert.match(media("(forced-colors: active)", ".fui-keyboard-key:focus-visible"), /outline-color: Highlight;/);
});

test("the title renamed in place draws its field on the surface, with the ring inside", () => {
  assert.match(rule(".fui-editable-text"), /display: inline-flex;/);
  assert.match(rule(".fui-editable-text-value"), /min-inline-size: 0;/);
  assert.match(rule(".fui-editable-text-field"), /border-radius: var\(--fui-radius-md\);/);
  assert.match(rule(".fui-editable-text-field"), /font-size: var\(--fui-text-sm\);/);
  assert.match(rule(".fui-editable-text[data-pending] .fui-editable-text-value"), /color: var\(--muted-foreground\);/);
  assert.match(media("(forced-colors: active)", ".fui-editable-text-field:focus-visible"), /outline-color: Highlight;/);
});
