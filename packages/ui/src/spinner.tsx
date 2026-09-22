// Origin: shadcn/ui, copied 2026-09-22. Fabrials will modify this.
import type { ComponentProps } from "react";
import { Loader2Icon } from "lucide-react";
import { classes as cn } from "./shared";

function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
