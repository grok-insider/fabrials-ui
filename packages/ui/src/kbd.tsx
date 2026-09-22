// Origin: Fabrials, 2026-09-22. A flat shortcut hint, not the Spectrum 3D keycap.
import type { ComponentProps } from "react";
import { classes } from "./shared";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return <kbd className={classes("fui-kbd", className)} {...props} />;
}
