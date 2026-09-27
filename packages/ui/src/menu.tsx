"use client";

import type { ComponentProps } from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Check, ChevronRight, Dot } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;
export const DropdownMenuRadioGroup = BaseMenu.RadioGroup;
export const DropdownMenuPortal = BaseMenu.Portal;
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

export function DropdownMenuSubTrigger({ className, children, ...props }: StyledProps<BaseMenu.SubmenuTrigger.Props>) {
  return (
    <BaseMenu.SubmenuTrigger className={classes("fui-menu-item", className)} {...props}>
      {children}
      <ChevronRight aria-hidden size={16} className="fui-menu-submenu-icon" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  sideOffset = 4,
  ...props
}: StyledProps<BaseMenu.Popup.Props> & Pick<BaseMenu.Positioner.Props, "sideOffset">) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner className="fui-positioner" side="right" align="start" sideOffset={sideOffset}>
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
  ...props
}: StyledProps<BaseMenu.Popup.Props> &
  Pick<
    BaseMenu.Positioner.Props,
    "align" | "side" | "sideOffset" | "collisionAvoidance"
  >) {
  return (
    <BaseMenu.Portal>
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
export const Tooltip = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  side = "top",
  align = "center",
  ...props
}: StyledProps<BaseTooltip.Popup.Props> &
  Pick<BaseTooltip.Positioner.Props, "sideOffset" | "side" | "align">) {
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
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
