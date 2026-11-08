"use client";
// Origin: shadcn/ui (Base UI Scroll Area), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { classes as cn } from "./shared";

/**
 * A region that scrolls inside while the page stays. `aria-label` (or `aria-labelledby`) names the viewport, the part that
 * takes keyboard focus while the content overflows, and makes it a region.
 */
function ScrollArea({
  className,
  children,
  fade = false,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: Omit<ScrollAreaPrimitive.Root.Props, "className"> & {
  className?: string;
  /** Fades the edges that have more behind them, up to 2rem and only as far as there is more (0.11). */
  fade?: boolean;
}) {
  const named = label !== undefined || labelledBy !== undefined;
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-fade={fade || undefined}
      className={cn("fui-scroll-area", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="fui-scroll-area-viewport"
        role={named ? "region" : undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: Omit<ScrollAreaPrimitive.Scrollbar.Props, "className"> & {
  className?: string;
}) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("fui-scrollbar", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="fui-scrollbar-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
