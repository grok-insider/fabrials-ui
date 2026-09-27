"use client";

import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "./display";
import { classes } from "./shared";

export type ActivityCell = {
  /** What the cell stands for, e.g. a day or an hour. */
  label: string;
  value: number;
  /** Colours this cell with a status tone instead of the brand ramp. */
  tone?: Tone;
};

export type ActivityStripProps = Omit<ComponentProps<"figure">, "children"> & {
  cells: ReadonlyArray<ActivityCell>;
  /** Accessible summary; also the caption of the screen-reader table. */
  caption: string;
  /** Value of the fullest cell. Defaults to the largest value. */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Text under the first and last cell, e.g. "hace 90 días" / "hoy". */
  startLabel?: ReactNode;
  endLabel?: ReactNode;
  formatValue?: (value: number) => string;
};

/** 0 for no activity, then 1–4 by share of `max`. */
export function activityLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as 1 | 2 | 3 | 4;
}

/**
 * A row of intensity cells, like an uptime bar or a row of contributions:
 * one cell per day, hour or bucket. Colour is backed by a native tooltip and
 * a screen-reader table with every value.
 */
export function ActivityStrip({
  cells,
  caption,
  max,
  size = "md",
  startLabel,
  endLabel,
  formatValue = (value) => String(value),
  className,
  ...props
}: ActivityStripProps) {
  const top = max ?? Math.max(0, ...cells.map((cell) => cell.value));
  return (
    <figure data-slot="activity-strip" data-size={size} className={classes("fui-activity-strip", className)} {...props}>
      <div className="fui-activity-cells" aria-hidden>
        {cells.map((cell, index) => (
          <span
            key={`${cell.label}-${index}`}
            className="fui-activity-cell"
            data-level={activityLevel(cell.value, top)}
            data-tone={cell.tone}
            title={`${cell.label}: ${formatValue(cell.value)}`}
          />
        ))}
      </div>
      {startLabel || endLabel ? (
        <figcaption className="fui-activity-labels" aria-hidden>
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </figcaption>
      ) : null}
      <table className="fui-sr-only">
        <caption>{caption}</caption>
        <tbody>
          {cells.map((cell, index) => (
            <tr key={`${cell.label}-${index}`}>
              <th scope="row">{cell.label}</th>
              <td>{formatValue(cell.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
