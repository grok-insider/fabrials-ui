"use client";
// Origin: Radiant's mobile header and app layout (the behaviour only). 0.12.

import { useContext, useRef, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SidebarInsetContext } from "./sidebar-inset-context";
import { SidebarTrigger } from "./sidebar";
import { classes } from "./shared";
import { useOverflowTabStop } from "./use-overflow";

export type SidebarInsetHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  /** What the app is showing. Truncates, and takes its own direction (`dir="auto"`). */
  title?: ReactNode;
  /** Makes the title a heading of that level. Without it the title is a plain element. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** The primary action at the end of the bar: a new chat, a save. */
  end?: ReactNode;
  /**
   * `mobile` (default) draws the bar only where the sidebar is the phone sheet; `always` draws it on every width, for a
   * section title with actions of its own.
   */
  visibility?: "always" | "mobile";
  /** The trigger's name (screen-reader text). */
  triggerLabel?: string;
};

/**
 * The bar at the top of a sidebar app's inset: the trigger, the title of what is showing, the actions other parts of the
 * page put in it, and the primary action at the end. A hairline and the surface; it does not blur.
 */
export function SidebarInsetHeader({
  title,
  headingLevel,
  end,
  visibility = "mobile",
  triggerLabel,
  className,
  children,
  ...props
}: SidebarInsetHeaderProps) {
  const inset = useContext(SidebarInsetContext);
  const Heading = (headingLevel ? `h${headingLevel}` : "span") as "h1";
  return (
    <header
      data-slot="sidebar-inset-header"
      data-visibility={visibility}
      className={classes("fui-sidebar-inset-header", className)}
      {...props}
    >
      <SidebarTrigger label={triggerLabel} size="icon-touch" />
      {title === undefined || title === null ? null : (
        <Heading className="fui-sidebar-inset-title" dir="auto">
          {title}
        </Heading>
      )}
      <div data-slot="sidebar-inset-header-actions" ref={inset?.setActions} className="fui-sidebar-inset-header-actions">
        {children}
      </div>
      {end ? (
        <div data-slot="sidebar-inset-header-end" className="fui-sidebar-inset-header-end">
          {end}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Actions of the header, rendered from anywhere inside the inset: a page deep in the app puts its own key in the phone's
 * bar without knowing where the bar is. Draws nothing until the bar has mounted.
 */
export function SidebarInsetHeaderActions({ children }: { children?: ReactNode }) {
  const inset = useContext(SidebarInsetContext);
  return inset?.actions ? createPortal(children, inset.actions) : null;
}

/**
 * The part of a framed inset that scrolls: the header and a docked footer stay, the page moves inside. It is a tab stop only
 * while it has more than it shows (as a `ScrollArea` is), so its content can be scrolled with the keys; a skip link also
 * lands on it.
 */
export function SidebarInsetContent({ id, className, ref, ...props }: ComponentProps<"div">) {
  const inset = useContext(SidebarInsetContext);
  const own = useRef<HTMLDivElement>(null);
  const tabStop = useOverflowTabStop(own);
  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="sidebar-inset-content"
      id={id ?? inset?.contentId}
      tabIndex={tabStop ?? (inset ? -1 : undefined)}
      className={classes("fui-sidebar-inset-content", className)}
      {...props}
    />
  );
}
