// The pure part of the clip player: what is on, what failed and why, and which late answers no longer count. No React and no
// browser, so every transition is tested alone.

/** The name of a rendering of a clip. The host decides what "slow" is; the player only asks for it by name. */
export type ClipSpeed = "normal" | "slow" | (string & {});

export type ClipFailureKind = "unavailable" | "rateLimited" | "quota" | "offline" | "failed";

/** Why a clip did not play, and whether asking again can help. */
export type ClipFailure = { kind: ClipFailureKind; retryable: boolean };

/**
 * What a loader throws to say why there is no clip: `unavailable` (no voice for this), `rateLimited` (wait a moment),
 * `quota` (the allowance is spent: not asked for again), `offline`, `failed`.
 */
export class ClipError extends Error {
  readonly kind: ClipFailureKind;
  constructor(kind: ClipFailureKind, message?: string) {
    super(message ?? `clip ${kind}`);
    this.name = "ClipError";
    this.kind = kind;
  }
}

/** Not when there is no voice and not when the allowance is spent: the same request would fail the same way. */
export const clipRetryable = (kind: ClipFailureKind): boolean => kind !== "unavailable" && kind !== "quota";

export const clipFailure = (kind: ClipFailureKind): ClipFailure => ({ kind, retryable: clipRetryable(kind) });

const nameOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "name" in error ? String((error as { name: unknown }).name) : "";

/**
 * What a rejected load means. `null` when it is nothing to tell: the player gave the load up itself (`aborted`). A
 * `ClipError` says its own kind; without a connection anything else is `offline`; the rest is `failed`.
 */
export function classifyClipFailure(error: unknown, context: { online?: boolean; aborted?: boolean } = {}): ClipFailure | null {
  if (error instanceof ClipError) return clipFailure(error.kind);
  if (context.aborted && nameOf(error) === "AbortError") return null;
  if (context.online === false) return clipFailure("offline");
  return clipFailure("failed");
}

/** The kind an HTTP answer usually means, for a loader built on a request: 503 no voice, 429 a wait (or the allowance, when the host says so). */
export function clipFailureOfStatus(status: number, options: { quota?: boolean } = {}): ClipFailureKind {
  if (status === 503 || status === 404 || status === 501) return "unavailable";
  if (status === 429) return options.quota ? "quota" : "rateLimited";
  return "failed";
}

export const clipKey = (ref: string, speed: ClipSpeed): string => `${ref}\u0000${speed}`;

export type ClipPhase = "idle" | "loading" | "playing";

export type ClipState = {
  /** Counts requests: an answer that carries an older number has been overtaken. */
  turn: number;
  speed: ClipSpeed;
  now: { ref: string; speed: ClipSpeed; phase: "loading" | "playing" } | null;
  /** The clip asked for last that did not play. */
  failed: { ref: string; speed: ClipSpeed; failure: ClipFailure } | null;
  /** The clips heard at least once. */
  played: ReadonlySet<string>;
  /** The clips refused for the allowance: not asked for again while the player lives. */
  spent: ReadonlySet<string>;
};

export type ClipEvent =
  | { type: "request"; ref: string; speed: ClipSpeed }
  | { type: "playing"; turn: number }
  | { type: "ended"; turn: number }
  | { type: "failed"; turn: number; ref: string; speed: ClipSpeed; failure: ClipFailure }
  | { type: "stop" }
  | { type: "speed"; speed: ClipSpeed };

export const initialClipState = (speed: ClipSpeed = "normal"): ClipState => ({
  turn: 0,
  speed,
  now: null,
  failed: null,
  played: new Set(),
  spent: new Set(),
});

const with1 = (set: ReadonlySet<string>, value: string): ReadonlySet<string> => (set.has(value) ? set : new Set(set).add(value));

export function clipReducer(state: ClipState, event: ClipEvent): ClipState {
  switch (event.type) {
    case "request": {
      const turn = state.turn + 1;
      if (state.spent.has(clipKey(event.ref, event.speed)))
        return { ...state, turn, now: null, failed: { ref: event.ref, speed: event.speed, failure: clipFailure("quota") } };
      return { ...state, turn, now: { ref: event.ref, speed: event.speed, phase: "loading" }, failed: null };
    }
    case "playing":
      if (event.turn !== state.turn || !state.now) return state;
      return { ...state, now: { ...state.now, phase: "playing" }, played: with1(state.played, state.now.ref) };
    case "ended":
      if (event.turn !== state.turn || !state.now) return state;
      return { ...state, now: null };
    case "failed": {
      // A spent allowance is remembered even when the answer came late: the clip is not asked for again either way.
      const spent = event.failure.kind === "quota" ? with1(state.spent, clipKey(event.ref, event.speed)) : state.spent;
      if (event.turn !== state.turn) return spent === state.spent ? state : { ...state, spent };
      return { ...state, spent, now: null, failed: { ref: event.ref, speed: event.speed, failure: event.failure } };
    }
    case "stop":
      if (!state.now) return state;
      return { ...state, turn: state.turn + 1, now: null };
    case "speed":
      if (event.speed === state.speed) return state;
      return { ...state, turn: state.now ? state.turn + 1 : state.turn, now: null, speed: event.speed };
  }
}

export const clipPhase = (state: ClipState, ref: string): ClipPhase => (state.now?.ref === ref ? state.now.phase : "idle");

/** The failure to show under `ref`, or under the clip asked for last when no clip is named. */
export const clipFailureFor = (state: ClipState, ref?: string): ClipFailure | null =>
  state.failed && (ref === undefined || state.failed.ref === ref) ? state.failed.failure : null;
