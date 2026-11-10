"use client";

import { Children, createContext, isValidElement, useContext, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Check, ChevronRight, Dot } from "lucide-react";
import { useDirection } from "./direction";
import { controlName, describesControl, panelOf, type Panel } from "./description";
import { classes, type StyledProps } from "./shared";

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuPortal = BaseMenu.Portal;
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

export function DropdownMenuSubTrigger({ className, children, ...props }: StyledProps<BaseMenu.SubmenuTrigger.Props>) {
  // The chevron points at the side the submenu opens on: the inline end, which a right-to-left page mirrors. The menu is
  // portaled out of the page's `dir`, so the direction is taken from Base UI's provider, not from the DOM.
  return (
    <BaseMenu.SubmenuTrigger className={classes("fui-menu-item", className)} {...props}>
      {children}
      <ChevronRight aria-hidden data-direction={useDirection() === "rtl" ? "rtl" : undefined} size={16} className="fui-menu-submenu-icon" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  sideOffset = 4,
  keepMounted,
  ...props
}: StyledProps<BaseMenu.Popup.Props> &
  Pick<BaseMenu.Positioner.Props, "sideOffset"> & { keepMounted?: boolean }) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
      <BaseMenu.Positioner className="fui-positioner" side="inline-end" align="start" sideOffset={sideOffset}>
        <BaseMenu.Popup className={classes("fui-menu", className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function DropdownMenuContent({
  className,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  collisionAvoidance,
  keepMounted,
  ...props
}: StyledProps<BaseMenu.Popup.Props> &
  Pick<
    BaseMenu.Positioner.Props,
    "align" | "side" | "sideOffset" | "collisionAvoidance"
  > & {
    /** Keep the menu in the DOM, hidden, while it is closed. */
    keepMounted?: boolean;
  }) {
  return (
    <BaseMenu.Portal keepMounted={keepMounted}>
      <BaseMenu.Positioner
        className="fui-positioner"
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
      >
        <BaseMenu.Popup className={classes("fui-menu", className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive = false,
  variant = "default",
  ...props
}: StyledProps<BaseMenu.Item.Props> & {
  destructive?: boolean;
  variant?: "default" | "destructive";
}) {
  const isDestructive = destructive || variant === "destructive";
  return (
    <BaseMenu.Item
      className={classes("fui-menu-item", className)}
      data-destructive={isDestructive || undefined}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: StyledProps<BaseMenu.CheckboxItem.Props>) {
  return (
    <BaseMenu.CheckboxItem
      className={classes("fui-menu-item", className)}
      {...props}
    >
      {children}
      <BaseMenu.CheckboxItemIndicator className="fui-menu-indicator">
        <Check aria-hidden size={16} />
      </BaseMenu.CheckboxItemIndicator>
    </BaseMenu.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: StyledProps<BaseMenu.RadioItem.Props>) {
  return (
    <BaseMenu.RadioItem
      className={classes("fui-menu-item", className)}
      {...props}
    >
      {children}
      <BaseMenu.RadioItemIndicator className="fui-menu-indicator">
        <Dot aria-hidden size={20} strokeWidth={4} />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );
}

export function DropdownMenuShortcut({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={classes("fui-menu-shortcut", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: StyledProps<BaseMenu.GroupLabel.Props>) {
  return (
    <BaseMenu.GroupLabel
      className={classes("fui-menu-label", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: StyledProps<BaseMenu.Separator.Props>) {
  return (
    <BaseMenu.Separator
      className={classes("fui-separator", "fui-menu-separator", className)}
      {...props}
    />
  );
}

export const TooltipProvider = BaseTooltip.Provider;

type TooltipPair = { id: string; open: boolean; panel: Panel | undefined; describe: boolean | undefined };

const TooltipContext = createContext<TooltipPair | null>(null);

/** The panel of a tooltip, read while it is still closed: the pair is written as a root with a trigger and a content. */
function panelFromChildren(children: ReactNode): Panel | undefined {
  let panel: Panel | undefined;
  Children.forEach(children, (child) => {
    if (panel === undefined && isValidElement(child) && child.type === TooltipContent) {
      panel = panelOf((child.props as { children?: ReactNode }).children) ?? { text: "", interactive: false };
    }
  });
  return panel;
}

function tooltipId(reactId: string) {
  return `fui-tooltip-${reactId.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

/**
 * A hint on hover and on keyboard focus. Its popup is a `role="tooltip"` and the trigger is described by it while it is
 * open, unless the tooltip only repeats the trigger's name (an icon key named by `aria-label`: it would be read twice) or
 * its words are built by another component. `describe` decides either way.
 */
export function Tooltip({
  describe,
  children,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: BaseTooltip.Root.Props & { describe?: boolean }) {
  const [shown, setShown] = useState(Boolean(defaultOpen));
  const controlled = open !== undefined;
  const id = tooltipId(useId());
  const panel = panelFromChildren(typeof children === "function" ? undefined : children);
  return (
    <TooltipContext.Provider value={{ id, open: controlled ? Boolean(open) : shown, panel, describe }}>
      <BaseTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          if (!controlled) setShown(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      >
        {children}
      </BaseTooltip.Root>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ render, ...props }: BaseTooltip.Trigger.Props) {
  const pair = useContext(TooltipContext);
  const rendered = isValidElement(render) ? (render.props as Record<string, unknown>) : undefined;
  const describedBy =
    pair?.open && describesControl(controlName(rendered, props as Record<string, unknown>), pair.panel, pair.describe)
      ? [props["aria-describedby"], pair.id].filter(Boolean).join(" ")
      : props["aria-describedby"];
  return <BaseTooltip.Trigger render={render} {...props} aria-describedby={describedBy} />;
}

export function TooltipContent({
  className,
  sideOffset = 6,
  side = "top",
  align = "center",
  ...props
}: StyledProps<BaseTooltip.Popup.Props> &
  Pick<BaseTooltip.Positioner.Props, "sideOffset" | "side" | "align">) {
  const pair = useContext(TooltipContext);
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        className="fui-positioner fui-tooltip-positioner"
        sideOffset={sideOffset}
        side={side}
        align={align}
      >
        <BaseTooltip.Popup
          className={classes("fui-tooltip", className)}
          id={pair?.id}
          role="tooltip"
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
