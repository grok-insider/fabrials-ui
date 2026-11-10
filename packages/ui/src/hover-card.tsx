"use client";
// Origin: shadcn/ui (Base UI Preview Card), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import { Children, createContext, isValidElement, useContext, useId, useState, type ReactNode } from "react";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { controlName, describesPreview, panelOf, type Panel } from "./description";
import { classes as cn } from "./shared";

type HoverCardPair = { id: string; open: boolean; panel: Panel | undefined; describe: boolean | undefined };

const HoverCardContext = createContext<HoverCardPair | null>(null);

function panelFromChildren(children: ReactNode): Panel | undefined {
  let panel: Panel | undefined;
  Children.forEach(children, (child) => {
    if (panel === undefined && isValidElement(child) && child.type === HoverCardContent) {
      panel = panelOf((child.props as { children?: ReactNode }).children) ?? { text: "", interactive: false };
    }
  });
  return panel;
}

/**
 * A source preview beside a link, on hover and on keyboard focus. It is a preview, not a dialog: nothing behind it becomes
 * inert, focus stays on the trigger, Escape closes it, and the link inside it is reached with the pointer only, so the
 * trigger's own destination must hold the same information. While the panel is short text with nothing to operate in it
 * the trigger is described by it; `describe` decides either way.
 */
function HoverCard({
  describe,
  children,
  ...props
}: PreviewCardPrimitive.Root.Props & { describe?: boolean }) {
  const [shown, setShown] = useState(Boolean(props.defaultOpen));
  const controlled = props.open !== undefined;
  const id = `fui-hover-card-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  const panel = panelFromChildren(typeof children === "function" ? undefined : children);
  return (
    <HoverCardContext.Provider value={{ id, open: controlled ? Boolean(props.open) : shown, panel, describe }}>
      <PreviewCardPrimitive.Root
        data-slot="hover-card"
        {...props}
        onOpenChange={(next, details) => {
          if (!controlled) setShown(next);
          props.onOpenChange?.(next, details);
        }}
      >
        {children}
      </PreviewCardPrimitive.Root>
    </HoverCardContext.Provider>
  );
}

function HoverCardTrigger({ render, ...props }: PreviewCardPrimitive.Trigger.Props) {
  const pair = useContext(HoverCardContext);
  const rendered = isValidElement(render) ? (render.props as Record<string, unknown>) : undefined;
  const describedBy =
    pair?.open && describesPreview(controlName(rendered, props as Record<string, unknown>), pair.panel, pair.describe)
      ? [props["aria-describedby"], pair.id].filter(Boolean).join(" ")
      : props["aria-describedby"];
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      render={render}
      {...props}
      aria-describedby={describedBy}
    />
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
  const pair = useContext(HoverCardContext);
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
          id={pair?.id}
          className={cn("fui-popover", "fui-hover-card", className)}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
