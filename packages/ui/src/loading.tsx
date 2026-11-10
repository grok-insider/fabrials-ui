"use client";

import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { classes } from "./shared";

export { placeholderList, placeholderText } from "./placeholder";

const LoadingContext = createContext(false);

/** True inside a `Loading` that is showing its skeleton; lets a component trim work it cannot show. */
export function useLoading() {
  return useContext(LoadingContext);
}

export type LoadingProps = Omit<ComponentProps<"div">, "children"> & {
  /** Shows the skeleton. The children stay mounted, so nothing moves when it turns off. */
  when: boolean;
  /** What assistive technology hears while it loads, e.g. "Loading accounts". */
  label?: string;
  children: ReactNode;
};

/**
 * Turns whatever it wraps into its own skeleton while `when` is true: text
 * becomes a bar per line, icons and images become blocks, coloured controls
 * become neutral shapes, and borders, tables and cards stay as structure.
 * Render the real components with placeholder data (see `placeholderText`)
 * so the skeleton has the exact layout of the finished view.
 *
 * Layout-neutral: the wrappers use `display: contents`, only paint changes,
 * so the page does not shift when loading ends. The content is `inert` while
 * loading (no focus, hidden from assistive technology) and a status message
 * says what is loading. Works on the server; motion follows reduced motion.
 */
export function Loading({ when, label = "Loading", className, children, ...props }: LoadingProps) {
  // For a frame after the skeleton ends, transitions stay off (see styles.css),
  // so the content returns at once instead of transitioning every property.
  const [previous, setPrevious] = useState(when);
  const [settling, setSettling] = useState(false);
  if (previous !== when) {
    setPrevious(when);
    setSettling(!when);
  }
  useEffect(() => {
    if (!settling) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSettling(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [settling]);
  return (
    <div
      data-slot="loading"
      data-fui-loading={when ? "" : undefined}
      data-fui-loading-settle={settling ? "" : undefined}
      aria-busy={when || undefined}
      className={classes("fui-loading", className)}
      {...props}
    >
      <span role="status" className="fui-sr-only">
        {when ? label : ""}
      </span>
      <div className="fui-loading-content" inert={when}>
        <LoadingContext.Provider value={when}>{children}</LoadingContext.Provider>
      </div>
    </div>
  );
}

