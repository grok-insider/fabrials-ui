// What a copy says, for assistive technology (0.12): always in the page, always polite, and empty until something happens,
// so the words arrive as a change instead of standing there from the first paint.

import type { ComponentProps } from "react";
import type { CopyState } from "./use-copy";
import { classes } from "./shared";

export type CopyStatusLabels = {
  /** Said once the text is on the clipboard ("Copied to clipboard"). */
  copied: string;
  /** Said when the clipboard refused; without it a failure is silent. */
  failed?: string;
};

export type CopyStatusProps = Omit<ComponentProps<"span">, "children"> & {
  status: CopyState;
  labels: CopyStatusLabels;
  /**
   * The class of the region while a failure has to be read as well as heard: the region then shows instead of hiding.
   * Without it the region is only for a screen reader (`.fui-sr-only`).
   */
  failedClassName?: string;
};

export function CopyStatus({ status, labels, failedClassName, className, ...props }: CopyStatusProps) {
  const shown = status === "failed" && failedClassName;
  return (
    <span
      role="status"
      data-state={status === "idle" ? undefined : status}
      className={classes(shown ? failedClassName : "fui-sr-only", className)}
      {...props}
    >
      {status === "copied" ? labels.copied : status === "failed" ? (labels.failed ?? "") : ""}
    </span>
  );
}
