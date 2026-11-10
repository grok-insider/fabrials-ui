"use client";
// Origin: Fabrials, 0.12 (the sidebar's phone check, read through useSyncExternalStore, and the query hook under it).

import { useCallback, useSyncExternalStore } from "react";

function matches(query: string) {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

/**
 * Whether a media query matches, kept up to date. The server and the hydrating render answer `serverValue` (`false`
 * unless given), so the markup agrees; a render that starts in the browser reads the real answer at once.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matches(query),
    () => serverValue,
  );
}

/** A window narrower than `breakpoint` px (768 by default, where the sidebar becomes a sheet). `false` on the server. */
export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
