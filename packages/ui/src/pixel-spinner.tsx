import type { ComponentProps } from "react";
import { classes } from "./shared";

// The eight cells of a 3x3 grid, clockwise from the top left: one lit at a time, like a device's busy light.
const CELLS = [
  [0, 0],
  [4, 0],
  [8, 0],
  [8, 4],
  [8, 8],
  [4, 8],
  [0, 8],
  [0, 4],
] as const;

/** The 0.10 busy mark: a ring of square cells that light in turn. Decorative unless the caller names it. */
export function PixelSpinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 11 11"
      focusable="false"
      shapeRendering="crispEdges"
      className={classes("fui-pixel-spinner", className)}
      {...props}
    >
      {CELLS.map(([x, y], index) => (
        <rect key={index} x={x} y={y} width={3} height={3} style={{ animationDelay: `${index * 100 - 800}ms` }} />
      ))}
    </svg>
  );
}
