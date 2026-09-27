"use client";

import type { ComponentProps, ReactNode } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { classes } from "./shared";

export type NavTabsProps = ComponentProps<"nav"> & {
  /** Accessible name of the navigation landmark. */
  label: string;
};

/**
 * Tabs that navigate: each tab is a link to its own URL, so the host's
 * router owns state and history. Looks like TabsList variant="underline".
 */
export function NavTabs({ label, className, children, ...props }: NavTabsProps) {
  return (
    <nav aria-label={label} data-slot="nav-tabs" className={classes("fui-nav-tabs", className)} {...props}>
      <div className="fui-tabs-list" data-variant="underline">
        {children}
      </div>
    </nav>
  );
}

export type NavTabProps = Omit<useRender.ComponentProps<"a">, "className"> & {
  /** This tab's page is the one shown. */
  current?: boolean;
  /** A small count after the label. */
  count?: ReactNode;
  className?: string;
};

/** Pass the host's link element through `render`, e.g. `render={<Link href="…" />}`. */
export function NavTab({ current = false, count, render, className, children, ...props }: NavTabProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: classes("fui-tab", "fui-nav-tab", className),
        "aria-current": current ? "page" : undefined,
        children: (
          <>
            {children}
            {count !== undefined && count !== null && count !== "" ? <span className="fui-nav-tab-count">{count}</span> : null}
          </>
        ),
      },
      { ...props, ...(current ? { "data-active": "" } : {}) },
    ),
  });
}
