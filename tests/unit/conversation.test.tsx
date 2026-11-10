import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import {
  Conversation,
  ConversationCheckpoint,
  ConversationCheckpoints,
  ConversationContent,
  ConversationEmpty,
  ConversationFooter,
  ConversationScrollButton,
  useConversation,
  CHECKPOINT_LABELS,
  END_THRESHOLD,
  SCROLL_BUTTON_LABELS,
  scrollButtonName,
} from "../../packages/ai-ui/src/index";
import {
  activeCheckpoint,
  chaseStep,
  checkpointLabel,
  conversationStep,
  distanceToEnd,
  dragsAway,
  endOf,
  initialLock,
  jumpTarget,
  markerSlot,
  overflows,
  railLimit,
  readingLine,
  rovingTarget,
  scrollsAway,
  type ConversationMetrics,
  type LockState,
} from "../../packages/ai-ui/src/conversation-logic";
import { aiStyles } from "./read-styles";

const styles = aiStyles();
// A top-level rule of the block, at two spaces of indentation (a selector repeated inside a query is not this one).
const rule = (selector: string) => {
  const at = styles.indexOf(`\n  ${selector}`);
  assert.ok(at >= 0, `missing rule ${selector}`);
  const open = styles.indexOf("{", at);
  return styles.slice(at, styles.indexOf("}", open) + 1);
};
/** Everything under a block opener, up to its matching brace. */
function blockAt(marker: string) {
  const start = styles.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const open = styles.indexOf("{", start);
  let depth = 0;
  for (let at = open; at < styles.length; at += 1) {
    if (styles[at] === "{") depth += 1;
    if (styles[at] === "}" && --depth === 0) return styles.slice(open + 1, at);
  }
  throw new Error(`unbalanced block at ${marker}`);
}

/* ---------------------------------------------------------------- the maths */

const metrics = (scrollTop: number, scrollHeight = 1000, clientHeight = 400): ConversationMetrics => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

test("the end is the last scroll position; near it counts as there, and only a taller content scrolls", () => {
  assert.equal(endOf(metrics(0)), 600);
  assert.equal(endOf(metrics(9999)), 600);
  assert.equal(endOf(metrics(0, 300, 400)), 0, "shorter than the view is the end at 0");
  assert.equal(distanceToEnd(metrics(550)), 50);
  assert.equal(distanceToEnd(metrics(600)), 0);
  assert.equal(distanceToEnd(metrics(900)), 0, "past the end is the end");
  assert.equal(overflows(metrics(0)), true);
  assert.equal(overflows(metrics(0, 401, 400)), true);
  assert.equal(overflows(metrics(0, 400.5, 400)), false, "half a pixel is rounding, not something to scroll");
});

test("a conversation opens at the end and follows it; `start` opens at the top as an ordinary scroller", () => {
  const atEnd = initialLock({ metrics: metrics(0) });
  assert.equal(atEnd.locked, true);
  assert.equal(atEnd.atEnd, true);
  assert.equal(atEnd.top, 600);
  const atStart = initialLock({ anchor: "start", metrics: metrics(120) });
  assert.equal(atStart.locked, false);
  assert.equal(atStart.top, 120, "the position is left alone");
  assert.equal(atStart.atEnd, 120 >= 600 - END_THRESHOLD ? true : false);
  assert.equal(initialLock({ anchor: "start", threshold: 4, metrics: metrics(560) }).atEnd, false);
  assert.equal(initialLock({ anchor: "start", threshold: 44, metrics: metrics(560) }).atEnd, true);
});

const start = (extra: Partial<Parameters<typeof initialLock>[0]> = {}) => initialLock({ metrics: metrics(600), ...extra });

test("growth while it holds the end is followed: the caller is told to scroll, at once and every time", () => {
  const grown = conversationStep(start(), { type: "grow", metrics: metrics(600, 1120), items: 3 });
  assert.equal(grown.scroll, "end");
  assert.equal(grown.state.locked, true);
  assert.equal(grown.state.atEnd, true);
  assert.equal(grown.state.height, 1120);
  // Nothing new to move to: no scroll of any kind.
  assert.equal(conversationStep(start(), { type: "grow", metrics: metrics(600), items: 2 }).scroll, null);
});

test("the reader's own movement away unlocks at once, and growth after it moves nothing; back at the end locks again", () => {
  let state: LockState = start();
  const away = conversationStep(state, { type: "intent", metrics: metrics(560) });
  assert.equal(away.state.locked, false);
  assert.equal(away.user, true);
  state = away.state;
  const grown = conversationStep(state, { type: "grow", metrics: metrics(560, 1200), items: 4 });
  assert.equal(grown.scroll, null);
  assert.equal(grown.state.hasNew, true);
  state = grown.state;
  // Their own scroll back into the threshold: it locks and settles on the end.
  const back = conversationStep(state, { type: "scroll", metrics: metrics(770, 1200) });
  assert.equal(back.state.locked, true);
  assert.equal(back.state.atEnd, true);
  assert.equal(back.scroll, "end");
  assert.equal(back.user, true);
  // At the very end there is nowhere to settle, so no scroll is asked for.
  assert.equal(conversationStep(state, { type: "scroll", metrics: metrics(800, 1200) }).scroll, null);
});

test("a wheel at the very top moves nothing, so it lets go of nothing", () => {
  const top = initialLock({ metrics: metrics(0) });
  const intent = conversationStep(top, { type: "intent", metrics: metrics(0) });
  assert.equal(intent.state.locked, true);
  assert.equal(intent.user, false);
});

test("our own scroll is never taken for the reader's: the position it went to is the proof", () => {
  let state = start();
  const own = conversationStep(state, { type: "scroll", metrics: metrics(300) });
  // Not expected: the reader's. It unlocks, and it is marked as theirs.
  assert.equal(own.user, true);
  assert.equal(own.state.locked, false);
  state = start();
  const moved = conversationStep(state, { type: "moved", top: 300, changed: true });
  assert.equal(moved.state.expected, 300);
  state = moved.state;
  const read = conversationStep(state, { type: "scroll", metrics: metrics(300) });
  assert.equal(read.user, false);
  assert.equal(read.state.locked, true, "our own scroll leaves the lock alone");
  assert.equal(read.state.expected, null, "the proof is spent");
  // A scroll of ours that moved nothing leaves no expectation behind, or the next real scroll would look like ours.
  const still = conversationStep(start(), { type: "moved", top: 600, changed: false });
  assert.equal(still.state.expected, null);
  assert.equal(conversationStep(still.state, { type: "scroll", metrics: metrics(560) }).user, true);
});

test("a pixel of rounding in the layout is not the reader pulling away", () => {
  const half = { ...start(), top: 500 };
  const rounding = conversationStep(half, { type: "scroll", metrics: metrics(499) });
  assert.equal(rounding.state.locked, true);
  assert.equal(rounding.user, false);
  const real = conversationStep(half, { type: "scroll", metrics: metrics(480) });
  assert.equal(real.state.locked, false);
  assert.equal(real.user, true);
});

test("a scroll of ours that lands short while following keeps atEnd; the reader's stops following", () => {
  const own = conversationStep(conversationStep(start(), { type: "moved", top: 400, changed: true }).state, { type: "scroll", metrics: metrics(400) });
  assert.equal(own.state.atEnd, true, "following the end still counts as there");
  const theirs = conversationStep(start(), { type: "scroll", metrics: metrics(400) });
  assert.equal(theirs.state.atEnd, false);
  assert.equal(theirs.state.locked, false);
});

test("a viewport that shrinks while following stays at the end", () => {
  const resized = conversationStep(start(), { type: "resize", metrics: metrics(600, 1000, 320) });
  assert.equal(resized.scroll, "end");
  const away = conversationStep(conversationStep(start(), { type: "intent", metrics: metrics(400) }).state, { type: "resize", metrics: metrics(400, 1000, 320) });
  assert.equal(away.scroll, null);
});

test("sending a message locks and jumps, whatever the reader was doing", () => {
  const away = conversationStep(start(), { type: "intent", metrics: metrics(200) }).state;
  const stuck = conversationStep(away, { type: "stick" });
  assert.equal(stuck.scroll, "end");
  assert.equal(stuck.state.locked, true);
  assert.equal(conversationStep(stuck.state, { type: "leave" }).state.locked, false);
});

test("a selection inside the conversation holds it: nothing locks by itself until the selection ends", () => {
  const away = conversationStep(start(), { type: "intent", metrics: metrics(100) }).state;
  const selecting = conversationStep({ ...away, top: 600 }, { type: "select", active: true, metrics: metrics(600) });
  assert.equal(selecting.state.locked, false);
  assert.equal(selecting.state.selecting, true);
  const atEnd = conversationStep(selecting.state, { type: "scroll", metrics: metrics(600) });
  assert.equal(atEnd.state.locked, false, "reading text at the end is not asking to follow");
  const done = conversationStep(atEnd.state, { type: "select", active: false, metrics: metrics(600) });
  assert.equal(done.state.locked, true, "at the end, letting go of the selection follows again");
  const stillAway = conversationStep({ ...selecting.state, top: 100 }, { type: "select", active: false, metrics: metrics(100) });
  assert.equal(stillAway.state.locked, false);
});

test("what arrived while the reader was away is counted in messages, and anything that grew is marked", () => {
  const away = conversationStep(initialLock({ metrics: metrics(600), items: 3 }), { type: "intent", metrics: metrics(200) }).state;
  const grown = conversationStep(away, { type: "grow", metrics: metrics(200, 1100), items: 5 });
  assert.equal(grown.state.unread, 2);
  assert.equal(grown.state.hasNew, true);
  const more = conversationStep(grown.state, { type: "grow", metrics: metrics(200, 1150), items: 5 });
  assert.equal(more.state.unread, 2, "more of the same message is not a new message");
  assert.equal(more.state.hasNew, true);
  const readAgain = conversationStep(more.state, { type: "scroll", metrics: metrics(750, 1150) });
  assert.equal(readAgain.state.unread, 0);
  assert.equal(readAgain.state.hasNew, false);
  assert.equal(readAgain.state.seen, 5);
});

test("a transcript read from the top counts nothing as unread while its end is in view", () => {
  const reading = initialLock({ anchor: "start", metrics: metrics(0, 3000, 400), items: 8 });
  assert.equal(reading.locked, false);
  const grown = conversationStep(reading, { type: "grow", metrics: metrics(0, 3200, 400), items: 9 });
  assert.equal(grown.state.unread, 1);
  const settled = conversationStep(reading, { type: "scroll", metrics: metrics(2600, 3000) });
  assert.equal(settled.state.unread, 0, "at the end, the whole thread has been seen");
  // A grow that moves the end away while the reader stays put is new content to them.
  const atEnd = conversationStep(settled.state, { type: "grow", metrics: metrics(2600, 3200), items: 9 });
  assert.equal(atEnd.state.unread, 1);
  assert.equal(conversationStep(atEnd.state, { type: "scroll", metrics: metrics(2800, 3200) }).state.unread, 0);
  assert.equal(conversationStep(reading, { type: "stick" }).state.locked, false, "`start` never follows");
});

test("changing the anchor to the end at the end follows, and to the start stops following", () => {
  const fromStart = conversationStep(initialLock({ anchor: "start", metrics: metrics(600) }), { type: "configure", anchor: "end", threshold: 48, metrics: metrics(600) });
  assert.equal(fromStart.state.locked, true);
  const toStart = conversationStep(start(), { type: "configure", anchor: "start", threshold: 48, metrics: metrics(600) });
  assert.equal(toStart.state.locked, false);
});

test("the keys and the drag that mean 'away from the end'", () => {
  for (const key of ["PageUp", "ArrowUp", "Home"]) assert.equal(scrollsAway(key), true, key);
  assert.equal(scrollsAway(" "), false);
  assert.equal(scrollsAway(" ", true), true, "Shift+Space is a page up");
  for (const key of ["PageDown", "ArrowDown", "End", "Enter", "a"]) assert.equal(scrollsAway(key), false, key);
  assert.equal(dragsAway(100, 120), true);
  assert.equal(dragsAway(100, 104), false, "a slop absorbs a shaky finger");
  assert.equal(dragsAway(100, 40), false, "up the screen drags the content down");
});

test("a scroll of ours eases to a target that may move, never overshooting and always arriving", () => {
  let at = 0;
  let frames = 0;
  while (at !== 600 && frames < 200) {
    const next = chaseStep(at, 600, 16);
    assert.ok(next >= at && next <= 600, `${next} stays between ${at} and 600`);
    at = next;
    frames += 1;
  }
  assert.equal(at, 600);
  assert.ok(frames < 60, `${frames} frames at 60 Hz is under a second`);
  // Most of the way within a quarter of a second, whatever the distance.
  assert.ok(chaseStep(0, 4000, 240) > 3000);
  // A target that moves while it travels is followed.
  assert.ok(chaseStep(600, 1200, 16) > 600);
  assert.equal(chaseStep(600, 600, 16), 600);
  assert.equal(chaseStep(590, 600, 0), 591, "a long frame still moves at least a pixel");
});

test("a message is brought to the top, the middle or the bottom, inside the scroll it has", () => {
  const view = metrics(0, 1400, 400);
  assert.equal(jumpTarget({ start: 900, size: 100, metrics: view }), 884);
  assert.equal(jumpTarget({ start: 1200, size: 100, metrics: view }), 1000, "clamped to the end");
  assert.equal(jumpTarget({ start: 900, size: 100, metrics: metrics(0) }), 600, "a short scroll clamps the other way");
  assert.equal(jumpTarget({ start: 300, size: 100, metrics: view, align: "center" }), 150);
  assert.equal(jumpTarget({ start: 300, size: 100, metrics: view, align: "end" }), 16);
  assert.equal(jumpTarget({ start: 0, size: 100, metrics: view, align: "center" }), 0, "never above the top");
  const reading = readingLine(800);
  assert.equal(reading, 96);
  assert.equal(readingLine(200), 50);
  assert.equal(readingLine(0), 0);
});

test("the checkpoint being read is the last whose top is above the line, and the last at the end", () => {
  const tops = [0, 120, 240, 360, 480];
  const topOf = (index: number) => tops[index]!;
  assert.equal(activeCheckpoint(0, topOf, 96), -1);
  assert.equal(activeCheckpoint(5, topOf, 96), 0, "the first while none reached the line");
  assert.equal(activeCheckpoint(5, topOf, 96, true), 4, "the last at the end");
  assert.equal(activeCheckpoint(5, topOf, 240), 2);
  assert.equal(activeCheckpoint(5, topOf, 239), 1);
  assert.equal(activeCheckpoint(5, topOf, 9999), 4);
  // It reads about log2(count) tops, not one per checkpoint.
  let reads = 0;
  const counted = (index: number) => {
    reads += 1;
    return index * 100;
  };
  activeCheckpoint(1000, counted, 50_000);
  assert.ok(reads <= 11, `${reads} reads`);
});

test("the rail never takes more than 70% of the viewport: markers pack instead of overflowing", () => {
  assert.equal(railLimit(1000), 700);
  assert.equal(railLimit(99), 69);
  assert.equal(markerSlot(2, 600), 22);
  assert.equal(markerSlot(12, 600), 22, "12 markers in 420 px keep their air");
  assert.equal(markerSlot(40, 600), 10, "past that they pack");
  assert.equal(markerSlot(1000, 600), 3, "never under 3 px");
  assert.equal(markerSlot(0, 600), 22);
  assert.equal(markerSlot(5, 0), 22, "an unmeasured viewport shows the slot it likes");
  assert.ok(markerSlot(40, 600) * 40 <= railLimit(600));
});

test("one tab stop in the rail, arrows between markers, no wrapping", () => {
  assert.equal(rovingTarget("ArrowDown", 0, 3), 1);
  assert.equal(rovingTarget("ArrowUp", 2, 3), 1);
  assert.equal(rovingTarget("ArrowUp", 0, 3), 0);
  assert.equal(rovingTarget("ArrowDown", 2, 3), 2);
  assert.equal(rovingTarget("Home", 2, 3), 0);
  assert.equal(rovingTarget("End", 0, 3), 2);
  assert.equal(rovingTarget("Tab", 0, 3), null);
  assert.equal(rovingTarget("ArrowDown", 0, 0), null);
});

test("a marker's preview is one line of the message, cut at 140 characters and never inside a character", () => {
  assert.equal(checkpointLabel("  Show\n\tme   the\ntable "), "Show me the table");
  assert.equal(checkpointLabel(""), "");
  const long = "a".repeat(200);
  const cut = checkpointLabel(long);
  assert.equal(Array.from(cut).length, 140);
  assert.ok(cut.endsWith("…"));
  const emoji = `${"😀".repeat(150)}`;
  assert.equal(Array.from(checkpointLabel(emoji)).length, 140);
  assert.equal(checkpointLabel("short", 3), "sh…");
});

test("the way back is named for what waits at the end", () => {
  assert.equal(scrollButtonName(SCROLL_BUTTON_LABELS, 0, false), "Jump to latest");
  assert.equal(scrollButtonName(SCROLL_BUTTON_LABELS, 1, false), "Jump to latest, 1 new message");
  assert.equal(scrollButtonName(SCROLL_BUTTON_LABELS, 4, false), "Jump to latest, 4 new messages");
  assert.equal(scrollButtonName(SCROLL_BUTTON_LABELS, 0, true), "Jump to latest, new content");
  assert.equal(CHECKPOINT_LABELS.position(3, 12), "Message 3 of 12");
  assert.equal(CHECKPOINT_LABELS.jump(3, 12, "Where do the tokens live?"), "Jump to message 3 of 12: Where do the tokens live?");
  assert.equal(CHECKPOINT_LABELS.jump(2, 2, ""), "Jump to message 2 of 2");
});

/* ------------------------------------------------------------- on the server */

const thread = (
  <Conversation>
    <ConversationContent>
      <p>Ask about the billing schema.</p>
    </ConversationContent>
    <ConversationCheckpoints />
    <ConversationScrollButton />
    <ConversationFooter>
      <span>Composer</span>
    </ConversationFooter>
  </Conversation>
);

test("the server's markup: a named log that is not a tab stop yet, and a key that is not shown yet", () => {
  const html = renderToStaticMarkup(thread);
  const root = html.match(/<div ([^>]*data-slot="conversation"[^>]*)>/)![1]!;
  assert.match(root, /class="fui-conversation"/);
  assert.match(root, /data-anchor="end"/);
  const log = html.match(/<div ([^>]*data-slot="conversation-content"[^>]*)>/)![1]!;
  assert.match(log, /role="log"/);
  assert.match(log, /aria-label="Conversation"/);
  assert.match(log, /aria-live="off"/);
  assert.doesNotMatch(log, /tabindex/, "a log that may not overflow is not a tab stop");
  const jump = html.match(/<button ([^>]*aria-label="Jump to latest"[^>]*)>/)![1]!;
  assert.match(jump, /class="[^"]*fui-conversation-jump/);
  assert.doesNotMatch(jump, /data-visible/, "the key appears when the reader is away");
  assert.match(html, /data-slot="conversation-footer"/);
  assert.match(html, /data-fade="true"/);
  assert.doesNotMatch(html, /conversation-checkpoints/, "no checkpoints on the server");
});

const inLog = (log: ReactNode) => renderToStaticMarkup(<Conversation>{log}</Conversation>);

test("the log's name and its live region are the host's to choose", () => {
  assert.match(inLog(<ConversationContent label="Thread" />), /aria-label="Thread"/);
  assert.match(inLog(<ConversationContent live="polite" />), /aria-live="polite"/);
  assert.match(inLog(<ConversationContent aria-labelledby="title" />), /aria-labelledby="title"/);
  assert.doesNotMatch(inLog(<ConversationContent aria-labelledby="title" />), /\saria-label=/);
  assert.match(inLog(<ConversationContent measure />), /data-measure="true"/);
  assert.doesNotMatch(inLog(<ConversationContent />), /data-measure/);
  assert.match(inLog(<ConversationContent align="center" measure />), /data-align="center"/);
  assert.doesNotMatch(inLog(<ConversationContent align="center" />), /data-align/, "without the measure there is nothing to centre");
});

test("a key with something waiting says so in its name and shows it as a tag", () => {
  const html = renderToStaticMarkup(
    <Conversation>
      <ConversationScrollButton unread={2} />
    </Conversation>,
  );
  assert.match(html, /aria-label="Jump to latest, 2 new messages"/);
  assert.match(html, /class="fui-conversation-jump-count"[^>]*>2</);
  assert.match(renderToStaticMarkup(<Conversation><ConversationScrollButton unread={1} /></Conversation>), />1</);
  assert.doesNotMatch(renderToStaticMarkup(<Conversation><ConversationScrollButton unread={false} /></Conversation>), /jump-count|new message/);
  const many = renderToStaticMarkup(<Conversation><ConversationScrollButton unread={120} /></Conversation>);
  assert.match(many, />99\+</);
  assert.match(many, /aria-label="Jump to latest, 120 new messages"/);
});

test("the empty slot is a line and a description, never a heading of its own", () => {
  const html = renderToStaticMarkup(<ConversationEmpty description="Ask anything." />);
  assert.match(html, /data-slot="conversation-empty"/);
  assert.match(html, /<p class="fui-conversation-empty-title">No messages yet<\/p>/);
  assert.match(html, /<p class="fui-conversation-empty-description">Ask anything.<\/p>/);
  assert.doesNotMatch(html, /<h[1-6]/);
  assert.match(renderToStaticMarkup(<ConversationEmpty title="Say something" />), /Say something/);
  assert.match(renderToStaticMarkup(<ConversationEmpty title="Mine"><span>custom</span></ConversationEmpty>), /custom/);
});

test("a checkpoint wrapper and a rail with its own selector are the host's two ways in", () => {
  const html = renderToStaticMarkup(<ConversationCheckpoint id="turn-4" label="The tokens" />);
  assert.match(html, /data-slot="conversation-checkpoint"/);
  assert.match(html, /id="turn-4"/);
  assert.equal(inLog(<ConversationCheckpoints />), '<div class="fui-conversation" data-anchor="end" data-slot="conversation"></div>', "nothing to list on the server");
});

test("the parts that need a conversation say so", () => {
  const Lose = () => {
    useConversation();
    return null;
  };
  assert.throws(() => renderToStaticMarkup(<Lose />), /must be rendered inside <Conversation>/);
  assert.throws(() => renderToStaticMarkup(<ConversationScrollButton />), /must be rendered inside <Conversation>/);
});

/* -------------------------------------------------------------------- style */

const conversation = blockAt("@layer components {\n  /* 0.12: conversation");

test("the log scrolls itself, keeps its bar thin and its gutter reserved, and never takes the page with it", () => {
  const content = rule(".fui-conversation-content {");
  assert.match(content, /overflow-y: auto;/);
  assert.match(content, /overscroll-behavior: contain;/);
  assert.match(content, /scrollbar-gutter: stable;/);
  assert.match(content, /scrollbar-width: thin;/);
  assert.match(content, /outline: none;/);
  assert.doesNotMatch(content, /scroll-behavior: smooth/, "an eased scroll is the engine's, not the browser's");
});

test("while it overflows the log's ring is drawn on the conversation, inside, above the content", () => {
  const ring = rule(".fui-conversation::after {");
  assert.match(ring, /position: absolute;/);
  assert.match(ring, /outline: 2px solid var\(--fui-focus\);/);
  assert.match(ring, /outline-offset: -2px;/);
  assert.match(ring, /opacity: 0;/);
  assert.match(rule(".fui-conversation:has(> .fui-conversation-content:focus-visible)::after {"), /opacity: 1;/);
});

test("the measure is opt-in, and only then do answers and bubbles change width", () => {
  const prose = rule(".fui-conversation-content[data-measure] .fui-chat-message[data-role=\"assistant\"] > .fui-chat-message-body {");
  assert.match(prose, /inline-size: fit-content;/);
  assert.match(prose, /max-inline-size: min\(100%, var\(--fui-chat-measure\)\);/);
  const wide = rule(
    ".fui-conversation-content[data-measure]\n    .fui-chat-message[data-role=\"assistant\"]\n    > .fui-chat-message-body:is(:has(table), :has(pre), :has(figure), :has(.katex-display), :has([data-wide]), [data-wide]) {",
  );
  assert.match(wide, /inline-size: 100%;/);
  assert.match(wide, /max-inline-size: 100%;/);
  assert.match(rule(".fui-conversation-content[data-measure] .fui-chat-message[data-role=\"user\"] > .fui-chat-message-body {"), /max-inline-size: min\(80%, 40rem\);/);
  assert.match(conversation, /@container \(max-width: 29\.99rem\) \{[\s\S]*?max-inline-size: 88%;/);
  assert.match(rule(".fui-conversation {"), /--fui-chat-measure: 52rem;/);
  // Nothing in the sheet widens an answer without the measure.
  const without = styles.replace(/\.fui-conversation-content\[data-measure\][^{]*\{[^}]*\}/g, "");
  assert.doesNotMatch(without, /inline-size: fit-content;[\s\S]{0,80}fui-chat-message-body/);
});

test("the way back is hidden until it is needed, and it rises rather than jumps", () => {
  const hidden = rule(".fui-conversation-jump.fui-button {");
  assert.match(hidden, /visibility: hidden;/);
  assert.match(hidden, /opacity: 0;/);
  assert.match(rule(".fui-conversation-jump.fui-button[data-visible] {"), /visibility: visible;/);
  assert.match(rule(".fui-conversation-jump.fui-button[data-align=\"center\"] {"), /inset-inline: 0;\s*margin-inline: auto;/);
  assert.match(rule(".fui-conversation-jump.fui-button[data-align=\"end\"] {"), /inset-inline-end: var\(--fui-space-2\);/);
  assert.match(rule(".fui-conversation-jump.fui-button {"), /inset-block-end: calc\(var\(--fui-conversation-footer-size\) \+ var\(--fui-space-3\)\);/);
  const motion = blockAt("@media (prefers-reduced-motion: no-preference) {\n    .fui-conversation-jump.fui-button {");
  assert.match(motion, /transition:/);
  const reduced = blockAt("@media (prefers-reduced-motion: no-preference) {\n    .fui-conversation-marker-tick {");
  assert.match(reduced, /transition:/);
  // Neither transition sits outside the block that only people who allow motion read.
  const outside = conversation.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n  \}\n/g, "");
  assert.doesNotMatch(outside, /transition:[\s\S]{0,60}fui-conversation-jump|transition:[\s\S]{0,60}marker-tick/);
});

test("the rail keeps to the end side, to 70% of the height, and away where it would cover the text", () => {
  const rail = rule(".fui-conversation-rail {");
  // Clear of the log's scrollbar, which the conversation measures: 8 px inside it, or inside the edge where scrollbars take no room.
  assert.match(rail, /inset-inline-end: calc\(var\(--fui-conversation-scrollbar, 0px\) \+ var\(--fui-space-2\)\);/);
  assert.match(rail, /max-block-size: 70%;/);
  assert.match(rail, /display: none;/);
  assert.match(rail, /translate: 0 -50%;/);
  const shows = blockAt("@media (pointer: fine) {\n    @container (min-width: 40rem) {");
  assert.match(shows, /\.fui-conversation-rail \{\s*display: flex;/);
  assert.match(shows, /padding-inline-end: calc\(var\(--fui-conversation-gutter\) \+ var\(--fui-space-6\) \+ var\(--fui-space-1\)\);/);
  assert.match(rule(".fui-conversation-marker {"), /block-size: var\(--fui-conversation-slot, 22px\);/);
  assert.match(rule(".fui-conversation-marker[aria-current=\"true\"] .fui-conversation-marker-tick {"), /background: var\(--fui-focus\);/);
});

test("the dock sits under the log, clear of the safe area, and the log fades into it", () => {
  assert.match(rule(".fui-conversation-footer {"), /padding-block: var\(--fui-space-2\) max\(var\(--fui-space-3\), env\(safe-area-inset-bottom, 0px\)\);/);
  const fade = rule(".fui-conversation:has(> .fui-conversation-footer[data-fade]) > .fui-conversation-content {");
  assert.match(fade, /mask-image: linear-gradient\(to bottom, var\(--foreground\) calc\(100% - var\(--fui-conversation-fade\)\), transparent\);/);
  assert.match(
    rule(".fui-conversation:has(> .fui-conversation-footer[data-fade]) .fui-conversation-column {"),
    /padding-block-end: var\(--fui-conversation-fade\);/,
    "the last line is never under the fade",
  );
});

test("the states that are only a tint have a form in forced colors, and nothing scrolls on paper", () => {
  const forced = blockAt("@media (forced-colors: active) {\n    .fui-conversation-marker-tick {");
  assert.match(forced, /\.fui-conversation-marker-tick \{\s*background: CanvasText;/);
  assert.match(forced, /\.fui-conversation-marker\[aria-current="true"\] \.fui-conversation-marker-tick,\s*\.fui-conversation-jump-dot \{\s*background: Highlight;/);
  assert.match(forced, /\.fui-conversation-jump-count \{[^}]*background: Canvas;[^}]*color: CanvasText;/);
  const print = blockAt("@media print {\n    .fui-conversation-content {");
  assert.match(print, /overflow: visible;/);
  assert.match(print, /:is\(\.fui-conversation-jump, \.fui-conversation-rail, \.fui-conversation-footer\) \{\s*display: none;/);
});

test("the whole block is logical and reads its colours from tokens", () => {
  assert.doesNotMatch(conversation, /(?:margin|padding|inset|border)-(?:left|right)/);
  assert.doesNotMatch(conversation, /(?:^|[\s;{])(?:left|right):/m);
  assert.doesNotMatch(conversation, /text-align: (?:left|right);/);
  assert.doesNotMatch(conversation, /#[0-9a-fA-F]{3,8}\b/);
});
