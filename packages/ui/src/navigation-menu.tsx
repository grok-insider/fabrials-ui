"use client";
// Origin: shadcn/ui (Base UI Navigation Menu), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import type * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { ChevronDownIcon } from "lucide-react";
import { classes as cn } from "./shared";

type Styled<T> = Omit<T, "className"> & { className?: string };

function NavigationMenu({
  align = "start",
  className,
  children,
  ...props
}: Styled<NavigationMenuPrimitive.Root.Props> &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align">) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("fui-nav-menu", className)}
      {...props}
    >
      {children}
      <NavigationMenuPositioner align={align} />
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: Styled<React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("fui-nav-menu-list", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: Styled<React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("fui-nav-menu-item", className)}
      {...props}
    />
  );
}

function navigationMenuTriggerStyle(options: { className?: string } = {}) {
  return cn("fui-nav-menu-trigger", options.className);
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: Styled<NavigationMenuPrimitive.Trigger.Props>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn("fui-nav-menu-trigger", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon aria-hidden className="fui-nav-menu-chevron" />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: Styled<NavigationMenuPrimitive.Content.Props>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn("fui-nav-menu-content", className)}
      {...props}
    />
  );
}

function NavigationMenuPositioner({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  ...props
}: Styled<NavigationMenuPrimitive.Positioner.Props>) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn("fui-positioner", "fui-nav-menu-positioner", className)}
        {...props}
      >
        <NavigationMenuPrimitive.Popup className="fui-nav-menu-popup">
          <NavigationMenuPrimitive.Viewport className="fui-nav-menu-viewport" />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: Styled<NavigationMenuPrimitive.Link.Props>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn("fui-nav-menu-link", className)}
      {...props}
    />
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: Styled<React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Icon>>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={cn("fui-nav-menu-indicator", className)}
      {...props}
    >
      <span className="fui-nav-menu-indicator-arrow" />
    </NavigationMenuPrimitive.Icon>
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuPositioner,
};
