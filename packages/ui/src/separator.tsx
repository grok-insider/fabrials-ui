import type { ComponentProps } from "react";
import { classes } from "./shared";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<"hr"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <hr
      data-orientation={orientation}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      className={classes("fui-separator", className)}
      {...props}
    />
  );
}
