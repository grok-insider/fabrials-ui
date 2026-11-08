import type { ComponentProps, CSSProperties } from "react";
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

/** The busy marks: `ring` (eight cells round a square), `dots`, `bars`, `grid` and `line`. */
export type SpinnerVariant = "ring" | "dots" | "bars" | "grid" | "line";

// The still frame of each bar of `bars`: how many of its three cells are lit.
const BAR_LEVELS = [1, 3, 2];

function cell(x: number, y: number, step: number, still: number, key: string) {
  return (
    <rect
      height={3}
      key={key}
      style={{ "--fui-spinner-step": step, "--fui-spinner-still": still } as CSSProperties}
      width={3}
      x={x}
      y={y}
    />
  );
}

/**
 * The busy mark in square cells. `ring` (default): a ring of eight cells lit in turn. `dots`: three cells in a row light
 * one after another. `bars`: three bars rise and fall a cell at a time. `grid`: a diagonal wave crosses a 3x3 grid from the
 * bottom left. `line`: five cells fill in order and empty, for a row or a cell of a table. Decorative unless the caller
 * names it; under reduced motion each holds a still frame.
 */
export function PixelSpinner({ variant = "ring", className, ...props }: ComponentProps<"svg"> & { variant?: SpinnerVariant }) {
  let cells;
  if (variant === "dots") cells = [0, 1, 2].map((index) => cell(index * 4, 4, index, index === 1 ? 1 : 0.22, `${index}`));
  else if (variant === "bars")
    cells = [0, 1, 2].flatMap((bar) =>
      [0, 1, 2].map((level) => (
        <rect
          data-level={level + 1}
          height={3}
          key={`${bar}-${level}`}
          style={{ "--fui-spinner-step": bar, "--fui-spinner-still": level < BAR_LEVELS[bar]! ? 1 : 0.22 } as CSSProperties}
          width={3}
          x={bar * 4}
          y={8 - level * 4}
        />
      )),
    );
  else if (variant === "grid")
    cells = [0, 1, 2].flatMap((row) =>
      [0, 1, 2].map((col) => {
        const step = col + (2 - row);
        return cell(col * 4, row * 4, step, step === 2 ? 1 : step === 1 || step === 3 ? 0.5 : 0.22, `${row}-${col}`);
      }),
    );
  else if (variant === "line") cells = [0, 1, 2, 3, 4].map((index) => cell(index * 4, 0, index, index < 3 ? 1 : 0.22, `${index}`));
  else
    cells = CELLS.map(([x, y], index) => (
      <rect key={index} x={x} y={y} width={3} height={3} style={{ animationDelay: `${index * 100 - 800}ms` }} />
    ));
  return (
    <svg
      viewBox={variant === "line" ? "0 0 19 3" : "0 0 11 11"}
      focusable="false"
      shapeRendering="crispEdges"
      data-variant={variant === "ring" ? undefined : variant}
      className={classes("fui-pixel-spinner", className)}
      {...props}
    >
      {cells}
    </svg>
  );
}
