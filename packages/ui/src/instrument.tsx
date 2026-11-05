import type { CSSProperties, ComponentProps } from "react";
import { classes } from "./shared";

const corners = ["top-start", "top-end", "bottom-start", "bottom-end"] as const;

/**
 * Draws a small cross on each corner of what it wraps, like the registration marks of a technical drawing. Wrap a plate
 * (a Card, a StatGroup, a Table, a chart) that carries the brand on a page; not every box. Decorative: the marks are
 * hidden from assistive technology and never take focus.
 */
export function CornerMarks({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="corner-marks" className={classes("fui-corner-marks", className)} {...props}>
      {children}
      {corners.map((corner) => (
        <span key={corner} aria-hidden className="fui-corner-mark" data-corner={corner} />
      ))}
    </div>
  );
}

/**
 * The layout grid drawn on the page: dashed column guides across a positioned section (a landing hero). They follow
 * `--fui-page-padding` and hide under 768 px, in forced colors and in print. Decorative.
 */
export function GridGuides({
  columns = 12,
  className,
  style,
  ...props
}: Omit<ComponentProps<"div">, "children"> & { columns?: number }) {
  return (
    <div
      aria-hidden
      data-slot="grid-guides"
      className={classes("fui-grid-guides", className)}
      style={{ "--fui-guide-columns": columns, ...style } as CSSProperties}
      {...props}
    >
      {Array.from({ length: columns }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
