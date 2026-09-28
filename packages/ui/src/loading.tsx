"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { classes } from "./shared";

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
  return (
    <div
      data-slot="loading"
      data-fui-loading={when ? "" : undefined}
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

// Word lengths that wrap like English UI copy; deterministic so the server and
// the browser render the same placeholder.
const WORDS = [5, 3, 7, 4, 9, 2, 6, 4, 8, 3, 5, 6, 3, 7, 4, 5];

/**
 * Placeholder copy of about `length` characters for a skeleton. Invisible in
 * the skeleton; only its length and word breaks matter, so lines wrap like the
 * real text will. Pass a `seed` for variety between rows.
 */
export function placeholderText(length: number, seed = 0): string {
  let text = "";
  for (let i = 0; text.length < length; i += 1) {
    const size = WORDS[(i + seed) % WORDS.length]!;
    text += (text ? " " : "") + "x".repeat(size);
  }
  return text.slice(0, Math.max(0, length));
}

/** `count` placeholder records built by `make`, for lists and tables while their data loads. */
export function placeholderList<T>(count: number, make: (index: number) => T): T[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => make(index));
}
