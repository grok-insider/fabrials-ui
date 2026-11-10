"use client";
// Origin: shadcn/ui (Base UI Popover), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { Button } from "./controls";
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
  keepMounted,
  ...props
}: Omit<PopoverPrimitive.Popup.Props, "className"> & { className?: string } &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** Keep the popover in the DOM, hidden, while it is closed: what was typed in it is still there when it opens again. */
    keepMounted?: boolean;
  }) {
  return (
    <PopoverPrimitive.Portal keepMounted={keepMounted}>
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

/**
 * Closes the popover and hands focus back to its trigger. With no `render` it is the corner key a dialog has: a ghost X named
 * by `label`, which stays in the corner while the popover scrolls. Put it last, so focus lands on the content first. With
 * `render` it is your own element (a "Done" button in a footer) with only the closing behaviour.
 */
function PopoverClose({
  className,
  label = "Close",
  render,
  children,
  ...props
}: Omit<PopoverPrimitive.Close.Props, "className"> & {
  className?: string;
  /** The key's name. */
  label?: string;
}) {
  if (render) {
    return (
      <PopoverPrimitive.Close data-slot="popover-close" className={className} render={render} {...props}>
        {children}
      </PopoverPrimitive.Close>
    );
  }
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      aria-label={label}
      {...props}
      render={<Button variant="ghost" size="icon-sm" className={cn("fui-popover-close", className)} />}
    >
      {children ?? <X aria-hidden size={16} />}
    </PopoverPrimitive.Close>
  );
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
