"use client";
// One reading of the motion preference (0.12): a DitherCanvas reveal, a moon's orbit, a scramble and a work timer all ask
// the same question through here, and a component that draws as the reader changes it asks the hook.

import { useSyncExternalStore } from "react";

/** The media query behind it, for the rare caller that watches it itself. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function matches() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Whether the reader asked for less motion, read once. False where there is no `matchMedia` (a server, a worker). Use it
 * from an effect, a handler or a paint; a component that must redraw as the preference changes uses `useReducedMotion`.
 */
export function prefersReducedMotion(): boolean {
  return matches();
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether the reader asked for less motion, kept up to date as they change it. The server and the hydrating render answer
 * `false`, so the markup agrees before the page has a browser to ask.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, matches, () => false);
}
