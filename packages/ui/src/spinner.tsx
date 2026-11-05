// Origin: shadcn/ui, copied 2026-09-22. Restyled with fui- classes in 0.4; the 0.10 mark is a ring of square cells.
import type { ComponentProps } from "react";
import { PixelSpinner } from "./pixel-spinner";
import { classes as cn } from "./shared";

function Spinner({
  className,
  label = "Loading",
  ...props
}: ComponentProps<"svg"> & { label?: string }) {
  return (
    <PixelSpinner
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("fui-spinner", className)}
      {...props}
    />
  );
}

export { Spinner };
