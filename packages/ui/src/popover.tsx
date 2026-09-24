"use client";
// Origin: shadcn/ui (Base UI Popover), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { classes as cn } from "./shared";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: Omit<PopoverPrimitive.Popup.Props, "className"> & { className?: string } &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="fui-positioner"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn("fui-popover", className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("fui-popover-header", className)}
      {...props}
    />
  );
}

function PopoverTitle({
  className,
  ...props
}: Omit<PopoverPrimitive.Title.Props, "className"> & { className?: string }) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("fui-popover-title", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: Omit<PopoverPrimitive.Description.Props, "className"> & {
  className?: string;
}) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("fui-description", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
