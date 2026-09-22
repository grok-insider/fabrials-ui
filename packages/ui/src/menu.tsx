"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { classes, type StyledProps } from "./shared";

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;

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
      className={classes("fui-separator", className)}
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
        className="fui-positioner"
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
