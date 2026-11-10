import type { ComponentProps } from "react";
import { classes } from "./shared";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={classes("fui-skeleton", className)}
      {...props}
    />
  );
}
