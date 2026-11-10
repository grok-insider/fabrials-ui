"use client";
// Origin: Fabrials, 0.12 (the one polite region Radiant's step players each kept for themselves).

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

export type AnnounceOptions = {
  /** Interrupts what is being read: for an error that needs attention now. Default: polite, after the current sentence. */
  assertive?: boolean;
};

export type Announce = (message: string, options?: AnnounceOptions) => void;

type Channel = "polite" | "assertive";
type Messages = Record<Channel, string>;

const SILENT: Messages = { polite: "", assertive: "" };

/**
 * The timing of a live region, apart from where its text is written. A message that repeats the one in the region is
 * cleared first and written a frame later (unchanged text is not read again), and every message leaves the region after
 * `clearAfter`, so a reader browsing the page later does not find a stale sentence.
 */
function createSpeaker(write: (channel: Channel, text: string) => void, clearAfter: () => number) {
  const current: Messages = { ...SILENT };
  const frames: Partial<Record<Channel, number>> = {};
  const timers: Partial<Record<Channel, number>> = {};
  const put = (channel: Channel, text: string) => {
    current[channel] = text;
    write(channel, text);
  };
  const cancel = (channel: Channel) => {
    if (frames[channel] !== undefined) cancelAnimationFrame(frames[channel]);
    window.clearTimeout(timers[channel]);
    frames[channel] = undefined;
  };
  return {
    announce(message: string, { assertive = false }: AnnounceOptions = {}) {
      const channel: Channel = assertive ? "assertive" : "polite";
      cancel(channel);
      const say = () => {
        frames[channel] = undefined;
        put(channel, message);
        const after = clearAfter();
        if (message && after > 0) timers[channel] = window.setTimeout(() => put(channel, ""), after);
      };
      if (!message || current[channel] !== message) return say();
      put(channel, "");
      frames[channel] = requestAnimationFrame(say);
    },
    stop() {
      cancel("polite");
      cancel("assertive");
    },
  };
}

function createStore(clearAfter: () => number) {
  let messages = SILENT;
  const listeners = new Set<() => void>();
  const speaker = createSpeaker((channel, text) => {
    messages = { ...messages, [channel]: text };
    for (const listener of listeners) listener();
  }, clearAfter);
  return {
    ...speaker,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read: () => messages,
  };
}

const AnnouncerContext = createContext<Announce | null>(null);

export type AnnouncerProps = {
  children?: ReactNode;
  /** Milliseconds a message stays in the region before it is emptied; 0 keeps it. Default 7000. */
  clearAfter?: number;
};

/**
 * One place a screen can speak through. It renders two regions that are always in the page and only clipped from view
 * (a region added at the moment it speaks, or one that is `display: none`, is not read): a polite one and an assertive
 * one. Put it once near the root; anything below calls `useAnnounce()`.
 */
export function Announcer({ children, clearAfter = 7000 }: AnnouncerProps) {
  const [store] = useState(() => {
    const settings = { clearAfter };
    return { settings, ...createStore(() => settings.clearAfter) };
  });
  useEffect(() => {
    store.settings.clearAfter = clearAfter;
  }, [store, clearAfter]);
  useEffect(() => store.stop, [store]);
  const messages = useSyncExternalStore(store.subscribe, store.read, () => SILENT);
  return (
    <AnnouncerContext value={store.announce}>
      {children}
      <div data-slot="announcer" data-live="polite" className="fui-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {messages.polite}
      </div>
      <div data-slot="announcer" data-live="assertive" className="fui-sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {messages.assertive}
      </div>
    </AnnouncerContext>
  );
}

let shared: Announce | undefined;

/** Without an `Announcer` above: two regions appended to the body, shared by the whole page. */
function sharedSpeaker(): Announce {
  if (shared) return shared;
  const regions = {} as Record<Channel, HTMLElement>;
  for (const channel of ["polite", "assertive"] as const) {
    const region = document.createElement("div");
    region.className = "fui-sr-only";
    region.dataset.slot = "announcer";
    region.dataset.live = channel;
    region.setAttribute("role", channel === "polite" ? "status" : "alert");
    region.setAttribute("aria-live", channel);
    region.setAttribute("aria-atomic", "true");
    document.body.appendChild(region);
    regions[channel] = region;
  }
  shared = createSpeaker(
    (channel, text) => {
      regions[channel].textContent = text;
    },
    () => 7000,
  ).announce;
  return shared;
}

const fallback: Announce = (message, options) => {
  if (typeof document === "undefined") return;
  if (shared) return shared(message, options);
  // A region that appears with its text already in it is not read: it gets a moment in the page first.
  const speak = sharedSpeaker();
  window.setTimeout(() => speak(message, options), 150);
};

/**
 * `announce(message)` says a sentence to screen-reader users without moving focus: the result of an action that changed
 * something elsewhere on the screen. The same sentence twice is read twice. The function keeps its identity. Without an
 * `Announcer` above, it speaks through a pair of regions of its own at the end of the body.
 */
export function useAnnounce(): Announce {
  const provided = useContext(AnnouncerContext);
  useEffect(() => {
    if (!provided) sharedSpeaker();
  }, [provided]);
  return provided ?? fallback;
}
