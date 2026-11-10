"use client";
// Origin: Radiant's session bar and conversation dock (the behaviour only). 0.12.

import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { classes } from "./shared";

export type ActionBarProps = ComponentProps<"div"> & {
  /** Secondary actions and status, at the start. */
  start?: ReactNode;
  /** The actions that move on, at the end. On a narrow bar they take a full row and share it. */
  end?: ReactNode;
  /** The element that gets `--fui-action-bar-size`, so what scrolls above the bar can keep clear of it. The bar's parent by default. */
  containerRef?: RefObject<HTMLElement | null>;
};

/**
 * The bar of a step, a form or a player: it sticks to the block end of its scroll container, over a hairline, clear of the
 * device's safe area and of the on-screen keyboard (with `useViewportInsets`). Its measured height is published as
 * `--fui-action-bar-size` on its container without rendering again. A bar with a name (`aria-label`) is a group; it is not
 * a toolbar, because its controls keep their own tab stops.
 *
 * It sticks inside the nearest scroll container: an ancestor with `overflow: hidden` becomes one and the bar would stick
 * to it instead of the page. Clip such a card with `overflow: clip`.
 */
export function ActionBar({ start, end, containerRef, className, children, ref, role, ...props }: ActionBarProps) {
  const bar = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = bar.current;
    const host = containerRef ? containerRef.current : element?.parentElement;
    if (!element || !host) return;
    const publish = () => host.style.setProperty("--fui-action-bar-size", `${Math.ceil(element.getBoundingClientRect().height)}px`);
    publish();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(publish) : null;
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      host.style.removeProperty("--fui-action-bar-size");
    };
  }, [containerRef]);
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <div
      data-slot="action-bar"
      role={role ?? (named ? "group" : undefined)}
      {...props}
      className={classes("fui-action-bar", className)}
      ref={(node) => {
        bar.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
    >
      {start ? <div className="fui-action-bar-start">{start}</div> : null}
      {children}
      {end ? <div className="fui-action-bar-end">{end}</div> : null}
    </div>
  );
}

/**
 * How much of the bottom of the layout viewport an on-screen keyboard covers, in px. Browsers that shrink the layout
 * viewport themselves give 0; Safari on iOS only shrinks the visual one. A change under `threshold` is a browser toolbar
 * coming or going, not a keyboard.
 */
export function keyboardInset(innerHeight: number, viewportHeight: number, viewportOffsetTop: number, threshold = 120): number {
  const covered = innerHeight - viewportHeight - viewportOffsetTop;
  return covered > threshold ? Math.round(covered) : 0;
}

export type UseViewportInsetsOptions = {
  /** The element that gets `--fui-keyboard-inset`. The document root by default. */
  target?: RefObject<HTMLElement | null>;
  /** Changes at or under this many px are ignored. */
  threshold?: number;
};

/**
 * Publishes `--fui-keyboard-inset` (the part of the layout viewport under the on-screen keyboard) as a CSS variable,
 * without rendering again. `ActionBar` rises by it and `InlineConfirm` scrolls clear of it.
 */
export function useViewportInsets({ target, threshold = 120 }: UseViewportInsetsOptions = {}): void {
  useEffect(() => {
    const host = target ? target.current : document.documentElement;
    const viewport = window.visualViewport;
    if (!host || !viewport) return;
    const update = () =>
      host.style.setProperty("--fui-keyboard-inset", `${keyboardInset(window.innerHeight, viewport.height, viewport.offsetTop, threshold)}px`);
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      host.style.removeProperty("--fui-keyboard-inset");
    };
  }, [target, threshold]);
}
