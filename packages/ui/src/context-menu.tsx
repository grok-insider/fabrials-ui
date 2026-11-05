"use client";
// Origin: Fabrials, 0.10, on Base UI's Context Menu, under shadcn's names so a shim covers it. The parts come from
// Base UI's context-menu entry (not the menu entry), so a bundler that splits the two never sees two menu contexts;
// they share the dropdown menu's classes, so both menus look and behave the same.

import type { ComponentProps } from "react";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Check, ChevronRight, Dot } from "lucide-react";
import { classes, type StyledProps } from "./shared";

/** Opens at the pointer on right-click, a long press, the Menu key or Shift+F10. Offer the same actions somewhere visible too. */
export const ContextMenu = BaseContextMenu.Root;
export const ContextMenuPortal = BaseContextMenu.Portal;
export const ContextMenuGroup = BaseContextMenu.Group;
export const ContextMenuRadioGroup = BaseContextMenu.RadioGroup;
export const ContextMenuSub = BaseContextMenu.SubmenuRoot;

/** The area that answers a right-click. It renders a `div`; `render` makes it a row, a card or a canvas. */
export function ContextMenuTrigger({ className, ...props }: StyledProps<BaseContextMenu.Trigger.Props>) {
  return <BaseContextMenu.Trigger data-slot="context-menu-trigger" className={classes("fui-context-menu-trigger", className)} {...props} />;
}

export function ContextMenuContent({
  className,
  keepMounted,
  ...props
}: StyledProps<BaseContextMenu.Popup.Props> & {
  /** Keep the menu in the DOM, hidden, while it is closed. */
  keepMounted?: boolean;
}) {
  return (
    <BaseContextMenu.Portal keepMounted={keepMounted}>
      <BaseContextMenu.Positioner className="fui-positioner">
        <BaseContextMenu.Popup data-slot="context-menu-content" className={classes("fui-menu", className)} {...props} />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

export function ContextMenuItem({
  className,
  variant = "default",
  ...props
}: StyledProps<BaseContextMenu.Item.Props> & { variant?: "default" | "destructive" }) {
  return (
    <BaseContextMenu.Item className={classes("fui-menu-item", className)} data-destructive={variant === "destructive" || undefined} {...props} />
  );
}

export function ContextMenuCheckboxItem({ className, children, ...props }: StyledProps<BaseContextMenu.CheckboxItem.Props>) {
  return (
    <BaseContextMenu.CheckboxItem className={classes("fui-menu-item", className)} {...props}>
      {children}
      <BaseContextMenu.CheckboxItemIndicator className="fui-menu-indicator">
        <Check aria-hidden size={16} />
      </BaseContextMenu.CheckboxItemIndicator>
    </BaseContextMenu.CheckboxItem>
  );
}

export function ContextMenuRadioItem({ className, children, ...props }: StyledProps<BaseContextMenu.RadioItem.Props>) {
  return (
    <BaseContextMenu.RadioItem className={classes("fui-menu-item", className)} {...props}>
      {children}
      <BaseContextMenu.RadioItemIndicator className="fui-menu-indicator">
        <Dot aria-hidden size={20} strokeWidth={4} />
      </BaseContextMenu.RadioItemIndicator>
    </BaseContextMenu.RadioItem>
  );
}

export function ContextMenuLabel({ className, ...props }: StyledProps<BaseContextMenu.GroupLabel.Props>) {
  return <BaseContextMenu.GroupLabel className={classes("fui-menu-label", className)} {...props} />;
}

export function ContextMenuSeparator({ className, ...props }: StyledProps<BaseContextMenu.Separator.Props>) {
  return <BaseContextMenu.Separator className={classes("fui-separator", "fui-menu-separator", className)} {...props} />;
}

export function ContextMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span aria-hidden className={classes("fui-menu-shortcut", className)} {...props} />;
}

export function ContextMenuSubTrigger({ className, children, ...props }: StyledProps<BaseContextMenu.SubmenuTrigger.Props>) {
  return (
    <BaseContextMenu.SubmenuTrigger className={classes("fui-menu-item", className)} {...props}>
      {children}
      <ChevronRight aria-hidden size={16} className="fui-menu-submenu-icon" />
    </BaseContextMenu.SubmenuTrigger>
  );
}

export function ContextMenuSubContent({ className, sideOffset = 4, ...props }: StyledProps<BaseContextMenu.Popup.Props> & { sideOffset?: number }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner className="fui-positioner" side="right" align="start" sideOffset={sideOffset}>
        <BaseContextMenu.Popup className={classes("fui-menu", className)} {...props} />
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
