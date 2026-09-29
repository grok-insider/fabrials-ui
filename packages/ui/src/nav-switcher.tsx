"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's mailbox switcher).

import { createContext, useContext, useRef, type ComponentProps, type ReactNode, type Ref } from "react";
import { useRender } from "@base-ui/react/use-render";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { SidebarMenuButton } from "./sidebar";
import { classes } from "./shared";

type Layout = "block" | "inline";
const LayoutContext = createContext<Layout>("block");

export type NavSwitcherProps = ComponentProps<typeof Popover> & {
  /** `block` fills its column (a sidebar, a pane) with a bordered 56 px box; `inline` sizes to its content (a header, a toolbar). */
  layout?: Layout;
};

/**
 * "Where am I": a switcher for the entity the rest of the screen is about (a mailbox, a workspace, a project). A
 * trigger that names the current one opens a popover with a list of LINKS, one per entity, so a middle click opens a
 * tab and the router owns navigation. It is a disclosure, not a menu: Tab moves through the links, Escape closes it
 * and focus goes back to the trigger.
 *
 * ```tsx
 * <NavSwitcher>
 *   <NavSwitcherTrigger label="Switch mailbox" mark={<Avatar …/>} title="ana@example.test" description="Personal" />
 *   <NavSwitcherContent label="Switch mailbox">
 *     <NavSwitcherItem render={<Link href="/a" />} current mark={…} tag={…}>ana@example.test</NavSwitcherItem>
 *     <NavSwitcherSeparator />
 *     <NavSwitcherItem render={<Link href="/link" />} mark={<Plus />}>Link a mailbox</NavSwitcherItem>
 *   </NavSwitcherContent>
 * </NavSwitcher>
 * ```
 */
export function NavSwitcher({ layout = "block", ...props }: NavSwitcherProps) {
  return (
    <LayoutContext.Provider value={layout}>
      <Popover {...props} />
    </LayoutContext.Provider>
  );
}

export type NavSwitcherTriggerProps = Omit<ComponentProps<typeof PopoverTrigger>, "children" | "className"> & {
  className?: string;
  /** The current entity's mark: an avatar, a gem, an icon. Hidden from assistive technology. */
  mark?: ReactNode;
  /** The current entity's name. Ellipsized; user text, so it carries `dir="auto"`. */
  title: ReactNode;
  /** A second line (a plan, a detail, a status tag). */
  description?: ReactNode;
  /** After the text, before the chevrons: an attention count, a status tag. */
  tag?: ReactNode;
  /** Screen-reader words before the title ("Switch mailbox"): the button's name is "Switch mailbox: ana@example.test". */
  label?: string;
};

export function NavSwitcherTrigger({ mark, title, description, tag, label, className, ...props }: NavSwitcherTriggerProps) {
  const layout = useContext(LayoutContext);
  return (
    <PopoverTrigger data-layout={layout} className={classes("fui-nav-switcher-trigger", className)} {...props}>
      {mark ? (
        <span className="fui-nav-switcher-mark" aria-hidden="true">
          {mark}
        </span>
      ) : null}
      <span className="fui-nav-switcher-text">
        {label ? <span className="fui-sr-only">{label}: </span> : null}
        <span className="fui-nav-switcher-title" dir="auto">
          {title}
        </span>
        {description ? (
          <span className="fui-nav-switcher-detail" dir="auto">
            {description}
          </span>
        ) : null}
      </span>
      {tag ? <span className="fui-nav-switcher-tag">{tag}</span> : null}
      <ChevronsUpDown className="fui-nav-switcher-chevron" aria-hidden="true" />
    </PopoverTrigger>
  );
}

export type NavSwitcherContentProps = Omit<ComponentProps<typeof PopoverContent>, "children" | "aria-label"> & {
  /** The popover's name. */
  label: string;
  /** The link list's name (a `nav` landmark); the popover's name when omitted. */
  listLabel?: string;
  /** `NavSwitcherItem`s and `NavSwitcherSeparator`s. */
  children: ReactNode;
  /** Below the list and outside its scroll: a stale note, a retry. The list scrolls, this stays in view. */
  footer?: ReactNode;
};

/** The popover: a `nav` list of links that scrolls on its own, and a footer that does not. Focus opens on the current link, else the first. */
export function NavSwitcherContent({ label, listLabel, children, footer, className, ref, initialFocus, ...props }: NavSwitcherContentProps) {
  const popup = useRef<HTMLDivElement | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    popup.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };
  return (
    <PopoverContent
      align="start"
      aria-label={label}
      className={classes("fui-nav-switcher-popover", className)}
      ref={setRef as Ref<HTMLDivElement>}
      initialFocus={initialFocus ?? (() => popup.current?.querySelector<HTMLElement>("[aria-current]") ?? true)}
      {...props}
    >
      <nav aria-label={listLabel ?? label} className="fui-nav-switcher-list">
        <ul>{children}</ul>
      </nav>
      {footer}
    </PopoverContent>
  );
}

export type NavSwitcherItemProps = useRender.ComponentProps<"a"> & {
  /** The current entity: `aria-current="page"`, the fill and the bar; a check mark at the end unless `tag` is given. */
  current?: boolean;
  /** Leading mark (an avatar, an icon). */
  mark?: ReactNode;
  /** A second line inside the link, part of its name: a status tag ("Needs authorization"). */
  description?: ReactNode;
  /** After the text: replaces the check mark of the current item. */
  tag?: ReactNode;
};

/** One link of the list. Pass the host's router link through `render`. The name wraps to two lines instead of being cut: touch has no tooltip. */
export function NavSwitcherItem({ current = false, mark, description, tag, children, ...props }: NavSwitcherItemProps) {
  return (
    <li data-slot="nav-switcher-item" className="fui-nav-switcher-entry">
      <SidebarMenuButton isActive={current} size="touch" {...(props as object)}>
        {mark ? (
          <span className="fui-nav-switcher-mark" aria-hidden="true">
            {mark}
          </span>
        ) : null}
        <span className="fui-nav-switcher-text">
          <span className="fui-nav-switcher-name" dir="auto">
            {children}
          </span>
          {description ? <span className="fui-nav-switcher-status">{description}</span> : null}
        </span>
        {tag ?? (current ? <Check className="fui-nav-switcher-check" aria-hidden="true" /> : null)}
      </SidebarMenuButton>
    </li>
  );
}

/** A hairline between groups of links (the footer action below the entities). An empty, hidden `li`: a list cannot hold a separator role. */
export function NavSwitcherSeparator({ className, ...props }: ComponentProps<"li">) {
  return <li aria-hidden="true" data-slot="nav-switcher-separator" className={classes("fui-nav-switcher-rule", className)} {...props} />;
}
