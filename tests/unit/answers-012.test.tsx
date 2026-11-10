import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AnnotationList,
  ChoiceFeedback,
  ChoiceGroup,
  ChoiceOption,
  MarkedText,
  Progress,
  RatingBar,
  RevealCard,
  StepControls,
  TextDiff,
  diffWords,
  segmentText,
} from "../../packages/ui/src/index";
import {
  choiceKey,
  choiceMarker,
  hotkeyAllowed,
  inHotkeysOff,
  isTypingTarget,
  matchesChoiceKey,
  outsideDialog,
  ratingKey,
  type KeyLike,
} from "../../packages/ui/src/choice-keys";
import { clampStep, lastStep, stepDelay, stepPlayerReducer, type StepPlayerAction, type StepPlayerState } from "../../packages/ui/src/step-player";
import { graphemeBoundaries, placeRanges, wordTokens, type DiffPart } from "../../packages/ui/src/text-ranges";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const BLOCK_MARK = "/* 0.12: answers and steps */";
const blockAt = styles.lastIndexOf("@layer components {", styles.indexOf(BLOCK_MARK));
const closeOf = (text: string, from: number) => {
  let depth = 0;
  for (let at = text.indexOf("{", from); at >= 0 && at < text.length; at += 1) {
    if (text[at] === "{") depth += 1;
    if (text[at] === "}" && --depth === 0) return at + 1;
  }
  return text.length;
};
const block = styles.slice(blockAt, closeOf(styles, blockAt));
const rule = (selector: string, from = block) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const at = from.search(new RegExp(`(?:^|\\n)  ${escaped} \\{`));
  assert.ok(at >= 0, `missing rule ${selector}`);
  const open = from.indexOf("{", at);
  return from.slice(at, from.indexOf("}", open) + 1);
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
const tags = (html: string, pattern: RegExp) => [...html.matchAll(pattern)].map((match) => match[0]);

// ---------------------------------------------------------------------------------------------------------- the key helper

/** A stand-in for an element: `closest` answers for the selectors it is told it sits inside. */
const element = (inside: string[] = [], extra: Record<string, unknown> = {}) => ({
  closest: (selector: string) => (selector.split(",").some((part) => inside.includes(part.trim())) ? { contains: () => false } : null),
  ...extra,
});

test("typing targets: fields, editable text and the roles that take text, from inside them too", () => {
  for (const selector of ["input", "textarea", "select", '[contenteditable]:not([contenteditable="false"])', '[role="textbox"]', '[role="combobox"]', '[role="searchbox"]', '[role="spinbutton"]'])
    assert.equal(isTypingTarget(element([selector])), true, selector);
  assert.equal(isTypingTarget(element([], { isContentEditable: true })), true);
  assert.equal(isTypingTarget(element(["button"])), false);
  assert.equal(isTypingTarget(element()), false);
  for (const nothing of [null, undefined, {}, "body", 3]) assert.equal(isTypingTarget(nothing), false);
});

test("an island that opted out keeps its keys, and a dialog keeps the page behind it from answering", () => {
  assert.equal(inHotkeysOff(element(['[data-hotkeys="off"]'])), true);
  assert.equal(inHotkeysOff(element()), false);
  assert.equal(inHotkeysOff(null), false);
  const scope = {};
  const dialogWith = (holds: boolean) => ({ closest: (selector: string) => (selector.includes('[role="dialog"]') ? { contains: (other: unknown) => holds && other === scope } : null) });
  assert.equal(outsideDialog(dialogWith(false), scope), true);
  assert.equal(outsideDialog(dialogWith(true), scope), false);
  assert.equal(outsideDialog(element(), scope), false);
  assert.equal(outsideDialog(null, scope), false);
});

test("a hotkey is allowed only without Ctrl, Alt or Meta, outside an IME, a field and an island, once per press", () => {
  const event = (over: Partial<KeyLike> = {}): KeyLike => ({ key: "b", target: element(), ...over });
  assert.equal(hotkeyAllowed(event()), true);
  assert.equal(hotkeyAllowed(event({ target: null })), true);
  for (const blocked of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { defaultPrevented: true }, { repeat: true }] as Partial<KeyLike>[])
    assert.equal(hotkeyAllowed(event(blocked)), false, JSON.stringify(blocked));
  assert.equal(hotkeyAllowed(event({ repeat: true }), { repeat: true }), true, "a caller may take repeats (to swallow them)");
  assert.equal(hotkeyAllowed(event({ target: element(["input"]) })), false);
  assert.equal(hotkeyAllowed(event({ target: element(['[role="textbox"]']) })), false);
  assert.equal(hotkeyAllowed(event({ target: element(['[data-hotkeys="off"]']) })), false);
  // Shift is not a blocker: Caps Lock and Shift+B still mean B.
  assert.equal(hotkeyAllowed({ ...event(), shiftKey: true } as KeyLike), true);
});

test("markers: A to Z, then none; numbers in the reader's digits; nothing for none or a place that is not one", () => {
  assert.deepEqual([0, 1, 2, 25].map((index) => choiceMarker(index, "letters")), ["A", "B", "C", "Z"]);
  assert.equal(choiceMarker(26, "letters"), "");
  assert.deepEqual([0, 1, 8, 9, 41].map((index) => choiceMarker(index, "numbers")), ["1", "2", "9", "10", "42"]);
  assert.deepEqual([0, 1, 11].map((index) => choiceMarker(index, "numbers", "ar-EG")), ["١", "٢", "١٢"]);
  assert.equal(choiceMarker(1233, "numbers", "en"), "1234", "no grouping in a keycap");
  for (const index of [0, 5]) assert.equal(choiceMarker(index, "none"), "");
  for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(choiceMarker(bad, "letters"), "");
    assert.equal(choiceMarker(bad, "numbers"), "");
    assert.equal(choiceKey(bad, "letters"), undefined);
    assert.equal(choiceKey(bad, "numbers"), undefined);
  }
});

test("keys: a to z beside letters, 1 to 9 otherwise, none past them; a press matches in either case or as printed", () => {
  assert.deepEqual([0, 1, 25, 26].map((index) => choiceKey(index, "letters")), ["a", "b", "z", undefined]);
  for (const markers of ["numbers", "none"] as const) assert.deepEqual([0, 8, 9].map((index) => choiceKey(index, markers)), ["1", "9", undefined]);
  assert.equal(matchesChoiceKey("b", "b"), true);
  assert.equal(matchesChoiceKey("B", "b"), true);
  assert.equal(matchesChoiceKey("c", "b"), false);
  assert.equal(matchesChoiceKey("2", "2", "٢"), true);
  assert.equal(matchesChoiceKey("٢", "2", "٢"), true, "the digit as printed on the keycap");
  assert.equal(matchesChoiceKey("٣", "2", "٢"), false);
  assert.equal(matchesChoiceKey("b", undefined, "B"), false, "an option without a key has none");
  assert.equal(matchesChoiceKey("", "b"), false);
  assert.equal(matchesChoiceKey("Enter", "e"), false);
  assert.deepEqual([0, 2, 8, 9, -1].map((index) => ratingKey(index)), ["1", "3", "9", undefined, undefined]);
  assert.equal(ratingKey(0, "G"), "g");
  assert.equal(ratingKey(0, ""), undefined, "an empty shortcut gives the rating no key");
});

// --------------------------------------------------------------------------------------------------------- the step player

const ACTIONS: StepPlayerAction[] = [
  { type: "next" },
  { type: "previous" },
  { type: "goTo", index: 0 },
  { type: "goTo", index: 2 },
  { type: "goTo", index: 99 },
  { type: "goTo", index: -4 },
  { type: "goTo", index: Number.NaN },
  { type: "play" },
  { type: "pause" },
  { type: "toggle" },
  { type: "restart" },
  { type: "tick" },
  { type: "setSpeed", speed: 2 },
  { type: "setSpeed", speed: 0 },
  { type: "setSpeed", speed: Number.NaN },
];

test("clampStep, lastStep and stepDelay", () => {
  assert.deepEqual([0, 1, 5, 5.9, -3, Number.NaN, Number.POSITIVE_INFINITY].map(lastStep), [0, 0, 4, 4, 0, 0, 0]);
  assert.equal(clampStep(3, 5), 3);
  assert.equal(clampStep(9, 5), 4);
  assert.equal(clampStep(Number.POSITIVE_INFINITY, 5), 4);
  assert.equal(clampStep(-2, 5), 0);
  assert.equal(clampStep(2.9, 5), 2);
  assert.equal(clampStep(Number.NaN, 5), 0);
  assert.equal(clampStep(3, 0), 0);
  assert.equal(stepDelay(1200, 1), 1200);
  assert.equal(stepDelay(1200, 2), 600);
  assert.equal(stepDelay(1200, 0.5), 2400);
  assert.equal(stepDelay(1200, 0), 1200, "a speed that is not one is 1");
  assert.equal(stepDelay(1200, Number.NaN), 1200);
  assert.equal(stepDelay(10, 4), 16, "never faster than a frame");
  assert.equal(stepDelay(-5, 1), 16);
});

test("the reducer, over every state, count, loop and action: the step exists, the speed is positive, and nothing changes without cause", () => {
  for (const count of [0, 1, 2, 3, 5]) {
    for (const loop of [false, true]) {
      for (let index = 0; index < Math.max(1, count); index += 1) {
        for (const playing of [false, true]) {
          const state: StepPlayerState = { index, playing, speed: 1 };
          for (const action of ACTIONS) {
            const next = stepPlayerReducer(state, action, { count, loop });
            const label = `${JSON.stringify(state)} ${JSON.stringify(action)} count=${count} loop=${loop}`;
            assert.ok(Number.isInteger(next.index) && next.index >= 0 && next.index <= lastStep(count), `index in range: ${label}`);
            assert.ok(next.speed > 0 && Number.isFinite(next.speed), `speed positive: ${label}`);
            if (count < 2) assert.equal(next.playing && action.type !== "setSpeed" && action.type !== "pause" ? state.playing && action.type === "setSpeed" : false, false, `one step never starts playing: ${label}`);
            if (next.index === state.index && next.playing === state.playing && next.speed === state.speed) assert.equal(next, state, `the same state is the same object: ${label}`);
            // A step by hand pauses.
            if (action.type === "next" || action.type === "previous" || action.type === "goTo" || action.type === "restart" || action.type === "pause")
              assert.equal(next.playing, false, `paused: ${label}`);
            // Only a tick, a step by hand or a replay moves the step.
            if (action.type === "pause" || action.type === "setSpeed") assert.equal(next.index, state.index, label);
            if (action.type === "setSpeed") assert.equal(next.playing, state.playing, label);
          }
        }
      }
    }
  }
});

test("next and previous stop at the ends, goTo clamps, restart goes to the first step", () => {
  const at = (index: number, playing = false): StepPlayerState => ({ index, playing, speed: 1 });
  const run = (state: StepPlayerState, action: StepPlayerAction, loop = false) => stepPlayerReducer(state, action, { count: 4, loop });
  assert.deepEqual(run(at(0), { type: "next" }), at(1));
  assert.deepEqual(run(at(3), { type: "next" }), at(3));
  assert.deepEqual(run(at(3), { type: "next" }, true), at(3), "by hand the steps do not go round, even with loop");
  assert.deepEqual(run(at(0), { type: "previous" }), at(0));
  assert.deepEqual(run(at(0), { type: "previous" }, true), at(0));
  assert.deepEqual(run(at(2), { type: "previous" }), at(1));
  assert.deepEqual(run(at(1, true), { type: "next" }), at(2, false));
  assert.deepEqual(run(at(1), { type: "goTo", index: 3 }), at(3));
  assert.deepEqual(run(at(1), { type: "goTo", index: 99 }), at(3));
  assert.deepEqual(run(at(1), { type: "goTo", index: -1 }), at(0));
  assert.deepEqual(run(at(3, true), { type: "restart" }), at(0));
  // A state that came in out of range (the count shrank) is brought back in.
  assert.deepEqual(stepPlayerReducer(at(9), { type: "pause" }, { count: 3 }), at(2));
});

test("play, pause and toggle: play at the end starts again, and one step never plays", () => {
  const at = (index: number, playing = false): StepPlayerState => ({ index, playing, speed: 1 });
  const run = (state: StepPlayerState, action: StepPlayerAction, loop = false, count = 4) => stepPlayerReducer(state, action, { count, loop });
  assert.deepEqual(run(at(1), { type: "play" }), at(1, true));
  assert.deepEqual(run(at(3), { type: "play" }), at(0, true), "replay");
  assert.deepEqual(run(at(3), { type: "play" }, true), at(3, true), "with loop the next tick goes round");
  assert.deepEqual(run(at(1, true), { type: "pause" }), at(1));
  assert.deepEqual(run(at(1), { type: "toggle" }), at(1, true));
  assert.deepEqual(run(at(1, true), { type: "toggle" }), at(1));
  assert.deepEqual(run(at(3), { type: "toggle" }), at(0, true));
  for (const count of [0, 1]) {
    assert.deepEqual(run(at(0), { type: "play" }, false, count), at(0));
    assert.deepEqual(run(at(0), { type: "toggle" }, true, count), at(0));
    assert.deepEqual(run(at(0, true), { type: "tick" }, true, count), at(0));
  }
});

test("a tick advances only while playing, stops on the last step, and goes round with loop", () => {
  const at = (index: number, playing = false): StepPlayerState => ({ index, playing, speed: 1 });
  const run = (state: StepPlayerState, loop = false) => stepPlayerReducer(state, { type: "tick" }, { count: 4, loop });
  assert.deepEqual(run(at(1)), at(1), "paused: a late tick does nothing");
  assert.deepEqual(run(at(0, true)), at(1, true));
  assert.deepEqual(run(at(2, true)), at(3, false), "arriving at the last step stops");
  assert.deepEqual(run(at(3, true)), at(3, false));
  assert.deepEqual(run(at(2, true), true), at(3, true));
  assert.deepEqual(run(at(3, true), true), at(0, true));
  // A whole run: count - 1 ticks from the first step, then it rests on the last.
  for (const count of [2, 3, 7]) {
    let state = stepPlayerReducer({ index: 0, playing: false, speed: 1 }, { type: "play" }, { count });
    const seen = [state.index];
    for (let step = 0; step < count + 3; step += 1) {
      state = stepPlayerReducer(state, { type: "tick" }, { count });
      seen.push(state.index);
    }
    assert.deepEqual(seen.slice(0, count), Array.from({ length: count }, (_, index) => index));
    assert.deepEqual(state, { index: count - 1, playing: false, speed: 1 });
  }
});

test("setSpeed takes a positive number and nothing else", () => {
  const state: StepPlayerState = { index: 1, playing: true, speed: 1 };
  assert.deepEqual(stepPlayerReducer(state, { type: "setSpeed", speed: 2 }, { count: 4 }), { index: 1, playing: true, speed: 2 });
  for (const speed of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(stepPlayerReducer(state, { type: "setSpeed", speed }, { count: 4 }), state);
});

// ----------------------------------------------------------------------------------------------------------- text ranges

const FAMILY = "👨‍👩‍👧"; // one grapheme: three people joined by zero-width joiners (8 code units)
const ACCENT = "e\u0301"; // one grapheme: e and a combining acute

test("grapheme boundaries never fall inside a surrogate pair, a joined emoji or a letter and its accent", () => {
  assert.deepEqual(graphemeBoundaries(""), [0]);
  assert.deepEqual(graphemeBoundaries("ab"), [0, 1, 2]);
  assert.deepEqual(graphemeBoundaries("a😀b"), [0, 1, 3, 4]);
  assert.deepEqual(graphemeBoundaries(`a${ACCENT}b`), [0, 1, 3, 4]);
  assert.deepEqual(graphemeBoundaries(`x${FAMILY}y`), [0, 1, 1 + FAMILY.length, 2 + FAMILY.length]);
  // Arabic letters with their vowel marks: a mark stays with its letter.
  assert.deepEqual(graphemeBoundaries("بَتَ"), [0, 2, 4]);
});

test("placeRanges: clamped, in reading order, widened to whole characters, never overlapping; the rest dropped with indexes kept", () => {
  const text = "The quick brown fox";
  assert.deepEqual(placeRanges(text, [{ start: 4, end: 9 }]), [{ index: 0, start: 4, end: 9 }]);
  // Out of the text: clamped. Empty, reversed, not numbers: dropped.
  assert.deepEqual(placeRanges(text, [{ start: -5, end: 3 }, { start: 16, end: 99 }]), [
    { index: 0, start: 0, end: 3 },
    { index: 1, start: 16, end: 19 },
  ]);
  assert.deepEqual(
    placeRanges(text, [{ start: 3, end: 3 }, { start: 9, end: 4 }, { start: Number.NaN, end: 4 }, { start: 0, end: Number.POSITIVE_INFINITY }, { start: 40, end: 50 }, { start: 10, end: 15 }]),
    [{ index: 5, start: 10, end: 15 }],
  );
  // Given out of order: sorted, and each keeps the place it had in the list.
  assert.deepEqual(placeRanges(text, [{ start: 10, end: 15 }, { start: 0, end: 3 }]), [
    { index: 1, start: 0, end: 3 },
    { index: 0, start: 10, end: 15 },
  ]);
  // Overlap: the first keeps its passage, the second what is left after it.
  assert.deepEqual(placeRanges(text, [{ start: 4, end: 9 }, { start: 7, end: 15 }]), [
    { index: 0, start: 4, end: 9 },
    { index: 1, start: 9, end: 15 },
  ]);
  // Nested: the inner one has nothing left. Same start: the longer wins. Identical: the earlier in the list.
  assert.deepEqual(placeRanges(text, [{ start: 4, end: 15 }, { start: 6, end: 9 }]), [{ index: 0, start: 4, end: 15 }]);
  assert.deepEqual(placeRanges(text, [{ start: 4, end: 9 }, { start: 4, end: 15 }]), [{ index: 1, start: 4, end: 15 }]);
  assert.deepEqual(placeRanges(text, [{ start: 4, end: 9 }, { start: 4, end: 9 }]), [{ index: 0, start: 4, end: 9 }]);
  // Fractions are cut to whole code units.
  assert.deepEqual(placeRanges(text, [{ start: 4.7, end: 9.2 }]), [{ index: 0, start: 4, end: 9 }]);
  assert.deepEqual(placeRanges("", [{ start: 0, end: 1 }]), []);
  // The input is not changed.
  const frozen = Object.freeze([Object.freeze({ start: 10, end: 15 }), Object.freeze({ start: 0, end: 3 })]);
  placeRanges(text, frozen);
});

test("a range that would cut a character is widened to hold it whole", () => {
  const emoji = "a😀b";
  assert.deepEqual(placeRanges(emoji, [{ start: 1, end: 2 }]), [{ index: 0, start: 1, end: 3 }], "ends inside the pair");
  assert.deepEqual(placeRanges(emoji, [{ start: 2, end: 4 }]), [{ index: 0, start: 1, end: 4 }], "starts inside the pair");
  const accent = `caf${ACCENT}s`;
  assert.deepEqual(placeRanges(accent, [{ start: 3, end: 4 }]), [{ index: 0, start: 3, end: 5 }], "the letter takes its accent");
  assert.deepEqual(placeRanges(accent, [{ start: 4, end: 5 }]), [{ index: 0, start: 3, end: 5 }], "the accent takes its letter");
  const family = `x${FAMILY}y`;
  assert.deepEqual(placeRanges(family, [{ start: 3, end: 4 }]), [{ index: 0, start: 1, end: 1 + FAMILY.length }]);
});

test("segmentText: the pieces join back into the text, for every pair of offsets, and no piece cuts a character", () => {
  const text = `I go 😀 to caf${ACCENT} ${FAMILY}!`;
  const boundaries = new Set(graphemeBoundaries(text));
  for (let start = -1; start <= text.length + 1; start += 1) {
    for (let end = -1; end <= text.length + 1; end += 1) {
      const segments = segmentText(text, [{ start, end }]);
      assert.equal(segments.map((segment) => segment.text).join(""), text, `${start}-${end}`);
      let at = 0;
      for (const segment of segments) {
        assert.equal(segment.start, at);
        assert.equal(segment.text, text.slice(segment.start, segment.end));
        assert.ok(segment.text.length > 0, "no empty piece");
        assert.ok(boundaries.has(segment.start) && boundaries.has(segment.end), `${start}-${end} cuts a character at ${segment.start}-${segment.end}`);
        at = segment.end;
      }
      assert.ok(segments.filter((segment) => segment.index != null).length <= 1);
    }
  }
  // Two ranges at every pair of places: still the whole text, in order, marks apart.
  for (let a = 0; a < text.length; a += 2) {
    for (let b = 0; b < text.length; b += 3) {
      const segments = segmentText(text, [{ start: a, end: a + 4 }, { start: b, end: b + 3 }]);
      assert.equal(segments.map((segment) => segment.text).join(""), text);
      const marked = segments.filter((segment) => segment.index != null);
      for (let index = 1; index < marked.length; index += 1) assert.ok(marked[index]!.start >= marked[index - 1]!.end);
    }
  }
});

test("segmentText: plain and marked pieces in order, each mark with its place in the list", () => {
  assert.deepEqual(segmentText("I go home", [{ start: 2, end: 4 }]), [
    { text: "I ", start: 0, end: 2, index: null },
    { text: "go", start: 2, end: 4, index: 0 },
    { text: " home", start: 4, end: 9, index: null },
  ]);
  assert.deepEqual(segmentText("go home", [{ start: 3, end: 7 }, { start: 0, end: 2 }]).map((segment) => [segment.text, segment.index]), [
    ["go", 1],
    [" ", null],
    ["home", 0],
  ]);
  assert.deepEqual(segmentText("abc", []), [{ text: "abc", start: 0, end: 3, index: null }]);
  assert.deepEqual(segmentText("", [{ start: 0, end: 3 }]), []);
  assert.deepEqual(segmentText("abc", [{ start: 0, end: 3 }]), [{ text: "abc", start: 0, end: 3, index: 0 }]);
});

const before = (parts: DiffPart[]) => parts.filter((part) => part.type !== "insert").map((part) => part.text).join("");
const after = (parts: DiffPart[]) => parts.filter((part) => part.type !== "delete").map((part) => part.text).join("");

test("wordTokens: words, spaces and signs, joined back into the text", () => {
  assert.deepEqual(wordTokens(""), []);
  assert.deepEqual(wordTokens("I go, home."), ["I", " ", "go", ",", " ", "home", "."]);
  for (const text of ["  two  spaces ", "l'été est là", "ذهبت إلى السوق", "東京に行きます", `x${FAMILY}y 😀`, "tab\tand\nline"]) assert.equal(wordTokens(text).join(""), text);
});

test("diffWords: what the two share stays, a replaced word reads old then new", () => {
  assert.deepEqual(diffWords("I go home", "I went home"), [
    { type: "equal", text: "I " },
    { type: "delete", text: "go" },
    { type: "insert", text: "went" },
    { type: "equal", text: " home" },
  ]);
  assert.deepEqual(diffWords("same text", "same text"), [{ type: "equal", text: "same text" }]);
  assert.deepEqual(diffWords("", ""), []);
  assert.deepEqual(diffWords("", "new"), [{ type: "insert", text: "new" }]);
  assert.deepEqual(diffWords("old", ""), [{ type: "delete", text: "old" }]);
  assert.deepEqual(diffWords("a b c", "a c"), [
    { type: "equal", text: "a " },
    { type: "delete", text: "b " },
    { type: "equal", text: "c" },
  ]);
  assert.deepEqual(diffWords("a c", "a b c"), [
    { type: "equal", text: "a " },
    { type: "insert", text: "b " },
    { type: "equal", text: "c" },
  ]);
  // A word is the unit: "apple" to "apples" is a replacement, not one letter.
  assert.deepEqual(diffWords("three apple.", "three apples."), [
    { type: "equal", text: "three " },
    { type: "delete", text: "apple" },
    { type: "insert", text: "apples" },
    { type: "equal", text: "." },
  ]);
});

test("diffWords: for any two texts the parts rebuild both, never repeat a type in a row and hold no empty part", () => {
  const texts = [
    "",
    "one",
    "one two three",
    "one three",
    "three two one",
    "Yesterday I go to the market and buyed three apple.",
    "Yesterday I went to the market and bought three apples.",
    "ذهبت إلى السوق أمس",
    "ذهبتُ إلى السوقِ اليوم",
    `caf${ACCENT} ${FAMILY} 😀`,
    "a a a a b a a a",
    "  spaces   kept  ",
  ];
  for (const a of texts) {
    for (const b of texts) {
      const parts = diffWords(a, b);
      assert.equal(before(parts), a, `before: ${a} -> ${b}`);
      assert.equal(after(parts), b, `after: ${a} -> ${b}`);
      parts.forEach((part, index) => {
        assert.ok(part.text.length > 0);
        if (index > 0) assert.notEqual(part.type, parts[index - 1]!.type);
        // Within a run of changes, what was removed comes before what was added.
        if (part.type === "delete" && index > 0) assert.notEqual(parts[index - 1]!.type, "insert");
      });
      if (a === b && a.length > 0) assert.deepEqual(parts, [{ type: "equal", text: a }]);
    }
  }
});

test("diffWords: two long texts with nothing in common still rebuild both (no table is built)", () => {
  const words = (prefix: string) => Array.from({ length: 1100 }, (_, index) => `${prefix}${index}`).join(" ");
  const a = `start ${words("a")} end`;
  const b = `start ${words("b")} end`;
  const parts = diffWords(a, b);
  assert.equal(before(parts), a);
  assert.equal(after(parts), b);
  assert.deepEqual(parts.map((part) => part.type), ["equal", "delete", "insert", "equal"]);
});

// ------------------------------------------------------------------------------------------------------------ markup

test("ChoiceGroup, one answer: a radiogroup of tiles whose names are their content, each with a hidden keycap", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Evening" defaultValue="b">
      <ChoiceOption value="a">
        <span lang="fr">Bonjour</span>
      </ChoiceOption>
      <ChoiceOption description="From six." value="b">
        Bonsoir
      </ChoiceOption>
    </ChoiceGroup>,
  );
  assert.match(html, /^<div role="radiogroup" data-slot="choice-group" data-orientation="vertical" aria-label="Evening" class="fui-choice-group">/);
  const options = tags(html, /<span [^>]*role="radio"[^>]*>/g);
  assert.equal(options.length, 2);
  assert.match(options[0]!, /aria-checked="false"/);
  assert.match(options[1]!, /aria-checked="true"/);
  for (const option of options) {
    assert.match(option, /data-slot="choice-option"/);
    assert.match(option, /class="fui-choice-option"/);
    assert.doesNotMatch(option, /aria-label=|aria-keyshortcuts|data-choice-key/, "no aria-label over the answer, no key without shortcuts");
  }
  assert.deepEqual(tags(html, /<span aria-hidden="true" class="fui-choice-marker">[^<]*<\/span>/g).map((tag) => tag.replace(/<[^>]+>/g, "")), ["A", "B"]);
  assert.match(html, /<span class="fui-choice-label" id="[^"]+"><span lang="fr">Bonjour<\/span><\/span>/);
  // A second line describes the option and stays out of its name.
  const label = html.match(/<span class="fui-choice-label" id="([^"]+)">Bonsoir/)![1]!;
  const description = html.match(/<span class="fui-choice-description" id="([^"]+)">From six\.<\/span>/)![1]!;
  assert.match(options[1]!, new RegExp(`aria-labelledby="${label}"`));
  assert.match(options[1]!, new RegExp(`aria-describedby="${description}"`));
  assert.doesNotMatch(options[0]!, /aria-labelledby|aria-describedby/);
  // The pick shows a tick; the other tile keeps the room for one.
  assert.equal(tags(html, /class="lucide lucide-check"/g).length, 1);
  assert.equal(tags(html, /class="fui-choice-state"/g).length, 2);
  assert.doesNotMatch(html, /data-readonly|aria-readonly/);
});

test("ChoiceGroup: shortcuts announce each key; a ruled-out option is disabled, says so and has no key", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" shortcuts>
      <ChoiceOption value="a">Alpha</ChoiceOption>
      <ChoiceOption ruledOut value="b">
        Beta
      </ChoiceOption>
      <ChoiceOption value="c">Gamma</ChoiceOption>
    </ChoiceGroup>,
  );
  const options = tags(html, /<span [^>]*role="radio"[^>]*>/g);
  assert.match(options[0]!, /data-choice-key="a"/);
  assert.match(options[0]!, /aria-keyshortcuts="A"/);
  assert.match(options[2]!, /aria-keyshortcuts="C"/, "the third option keeps the third letter");
  assert.match(options[1]!, /aria-disabled="true"/);
  assert.match(options[1]!, /data-ruled-out=""/);
  assert.doesNotMatch(options[1]!, /aria-keyshortcuts|data-choice-key/);
  assert.match(html, /<span class="fui-sr-only" id="[^"]+">, Ruled out<\/span>/);
  assert.match(html, /<input type="radio"[^>]*disabled=""[^>]*value="b"/);
  // Numbers, in the reader's digits; the key stays the ASCII digit and the printed digit is kept for matching.
  const arabic = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" locale="ar-EG" markers="numbers" shortcuts>
      <ChoiceOption value="a">ا</ChoiceOption>
      <ChoiceOption value="b">ب</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.match(arabic, /data-choice-key="2" data-choice-marker="٢" aria-keyshortcuts="2"/);
  assert.match(arabic, /class="fui-choice-marker">٢</);
  const bare = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" markers="none" shortcuts>
      <ChoiceOption value="a">Alpha</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.doesNotMatch(bare, /fui-choice-marker/);
  assert.match(bare, /aria-keyshortcuts="1"/);
});

test("ChoiceGroup: an option that is not a direct child takes its place from index; an element without a value is not counted", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" shortcuts>
      <ChoiceOption value="a">Alpha</ChoiceOption>
      <p>Or one of these:</p>
      <ChoiceOption value="b">Beta</ChoiceOption>
      <div>
        <ChoiceOption index={2} value="c">
          Gamma
        </ChoiceOption>
        <ChoiceOption value="d">Delta</ChoiceOption>
      </div>
    </ChoiceGroup>,
  );
  assert.deepEqual(tags(html, /class="fui-choice-marker">[^<]*</g).map((tag) => tag.slice(-2, -1)), ["A", "B", "C"]);
  assert.deepEqual(tags(html, /aria-keyshortcuts="[^"]*"/g), ['aria-keyshortcuts="A"', 'aria-keyshortcuts="B"', 'aria-keyshortcuts="C"']);
  assert.throws(() => renderToStaticMarkup(<ChoiceOption value="a">Alone</ChoiceOption>), /inside a ChoiceGroup/);
});

test("ChoiceGroup, answered: read-only, the pick marked with the verdict, each marked option with an icon and its word", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" result="incorrect" shortcuts value="a">
      <ChoiceOption value="a">Alpha</ChoiceOption>
      <ChoiceOption result="missed" value="b">
        Beta
      </ChoiceOption>
      <ChoiceOption value="c">Gamma</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.equal(attribute(html, "aria-readonly"), "true");
  assert.equal(attribute(html, "data-readonly"), "");
  const options = tags(html, /<span [^>]*role="radio"[^>]*>/g);
  assert.match(options[0]!, /data-result="incorrect"/);
  assert.match(options[1]!, /data-result="missed"/);
  assert.doesNotMatch(options[2]!, /data-result/);
  assert.doesNotMatch(html, /aria-keyshortcuts|data-choice-key/, "an answered group has no keys");
  assert.match(html, /lucide-circle-x[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span class="fui-sr-only" id="[^"]+">, Your answer, incorrect<\/span>/);
  assert.match(html, /class="lucide lucide-check"[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span class="fui-sr-only" id="[^"]+">, Correct answer<\/span>/);
  const right = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" labels={{ correct: "Richtig" }} result="correct" value="a">
      <ChoiceOption value="a">Alpha</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.match(right, /lucide-circle-check[^>]*>.*?<\/svg><span class="fui-sr-only" id="[^"]+">, Richtig<\/span>/);
  // A result on an option alone makes the group read-only too; readOnly does it without a verdict.
  const own = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" value="a">
      <ChoiceOption result="correct" value="a">
        Alpha
      </ChoiceOption>
    </ChoiceGroup>,
  );
  assert.equal(attribute(own, "aria-readonly"), "true");
  const locked = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" readOnly value="a">
      <ChoiceOption value="a">Alpha</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.equal(attribute(locked, "aria-readonly"), "true");
  assert.doesNotMatch(locked, /data-result/);
});

test("ChoiceGroup, several answers: a group of checkboxes that submit under one name, read-only one by one", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Primes" markers="numbers" multiple name="primes" value={["7"]}>
      <ChoiceOption value="7">7</ChoiceOption>
      <ChoiceOption value="9">9</ChoiceOption>
    </ChoiceGroup>,
  );
  assert.match(html, /^<div role="group" data-slot="choice-group"/);
  assert.doesNotMatch(html, /aria-readonly|aria-required/, "a group role has neither state");
  const boxes = tags(html, /<span [^>]*role="checkbox"[^>]*>/g);
  assert.equal(boxes.length, 2);
  assert.match(boxes[0]!, /aria-checked="true"/);
  assert.match(boxes[1]!, /aria-checked="false"/);
  for (const box of boxes) assert.match(box, /tabindex="0"/, "each checkbox is its own tab stop");
  assert.match(html, /<input[^>]*type="checkbox"[^>]*name="primes"[^>]*checked=""[^>]*value="7"/);
  const answered = renderToStaticMarkup(
    <ChoiceGroup aria-label="Primes" multiple value={["7", "9"]}>
      <ChoiceOption result="correct" value="7">
        7
      </ChoiceOption>
      <ChoiceOption result="incorrect" value="9">
        9
      </ChoiceOption>
    </ChoiceGroup>,
  );
  assert.equal(tags(answered, /role="checkbox"[^>]*aria-readonly="true"/g).length, 2);
  assert.match(answered.slice(0, answered.indexOf(">")), /data-readonly=""/);
});

test("ChoiceGroup: layout says itself in attributes the stylesheet reads", () => {
  const html = renderToStaticMarkup(
    <ChoiceGroup aria-label="Q" className="mine" columns={2} orientation="horizontal" size="lg">
      <ChoiceOption className="tile" value="a">
        Alpha
      </ChoiceOption>
    </ChoiceGroup>,
  );
  assert.match(html, /data-orientation="horizontal"/);
  assert.match(html, /data-size="lg"/);
  assert.match(html, /data-columns=""/);
  assert.match(html, /style="--fui-choice-columns:2"/);
  assert.match(html, /class="fui-choice-group mine"/);
  assert.match(html, /class="fui-choice-option tile"/);
  assert.doesNotMatch(renderToStaticMarkup(<ChoiceGroup aria-label="Q" columns={1} />), /data-columns|--fui-choice-columns/);
});

test("ChoiceFeedback: always a polite status, an icon and the verdict in words", () => {
  const correct = renderToStaticMarkup(<ChoiceFeedback tone="correct">Said in the evening.</ChoiceFeedback>);
  assert.match(correct, /^<div role="status" data-slot="choice-feedback" data-variant="success" class="fui-alert fui-choice-feedback" data-tone="correct">/);
  assert.match(correct, /<svg[^>]*lucide-circle-check[^>]*aria-hidden="true"/);
  assert.match(correct, /<div class="fui-alert-title">Correct<\/div><div class="fui-choice-feedback-body">Said in the evening\.<\/div>/);
  const wrong = renderToStaticMarkup(<ChoiceFeedback tone="incorrect" />);
  assert.equal(attribute(wrong, "role"), "status", "a wrong answer is not an alert");
  assert.equal(attribute(wrong, "data-variant"), "destructive");
  assert.match(wrong, /Not quite/);
  assert.match(renderToStaticMarkup(<ChoiceFeedback tone="partial" />), /data-variant="warning".*Partly right/);
  const neutral = renderToStaticMarkup(<ChoiceFeedback>Compare.</ChoiceFeedback>);
  assert.equal(attribute(neutral, "data-tone"), "neutral");
  assert.doesNotMatch(neutral, /fui-alert-title/);
  assert.match(renderToStaticMarkup(<ChoiceFeedback title="Richtig" tone="correct" />), /<div class="fui-alert-title">Richtig<\/div>/);
  assert.doesNotMatch(renderToStaticMarkup(<ChoiceFeedback title={null} tone="correct" />), /fui-alert-title/);
  assert.match(renderToStaticMarkup(<ChoiceFeedback icon={<i>!</i>} tone="correct" />), /<i>!<\/i>/);
});

test("RevealCard: the answer's live region is there before the answer, and the card is a labelled focus target", () => {
  const hidden = renderToStaticMarkup(
    <RevealCard back={<b>the answer</b>} front="the question" label="Card 3 of 20">
      <i>ratings</i>
    </RevealCard>,
  );
  assert.match(hidden, /^<article aria-label="Card 3 of 20" tabindex="-1" data-slot="reveal-card" class="fui-reveal-card">/);
  assert.match(hidden, /<div class="fui-reveal-card-front">the question<\/div><div aria-live="polite" class="fui-reveal-card-back"><\/div>/);
  assert.doesNotMatch(hidden, /the answer|ratings|data-revealed/);
  assert.match(hidden, /<button aria-keyshortcuts="Space" class="fui-button fui-reveal-card-show" data-slot="button" data-variant="outline" type="button"><span>Show answer<\/span><kbd class="fui-kbd fui-reveal-card-key" aria-hidden="true">Space<\/kbd><\/button>/);

  const shown = renderToStaticMarkup(
    <RevealCard back={<b>the answer</b>} defaultRevealed front="the question">
      <i>ratings</i>
    </RevealCard>,
  );
  assert.match(shown, /data-revealed=""/);
  assert.match(shown, /<div aria-live="polite" class="fui-reveal-card-back"><div class="fui-reveal-card-answer fui-rise"><b>the answer<\/b><\/div><\/div><div class="fui-reveal-card-after"><i>ratings<\/i><\/div>/);
  assert.doesNotMatch(shown, /<button/);
  // Controlled wins over the default; without shortcuts there is no key to print or announce.
  assert.doesNotMatch(renderToStaticMarkup(<RevealCard back="b" defaultRevealed front="f" revealed={false} />), /data-revealed/);
  const quiet = renderToStaticMarkup(<RevealCard back="b" front="f" revealKeyLabel="Leertaste" revealLabel="Antwort zeigen" shortcuts={false} />);
  assert.match(quiet, /<span>Antwort zeigen<\/span><\/button>/);
  assert.doesNotMatch(quiet, /aria-keyshortcuts|<kbd/);
  assert.match(renderToStaticMarkup(<RevealCard back="b" front="f" revealKeyLabel="Leertaste" />), />Leertaste<\/kbd>/);
});

test("RatingBar: a named group of buttons, each with its key, its word and what it means", () => {
  const html = renderToStaticMarkup(
    <RatingBar
      label="How well did you know it?"
      onRate={() => {}}
      options={[
        { value: "again", label: "Again", hint: "In 1 minute", tone: "danger" },
        { value: "good", label: "Good", tone: "neutral" },
        { value: "easy", label: "Easy", shortcut: "E" },
        { value: "skip", label: "Skip", shortcut: "" },
      ]}
    />,
  );
  const id = html.match(/<p class="fui-rating-bar-label" id="([^"]+)">How well did you know it\?<\/p>/)![1]!;
  assert.match(html, new RegExp(`^<div aria-labelledby="${id}" role="group" data-slot="rating-bar" class="fui-rating-bar">`));
  const buttons = tags(html, /<button [^>]*>/g);
  assert.equal(buttons.length, 4);
  assert.match(buttons[0]!, /aria-keyshortcuts="1" class="fui-rating" data-tone="danger" type="button"/);
  assert.doesNotMatch(buttons[1]!, /data-tone/);
  assert.match(buttons[2]!, /aria-keyshortcuts="E"/);
  assert.doesNotMatch(buttons[3]!, /aria-keyshortcuts/);
  assert.match(html, /<kbd class="fui-kbd fui-rating-key" aria-hidden="true">1<\/kbd><span class="fui-rating-label">Again<\/span><span class="fui-rating-hint">In 1 minute<\/span>/);
  assert.equal(tags(html, /<kbd /g).length, 3);
  assert.equal(tags(html, /fui-rating-hint/g).length, 1);
  // Blocked buttons stay focusable: aria-disabled, never the disabled attribute.
  for (const blocked of [<RatingBar aria-label="Rate" disabled onRate={() => {}} options={[{ value: "a", label: "A" }]} />, <RatingBar aria-label="Rate" onRate={() => {}} options={[{ value: "a", label: "A" }]} pending />]) {
    const markup = renderToStaticMarkup(blocked);
    assert.match(markup, /<button aria-disabled="true"/);
    assert.doesNotMatch(markup, / disabled=""/);
    assert.match(markup, /^<div role="group" aria-label="Rate"/);
  }
  assert.match(renderToStaticMarkup(<RatingBar aria-label="Rate" onRate={() => {}} options={[{ value: "a", label: "A" }]} pending />), /data-pending=""/);
  assert.doesNotMatch(renderToStaticMarkup(<RatingBar aria-label="Rate" onRate={() => {}} options={[{ value: "a", label: "A" }]} shortcuts={false} />), /<kbd|aria-keyshortcuts/);
});

const noop = () => {};

test("StepControls: a named toolbar; previous and next go off at the ends and stay focusable; the play key says what it will do", () => {
  const start = renderToStaticMarkup(<StepControls count={12} index={0} next={noop} previous={noop} toggle={noop} />);
  assert.match(start, /^<div [^>]*role="toolbar"[^>]*>/);
  assert.equal(attribute(start, "aria-label"), "Steps");
  assert.equal(attribute(start, "class"), "fui-toolbar fui-step-controls");
  const button = (html: string, key: string) => html.match(new RegExp(`<button [^>]*fui-step-controls-${key}"[^>]*>`))![0]!;
  assert.match(button(start, "previous"), /aria-disabled="true"/);
  assert.match(button(start, "previous"), /data-focusable=""/);
  assert.doesNotMatch(button(start, "previous"), / disabled=""/);
  assert.match(button(start, "next"), /aria-disabled="false"/);
  assert.match(button(start, "play"), /data-state="paused"/);
  assert.match(start, /class="fui-toolbar-label">Play<\/span>/);
  assert.match(start, /<span class="fui-step-controls-count">Step 1 of 12<\/span>/);
  assert.match(start, /<span aria-live="polite" class="fui-sr-only" role="status"><\/span><\/div>$/, "the live region starts empty: nothing is announced on first paint");
  assert.doesNotMatch(start, /fui-step-controls-reset|fui-step-controls-speeds/);
  for (const name of ["Previous step", "Next step"]) assert.match(start, new RegExp(`class="fui-toolbar-label">${name}</span>`));

  const playing = renderToStaticMarkup(<StepControls count={12} index={5} next={noop} playing previous={noop} toggle={noop} />);
  assert.match(button(playing, "play"), /data-state="playing"/);
  assert.match(playing, /class="fui-toolbar-label">Pause<\/span>/);
  assert.equal(attribute(playing, "data-playing"), "");
  assert.match(button(playing, "previous"), /aria-disabled="false"/);

  const end = renderToStaticMarkup(<StepControls count={12} index={11} next={noop} previous={noop} toggle={noop} />);
  assert.match(button(end, "next"), /aria-disabled="true"/);
  assert.match(button(end, "play"), /data-state="ended"/);
  assert.match(end, /class="fui-toolbar-label">Replay<\/span>/);
  assert.match(end, /Step 12 of 12/);
});

test("StepControls: a pager without a play key, reset and speeds on request, words and digits from props", () => {
  const pager = renderToStaticMarkup(<StepControls aria-label="Questions" count={8} index={2} next={noop} previous={noop} />);
  assert.equal(attribute(pager, "aria-label"), "Questions");
  assert.doesNotMatch(pager, /fui-step-controls-play/);
  assert.match(renderToStaticMarkup(<StepControls count={8} index={2} pause={noop} play={noop} />), /fui-step-controls-play/);
  // A key with nothing to call is off.
  assert.match(renderToStaticMarkup(<StepControls count={8} index={2} />).match(/<button [^>]*fui-step-controls-next"[^>]*>/)![0]!, /aria-disabled="true"/);

  const full = renderToStaticMarkup(<StepControls count={4} index={1} next={noop} previous={noop} reset restart={noop} setSpeed={noop} speed={2} speeds={[0.5, 1, 2]} toggle={noop} />);
  assert.match(full, /class="fui-toolbar-label">Back to the start<\/span>/);
  assert.match(full, /<div [^>]*role="group"[^>]*aria-label="Speed"[^>]*class="fui-toolbar-group fui-step-controls-speeds">/);
  assert.deepEqual(tags(full, /aria-pressed="(true|false)"[^>]*>[^<]*/g).map((tag) => `${tag.match(/aria-pressed="(\w+)"/)![1]} ${tag.split(">")[1]}`), ["false 0.5×", "false 1×", "true 2×"]);

  const arabic = renderToStaticMarkup(
    <StepControls count={12} index={4} labels={{ step: (current, total) => `الخطوة ${current} من ${total}`, controls: "الخطوات" }} locale="ar-EG" next={noop} previous={noop} />,
  );
  assert.match(arabic, /الخطوة ٥ من ١٢/);
  assert.equal(attribute(arabic, "aria-label"), "الخطوات");
  const off = renderToStaticMarkup(<StepControls count={4} disabled index={1} next={noop} previous={noop} toggle={noop} />);
  assert.equal(tags(off, /aria-disabled="true"/g).length, 3);
  // The count never shows a step that does not exist.
  assert.match(renderToStaticMarkup(<StepControls count={3} index={9} />), /Step 3 of 3/);
  assert.match(renderToStaticMarkup(<StepControls count={0} index={0} />), /Step 0 of 0/);
  assert.match(renderToStaticMarkup(<StepControls aria-labelledby="title" count={3} index={0} />), /aria-labelledby="title"/);
});

const SESSION = [
  { id: "a", label: "Warm-up", weight: 2, state: "done" },
  { id: "b", label: "Listening", weight: 4, state: "current" },
  { id: "c", label: "Review" },
] as const;

test("Progress segments: still a progressbar, whose value names the current segment; each part has its width, state and words", () => {
  const html = renderToStaticMarkup(<Progress hint="12 minutes left" label="Today's session" segments={SESSION} />);
  assert.match(html, /^<div [^>]*role="progressbar"/);
  assert.equal(attribute(html, "aria-valuenow"), "1");
  assert.equal(attribute(html, "aria-valuemin"), "0");
  assert.equal(attribute(html, "aria-valuemax"), "3");
  assert.equal(attribute(html, "aria-valuetext"), "Step 2 of 3, Listening");
  assert.equal(attribute(html, "data-variant"), "segments");
  assert.equal(attribute(html, "class"), "fui-progress");
  assert.match(html, /<span [^>]*class="fui-progress-label">Today(&#x27;|')s session<\/span>/);
  const hint = html.match(/<p class="fui-progress-hint" id="([^"]+)">12 minutes left<\/p>/)![1]!;
  assert.equal(attribute(html, "aria-describedby"), hint);
  assert.match(
    html,
    /<ol class="fui-progress-parts"><li class="fui-progress-part" data-state="done" style="flex-grow:2" title="Warm-up"><span class="fui-sr-only">Warm-up, done<\/span><\/li><li aria-current="step" class="fui-progress-part" data-state="current" style="flex-grow:4" title="Listening"><span class="fui-sr-only">Listening, current<\/span><\/li><li class="fui-progress-part" data-state="todo" style="flex-grow:1" title="Review"><span class="fui-sr-only">Review, to do<\/span><\/li><\/ol>/,
  );
  assert.doesNotMatch(html, /fui-progress-track|fui-progress-value|<button|role="toolbar"/);
  assert.equal(tags(html, /aria-current="step"/g).length, 1);
});

test("Progress segments: the value text without a current segment, in the reader's words and digits, or the host's own", () => {
  const done = renderToStaticMarkup(<Progress aria-label="Session" segments={SESSION.map((segment) => ({ ...segment, state: "done" as const }))} />);
  assert.equal(attribute(done, "aria-valuetext"), "3 of 3 done");
  assert.equal(attribute(done, "aria-valuenow"), "3");
  assert.equal(attribute(done, "aria-label"), "Session");
  const quiz = renderToStaticMarkup(
    <Progress
      aria-label="Quiz"
      segments={[
        { label: "Q1", state: "correct" },
        { label: "Q2", state: "incorrect" },
        { label: "Q3", state: "skipped" },
        { label: "Q4" },
      ]}
    />,
  );
  assert.equal(attribute(quiz, "aria-valuenow"), "3", "right, wrong and skipped are all settled");
  assert.equal(attribute(quiz, "aria-valuetext"), "3 of 4 done");
  assert.deepEqual(tags(quiz, /data-state="\w+"/g), ['data-state="correct"', 'data-state="incorrect"', 'data-state="skipped"', 'data-state="todo"']);
  const french = renderToStaticMarkup(
    <Progress
      aria-label="Séance"
      labels={{ step: (current, total, label) => `Étape ${current} sur ${total} : ${label}`, segment: (label, state) => `${label} (${state})` }}
      locale="ar-EG"
      segments={SESSION}
    />,
  );
  assert.equal(attribute(french, "aria-valuetext"), "Étape ٢ sur ٣ : Listening");
  assert.match(french, /Listening \(current\)/);
  assert.equal(attribute(renderToStaticMarkup(<Progress aria-label="S" getAriaValueText={() => "mine"} segments={SESSION} />), "aria-valuetext"), "mine");
  assert.equal(attribute(renderToStaticMarkup(<Progress aria-label="S" segments={SESSION} value={2} />), "aria-valuenow"), "2");
  assert.match(renderToStaticMarkup(<Progress aria-label="S" segments={SESSION} showValue />), /<span [^>]*class="fui-progress-value">Step 2 of 3, Listening<\/span>/);
  assert.match(renderToStaticMarkup(<Progress aria-label="S" segments={SESSION} size="sm" tone="success" />), /data-tone="success" data-size="sm"/);
  // A weight that is not positive still draws a sliver; a ring ignores segments.
  assert.match(renderToStaticMarkup(<Progress aria-label="S" segments={[{ label: "A", weight: 0 }]} />), /flex-grow:0\.01/);
  assert.match(renderToStaticMarkup(<Progress aria-label="S" segments={SESSION} value={40} variant="ring" />), /fui-progress-ring/);
});

test("Progress segments as buttons: a toolbar of named buttons, not a progressbar", () => {
  const html = renderToStaticMarkup(<Progress className="mine" hint="Go back to any question." label="Questions" onSegmentSelect={noop} segments={SESSION} />);
  assert.doesNotMatch(html, /role="progressbar"|aria-valuenow|aria-valuetext|<ol|<li/);
  assert.match(html, /^<div data-slot="progress" data-tone="neutral" data-variant="segments" class="fui-progress mine" data-interactive="">/);
  const label = html.match(/<span class="fui-progress-label" data-slot="progress-label" id="([^"]+)">Questions<\/span>/)![1]!;
  const hint = html.match(/<p class="fui-progress-hint" id="([^"]+)">/)![1]!;
  const toolbar = html.match(/<div [^>]*role="toolbar"[^>]*>/)![0]!;
  assert.match(toolbar, new RegExp(`aria-labelledby="${label}"`));
  assert.match(toolbar, new RegExp(`aria-describedby="${hint}"`));
  assert.match(toolbar, /class="fui-progress-parts"/);
  assert.doesNotMatch(toolbar, /aria-label=/);
  const buttons = tags(html, /<button [^>]*>/g);
  assert.equal(buttons.length, 3);
  assert.match(buttons[1]!, /aria-current="step"/);
  assert.match(buttons[1]!, /data-state="current"/);
  assert.match(buttons[1]!, /style="flex-grow:4"/);
  assert.match(html, /<span class="fui-sr-only">Listening, current<\/span><\/button>/);
  // Without a label the group still has a name: the host's, or the default.
  assert.match(renderToStaticMarkup(<Progress aria-label="Quiz" onSegmentSelect={noop} segments={SESSION} />).match(/<div [^>]*role="toolbar"[^>]*>/)![0]!, /aria-label="Quiz"/);
  assert.match(renderToStaticMarkup(<Progress onSegmentSelect={noop} segments={SESSION} />).match(/<div [^>]*role="toolbar"[^>]*>/)![0]!, /aria-label="Steps"/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="Quiz" onSegmentSelect={noop} segments={SESSION} />).slice(0, 120), /^<div[^>]*aria-label/, "the name is the toolbar's, not the wrapper's");
});

test("Progress marks: ticks at their share of the track from its start, spoken as the bar's description", () => {
  const html = renderToStaticMarkup(
    <Progress
      aria-describedby="note"
      hint="Between 10 and 25 questions."
      label="Placement test"
      marks={[
        { value: 10, label: "The shortest test ends here", caption: true },
        { value: 25, label: "The longest" },
        { value: 2, label: "Warm-up" },
      ]}
      max={25}
      value={6}
    />,
  );
  assert.equal(attribute(html, "aria-valuenow"), "6");
  const hint = html.match(/<p class="fui-progress-hint" id="([^"]+)">/)![1]!;
  const marks = html.match(/<span class="fui-sr-only" id="([^"]+)">The shortest test ends here\. The longest\. Warm-up<\/span>/)![1]!;
  assert.equal(attribute(html, "aria-describedby"), `note ${hint} ${marks}`);
  assert.match(html, /<div class="fui-progress-rail" data-captions=""><div [^>]*class="fui-progress-track">/);
  assert.deepEqual(tags(html, /<span aria-hidden="true" class="fui-progress-mark"[^>]*>/g), [
    '<span aria-hidden="true" class="fui-progress-mark" style="--fui-progress-mark-at:40%">',
    '<span aria-hidden="true" class="fui-progress-mark" data-align="end" style="--fui-progress-mark-at:100%">',
    '<span aria-hidden="true" class="fui-progress-mark" data-align="start" style="--fui-progress-mark-at:8%">',
  ]);
  assert.equal(tags(html, /fui-progress-mark-caption/g).length, 1);
  assert.match(html, /<span class="fui-progress-mark-tick"><\/span><span class="fui-progress-mark-caption">The shortest test ends here<\/span>/);
  // A value outside the range is drawn at the end it is nearest to; with min and max the share follows them.
  assert.match(renderToStaticMarkup(<Progress aria-label="x" marks={[{ value: 400, label: "far" }]} value={1} />), /--fui-progress-mark-at:100%/);
  assert.match(renderToStaticMarkup(<Progress aria-label="x" marks={[{ value: 15, label: "mid" }]} max={20} min={10} value={12} />), /--fui-progress-mark-at:50%/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" marks={[{ value: 15, label: "mid" }]} value={12} />), /data-captions/);
});

test("Progress: a bar without segments or marks is what it was, and a ring takes no marks", () => {
  const html = renderToStaticMarkup(<Progress aria-label="Quota used" value={42} />);
  assert.doesNotMatch(html, /fui-progress-rail|fui-progress-mark|fui-progress-parts/);
  assert.match(html, /<div data-progressing="" data-slot="progress-track" class="fui-progress-track"><div [^>]*width:42%[^>]*data-slot="progress-indicator" class="fui-progress-indicator"/);
  assert.equal(attribute(html, "aria-describedby"), undefined);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" marks={[]} value={12} />), /fui-progress-rail/);
  assert.doesNotMatch(renderToStaticMarkup(<Progress aria-label="x" marks={[{ value: 5, label: "m" }]} value={12} variant="ring" />), /fui-progress-mark/);
  assert.match(renderToStaticMarkup(<Progress aria-label="x" marks={[{ value: 5, label: "m" }]} steps={4} value={50} />), /fui-progress-rail"><div [^>]*data-steps="4"/);
});

test("MarkedText: each range is a mark with a spoken prefix, a hidden number and the id of its note", () => {
  const text = "Yesterday I go home";
  const html = renderToStaticMarkup(
    <MarkedText
      dir="ltr"
      lang="en"
      ranges={[
        { start: 12, end: 14, id: "note-1" },
        { start: 15, end: 19, severity: "note" },
        { start: 0, end: 9, severity: "warning", label: "Style" },
      ]}
      text={text}
    />,
  );
  assert.match(html, /^<p data-slot="marked-text" class="fui-marked-text" dir="ltr" lang="en">/);
  assert.equal(html.replace(/<span class="fui-sr-only">[^<]*<\/span>|<sup[^>]*>[^<]*<\/sup>|<[^>]+>/g, ""), text, "without the hidden words and the numbers it is the text");
  assert.deepEqual(tags(html, /<mark [^>]*>.*?<\/mark>/g), [
    '<mark class="fui-mark" data-severity="warning"><span class="fui-sr-only">Style: </span>Yesterday<sup aria-hidden="true" class="fui-mark-number">3</sup></mark>',
    '<mark aria-describedby="note-1" class="fui-mark" data-severity="error"><span class="fui-sr-only">Mistake 1: </span>go<sup aria-hidden="true" class="fui-mark-number">1</sup></mark>',
    '<mark class="fui-mark" data-severity="note"><span class="fui-sr-only">Note 2: </span>home<sup aria-hidden="true" class="fui-mark-number">2</sup></mark>',
  ]);
  const arabic = renderToStaticMarkup(
    <MarkedText dir="rtl" labelDir="ltr" labelLang="en" labels={{ error: (number) => `Error ${number}` }} lang="ar" locale="ar-EG" ranges={[{ start: 0, end: 4 }]} text="ذهبت إلى السوق" />,
  );
  assert.match(arabic, /<span class="fui-sr-only" dir="ltr" lang="en">Error ١: <\/span>ذهبت<sup aria-hidden="true" class="fui-mark-number">١<\/sup>/);
  assert.match(renderToStaticMarkup(<MarkedText className="mine" ranges={[]} text="plain" />), /^<p data-slot="marked-text" class="fui-marked-text mine"><span>plain<\/span><\/p>$/);
});

test("AnnotationList: numbered notes with ids, what was written and what is suggested, each said in words", () => {
  const html = renderToStaticMarkup(
    <AnnotationList
      aria-label="Notes"
      items={[
        { id: "note-1", title: "Tense", before: "go", after: "went", children: "Yesterday asks for the past." },
        { severity: "warning", before: "at home" },
        { severity: "note", number: 7, children: "Nice." },
      ]}
      textDir="ltr"
      textLang="en"
    />,
  );
  assert.match(html, /^<ol data-slot="annotation-list" class="fui-annotation-list" aria-label="Notes">/);
  const items = tags(html, /<li [^>]*>/g);
  assert.deepEqual(items, ['<li class="fui-annotation" data-severity="error" id="note-1">', '<li class="fui-annotation" data-severity="warning">', '<li class="fui-annotation" data-severity="note">']);
  assert.deepEqual(tags(html, /<span aria-hidden="true" class="fui-annotation-number">[^<]*/g).map((tag) => tag.split(">")[1]), ["1", "2", "7"]);
  assert.deepEqual(tags(html, /<div class="fui-annotation-body"><span class="fui-sr-only">[^<]*/g).map((tag) => tag.split(">").pop()), ["Mistake 1. ", "Warning 2. ", "Note 7. "]);
  assert.match(
    html,
    /<p class="fui-annotation-title">Tense<\/p><p class="fui-annotation-change"><span class="fui-sr-only">Written: <\/span><bdi class="fui-annotation-fragment" data-kind="before" dir="ltr" lang="en">go<\/bdi><svg[^>]*fui-annotation-arrow[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span class="fui-sr-only">Suggested: <\/span><bdi class="fui-annotation-fragment" data-kind="after" dir="ltr" lang="en">went<\/bdi><\/p><div class="fui-annotation-note">Yesterday asks for the past\.<\/div>/,
  );
  // A passage with no suggestion is flagged, with no arrow.
  assert.match(html, /<bdi class="fui-annotation-fragment" data-kind="flag" dir="ltr" lang="en">at home<\/bdi><\/p>/);
  assert.equal(tags(html, /fui-annotation-arrow/g).length, 1);
  const translated = renderToStaticMarkup(<AnnotationList items={[{ before: "a", after: "b" }]} labels={{ error: (number) => `Fehler ${number}`, before: "Geschrieben", after: "Besser" }} locale="ar-EG" />);
  assert.match(translated, /Fehler ١\. /);
  assert.match(translated, /Geschrieben: .*Besser: /);
  assert.match(renderToStaticMarkup(<AnnotationList items={[]}><li>more</li></AnnotationList>), /<li>more<\/li><\/ol>$/);
});

test("TextDiff: del and ins with spoken prefixes, from two texts or from parts, with a legend on request", () => {
  const html = renderToStaticMarkup(<TextDiff after="I went home" before="I go home" dir="ltr" lang="en" legend />);
  assert.equal(
    html,
    '<div data-slot="text-diff" class="fui-text-diff"><p class="fui-text-diff-text" dir="ltr" lang="en"><span>I </span><del><span class="fui-sr-only">Removed: </span>go</del><ins><span class="fui-sr-only">Added: </span>went</ins><span> home</span></p><p aria-hidden="true" class="fui-text-diff-legend"><del>Removed</del><ins>Added</ins></p></div>',
  );
  const parts = renderToStaticMarkup(
    <TextDiff
      before="ignored"
      className="mine"
      labels={{ removed: "Extra", added: "Missing" }}
      parts={[
        { type: "equal", text: "caf" },
        { type: "delete", text: "e" },
        { type: "insert", text: "é" },
      ]}
    />,
  );
  assert.equal(parts, '<div data-slot="text-diff" class="fui-text-diff mine"><p class="fui-text-diff-text"><span>caf</span><del><span class="fui-sr-only">Extra: </span>e</del><ins><span class="fui-sr-only">Missing: </span>é</ins></p></div>');
  assert.equal(renderToStaticMarkup(<TextDiff after="same" before="same" />), '<div data-slot="text-diff" class="fui-text-diff"><p class="fui-text-diff-text"><span>same</span></p></div>');
  assert.equal(renderToStaticMarkup(<TextDiff />), '<div data-slot="text-diff" class="fui-text-diff"><p class="fui-text-diff-text"></p></div>');
});

// ----------------------------------------------------------------------------------------------------------- stylesheet

test("the 0.12 block is one layer block, in logical properties and tokens", () => {
  assert.equal(styles.split(BLOCK_MARK).length, 2, "one block carries the marker");
  assert.equal(block.trimEnd().endsWith("}"), true);
  let depth = 0;
  let closed = -1;
  for (let at = block.indexOf("{"); at < block.length; at += 1) {
    if (block[at] === "{") depth += 1;
    if (block[at] === "}" && --depth === 0) {
      closed = at;
      break;
    }
  }
  assert.equal(block.slice(closed + 1).replace(/\/\*[\s\S]*?\*\//g, "").trim(), "", "nothing follows the block");
  const css = block.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /(^|[\s;{])(left|right|top|bottom|width|height|min-width|max-width|min-height|max-height)\s*:/m, "sizes and sides are logical");
  assert.doesNotMatch(css, /(margin|padding|border)-(left|right|top|bottom)\b/);
  assert.doesNotMatch(css, /text-align:\s*(left|right)/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|\b(rgb|hsl|oklch)a?\(/, "no literal colour");
  assert.doesNotMatch(css, /\banimation(-name)?\s*:/, "nothing here animates on its own");
  for (const [, value] of css.matchAll(/border-radius:\s*([^;]+);/g)) assert.match(value!, /^(?:var\(--fui-radius-[a-z0-9]+\)|1px)$/, `a radius from the scale: ${value}`);
  // Every transition sits inside the reduced-motion guard.
  const guarded = media("(prefers-reduced-motion: no-preference)");
  assert.equal(css.split("transition").length, guarded.split("transition").length);
});

test("choice tiles: a pick, a verdict and a ruled-out option each have a form that does not rest on colour", () => {
  assert.match(rule(".fui-choice-option"), /min-block-size: 2\.75rem;/);
  assert.match(rule(".fui-choice-option"), /border: 1px solid var\(--fui-choice-edge\);/);
  assert.match(rule(".fui-choice-option"), /border-radius: var\(--fui-radius-md\);/);
  assert.match(rule(".fui-choice-option[data-checked]"), /--fui-choice-surface: color-mix\(in oklab, var\(--brand\) var\(--fui-tint-strength\), var\(--card\)\);/);
  assert.match(rule(".fui-choice-option[data-checked] .fui-choice-marker"), /background: var\(--brand\);/);
  assert.match(rule('.fui-choice-option[data-result="correct"]'), /var\(--success\) var\(--fui-tint-strength\).*--fui-choice-ink: var\(--fui-success-ink\);/s);
  assert.match(rule('.fui-choice-option[data-result="incorrect"]'), /var\(--destructive\) var\(--fui-tint-strength\).*--fui-choice-ink: var\(--fui-danger-ink\);/s);
  assert.match(rule('.fui-choice-option[data-result="missed"]'), /border-style: dashed;/);
  assert.match(rule(".fui-choice-option[data-ruled-out] .fui-choice-label"), /text-decoration: line-through;/);
  assert.match(rule(".fui-choice-marker"), /border-radius: var\(--fui-radius-xs\);.*font-family: var\(--fui-font-label\);/s);
  assert.match(rule(".fui-choice-state"), /inline-size: 1\.125rem;/, "the tick's room is kept, so a pick moves nothing");
  // Columns: as many as fit, never more than asked for.
  assert.match(rule(".fui-choice-group[data-columns]"), /repeat\(\s*auto-fit,/);
  assert.match(rule(".fui-choice-group[data-columns]"), /var\(--fui-choice-columns\)/);
  // Hover only where there is a pointer that hovers, and not on a group that can no longer change.
  assert.match(media("(hover: hover)"), /\.fui-choice-group:not\(\[data-readonly\]\) \.fui-choice-option:not\(\[data-disabled\], \[data-checked\]\):hover/);
  assert.match(media("(pointer: coarse)"), /\.fui-choice-group\[data-size="sm"\] \.fui-choice-option \{\s*min-block-size: 2\.75rem;/);
  const forced = media("(forced-colors: active)");
  assert.match(forced, /\.fui-choice-option\[data-checked\] \{\s*border: 2px solid Highlight;/);
  assert.match(forced, /\.fui-choice-option\[data-checked\] \.fui-choice-marker \{\s*forced-color-adjust: none;\s*border-color: Highlight;\s*background: Highlight;\s*color: HighlightText;/);
  assert.match(forced, /\.fui-choice-option\[data-result="correct"\] \{\s*border: 2px solid CanvasText;/);
  assert.match(forced, /\.fui-choice-option\[data-result="incorrect"\] \{\s*border: 3px double CanvasText;/);
  assert.match(forced, /\.fui-choice-option\[data-result="missed"\] \{\s*border: 2px dashed CanvasText;/);
  assert.doesNotMatch(forced, /var\(--/, "only system colours in forced colors");
});

test("the card and its ratings: the empty live region takes no gap, keys go where nothing hovers, targets reach 44 px", () => {
  assert.match(rule(".fui-reveal-card"), /border-radius: var\(--fui-radius-plate\);/);
  assert.match(rule(".fui-reveal-card-back:empty"), /margin-block-end: calc\(-1 \* var\(--fui-reveal-gap\)\);/);
  assert.doesNotMatch(rule(".fui-reveal-card-back:empty"), /display: none/, "a live region that is not rendered announces nothing");
  assert.match(rule(".fui-reveal-card-show"), /min-block-size: var\(--fui-control-height-lg\);/);
  assert.match(rule(".fui-rating"), /min-block-size: var\(--fui-control-height-lg\);/);
  assert.match(rule(".fui-rating-bar"), /container: fui-rating-bar \/ inline-size;/);
  assert.match(block, /@container fui-rating-bar \(max-width: 22rem\) \{[^@]*\.fui-rating-hint \{\s*display: none;/);
  const touch = media("(hover: none)");
  assert.match(touch, /\.fui-rating-key,\s*\.fui-reveal-card-key \{\s*display: none;/);
  assert.match(media("(pointer: coarse)", ".fui-rating-key,"), /\.fui-rating \{\s*min-block-size: 2\.75rem;/);
  assert.match(rule('.fui-rating[aria-disabled="true"]'), /cursor: not-allowed;/);
});

test("step controls: the play key shows its word, the chevrons turn with the page, a pressed speed has a bar in forced colors", () => {
  assert.match(rule(".fui-step-controls-play .fui-toolbar-label"), /position: static;.*clip-path: none;/s);
  assert.match(rule(".fui-step-controls .fui-button.fui-step-controls-play"), /aspect-ratio: auto;/);
  assert.match(rule(".fui-step-controls-chevron:dir(rtl)"), /transform: scaleX\(-1\);/);
  assert.match(rule(".fui-step-controls-count"), /font-family: var\(--fui-font-label\);.*font-size: var\(--fui-text-label\);.*font-variant-numeric: tabular-nums;/s);
  assert.match(rule(".fui-step-controls-speeds"), /margin-inline-start: auto;/);
  assert.match(media("(forced-colors: active)"), /\.fui-step-controls-speed\[aria-pressed="true"\]::after \{[^}]*background: Highlight;/);
});

test("progress parts and marks: states read apart without colour, buttons are targets, marks are placed from the start", () => {
  assert.match(rule(".fui-progress-part::before"), /inset-block: calc\(50% - var\(--fui-progress-thickness\) \/ 2 - var\(--fui-progress-part-rise\)\);.*background: var\(--border\);/s);
  assert.match(rule('.fui-progress-part[data-state="done"]::before'), /background: var\(--fui-progress-fill\);/);
  assert.match(rule('.fui-progress-part[data-state="correct"]::before'), /background: var\(--success\);/);
  const incorrect = rule('.fui-progress-part[data-state="incorrect"]::before');
  const skipped = rule('.fui-progress-part[data-state="skipped"]::before');
  assert.match(incorrect, /repeating-linear-gradient\(90deg, var\(--destructive\) 0 0\.375rem, transparent/);
  assert.match(skipped, /repeating-linear-gradient\(90deg, var\(--muted-foreground\) 0 0\.125rem, transparent/);
  assert.match(rule('.fui-progress-part[data-state="current"]'), /--fui-progress-part-rise: 2px;/);
  assert.match(rule('.fui-progress-part[data-state="current"]::before'), /border: 1\.5px solid var\(--foreground\);/);
  assert.match(rule("button.fui-progress-part"), /block-size: 1\.5rem;/);
  assert.match(media("(pointer: coarse)", "button.fui-progress-part:hover"), /button\.fui-progress-part \{\s*block-size: 2\.75rem;/);
  assert.match(rule(".fui-progress-mark"), /inset-inline-start: var\(--fui-progress-mark-at\);.*inline-size: 0;/s);
  assert.match(rule(".fui-progress-mark-tick"), /block-size: calc\(var\(--fui-progress-thickness\) \+ 0\.375rem\);/);
  assert.match(rule('.fui-progress-mark[data-align="start"] .fui-progress-mark-caption'), /align-self: flex-start;/);
  assert.match(rule('.fui-progress-mark[data-align="end"] .fui-progress-mark-caption'), /align-self: flex-end;/);
  assert.match(rule(".fui-progress-rail[data-captions]"), /padding-block-end:/);
  const forced = media("(forced-colors: active)");
  assert.match(forced, /\.fui-progress-part:is\(\[data-state="done"\], \[data-state="correct"\]\)::before \{\s*background: Highlight;/);
  assert.match(forced, /\.fui-progress-part\[data-state="incorrect"\]::before \{\s*forced-color-adjust: none;[^}]*repeating-linear-gradient\(90deg, CanvasText/);
  assert.match(forced, /\.fui-progress-part\[data-state="current"\]::before \{\s*border: 2px solid Highlight;/);
  assert.match(forced, /\.fui-progress-mark-tick \{\s*background: CanvasText;/);
});

test("marks, notes and diffs: the line's style is the severity, and a removal and an addition differ by their line", () => {
  assert.match(rule(".fui-mark"), /text-decoration: underline solid var\(--fui-marked-ink\) 2px;/);
  assert.match(rule('.fui-mark[data-severity="warning"]'), /text-decoration-style: dashed;/);
  assert.match(rule('.fui-mark[data-severity="note"]'), /text-decoration-style: dotted;/);
  assert.doesNotMatch(rule(".fui-mark-number"), /display: inline-block/, "an inline number cannot wrap away from its word");
  assert.match(rule('.fui-annotation[data-severity="warning"] .fui-annotation-number'), /border-style: dashed;/);
  assert.match(rule('.fui-annotation[data-severity="note"] .fui-annotation-number'), /border-style: dotted;/);
  assert.match(rule('.fui-annotation-fragment[data-kind="before"]'), /text-decoration: line-through;/);
  assert.match(rule('.fui-annotation-fragment[data-kind="after"]'), /text-decoration: underline;/);
  assert.match(rule(".fui-annotation-arrow:dir(rtl)"), /transform: scaleX\(-1\);/);
  assert.match(rule(".fui-text-diff del"), /text-decoration: line-through;/);
  assert.match(rule(".fui-text-diff ins"), /text-decoration: underline 2px;/);
  assert.match(media("(forced-colors: active)"), /\.fui-mark \{\s*background: Mark;\s*color: MarkText;/);
});
