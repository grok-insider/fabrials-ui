// The state of a step player, as a pure reducer: no clock and no DOM, so every move can be tested. `useStepPlayer`
// (step-controls.tsx) runs it against a timer.

export type StepPlayerState = {
  /** The step shown, from 0. */
  index: number;
  playing: boolean;
  /** A multiplier of the pace: 2 is twice as fast. */
  speed: number;
};

export type StepPlayerAction =
  | { type: "next" }
  | { type: "previous" }
  | { type: "goTo"; index: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "restart" }
  | { type: "tick" }
  | { type: "setSpeed"; speed: number };

export type StepPlayerOptions = {
  /** How many steps there are. */
  count: number;
  /** After the last step, playing goes on from the first. */
  loop?: boolean;
};

/** The last step, from 0. With no steps it is 0. */
export function lastStep(count: number): number {
  return Math.max(0, Math.floor(Number.isFinite(count) ? count : 0) - 1);
}

/** A step that exists: whole, from 0 to the last. Not a number is the first step. */
export function clampStep(index: number, count: number): number {
  if (Number.isNaN(index)) return 0;
  return Math.min(lastStep(count), Math.max(0, Math.trunc(index)));
}

/** The wait before the next step while playing: the interval divided by the speed, never under 16 ms. */
export function stepDelay(interval: number, speed: number): number {
  const pace = Number.isFinite(speed) && speed > 0 ? speed : 1;
  const base = Number.isFinite(interval) && interval > 0 ? interval : 0;
  return Math.max(16, base / pace);
}

const same = (state: StepPlayerState, index: number, playing: boolean, speed = state.speed): StepPlayerState =>
  state.index === index && state.playing === playing && state.speed === speed ? state : { index, playing, speed };

/**
 * A step by hand (next, previous, goTo) pauses, as a frame step does in a video: the reader has taken over; it stops at the
 * ends and never goes round. Play at the end starts again from the first step; a tick on the last step stops there, or goes
 * round with `loop`. One step, or none, never plays.
 */
export function stepPlayerReducer(state: StepPlayerState, action: StepPlayerAction, { count, loop = false }: StepPlayerOptions): StepPlayerState {
  const last = lastStep(count);
  const index = clampStep(state.index, count);
  const playable = last > 0;
  switch (action.type) {
    case "next":
      return same(state, Math.min(last, index + 1), false);
    case "previous":
      return same(state, Math.max(0, index - 1), false);
    case "goTo":
      return same(state, clampStep(action.index, count), false);
    case "play":
      if (!playable) return same(state, index, false);
      return same(state, index >= last && !loop ? 0 : index, true);
    case "pause":
      return same(state, index, false);
    case "toggle":
      return stepPlayerReducer(state, { type: state.playing ? "pause" : "play" }, { count, loop });
    case "restart":
      return same(state, 0, false);
    case "tick":
      if (!state.playing) return same(state, index, false);
      if (!playable) return same(state, index, false);
      if (index >= last) return loop ? same(state, 0, true) : same(state, last, false);
      return same(state, index + 1, loop || index + 1 < last);
    case "setSpeed":
      return Number.isFinite(action.speed) && action.speed > 0 ? same(state, index, state.playing, action.speed) : same(state, index, state.playing);
  }
}
