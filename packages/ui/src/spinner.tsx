// Origin: shadcn/ui, copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.
import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { classes as cn } from "./shared";

function Spinner({
  className,
  label = "Loading",
  ...props
}: ComponentProps<"svg"> & { label?: string }) {
  return (
    <LoaderCircle
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("fui-spinner", "fui-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
