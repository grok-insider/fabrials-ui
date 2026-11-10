"use client";
// One clock for the page (0.12). Timers sleep in a hidden tab; whoever listens reads the time again as the page shows,
// takes focus or comes back from the back-forward cache, because a tick is not a count of the time that passed.

const MIN_TICK = 50;

type Period = { listeners: Set<() => void>; timer: ReturnType<typeof setInterval> | undefined };

const periods = new Map<number, Period>();
let watching = false;

function wake(period: Period) {
  for (const listener of [...period.listeners]) listener();
}

function wakeAll() {
  for (const period of periods.values()) wake(period);
}

function start(group: Period, period: number) {
  if (group.timer !== undefined) return;
  group.timer = setInterval(() => wake(group), period);
}

function sleep() {
  for (const group of periods.values()) {
    clearInterval(group.timer);
    group.timer = undefined;
  }
}

const hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";

function onVisibility() {
  if (hidden()) {
    sleep();
    return;
  }
  for (const [period, group] of periods) start(group, period);
  wakeAll();
}

function watch(on: boolean) {
  if (on === watching || typeof window === "undefined") return;
  watching = on;
  if (on) {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", wakeAll);
    window.addEventListener("pageshow", wakeAll);
  } else {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", wakeAll);
    window.removeEventListener("pageshow", wakeAll);
  }
}

/**
 * Calls `listener` every `intervalMs` (at least 50 ms) while the page is visible, through one interval shared by everyone
 * who asked for that period. The timers stop while the page is hidden and the listener runs once as it shows again.
 * Returns the unsubscribe; the last one to leave takes the interval with it.
 */
export function subscribeTick(intervalMs: number, listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const period = Math.max(MIN_TICK, Math.round(intervalMs));
  const known = periods.get(period);
  const group = known ?? { listeners: new Set<() => void>(), timer: undefined };
  if (!known) periods.set(period, group);
  group.listeners.add(listener);
  watch(true);
  if (!hidden()) start(group, period);
  return () => {
    group.listeners.delete(listener);
    if (group.listeners.size === 0) {
      clearInterval(group.timer);
      periods.delete(period);
    }
    if (periods.size === 0) watch(false);
  };
}
