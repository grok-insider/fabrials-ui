"use client";
// Origin: shadcn/ui (Base UI Preview Card), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { classes as cn } from "./shared";

function HoverCard({ ...props }: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  ...props
}: Omit<PreviewCardPrimitive.Popup.Props, "className"> & { className?: string } &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="fui-positioner"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn("fui-popover", "fui-hover-card", className)}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
