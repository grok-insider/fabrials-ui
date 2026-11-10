// Origin: Fabrials, 0.12. The behaviour of Radiant's conversation (stay at the end while an answer arrives, let go the moment
// the reader scrolls away), written as plain functions with no dependency. No directive: nothing here touches the DOM.

/** What a scroll container says about itself: where it is, how tall its content is and how much of it shows. */
export type ConversationMetrics = { scrollTop: number; scrollHeight: number; clientHeight: number };

export type ConversationAnchor = "end" | "start";

/** How near the end still counts as being there, in px. */
export const END_THRESHOLD = 48;

// Scroll positions are fractions of a pixel on a dense screen: within one pixel of a place is that place.
const EXACT = 1;
// A line of text: a layout that settles moves the view less than this, and a hand that scrolls moves it more.
const LINE = 24;

/** The last scroll position there is. */
export function endOf(metrics: ConversationMetrics): number {
  return Math.max(0, metrics.scrollHeight - metrics.clientHeight);
}

/** How far the view is from the end; never negative (a rubber band past the end is the end). */
export function distanceToEnd(metrics: ConversationMetrics): number {
  return Math.max(0, endOf(metrics) - metrics.scrollTop);
}

export function overflows(metrics: ConversationMetrics): boolean {
  return metrics.scrollHeight - metrics.clientHeight > 0.5;
}

export type LockState = {
  anchor: ConversationAnchor;
  threshold: number;
  /** Following the end: growth keeps the end in view. Only ever true with `anchor: "end"`. */
  locked: boolean;
  /** Within the threshold of the end, or following it. */
  atEnd: boolean;
  /** The reader holds a selection inside the conversation: nothing locks by itself while they do. */
  selecting: boolean;
  /** The last scroll position seen or set. */
  top: number;
  /** The last content height seen. */
  height: number;
  /** Where our own scroll put the view: the scroll event that reads this position is ours, not the reader's. */
  expected: number | null;
  /** How many items the conversation holds, and how many of them the reader has been at the end for. */
  items: number;
  seen: number;
  /** Items that arrived while the reader was away, and whether anything at all did. */
  unread: number;
  hasNew: boolean;
};

export type LockEvent =
  /** The content changed size (a token, a message, a picture that loaded). */
  | { type: "grow"; metrics: ConversationMetrics; items: number }
  /** The viewport changed size (the window, an on-screen keyboard, a composer that grew). */
  | { type: "resize"; metrics: ConversationMetrics }
  /** A scroll event, ours or the reader's. */
  | { type: "scroll"; metrics: ConversationMetrics }
  /** The reader starts to move away from the end: a wheel up, a drag, PageUp. Known before any scroll event. */
  | { type: "intent"; metrics: ConversationMetrics }
  /** A selection inside the conversation begins or ends. */
  | { type: "select"; active: boolean; metrics: ConversationMetrics }
  /** The host or the reader asks for the end: a message sent, the jump key. */
  | { type: "stick" }
  /** A jump to a message begins: the end is no longer followed. */
  | { type: "leave" }
  /** Our own scroll put the view at `top`; `changed` is false when it was there already (no scroll event will come). */
  | { type: "moved"; top: number; changed: boolean }
  | { type: "configure"; anchor: ConversationAnchor; threshold: number; metrics: ConversationMetrics };

export type LockStep = {
  state: LockState;
  /** What the caller must do now: put the view at the end. */
  scroll: "end" | null;
  /** The event was the reader's own movement (it cancels a scroll of ours that is under way). */
  user: boolean;
};

export function initialLock(options: {
  anchor?: ConversationAnchor;
  threshold?: number;
  metrics: ConversationMetrics;
  items?: number;
}): LockState {
  const { anchor = "end", threshold = END_THRESHOLD, metrics, items = 0 } = options;
  const locked = anchor === "end";
  return {
    anchor,
    threshold,
    locked,
    // Following the end is being there: the attach puts the view at the end before the first paint.
    atEnd: locked || distanceToEnd(metrics) <= threshold,
    selecting: false,
    top: locked ? endOf(metrics) : metrics.scrollTop,
    height: metrics.scrollHeight,
    expected: null,
    items,
    seen: items,
    unread: 0,
    hasNew: false,
  };
}

/** The reader is where new content shows: following the end, or (in a transcript read from the top) at its end. */
function present(state: LockState): boolean {
  return state.anchor === "end" ? state.locked : state.atEnd;
}

function count(state: LockState): LockState {
  if (present(state)) return { ...state, seen: state.items, unread: 0, hasNew: false };
  return { ...state, unread: Math.max(0, state.items - state.seen) };
}

const mayLock = (state: LockState) => state.anchor === "end" && !state.selecting;

/**
 * The lock as a reducer. `locked` starts true and means growth is followed; the reader's own movement away unlocks at
 * once, and only their return to the end (or `stick`) locks again. Our own scrolls are recognised by the position they
 * were sent to, so they are never mistaken for the reader's.
 */
export function conversationStep(state: LockState, event: LockEvent): LockStep {
  switch (event.type) {
    case "grow": {
      const distance = distanceToEnd(event.metrics);
      const grew = event.metrics.scrollHeight > state.height + 0.5;
      const next = { ...state, height: event.metrics.scrollHeight, items: event.items };
      if (state.locked) return { state: count({ ...next, atEnd: true }), scroll: distance > 0.5 ? "end" : null, user: false };
      const locked = mayLock(state) && distance <= EXACT;
      return {
        state: count({ ...next, locked, atEnd: locked || distance <= state.threshold, hasNew: state.hasNew || grew }),
        scroll: null,
        user: false,
      };
    }
    case "resize": {
      const distance = distanceToEnd(event.metrics);
      const next = { ...state, height: event.metrics.scrollHeight };
      if (state.locked) return { state: count({ ...next, atEnd: true }), scroll: distance > 0.5 ? "end" : null, user: false };
      return { state: count({ ...next, atEnd: distance <= state.threshold }), scroll: null, user: false };
    }
    case "scroll": {
      const top = event.metrics.scrollTop;
      const own = state.expected !== null && Math.abs(top - state.expected) <= EXACT;
      const delta = top - state.top;
      const distance = distanceToEnd(event.metrics);
      const within = distance <= state.threshold;
      const next = { ...state, top, height: event.metrics.scrollHeight, expected: null };
      // At the very end the view follows again, however it got there.
      if (distance <= EXACT) {
        const locked = state.locked || mayLock(state);
        return { state: count({ ...next, locked, atEnd: true }), scroll: null, user: !own };
      }
      if (own) return { state: count({ ...next, atEnd: state.locked || within }), scroll: null, user: false };
      // A pixel of rounding in the layout is not a hand on the wheel.
      if (Math.abs(delta) <= EXACT) return { state: count({ ...next, atEnd: state.locked || within }), scroll: null, user: false };
      // Neither is the view moving a little because the content it sits in shrank as it settled (a font, a picture): a hand
      // that scrolls also says so through its wheel, its finger or its key, before any scroll event arrives.
      if (delta < 0 && Math.abs(delta) <= LINE && event.metrics.scrollHeight !== state.height)
        return { state: count({ ...next, atEnd: state.locked || within }), scroll: null, user: false };
      if (delta < 0) return { state: count({ ...next, locked: false, atEnd: within }), scroll: null, user: true };
      // Coming back: inside the threshold is close enough, and the view settles on the end.
      if (delta > 0 && within && mayLock(state)) return { state: count({ ...next, locked: true, atEnd: true }), scroll: "end", user: true };
      return { state: count({ ...next, atEnd: state.locked || within }), scroll: null, user: delta !== 0 };
    }
    case "intent": {
      // Nothing above to go to: the gesture moves nothing, so it lets go of nothing.
      if (event.metrics.scrollTop <= 0) return { state, scroll: null, user: false };
      const within = distanceToEnd(event.metrics) <= state.threshold;
      return { state: count({ ...state, locked: false, expected: null, atEnd: within }), scroll: null, user: true };
    }
    case "select": {
      const distance = distanceToEnd(event.metrics);
      if (event.active) {
        return { state: count({ ...state, selecting: true, locked: false, atEnd: distance <= state.threshold }), scroll: null, user: true };
      }
      const locked = state.locked || (state.anchor === "end" && distance <= EXACT);
      return { state: count({ ...state, selecting: false, locked, atEnd: locked || distance <= state.threshold }), scroll: null, user: false };
    }
    case "stick":
      return { state: count({ ...state, locked: state.anchor === "end", atEnd: true }), scroll: "end", user: false };
    case "leave":
      return { state: count({ ...state, locked: false, expected: null }), scroll: null, user: false };
    case "moved":
      return { state: { ...state, top: event.top, expected: event.changed ? event.top : null }, scroll: null, user: false };
    case "configure": {
      const distance = distanceToEnd(event.metrics);
      const locked = event.anchor === "end" && (state.locked || distance <= EXACT);
      const next = { ...state, anchor: event.anchor, threshold: event.threshold, locked };
      return { state: count({ ...next, atEnd: locked || distance <= event.threshold }), scroll: null, user: false };
    }
  }
}

/** Keys that scroll a focused region toward its start. */
export function scrollsAway(key: string, shift = false): boolean {
  return key === "PageUp" || key === "ArrowUp" || key === "Home" || (key === " " && shift);
}

/** A finger that has travelled down the screen drags the content toward its start. */
export function dragsAway(startY: number, currentY: number, slop = 6): boolean {
  return currentY - startY > slop;
}

/**
 * One frame of a scroll of ours toward `target`, `elapsed` ms after the last: most of what is left in about a quarter of
 * a second whatever the distance, never slower than a third of a pixel per millisecond, and it follows a target that moves.
 */
export function chaseStep(current: number, target: number, elapsed: number): number {
  const left = target - current;
  const far = Math.abs(left);
  if (far <= 0.5) return target;
  const time = Math.max(0, elapsed);
  const eased = far * (1 - Math.exp(-time / 70));
  const least = Math.max(1, time * 0.3);
  return current + Math.sign(left) * Math.min(far, Math.max(eased, least));
}

export type JumpAlign = "start" | "center" | "end";

/** Where to scroll so an element `start` px into the content and `size` px tall sits at the top, the middle or the bottom. */
export function jumpTarget(options: {
  start: number;
  size: number;
  metrics: ConversationMetrics;
  align?: JumpAlign;
  /** The air left between the element and the edge it is brought to. */
  offset?: number;
}): number {
  const { start, size, metrics, align = "start", offset = 16 } = options;
  const wanted =
    align === "start"
      ? start - offset
      : align === "end"
        ? start + size - metrics.clientHeight + offset
        : start - (metrics.clientHeight - size) / 2;
  return Math.min(endOf(metrics), Math.max(0, wanted));
}

/** The line a reader's eye is on, in px below the top of the viewport. */
export function readingLine(clientHeight: number): number {
  return Math.min(96, Math.max(0, clientHeight) / 4);
}

/**
 * The checkpoint being read: the last whose top is at or above the reading line, the first while none is, and the last one
 * at the end (it may never reach the line). `topOf` gives a checkpoint's top relative to the viewport; tops must rise with
 * the index, and only about log2(count) of them are read. -1 without checkpoints.
 */
export function activeCheckpoint(count: number, topOf: (index: number) => number, line: number, atEnd = false): number {
  if (count <= 0) return -1;
  if (atEnd) return count - 1;
  let low = 0;
  let high = count - 1;
  let found = 0;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (topOf(middle) <= line) {
      found = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  return found;
}

export const RAIL_SHARE = 0.7;
export const MARKER_SLOT = 22;
export const MARKER_SLOT_MIN = 3;

/** The most a rail may take of a viewport `viewport` px tall. */
export function railLimit(viewport: number): number {
  return Math.max(0, Math.floor(viewport * RAIL_SHARE));
}

/**
 * The height of one marker's slot, in whole px: 22 while the rail fits in its share of the viewport, less as the markers
 * pack, never under 3 (past that the rail scrolls inside its limit). An unmeasured viewport gives the full slot.
 */
export function markerSlot(count: number, viewport: number): number {
  if (count <= 0 || viewport <= 0) return MARKER_SLOT;
  return Math.max(MARKER_SLOT_MIN, Math.min(MARKER_SLOT, Math.floor(railLimit(viewport) / count)));
}

/** Where the arrow keys, Home and End take focus in a column of `count` markers; null for any other key. No wrapping. */
export function rovingTarget(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  if (key === "ArrowDown") return Math.min(count - 1, index + 1);
  if (key === "ArrowUp") return Math.max(0, index - 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

/** A message's text as one line for a marker's preview: white space collapsed, cut at `max` characters with an ellipsis. */
export function checkpointLabel(text: string, max = 140): string {
  const line = text.replace(/\s+/g, " ").trim();
  const characters = Array.from(line);
  if (characters.length <= max) return line;
  return `${characters.slice(0, max - 1).join("").trimEnd()}…`;
}

const plural = new Intl.PluralRules("en");

export type ConversationScrollButtonLabels = {
  /** The key's name. */
  jump: string;
  /** Its name when `count` items arrived while the reader was away. */
  unread: (count: number) => string;
  /** Its name when something arrived that is not a whole item (an answer that kept growing). */
  fresh: string;
};

export const SCROLL_BUTTON_LABELS: ConversationScrollButtonLabels = {
  jump: "Jump to latest",
  unread: (count) => `Jump to latest, ${count} new ${plural.select(count) === "one" ? "message" : "messages"}`,
  fresh: "Jump to latest, new content",
};

export type ConversationCheckpointsLabels = {
  /** The rail's name. */
  rail: string;
  /** "Message 3 of 12": the first line of a marker's preview. */
  position: (index: number, count: number) => string;
  /** A marker's name: its place and what the message says. `preview` is empty for a message without text. */
  jump: (index: number, count: number, preview: string) => string;
};

export const CHECKPOINT_LABELS: ConversationCheckpointsLabels = {
  rail: "Your messages",
  position: (index, count) => `Message ${index} of ${count}`,
  jump: (index, count, preview) => (preview ? `Jump to message ${index} of ${count}: ${preview}` : `Jump to message ${index} of ${count}`),
};

/** The name of the jump key for what is waiting at the end. */
export function scrollButtonName(labels: ConversationScrollButtonLabels, unread: number, hasNew: boolean): string {
  if (unread > 0) return labels.unread(unread);
  return hasNew ? labels.fresh : labels.jump;
}
