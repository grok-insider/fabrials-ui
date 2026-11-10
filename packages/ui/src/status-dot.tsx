import type { ComponentProps, ReactNode } from "react";
import type { Tone } from "./display";
import { classes } from "./shared";

export function StatusDot({
  tone = "neutral",
  label,
  hideLabel = false,
  pulse = false,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  tone?: Tone;
  /** Text companion for the color. Required; hide it visually with hideLabel. */
  label: ReactNode;
  hideLabel?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      data-slot="status"
      data-tone={tone}
      data-pulse={pulse || undefined}
      className={classes("fui-status", className)}
      {...props}
    >
      <span aria-hidden className="fui-status-dot" />
      <span className={hideLabel ? "fui-sr-only" : "fui-status-label"}>{label}</span>
    </span>
  );
}
