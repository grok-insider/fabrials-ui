// Origin: shadcn/ui, copied 2026-09-22. Restyled with fui- classes in 0.4; the 0.10 mark is a ring of square cells.
import type { ComponentProps } from "react";
import { PixelSpinner, type SpinnerVariant } from "./pixel-spinner";
import { classes as cn } from "./shared";

export type { SpinnerVariant };

function Spinner({
  className,
  label = "Loading",
  variant = "ring",
  ...props
}: ComponentProps<"svg"> & {
  label?: string;
  /** `ring` (default), `dots`, `bars`, `grid`, or `line` for a row or a table cell. All square cells, all still under reduced motion. */
  variant?: SpinnerVariant;
}) {
  return (
    <PixelSpinner
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("fui-spinner", className)}
      variant={variant}
      {...props}
    />
  );
}

export { Spinner };
