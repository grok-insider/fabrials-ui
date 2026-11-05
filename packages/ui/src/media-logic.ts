/**
 * The gestures of the media viewer and the player, apart from the DOM so each rule can be tested. Assimilated from X
 * Tracker's viewer (zoom-logic) and player (player-logic), where they ran in production first.
 */

/** Two touches must move this much apart (or together) before it is a pinch and not a shaky tap. */
export const PINCH_IN = 1.25;
export const PINCH_OUT = 0.8;
/** A press that moves less than this many pixels is a click. */
export const DRAG_SLOP = 4;
/** A horizontal swipe on a fitted image must travel this far to move to the next one. */
export const SWIPE_DISTANCE = 48;

export type ZoomIntent = "in" | "out" | null;

/**
 * A wheel over the image: scrolling up (or a trackpad pinch spreading, which browsers send as Ctrl + wheel with a negative
 * delta) brings it to its real size; a pinch closing (Ctrl + wheel, positive) fits it again. A plain wheel at real size
 * scrolls the stage, so it never means "out": leaving by accident while looking around would be a trap.
 */
export function wheelIntent(event: { deltaY: number; ctrlKey: boolean }, zoomed: boolean): ZoomIntent {
  if (event.deltaY === 0) return null;
  if (!zoomed) return event.deltaY < 0 ? "in" : null;
  return event.ctrlKey && event.deltaY > 0 ? "out" : null;
}

/** Two fingers: how far apart they were when they landed, and how far apart they are now. */
export function pinchIntent(startDistance: number, distance: number, zoomed: boolean): ZoomIntent {
  if (!(startDistance > 0) || !Number.isFinite(distance)) return null;
  const ratio = distance / startDistance;
  if (!zoomed && ratio >= PINCH_IN) return "in";
  if (zoomed && ratio <= PINCH_OUT) return "out";
  return null;
}

/** Whether a pointer that went down at `from` and is now at `to` has been dragged. */
export const isDrag = (from: { x: number; y: number }, to: { x: number; y: number }): boolean => Math.hypot(to.x - from.x, to.y - from.y) > DRAG_SLOP;

/** A finished horizontal swipe: 1 for the next item, -1 for the previous, 0 for neither (in reading order). */
export function swipeStep(from: { x: number; y: number }, to: { x: number; y: number }, rtl = false): -1 | 0 | 1 {
  const dx = to.x - from.x;
  if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(to.y - from.y) * 1.5) return 0;
  const step = dx < 0 ? 1 : -1;
  return (rtl ? -step : step) as -1 | 1;
}

/** The point of the fitted image that was pointed at, as fractions (0-1) of its width and height; the middle without one. */
export function focusOf(box: { left: number; top: number; width: number; height: number }, at?: { x: number; y: number }): { fx: number; fy: number } {
  if (!at || box.width <= 0 || box.height <= 0) return { fx: 0.5, fy: 0.5 };
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  return { fx: clamp01((at.x - box.left) / box.width), fy: clamp01((at.y - box.top) / box.height) };
}

/**
 * Where the stage scrolls when the image grows to its real size: the focused point goes to the middle of the stage, kept
 * inside what can be scrolled (an image smaller than the stage does not scroll, and the stage centres it).
 */
export function scrollForFocus(
  focus: { fx: number; fy: number },
  content: { left: number; top: number; width: number; height: number },
  stage: { width: number; height: number },
): { left: number; top: number } {
  const limit = (value: number, end: number, view: number) => Math.min(Math.max(0, end - view), Math.max(0, value));
  return {
    left: limit(content.left + focus.fx * content.width - stage.width / 2, content.left + content.width, stage.width),
    top: limit(content.top + focus.fy * content.height - stage.height / 2, content.top + content.height, stage.height),
  };
}

/** How far the arrows and Page keys move a zoomed image: a tenth of the stage, or most of it for a page. */
export function panDelta(key: string, stage: { width: number; height: number }): { dx: number; dy: number } | null {
  const step = { x: Math.round(stage.width / 10), y: Math.round(stage.height / 10) };
  switch (key) {
    case "ArrowLeft":
      return { dx: -step.x, dy: 0 };
    case "ArrowRight":
      return { dx: step.x, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: -step.y };
    case "ArrowDown":
      return { dx: 0, dy: step.y };
    case "PageUp":
      return { dx: 0, dy: -Math.round(stage.height * 0.9) };
    case "PageDown":
      return { dx: 0, dy: Math.round(stage.height * 0.9) };
    default:
      return null;
  }
}

/** The playback rates the player offers. */
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A time as the player writes it: m:ss, or h:mm:ss past an hour. Unknown is 0:00. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** A time as a screen reader should say it ("1 minute 5 seconds"), for the seek bar's aria-valuetext. English by default. */
export function spokenClock(seconds: number, units = { hour: ["hour", "hours"], minute: ["minute", "minutes"], second: ["second", "seconds"] }): string {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const parts: string[] = [];
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  if (h) parts.push(`${h} ${units.hour[h === 1 ? 0 : 1]}`);
  if (m) parts.push(`${m} ${units.minute[m === 1 ? 0 : 1]}`);
  if (s || parts.length === 0) parts.push(`${s} ${units.second[s === 1 ? 0 : 1]}`);
  return parts.join(" ");
}

/** The end of the buffered range that holds the playhead, so the bar shows what is loaded around the current time. */
export function bufferedEnd(ranges: { length: number; start: (index: number) => number; end: (index: number) => number }, time: number): number {
  for (let index = 0; index < ranges.length; index += 1) if (ranges.start(index) <= time + 0.5 && ranges.end(index) >= time) return ranges.end(index);
  return ranges.length ? ranges.end(ranges.length - 1) : 0;
}

/** The next speed up or down the list, staying at its ends. */
export function stepSpeed(current: number, direction: 1 | -1): number {
  const index = SPEEDS.findIndex((speed) => speed >= current - 1e-6);
  const at = index < 0 ? SPEEDS.length - 1 : index;
  return SPEEDS[clamp(at + direction, 0, SPEEDS.length - 1)]!;
}

export type PlayerAction =
  | { type: "toggle" }
  | { type: "seek"; by: number }
  | { type: "seekTo"; percent: number }
  | { type: "volume"; by: number }
  | { type: "mute" }
  | { type: "fullscreen" }
  | { type: "captions" }
  | { type: "speed"; direction: 1 | -1 };

/**
 * What a key does to the player, as YouTube and the browsers have taught people: Space or K plays and pauses, J and L or
 * the arrows seek, Up and Down change the volume, M mutes, F fills the screen, C shows the captions, < and > change the
 * speed, Home, End and 0 to 9 jump. Null leaves the key to the page.
 */
export function keyAction(key: string, options: { seekStep?: number; audio?: boolean } = {}): PlayerAction | null {
  const step = options.seekStep ?? 5;
  switch (key) {
    case " ":
    case "k":
    case "K":
      return { type: "toggle" };
    case "ArrowLeft":
      return { type: "seek", by: -step };
    case "ArrowRight":
      return { type: "seek", by: step };
    case "j":
    case "J":
      return { type: "seek", by: -10 };
    case "l":
    case "L":
      return { type: "seek", by: 10 };
    case "ArrowUp":
      return { type: "volume", by: 0.1 };
    case "ArrowDown":
      return { type: "volume", by: -0.1 };
    case "m":
    case "M":
      return { type: "mute" };
    case "f":
    case "F":
      return options.audio ? null : { type: "fullscreen" };
    case "c":
    case "C":
      return options.audio ? null : { type: "captions" };
    case "<":
      return { type: "speed", direction: -1 };
    case ">":
      return { type: "speed", direction: 1 };
    case "Home":
      return { type: "seekTo", percent: 0 };
    case "End":
      return { type: "seekTo", percent: 100 };
    default:
      return /^[0-9]$/.test(key) ? { type: "seekTo", percent: Number(key) * 10 } : null;
  }
}
