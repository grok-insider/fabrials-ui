"use client";
// Origin: Fabrials, 0.12 (from Radiant's local-time).

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False on the server and while the page hydrates, true afterwards. Anything that depends on the reader's device (their
 * time zone, their locale, a stored preference) waits for it, so the first client render matches the server's markup.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
