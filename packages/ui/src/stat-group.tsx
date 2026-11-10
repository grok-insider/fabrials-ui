import type { ComponentProps } from "react";
import { classes } from "./shared";

export function StatGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-group"
      className={classes("fui-stat-group", className)}
      {...props}
    />
  );
}
