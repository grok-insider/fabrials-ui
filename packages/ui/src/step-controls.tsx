"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useLocale } from "./labels";
import { classes } from "./shared";
import { clampStep, lastStep, stepDelay, stepPlayerReducer, type StepPlayerAction, type StepPlayerState } from "./step-player";
import { Toolbar, ToolbarButton, ToolbarGroup, type ToolbarProps } from "./toolbar";

export type UseStepPlayerOptions = {
  /** How many steps there are. */
  count: number;
  /** The step shown, from 0, when the host holds it. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  playing?: boolean;
  defaultPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /** A multiplier of the pace: 2 is twice as fast. */
  speed?: number;
  defaultSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  /** Milliseconds a step stays up at speed 1. Default 1200. */
  interval?: number;
  /** After the last step, playing goes on from the first. */
  loop?: boolean;
};

export type StepPlayer = StepPlayerState & {
  count: number;
  atStart: boolean;
  atEnd: boolean;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
};

/**
 * Steps a reader walks through or lets play: an algorithm's frames, the slides of an explanation. While playing it moves on a
 * timer (`interval` divided by the speed), stops at the last step (or goes round with `loop`) and waits while the page is
 * hidden. A step taken by hand pauses it. Spread what it returns on `StepControls`.
 */
export function useStepPlayer({
  count,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  playing: playingProp,
  defaultPlaying = false,
  onPlayingChange,
  speed: speedProp,
  defaultSpeed = 1,
  onSpeedChange,
  interval = 1200,
  loop = false,
}: UseStepPlayerOptions): StepPlayer {
  const [innerIndex, setInnerIndex] = useState(defaultIndex);
  const [innerPlaying, setInnerPlaying] = useState(defaultPlaying);
  const [innerSpeed, setInnerSpeed] = useState(defaultSpeed);
  const index = clampStep(indexProp ?? innerIndex, count);
  const speed = speedProp ?? innerSpeed;
  const last = lastStep(count);
  // Playing on the last step with nowhere to go is not playing: a host that holds `playing` need not flip it at the end.
  const playing = (playingProp ?? innerPlaying) && last > 0 && (loop || index < last);
  const latest = useRef({ state: { index, playing, speed }, count, loop, onIndexChange, onPlayingChange, onSpeedChange });
  useEffect(() => {
    latest.current = { state: { index, playing, speed }, count, loop, onIndexChange, onPlayingChange, onSpeedChange };
  });

  const dispatch = useCallback((action: StepPlayerAction) => {
    const now = latest.current;
    const next = stepPlayerReducer(now.state, action, { count: now.count, loop: now.loop });
    if (next === now.state) return;
    const before = now.state;
    // The next action in the same tick (two key presses before a render) starts from here.
    now.state = next;
    if (next.index !== before.index) {
      setInnerIndex(next.index);
      now.onIndexChange?.(next.index);
    }
    if (next.playing !== before.playing) {
      setInnerPlaying(next.playing);
      now.onPlayingChange?.(next.playing);
    }
    if (next.speed !== before.speed) {
      setInnerSpeed(next.speed);
      now.onSpeedChange?.(next.speed);
    }
  }, []);

  // The stored flag follows what is shown: at the end of a run the host hears that playing stopped.
  const stored = playingProp ?? innerPlaying;
  useEffect(() => {
    if (!stored || playing) return;
    setInnerPlaying(false);
    latest.current.onPlayingChange?.(false);
  }, [stored, playing]);

  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const read = () => setHidden(document.visibilityState === "hidden");
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, []);

  useEffect(() => {
    if (!playing || hidden) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), stepDelay(interval, speed));
    return () => window.clearTimeout(timer);
  }, [playing, hidden, index, speed, interval, dispatch]);

  return useMemo(
    () => ({
      index,
      count,
      playing,
      speed,
      atStart: index <= 0,
      atEnd: index >= last,
      next: () => dispatch({ type: "next" }),
      previous: () => dispatch({ type: "previous" }),
      goTo: (to: number) => dispatch({ type: "goTo", index: to }),
      play: () => dispatch({ type: "play" }),
      pause: () => dispatch({ type: "pause" }),
      toggle: () => dispatch({ type: "toggle" }),
      restart: () => dispatch({ type: "restart" }),
      setSpeed: (to: number) => dispatch({ type: "setSpeed", speed: to }),
    }),
    [index, count, playing, speed, last, dispatch],
  );
}

export type StepControlsLabels = {
  /** Names the toolbar. */
  controls: string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  /** The play key once the last step is up. */
  replay: string;
  reset: string;
  /** "Step 3 of 12": the step and the total, already in the reader's digits. */
  step: (current: string, total: string) => string;
  /** Names the group of speeds. */
  speed: string;
  /** One speed: "2×". */
  speedValue: (speed: string) => string;
};

const LABELS: StepControlsLabels = {
  controls: "Steps",
  previous: "Previous step",
  next: "Next step",
  play: "Play",
  pause: "Pause",
  replay: "Replay",
  reset: "Back to the start",
  step: (current, total) => `Step ${current} of ${total}`,
  speed: "Speed",
  speedValue: (speed) => `${speed}×`,
};

export type StepControlsProps = Omit<ToolbarProps, "aria-label" | "aria-labelledby" | "children" | "variant" | "sticky" | "contain"> &
  Partial<Pick<StepPlayer, "playing" | "speed" | "atStart" | "atEnd" | "next" | "previous" | "goTo" | "play" | "pause" | "toggle" | "restart" | "setSpeed">> & {
    /** The step shown, from 0. */
    index: number;
    count: number;
    /** Shows the key that goes back to the first step (it calls `restart`). */
    reset?: boolean;
    /** Shows a set of speeds to choose from (`[0.5, 1, 2]`); choosing calls `setSpeed`. */
    speeds?: readonly number[];
    /** Turns every key off; they stay in the tab order, so focus is not thrown out of the toolbar. */
    disabled?: boolean;
    /** The digits of the counter and the speeds. Default `"en"`. */
    locale?: Intl.LocalesArgument;
    labels?: Partial<StepControlsLabels>;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    /** Placed after the counter, inside the toolbar: one more `ToolbarButton`. */
    children?: ReactNode;
  };

/**
 * The keys of something shown in steps: previous, play or pause, next, where the reader is, and optionally reset and a speed.
 * One tab stop; the arrow keys move between the keys. Drive it with `useStepPlayer` (`<StepControls {...player} />`) or with
 * plain props: the play key shows when `toggle` (or `play` and `pause`) is given, so previous and next alone make a pager.
 * The counter is not a live region (it would speak on every tick): the step is announced when a key changes it, and when
 * playing pauses or ends.
 */
export function StepControls({
  className,
  index,
  count,
  playing = false,
  speed,
  atStart,
  atEnd,
  next,
  previous,
  goTo: _goTo,
  play,
  pause,
  toggle,
  restart,
  setSpeed,
  reset = false,
  speeds,
  disabled = false,
  locale: ownLocale,
  labels: ownLabels,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: StepControlsProps) {
  const labels = { ...LABELS, ...ownLabels };
  const total = Math.max(0, Math.floor(count));
  const at = clampStep(index, total);
  const first = atStart ?? at <= 0;
  const final = atEnd ?? at >= total - 1;
  const locale = useLocale(ownLocale);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const where = labels.step(number.format(total === 0 ? 0 : at + 1), number.format(total));
  const playable = toggle != null || (play != null && pause != null);
  const press = playing ? (pause ?? toggle) : (play ?? toggle);

  // What a screen reader hears: the step, when a key changed it or when playing stopped on it. Not each tick.
  const [spoken, setSpoken] = useState("");
  const before = useRef({ at, playing });
  useEffect(() => {
    const was = before.current;
    before.current = { at, playing };
    if ((was.playing && !playing) || (was.at !== at && !playing)) setSpoken(where);
    else if (playing) setSpoken("");
  }, [at, playing, where]);

  const named = ariaLabelledBy != null ? { "aria-labelledby": ariaLabelledBy } : { "aria-label": ariaLabel ?? labels.controls };
  return (
    <Toolbar {...named} {...props} data-slot="step-controls" data-playing={playing ? "" : undefined} className={classes("fui-step-controls", className)}>
      <ToolbarButton className="fui-step-controls-previous" disabled={disabled || first || previous == null} label={labels.previous} onClick={() => previous?.()}>
        <ChevronLeft aria-hidden="true" className="fui-step-controls-chevron" />
      </ToolbarButton>
      {playable ? (
        <ToolbarButton
          className="fui-step-controls-play"
          data-state={playing ? "playing" : final ? "ended" : "paused"}
          disabled={disabled || total < 2}
          label={playing ? labels.pause : final ? labels.replay : labels.play}
          onClick={() => press?.()}
          tooltip={false}
          variant="outline"
        >
          {playing ? <Pause aria-hidden="true" /> : final ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
        </ToolbarButton>
      ) : null}
      <ToolbarButton className="fui-step-controls-next" disabled={disabled || final || next == null} label={labels.next} onClick={() => next?.()}>
        <ChevronRight aria-hidden="true" className="fui-step-controls-chevron" />
      </ToolbarButton>
      {reset ? (
        <ToolbarButton className="fui-step-controls-reset" disabled={disabled || restart == null || (first && !playing)} label={labels.reset} onClick={() => restart?.()}>
          <RotateCcw aria-hidden="true" />
        </ToolbarButton>
      ) : null}
      <span className="fui-step-controls-count">{where}</span>
      {children}
      {speeds && speeds.length > 0 ? (
        <ToolbarGroup aria-label={labels.speed} className="fui-step-controls-speeds">
          <span aria-hidden="true" className="fui-step-controls-speed-label">
            {labels.speed}
          </span>
          {speeds.map((option) => (
            <BaseToolbar.Button
              aria-pressed={option === speed}
              className="fui-button fui-step-controls-speed"
              data-size="sm"
              data-slot="button"
              data-variant="ghost"
              disabled={disabled || setSpeed == null}
              focusableWhenDisabled
              key={option}
              onClick={() => setSpeed?.(option)}
            >
              {labels.speedValue(number.format(option))}
            </BaseToolbar.Button>
          ))}
        </ToolbarGroup>
      ) : null}
      <span aria-live="polite" className="fui-sr-only" role="status">
        {spoken}
      </span>
    </Toolbar>
  );
}
