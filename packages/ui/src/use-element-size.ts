"use client";
// Origin: Fabrials, 0.12 (from Radiant's use-width and the measuring SeriesChart did inline).

import { useEffect, useRef, useState, type RefObject } from "react";

export type ElementSize = { width: number; height: number };

export type UseElementSizeOptions<T extends Element> = {
  /**
   * Reads another box than the content box (`clientWidth`, a scroll size). Called on mount and at every resize; return 0
   * for an axis to leave it out, so its changes never re-render.
   */
  measure?: (element: T) => ElementSize;
};

const UNMEASURED: ElementSize = { width: 0, height: 0 };

/** A CSS length on the device's pixel grid, so half a pixel of layout noise is not a new size. */
function snap(value: number): number {
  const ratio = (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
  return Math.round(value * ratio) / ratio;
}

/**
 * The size of an element's content box, kept current by a `ResizeObserver`: 0 by 0 on the server and until it is
 * measured. Pass your own ref or use the one returned. Re-renders only when the size, rounded to device pixels, changes.
 */
export function useElementSize<T extends Element = HTMLElement>(
  ref?: RefObject<T | null>,
  options: UseElementSizeOptions<T> = {},
): { ref: RefObject<T | null>; width: number; height: number } {
  const own = useRef<T | null>(null);
  const target = ref ?? own;
  const [size, setSize] = useState(UNMEASURED);
  const measure = useRef(options.measure);
  const watched = useRef<{ element: T; stop: () => void } | null>(null);
  // No dependency list: the element behind a ref can change without the ref changing (a conditional render).
  useEffect(() => {
    measure.current = options.measure;
    const element = target.current;
    if (element === (watched.current?.element ?? null)) return;
    watched.current?.stop();
    watched.current = null;
    if (!element) {
      setSize(UNMEASURED);
      return;
    }
    const commit = (next: ElementSize) => setSize((current) => (current.width === next.width && current.height === next.height ? current : next));
    if (measure.current) commit(measure.current(element));
    if (typeof ResizeObserver === "undefined") {
      watched.current = { element, stop: () => {} };
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (measure.current) commit(measure.current(element));
      else if (entry) commit({ width: snap(entry.contentRect.width), height: snap(entry.contentRect.height) });
    });
    observer.observe(element);
    watched.current = { element, stop: () => observer.disconnect() };
  });
  useEffect(
    () => () => {
      watched.current?.stop();
      watched.current = null;
    },
    [],
  );
  return { ref: target, width: size.width, height: size.height };
}
