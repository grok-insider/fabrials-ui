"use client";
// Origin: Fabrials, 0.12.

import { useEffect, useState, type RefObject } from "react";

/** Whether a box holds more than it shows, on either axis. A pixel of slack absorbs the rounding of `scrollWidth`. */
export function overflows(node: Pick<HTMLElement, "scrollWidth" | "clientWidth" | "scrollHeight" | "clientHeight">): boolean {
  return node.scrollWidth - node.clientWidth > 1 || node.scrollHeight - node.clientHeight > 1;
}

/**
 * The `tabIndex` of a region that scrolls: `0` while its content overflows, so the keyboard can reach it and scroll it, and
 * `undefined` while everything fits, so Tab does not stop on a box with nothing to scroll. Nothing is measured on the server:
 * the first paint has no tab stop, as `ScrollArea` does. It measures after every render of the caller and whenever the region
 * or its first-level content changes size.
 */
export function useOverflowTabStop(ref: RefObject<HTMLElement | null>): 0 | undefined {
  const [stop, setStop] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (node) setStop(overflows(node));
  });
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setStop(overflows(node)));
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    return () => observer.disconnect();
  }, [ref]);
  return stop ? 0 : undefined;
}
