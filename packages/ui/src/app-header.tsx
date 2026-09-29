"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's application header).

import type { ComponentProps, ReactNode } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDown } from "lucide-react";
import { Button } from "./controls";
import { classes } from "./shared";

/** Data attributes and class as one loosely typed bag: Base UI's prop types do not list `data-*`. */
const attrs = (value: Record<string, string | boolean | undefined>) => value as never;

export type AppHeaderProps = Omit<ComponentProps<"header">, "children"> & {
  /** The product mark: an `AppHeaderBrand` around a `ProductLockup` (or anything). It shrinks before the controls do. */
  brand: ReactNode;
  /** Primary navigation: an `AppHeaderNav` of `AppHeaderLink`s. It keeps its place on a phone (icons only). */
  navigation?: ReactNode;
  /** The command launcher (a palette trigger). Its slot has a definite width per mode, and is the size container `command` it answers to. */
  command?: ReactNode;
  /** Session chrome at the end of the row: settings, account, preferences. */
  actions?: ReactNode;
  /** Stays under the top of its scroll container. The workspace shell keeps the header put by itself, so this is for pages that flow. */
  sticky?: boolean;
};

/**
 * The application header: one row of 56 px with a hairline below, no blur, spanning the window with its content on
 * the page gutter. Order in the row: brand, navigation, then the command slot and the actions pushed to the end.
 * It carries session chrome only, never anything scoped to a mailbox, an account, a folder or a message.
 *
 * Presentational, no hooks. The modes are container queries in rem on the header's own width, so text zoom collapses
 * the header instead of overflowing it: compact below 48rem (labels become screen-reader text, controls are square),
 * medium to 72rem, wide from there (the command slot grows to 14, 18 and 22rem), the brand name gives way at 24rem
 * and the row wraps in two at 19rem. The command slot is definite in width, never only a `flex-basis`: Firefox and
 * WebKit size the actions cluster from its content, so a slot that only has a basis makes the cluster too narrow and
 * the header overflows.
 */
export function AppHeader({ brand, navigation, command, actions, sticky = false, className, ...props }: AppHeaderProps) {
  return (
    <header data-slot="app-header" data-sticky={sticky ? "" : undefined} className={classes("fui-app-header", className)} {...props}>
      <div className="fui-app-header-inner">
        {brand}
        {navigation}
        <div className="fui-app-header-actions">
          {command ? <div className="fui-app-header-command">{command}</div> : null}
          {actions}
        </div>
      </div>
    </header>
  );
}

/** The brand link: 44 px tall, it grows into the gutter so the mark itself starts on it. Render the host's router link through `render`. */
export function AppHeaderBrand({ render, className, ...props }: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(attrs({ className: classes("fui-app-header-brand", className), "data-slot": "app-header-brand" }), props),
  });
}

/** An installation's logo inside a `ProductLockup` (`mark={<AppHeaderLogo src=… width height />}`): sized by the lockup and shrinking on a phone. */
export function AppHeaderLogo({ className, alt = "", ...props }: ComponentProps<"img">) {
  return <img alt={alt} className={classes("fui-app-header-logo", className)} {...props} />;
}

/** Primary navigation: a labelled `nav` of plain links. */
export function AppHeaderNav({ label, className, ...props }: Omit<ComponentProps<"nav">, "aria-label" | "aria-labelledby"> & { label: string }) {
  return <nav data-slot="app-header-nav" aria-label={label} className={classes("fui-app-header-nav", className)} {...props} />;
}

/**
 * A navigation link: icon and text, full ink and a 2 px Stormlight bar on the header's hairline when `current`
 * (`aria-current="page"`). Put the text in a `span` (or `AppHeaderLabel`): below 48rem the icon stands alone.
 */
export function AppHeaderLink({ current = false, render, className, ...props }: useRender.ComponentProps<"a"> & { current?: boolean }) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      attrs({ className: classes("fui-app-header-link", className), "data-slot": "app-header-link", "aria-current": current ? "page" : undefined }),
      props,
    ),
  });
}

/** A ghost `Button` of the header row (an account trigger, a preferences menu, a settings button). Below 48rem it becomes a square icon: its `AppHeaderLabel` turns into screen-reader text and its `AppHeaderCaret` goes. Base UI triggers can `render` it. */
export function AppHeaderAction({ className, variant = "ghost", size = "lg", ...props }: ComponentProps<typeof Button>) {
  return <Button data-slot="app-header-action" variant={variant} size={size} className={classes("fui-app-header-action", className)} {...props} />;
}

/** Text that stays visible on wide headers and becomes screen-reader text below 48rem. It ellipsizes at 14rem. */
export function AppHeaderLabel({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="app-header-label" className={classes("fui-app-header-label", className)} {...props} />;
}

/** The chevron of a menu trigger: gone when the header is compact. */
export function AppHeaderCaret({ className, ...props }: Omit<ComponentProps<typeof ChevronDown>, "aria-hidden">) {
  return <ChevronDown aria-hidden="true" className={classes("fui-app-header-caret", className)} {...props} />;
}

/** The box of a control that is not there yet (a trigger whose boundary is still resolving), so nothing shifts when it arrives. */
export function AppHeaderPlaceholder({ className, ...props }: ComponentProps<"span">) {
  return <span aria-hidden="true" data-slot="app-header-placeholder" className={classes("fui-app-header-placeholder", className)} {...props} />;
}
