import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  ConfirmDialog,
  FileSize,
  IconButton,
  Kbd,
  KbdGroup,
  RelativeTime,
  StatePanel,
  Toolbar,
  ToolbarButton,
  avatarInitials,
  formatAbsoluteTime,
  formatBytes,
  formatRelativeTime,
  useConfirm,
  useModifierKey,
  type ConfirmFunction,
} from "../../packages/ui/src/index";
import { keyShortcutsValue } from "../../packages/ui/src/icon-tooltip";
import { isApplePlatform } from "../../packages/ui/src/use-modifier-key";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

test("state panel keeps its default markup and gains size, variant and fill hooks", () => {
  const base = renderToStaticMarkup(<StatePanel state="empty" title="Nothing here" />);
  assert.match(base, /class="fui-state-panel"/);
  assert.match(base, /data-state="empty" data-align="start"/);
  assert.doesNotMatch(base, /data-size|data-variant|data-fill/);
  assert.match(base, /role="status"/);

  const compact = renderToStaticMarkup(
    <StatePanel state="error" title="Failed" size="sm" variant="inline" fill align="center" id="folders-error" className="host" />,
  );
  assert.match(compact, /data-size="sm"/);
  assert.match(compact, /data-variant="inline"/);
  assert.match(compact, /data-fill="true"/);
  assert.match(compact, /role="alert"/);
  assert.match(compact, /id="folders-error"/);
  assert.match(compact, /class="fui-state-panel host"/);
  // A host can still make a panel a labelled region.
  assert.match(renderToStaticMarkup(<StatePanel state="stale" title="Old" role="region" aria-label="Folders" />), /role="region"[^>]*aria-label="Folders"/);
});

test("state panel size and variant beat the error and centred rules, and fill centres in a definite region", () => {
  const error = styles.indexOf('.fui-state-panel[data-state="error"] {');
  const inline = styles.indexOf('.fui-state-panel[data-variant="inline"],');
  const centred = styles.indexOf('.fui-state-panel[data-align="center"] {');
  const small = styles.indexOf('.fui-state-panel[data-size="sm"],');
  assert.ok(error > 0 && inline > error, "inline comes after the error rule");
  assert.ok(centred > 0 && small > centred, "sm comes after the centred rule");
  assert.match(styles.slice(small, small + 200), /\[data-size="sm"\]\[data-align="center"\]/);
  assert.match(rule('.fui-state-panel[data-size="sm"],\n  .fui-state-panel[data-size="sm"][data-align="center"] {'), /padding: var\(--fui-space-4\)/);
  assert.match(rule('.fui-state-panel[data-variant="inline"][data-state="error"] {'), /border: 0;\s*background: transparent/);
  assert.match(rule(".fui-state-panel[data-fill] {"), /min-block-size: 100%/);
});

test("confirm dialog closed renders nothing and its description is optional", () => {
  assert.equal(renderToStaticMarkup(<ConfirmDialog open={false} onOpenChange={() => undefined} title="Delete?" confirmLabel="Delete" onConfirm={() => undefined} />), "");
});

test("useConfirm without a provider is window.confirm, and answers false where there is no window", async () => {
  let ask: ConfirmFunction | undefined;
  function Probe() {
    ask = useConfirm();
    return null;
  }
  renderToStaticMarkup(<Probe />);
  const first = ask;
  assert.ok(first);
  assert.equal(await first({ title: "Delete draft?" }), false);
  renderToStaticMarkup(<Probe />);
  assert.equal(ask, first, "the fallback keeps its identity");
  const seen: string[] = [];
  const target = globalThis as unknown as { window?: unknown };
  target.window = {
    confirm: (text: string) => {
      seen.push(text);
      return true;
    },
  };
  try {
    assert.equal(await first({ title: "Delete draft?", description: "It cannot be undone." }), true);
    assert.equal(await first({ title: <b>Rich</b>, fallbackText: "Plain words" }), true);
    assert.equal(await first({ title: <b>Rich</b> }), true);
  } finally {
    delete target.window;
  }
  assert.deepEqual(seen, ["Delete draft?\n\nIt cannot be undone.", "Plain words", "Are you sure?"]);
});

test("relative time in deterministic mode prints the same text and title on any machine", () => {
  const date = "2026-09-29T23:41:00Z";
  const html = renderToStaticMarkup(
    <RelativeTime date={date} locale="en" timeZone="Europe/Madrid" absoluteFormat={{ day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }} />,
  );
  // 23:41 UTC is 01:41 the next day in Madrid, whatever zone this machine is in.
  assert.match(html, />Sep\w* 30, 1:41 AM<\/time>/);
  assert.match(html, /datetime="2026-09-29T23:41:00.000Z"/i);
  assert.match(html, /title="Wednesday, September 30, 2026 at 1:41:00 AM (GMT\+2|CEST)"/);
  assert.match(html, /data-mode="fixed"/);

  // A fixed clock makes the relative text exact too.
  const fixed = renderToStaticMarkup(<RelativeTime date={date} now={Date.parse("2026-09-30T00:41:00Z")} />);
  assert.match(fixed, />1 hour ago<\/time>/);
  assert.match(fixed, /data-mode="fixed"/);
  const live = renderToStaticMarkup(<RelativeTime date={date} />);
  assert.match(live, /data-mode="live"/);
});

test("absolute time formats: options, a per-date function that reads the clock, and invalid dates", () => {
  const now = Date.parse("2026-09-29T12:00:00Z");
  const sameYear = "2026-03-02T10:15:00Z";
  const older = "2024-03-02T10:15:00Z";
  const format = (date: Date, at: number): Intl.DateTimeFormatOptions => ({
    day: "numeric",
    month: "short",
    ...(date.getUTCFullYear() === new Date(at).getUTCFullYear() ? {} : { year: "numeric" }),
  });
  assert.equal(formatAbsoluteTime(sameYear, "en", format, { now, timeZone: "UTC" }), "Mar 2");
  assert.equal(formatAbsoluteTime(older, "en", format, { now, timeZone: "UTC" }), "Mar 2, 2024");
  assert.equal(formatAbsoluteTime("nope", "en", format), "");
  assert.equal(formatAbsoluteTime(sameYear, "en", { month: "long", timeZone: "Asia/Tokyo" }, { timeZone: "UTC" }), "March");
  assert.equal(formatRelativeTime("2026-01-01T00:00:00Z", now, "en", { timeZone: "UTC" }), "Jan 1, 2026");
});

test("kbd: mod prints the server default and a sequence puts a translatable word between the keys", () => {
  assert.match(renderToStaticMarkup(<Kbd mod />), /^<kbd class="fui-kbd">Ctrl<\/kbd>$/);
  assert.match(renderToStaticMarkup(<Kbd>K</Kbd>), /^<kbd class="fui-kbd">K<\/kbd>$/);
  let key = "";
  function Probe() {
    key = useModifierKey();
    return null;
  }
  renderToStaticMarkup(<Probe />);
  assert.equal(key, "Ctrl");

  const plain = renderToStaticMarkup(<KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>);
  assert.doesNotMatch(plain, /data-sequence|fui-kbd-separator/);
  const sequence = renderToStaticMarkup(<KbdGroup sequence><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>);
  assert.match(sequence, /data-sequence="true"/);
  assert.match(sequence, /<kbd class="fui-kbd">g<\/kbd><span class="fui-kbd-separator">then<\/span><kbd class="fui-kbd">i<\/kbd>/);
  const translated = renderToStaticMarkup(<KbdGroup sequence separator="luego"><Kbd>g</Kbd><Kbd>i</Kbd><Kbd>x</Kbd></KbdGroup>);
  assert.equal((translated.match(/luego/g) ?? []).length, 2);
});

test("alert inline wraps its children in a body that answers to the alert's own width", () => {
  const stacked = renderToStaticMarkup(<Alert><AlertTitle>Saved</AlertTitle></Alert>);
  assert.doesNotMatch(stacked, /fui-alert-body|data-layout/);
  const inline = renderToStaticMarkup(
    <Alert layout="inline" variant="warning">
      <AlertTitle>Offline</AlertTitle>
      <AlertDescription>Changes wait for the connection.</AlertDescription>
      <AlertAction>Retry</AlertAction>
    </Alert>,
  );
  assert.match(inline, /data-layout="inline"/);
  assert.match(inline, /<div class="fui-alert-body"><div class="fui-alert-title">Offline<\/div>/);
  assert.match(inline, /role="status"/);
  assert.match(rule('.fui-alert[data-layout="inline"] {'), /container: fui-alert \/ inline-size/);
  assert.match(rule('.fui-alert[data-layout="inline"] {'), /inline-size: 100%/);
  assert.match(styles, /@container fui-alert \(min-width: 48rem\) \{\s*\.fui-alert-body \{\s*display: flex/);
  assert.match(styles, /\.fui-alert-body > \.fui-alert-action \{[^}]*margin-inline-start: auto/);
});

test("badge: data colour hooks, truncation and a hollow dot", () => {
  const plain = renderToStaticMarkup(<Badge>Draft</Badge>);
  assert.match(plain, /^<span data-slot="badge" class="fui-badge" data-tone="neutral" data-variant="soft">Draft<\/span>$/);

  const tag = renderToStaticMarkup(<Badge dot dotColor="var(--label-tone)" style={{ color: "red" }}>Work</Badge>);
  assert.match(tag, /style="--fui-badge-dot:var\(--label-tone\);color:red"/);
  assert.match(tag, /<span aria-hidden="true" class="fui-badge-dot"><\/span>/);
  assert.match(renderToStaticMarkup(<Badge dot="hollow">Archived</Badge>), /class="fui-badge-dot" data-hollow="true"/);

  const cut = renderToStaticMarkup(<Badge truncate>A very long label</Badge>);
  assert.match(cut, /data-truncate="true"/);
  assert.match(cut, /title="A very long label"/);
  assert.match(cut, /<span class="fui-badge-text">A very long label<\/span>/);
  assert.match(renderToStaticMarkup(<Badge truncate title="Full">Short</Badge>), /title="Full"/);
  assert.doesNotMatch(renderToStaticMarkup(<Badge>Untouched</Badge>), /title=/);
});

test("the badge dot follows --fui-badge-solid on every tone, so a neutral data tag colours its dot", () => {
  assert.doesNotMatch(styles, /\.fui-badge\[data-tone="neutral"\] \.fui-badge-dot/);
  assert.match(rule(".fui-badge-dot {"), /background: var\(--fui-badge-dot, var\(--fui-badge-solid\)\)/);
  assert.match(rule(".fui-badge[data-truncate] {"), /max-inline-size: var\(--fui-badge-max, 100%\)/);
});

test("text helpers: sizes as people read them, initials by grapheme, and a size that never throws while rendering", () => {
  assert.equal(formatBytes("en", 0), "0 B");
  assert.equal(formatBytes("en-GB", 812), "812 B");
  assert.equal(formatBytes("es", 812), "812 B");
  assert.equal(formatBytes("en", 25 * 1024 * 1024), "25 MB");
  assert.equal(formatBytes("en", 1536), "1.5 kB");
  assert.equal(formatBytes("es", 2.4 * 1024 * 1024), "2,4 MB");
  assert.throws(() => formatBytes("en", -1), RangeError);
  assert.throws(() => formatBytes("en", Number.NaN), /Invalid byte count/);

  assert.match(renderToStaticMarkup(<FileSize bytes={2048} />), /<span data-slot="file-size" class="fui-file-size" title="2,048 bytes">2 kB<\/span>/);
  assert.equal(renderToStaticMarkup(<FileSize bytes={undefined} />), "");
  assert.equal(renderToStaticMarkup(<FileSize bytes={-5} />), "");
  assert.match(renderToStaticMarkup(<FileSize bytes={Number.NaN} fallback="unknown" />), />unknown<\/span>/);

  assert.equal(avatarInitials("Ana Lopez Ruiz"), "AR");
  assert.equal(avatarInitials("ana@example.com"), "A");
  assert.equal(avatarInitials("  "), "?");
  assert.equal(avatarInitials("", "-"), "-");
  assert.equal(avatarInitials("élan vital"), "ÉV");
  assert.equal(avatarInitials("🙂 Smile"), "🙂S");
  assert.equal(avatarInitials("istanbul", "?", "tr"), "İ");
});

test("data-hit grows the target to the control height with a pseudo-element, never the layout", () => {
  assert.match(rule('[data-hit="44"] {'), /position: relative;\s*z-index: 1/);
  assert.match(rule('[data-hit="44"]::before {'), /inset-block: min\(0px, calc\(\(100% - var\(--fui-control-height-lg\)\) \/ 2\)\)/);
});

test("data-hit has two more shapes: block-wise only (y) and block-wise plus past the end edge only (end), same stacking as 44", () => {
  assert.match(rule('[data-hit="y"],\n  [data-hit="end"] {'), /position: relative;\s*z-index: 1/);
  const shared = rule('[data-hit="y"]::before,\n  [data-hit="end"]::before {');
  assert.match(shared, /position: absolute/);
  assert.match(shared, /inset-block: min\(0px, calc\(\(100% - var\(--fui-control-height-lg\)\) \/ 2\)\)/);
  assert.match(shared, /inset-inline: 0;/);
  assert.match(styles, /\n  \[data-hit="end"\]::before \{\n    inset-inline: 0 min\(0px, calc\(100% - var\(--fui-control-height-lg\)\)\);/);
  // "44" is untouched: the same four-sided reach it always had.
  assert.match(rule('[data-hit="44"]::before {'), /inset-inline: min\(0px, calc\(\(100% - var\(--fui-control-height-lg\)\) \/ 2\)\)/);
});

test("a shortcut can be a sequence: no aria-keyshortcuts (it cannot express steps), together keys still do", () => {
  assert.equal(keyShortcutsValue({ keys: ["g", "i"], sequence: true }), undefined);
  assert.equal(keyShortcutsValue({ keys: ["Ctrl", "K"] }), "Control+K");
  assert.equal(keyShortcutsValue(["Ctrl", "K"]), "Control+K");
  assert.equal(keyShortcutsValue([]), undefined);
  const together = renderToStaticMarkup(<IconButton label="Search" tooltip={false} shortcut={["Ctrl", "K"]}><svg /></IconButton>);
  assert.match(together, /aria-keyshortcuts="Control\+K"/);
  const sequence = renderToStaticMarkup(<IconButton label="Go to inbox" tooltip={false} shortcut={{ keys: ["g", "i"], sequence: true }}><svg /></IconButton>);
  assert.doesNotMatch(sequence, /aria-keyshortcuts/);
  const bar = renderToStaticMarkup(
    <Toolbar aria-label="Actions"><ToolbarButton label="Inbox" shortcut={{ keys: ["g", "i"], sequence: true }}><svg /></ToolbarButton></Toolbar>,
  );
  assert.doesNotMatch(bar, /aria-keyshortcuts/);
});

test("the modifier key is the Apple one for every string an Apple browser reports, «macOS» of Chromium included", () => {
  // `navigator.platform` (Safari, Firefox) and `userAgentData.platform` (Chromium) spell the same thing differently.
  for (const platform of ["MacIntel", "MacPPC", "macOS", "iPhone", "iPad", "iPod touch"]) assert.equal(isApplePlatform(platform), true, platform);
  for (const platform of ["", "Win32", "Windows", "Linux x86_64", "Linux armv8l", "Android", "Chrome OS", "Unknown"]) assert.equal(isApplePlatform(platform), false, platform);
});

test("a toast's cancel button outranks Sonner's own dark rule, which would paint it a 30 % white fill and sink its contrast", () => {
  // Sonner injects its sheet after ours; its dark rule is `[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]`
  // (five attributes). Ours had five too and lost by coming first: it needs the sixth, `[data-sonner-theme]`, which the Toaster always sets.
  const selector = '.fui-toaster[data-sonner-toaster][data-sonner-theme] [data-sonner-toast][data-styled="true"] [data-cancel] {';
  assert.match(rule(selector), /background: transparent/);
  assert.match(rule(selector), /color: var\(--foreground\)/);
  // Selector lines only: the comment above the rule names the attribute too.
  const bare = styles.split("\n").filter((line) => /^\.fui-toaster.*\[data-cancel\]/.test(line) && !/\[data-sonner-theme\]/.test(line));
  assert.deepEqual(bare, [], "every rule on the cancel button carries the theme attribute");
});

test("the transparent block borders of a touch navigation row are Canvas in forced colors, not a line above and below every row", () => {
  const forced = styles.slice(styles.indexOf('.fui-sidebar-menu-button[data-active]::before {\n      background: Highlight;'));
  const block = forced.slice(0, forced.indexOf("\n  }\n  .fui-sidebar-menu-button:disabled"));
  assert.match(block, /\.fui-sidebar-menu-button\[data-size="touch"\] \{\s*border-block-color: Canvas;/);
});
