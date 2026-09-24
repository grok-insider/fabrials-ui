"use client";
// Origin: shadcn/ui (Base UI Scroll Area), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { classes as cn } from "./shared";

function ScrollArea({
  className,
  children,
  ...props
}: Omit<ScrollAreaPrimitive.Root.Props, "className"> & { className?: string }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("fui-scroll-area", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="fui-scroll-area-viewport"
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
