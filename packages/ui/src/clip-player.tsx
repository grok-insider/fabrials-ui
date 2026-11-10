"use client";
// Origin: Fabrials, 0.12, from Radiant's exercise audio (a clip asked for by name, loaded by the host, one at a time).

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { Square, Turtle, Volume2 } from "lucide-react";
import {
  ClipError,
  clipFailure,
  clipFailureFor,
  clipKey,
  clipPhase,
  clipReducer,
  classifyClipFailure,
  initialClipState,
  type ClipEvent,
  type ClipFailure,
  type ClipFailureKind,
  type ClipPhase,
  type ClipSpeed,
  type ClipState,
} from "./clip-logic";
import { Button, type ButtonProps } from "./controls";
import { PixelSpinner } from "./pixel-spinner";
import { classes } from "./shared";
import { claimSound, releaseSound } from "./sound-bus";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

/** Gets a clip for the player: a `Blob`, or a URL the browser can play. It throws a `ClipError` to say why there is none. */
export type ClipLoader = (ref: string, context: { speed: ClipSpeed; signal: AbortSignal }) => Promise<Blob | string>;

export type UseClipPlayerOptions = {
  load: ClipLoader;
  /** The renderings a clip has, the usual one first. The toggle moves between the first two. */
  speeds?: readonly ClipSpeed[];
  /** Keep each loaded clip while the player lives, so a replay and a change of speed cost nothing. */
  cache?: boolean;
  onError?: (failure: ClipFailure, context: { ref: string; speed: ClipSpeed; error: unknown }) => void;
};

export type ClipPlayer = {
  state: (ref: string) => ClipPhase;
  /** Whether the clip was heard at least once. */
  played: (ref: string) => boolean;
  /** Why `ref` did not play; without a clip, why the one asked for last did not. */
  failure: (ref?: string) => ClipFailure | null;
  play: (ref: string, speed?: ClipSpeed) => Promise<void>;
  stop: () => void;
  /** Plays the clip, or stops it when it is the one loading or playing. */
  toggle: (ref: string, speed?: ClipSpeed) => void;
  /** Asks again for the clip that failed, when asking again can help. Answers the clip it asked for. */
  retry: (ref?: string) => string | null;
  speed: ClipSpeed;
  speeds: readonly ClipSpeed[];
  /** Changes the speed; what is playing stops. */
  setSpeed: (speed: ClipSpeed) => void;
  /** A clip's button says where it is, so a note that goes away can hand the focus back to it. */
  register: (ref: string, element: HTMLElement | null) => () => void;
  focus: (ref: string) => boolean;
};

const DEFAULT_SPEEDS: readonly ClipSpeed[] = ["normal", "slow"];
const noLoader: ClipLoader = () => Promise.reject(new ClipError("unavailable"));

/**
 * Plays clips the host loads. A clip is asked for by name and speed; what comes back is kept as an object URL while the player
 * lives and revoked when it goes. One clip at a time, on the page's sound bus: a second clip, a player or the microphone
 * stops this one. A load that comes back after a newer request never plays (it is kept for later), and a clip refused
 * because the allowance is spent is not asked for again.
 */
export function useClipPlayer({ load, speeds = DEFAULT_SPEEDS, cache = true, onError }: UseClipPlayerOptions): ClipPlayer {
  const [state, setState] = useState<ClipState>(() => initialClipState(speeds[0] ?? "normal"));
  // The reducer's state, readable the moment it changes: a load that resolves must know at once whether it was overtaken.
  const live = useRef(state);
  const [owner] = useState(() => ({}));
  const latest = useRef({ load, onError, cache });
  const audio = useRef<HTMLAudioElement | null>(null);
  const kept = useRef(new Map<string, string>());
  const made = useRef(new Set<string>());
  const loading = useRef(new Map<string, Promise<string>>());
  const cancel = useRef<AbortController | null>(null);
  const passing = useRef<string | null>(null);
  const anchors = useRef(new Map<string, HTMLElement>());
  const gone = useRef(false);

  useEffect(() => {
    latest.current = { load, onError, cache };
  });

  const send = useCallback((event: ClipEvent): ClipState => {
    const next = clipReducer(live.current, event);
    if (next !== live.current) {
      live.current = next;
      setState(next);
    }
    return next;
  }, []);

  const revoke = useCallback((url: string) => {
    if (made.current.delete(url)) URL.revokeObjectURL(url);
  }, []);

  const quiet = useCallback(() => {
    const element = audio.current;
    if (element) {
      element.onended = null;
      element.onerror = null;
      element.pause();
    }
    // A clip that is not kept goes with its last note.
    if (passing.current) revoke(passing.current);
    passing.current = null;
  }, [revoke]);

  const stop = useCallback(() => {
    quiet();
    releaseSound(owner);
    send({ type: "stop" });
  }, [owner, quiet, send]);

  useEffect(() => {
    gone.current = false;
    const urls = kept.current;
    const objects = made.current;
    const pending = loading.current;
    return () => {
      gone.current = true;
      quiet();
      releaseSound(owner);
      cancel.current?.abort();
      cancel.current = null;
      for (const url of objects) URL.revokeObjectURL(url);
      objects.clear();
      urls.clear();
      pending.clear();
      send({ type: "stop" });
    };
  }, [owner, quiet, send]);

  const fetchClip = useCallback((ref: string, speed: ClipSpeed): Promise<string> => {
    const key = clipKey(ref, speed);
    const ready = kept.current.get(key);
    if (ready) return Promise.resolve(ready);
    const shared = loading.current.get(key);
    if (shared) return shared;
    const controller = (cancel.current ??= new AbortController());
    const keep = latest.current.cache;
    const request = Promise.resolve()
      .then(() => latest.current.load(ref, { speed, signal: controller.signal }))
      .then((result) => {
        const url = typeof result === "string" ? result : URL.createObjectURL(result);
        if (typeof result !== "string") made.current.add(url);
        if (controller.signal.aborted) {
          revoke(url);
          throw new DOMException("The player is gone.", "AbortError");
        }
        if (keep) kept.current.set(key, url);
        return url;
      });
    if (!keep) return request;
    const tracked = request.finally(() => {
      if (loading.current.get(key) === tracked) loading.current.delete(key);
    });
    loading.current.set(key, tracked);
    return tracked;
  }, [revoke]);

  const play = useCallback(
    async (ref: string, speed?: ClipSpeed) => {
      const at = speed ?? live.current.speed;
      const key = clipKey(ref, at);
      quiet();
      const { turn, now } = send({ type: "request", ref, speed: at });
      // Refused for the allowance before: the note says so and nothing is asked for.
      if (!now) {
        releaseSound(owner);
        return;
      }
      claimSound(owner, stop);
      const current = () => !gone.current && live.current.turn === turn;
      let settled = false;
      const fail = (failure: ClipFailure, error: unknown) => {
        if (settled) return;
        settled = true;
        const mine = current();
        send({ type: "failed", turn, ref, speed: at, failure });
        if (!mine) return;
        quiet();
        releaseSound(owner);
        latest.current.onError?.(failure, { ref, speed: at, error });
      };
      let url: string;
      try {
        url = await fetchClip(ref, at);
      } catch (error) {
        const failure = classifyClipFailure(error, {
          online: typeof navigator === "undefined" ? undefined : navigator.onLine,
          aborted: gone.current || cancel.current?.signal.aborted,
        });
        if (failure && !gone.current) fail(failure, error);
        return;
      }
      // Overtaken while it loaded: it does not play. A kept clip is ready for the next press.
      if (!current()) {
        if (!kept.current.has(key)) revoke(url);
        return;
      }
      if (!kept.current.has(key)) passing.current = url;
      const element = (audio.current ??= new Audio());
      element.onended = () => {
        if (!current()) return;
        quiet();
        releaseSound(owner);
        send({ type: "ended", turn });
      };
      const broken = (error: unknown) => {
        if (!current()) return;
        // The kept clip no longer plays (a URL that expired): the next request loads it again.
        const stale = kept.current.get(key);
        if (stale) {
          kept.current.delete(key);
          revoke(stale);
        }
        fail(clipFailure("failed"), error);
      };
      element.onerror = () => broken(element.error);
      element.src = url;
      try {
        await element.play();
      } catch (error) {
        // A browser that refuses to start sound (the press was too long ago) lands here: the note offers the clip again,
        // and that press starts it at once from the kept copy.
        if (current()) fail(clipFailure("failed"), error);
        return;
      }
      if (current() && !settled) send({ type: "playing", turn });
    },
    [fetchClip, owner, quiet, revoke, send, stop],
  );

  const toggle = useCallback(
    (ref: string, speed?: ClipSpeed) => {
      if (clipPhase(live.current, ref) !== "idle") stop();
      else void play(ref, speed);
    },
    [play, stop],
  );

  const retry = useCallback(
    (ref?: string) => {
      const failed = live.current.failed;
      if (!failed || !failed.failure.retryable || (ref !== undefined && failed.ref !== ref)) return null;
      void play(failed.ref, failed.speed);
      return failed.ref;
    },
    [play],
  );

  const setSpeed = useCallback(
    (speed: ClipSpeed) => {
      if (live.current.now) {
        quiet();
        releaseSound(owner);
      }
      send({ type: "speed", speed });
    },
    [owner, quiet, send],
  );

  const register = useCallback((ref: string, element: HTMLElement | null) => {
    if (!element) return () => {};
    anchors.current.set(ref, element);
    return () => {
      if (anchors.current.get(ref) === element) anchors.current.delete(ref);
    };
  }, []);

  const focus = useCallback((ref: string) => {
    const element = anchors.current.get(ref);
    if (!element?.isConnected) return false;
    element.focus({ preventScroll: true });
    return true;
  }, []);

  return useMemo(
    () => ({
      state: (ref: string) => clipPhase(state, ref),
      played: (ref: string) => state.played.has(ref),
      failure: (ref?: string) => clipFailureFor(state, ref),
      play,
      stop,
      toggle,
      retry,
      speed: state.speed,
      speeds,
      setSpeed,
      register,
      focus,
    }),
    [focus, play, register, retry, setSpeed, speeds, state, stop, toggle],
  );
}

export type ClipButtonLabels = {
  listen: string;
  listenAgain: string;
};

const CLIP_BUTTON_LABELS: ClipButtonLabels = { listen: "Listen", listenAgain: "Listen again" };

export type ClipButtonProps = Omit<ButtonProps, "children" | "size" | "aria-pressed" | "aria-label" | "loading"> & {
  /** The clip's name: what the loader is asked for. */
  clip: string;
  /** The player this button belongs to. Without one the button plays through its own, from `load`. */
  player?: ClipPlayer;
  load?: ClipLoader;
  /** A speed of its own; by default the player's. */
  speed?: ClipSpeed;
  /** The button's words. By default "Listen", and "Listen again" once the clip was heard. */
  label?: string;
  labels?: Partial<ClipButtonLabels>;
  size?: "sm" | "default" | "lg";
  /** Only the icon; the name is still there for a screen reader. */
  iconOnly?: boolean;
  /**
   * The name as markup, for a name that holds words in another language: they keep their own `lang` and `dir`, which an
   * `aria-label` would drop. Shown in place of `label`, and visually hidden when the button is only an icon.
   */
  labelContent?: ReactNode;
};

const ICON_SIZES = { sm: "icon-sm", default: "icon", lg: "icon-lg" } as const;

/**
 * One button for one clip: a speaker, a spinner while the clip loads, a square while it plays (`aria-pressed`); pressing
 * it again stops it. The name stays what it was, so a screen reader hears one button change state.
 */
export function ClipButton({
  clip,
  player,
  load,
  speed,
  label,
  labels,
  size = "default",
  iconOnly = false,
  labelContent,
  variant = "outline",
  className,
  onClick,
  ref,
  ...props
}: ClipButtonProps) {
  const own = useClipPlayer({ load: load ?? noLoader });
  const used = player ?? own;
  const { register } = used;
  const node = useRef<HTMLElement | null>(null);
  useEffect(() => register(clip, node.current), [clip, register]);
  const text = { ...CLIP_BUTTON_LABELS, ...labels };
  const phase = used.state(clip);
  const name = label ?? (used.played(clip) ? text.listenAgain : text.listen);
  return (
    <Button
      {...props}
      aria-busy={phase === "loading" || undefined}
      aria-label={iconOnly && labelContent === undefined ? name : undefined}
      aria-pressed={phase === "playing"}
      className={classes("fui-clip-button", className)}
      data-icon-only={iconOnly || undefined}
      data-state={phase}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) used.toggle(clip, speed);
      }}
      ref={(element) => {
        node.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      size={iconOnly ? ICON_SIZES[size] : size}
      variant={variant}
    >
      {phase === "loading" ? <PixelSpinner aria-hidden /> : phase === "playing" ? <Square aria-hidden fill="currentColor" /> : <Volume2 aria-hidden />}
      {iconOnly ? (
        labelContent === undefined ? null : (
          <span className="fui-sr-only">{labelContent}</span>
        )
      ) : (
        <span className="fui-clip-button-label">{labelContent ?? name}</span>
      )}
    </Button>
  );
}

export type SpeedToggleLabels = {
  /** The pressed button, and the second segment. */
  slow: string;
  normal: string;
  /** The name of the two-segment control. */
  speed: string;
};

const SPEED_LABELS: SpeedToggleLabels = { slow: "Slow", normal: "Normal", speed: "Speed" };

export type SpeedToggleProps = Omit<ComponentProps<"button">, "children" | "onChange" | "aria-pressed" | "value" | "defaultValue" | "ref"> & {
  player: Pick<ClipPlayer, "speed" | "speeds" | "setSpeed">;
  /** `button`: one key, pressed while the slow speed is on. `segmented`: a segment for each speed. */
  variant?: "button" | "segmented";
  /** `slow`, `normal` and the control's name; a speed with another name is labelled by that name as its key. */
  labels?: Partial<SpeedToggleLabels> & Record<string, string>;
  size?: "sm" | "default" | "lg";
};

/** The switch between a clip's usual speed and its slow one. Changing it stops what is playing. */
export function SpeedToggle({ player, variant = "button", labels, size = "default", className, ...props }: SpeedToggleProps) {
  const text: Record<string, string> = { ...SPEED_LABELS, ...labels };
  const [usual, slow] = player.speeds;
  if (usual === undefined || slow === undefined) return null;
  if (variant === "segmented") {
    return (
      <ToggleGroup
        {...(props as object)}
        aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : text.speed)}
        className={classes("fui-speed-toggle", className)}
        onValueChange={(next) => {
          const chosen = next[0];
          if (chosen !== undefined) player.setSpeed(chosen);
        }}
        size={size}
        value={[player.speed]}
      >
        {player.speeds.map((speed) => (
          <ToggleGroupItem key={speed} value={speed}>
            {text[speed] ?? speed}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }
  const on = player.speed === slow;
  return (
    <Button
      {...(props as object)}
      aria-pressed={on}
      className={classes("fui-speed-toggle", className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) player.setSpeed(on ? usual : slow);
      }}
      size={size}
      variant="ghost"
    >
      <Turtle aria-hidden />
      <span>{text[slow] ?? slow}</span>
    </Button>
  );
}

export type ClipNoteLabels = Record<ClipFailureKind, string> & { retry: string };

const CLIP_NOTE_LABELS: ClipNoteLabels = {
  unavailable: "There is no audio for this.",
  rateLimited: "Too many requests at once. Wait a moment, then try again.",
  quota: "The audio allowance is used up for now.",
  offline: "You are offline. Reconnect, then try again.",
  failed: "The audio could not be played.",
  retry: "Try again",
};

export type ClipNoteProps = Omit<ComponentProps<"p">, "children" | "role"> & {
  player: Pick<ClipPlayer, "failure" | "retry" | "focus">;
  /** The clip the note is about. Without one, the clip asked for last. */
  clip?: string;
  labels?: Partial<ClipNoteLabels>;
};

/**
 * The line under a clip that did not play: what happened, and a way to ask again only when asking again can help. It is a
 * polite status, there from the start so the sentence is announced when it arrives; empty, it takes no room.
 */
export function ClipNote({ player, clip, labels, className, ...props }: ClipNoteProps) {
  const text = { ...CLIP_NOTE_LABELS, ...labels };
  const failure = player.failure(clip);
  return (
    <p {...props} className={classes("fui-clip-note", className)} data-kind={failure?.kind} role="status">
      {failure ? (
        <>
          <span>{text[failure.kind]}</span>
          {failure.retryable ? (
            <button
              className="fui-clip-note-retry"
              onClick={() => {
                // The note goes as the clip is asked for again: the focus moves to the clip's button, not to nowhere.
                const asked = player.retry(clip);
                if (asked !== null) player.focus(asked);
              }}
              type="button"
            >
              {text.retry}
            </button>
          ) : null}
        </>
      ) : null}
    </p>
  );
}
