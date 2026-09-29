"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's reader toolbar).

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { IconButtonSize } from "./icon-button";
import { IconTooltipContent, keyShortcutsValue } from "./icon-tooltip";
import { Tooltip, TooltipTrigger } from "./menu";
import { classes, type StyledProps } from "./shared";
import type { ButtonProps } from "./controls";

type Named = { "aria-label": string; "aria-labelledby"?: never } | { "aria-labelledby": string; "aria-label"?: never };

export type ToolbarProps = StyledProps<BaseToolbar.Root.Props> &
  Named & {
    /** `plain` is a bare row. `bar` is a band: the page background between two hairlines, its icons aligned to the
     * page gutter, and it measures its own width so `reveal` and `tier` respond to it. */
    variant?: "plain" | "bar";
    /** With `bar`: stays under the top of its scroll container (not on short windows, where it would take the screen). */
    sticky?: boolean;
    /** Whether the toolbar is the size container that `reveal` and `tier` read. On for `bar`. A container takes
     * its width from its parent, never from its buttons, so give a content-sized plain toolbar `false` and let a
     * pane above it be the container instead. */
    contain?: boolean;
  };

/** Home and End: Base UI's toolbar has the arrows but not these two. They go to the first and last item a person can reach. */
function moveToEdge(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Home" && event.key !== "End") return;
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const root = event.currentTarget;
  const target = event.target as HTMLElement;
  // A menu or popover rendered in a portal bubbles its keys through React, not through the DOM: leave those alone,
  // and leave a text field its caret keys.
  if (!root.contains(target) || target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>("[tabindex]")).filter(
    (item) =>
      item.closest('[role="toolbar"]') === root &&
      !item.hasAttribute("disabled") &&
      /^-?[01]$/.test(item.getAttribute("tabindex") ?? "") &&
      getComputedStyle(item).display !== "none",
  );
  const next = event.key === "Home" ? items[0] : items[items.length - 1];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

/**
 * One tab stop for a row of controls. Tab enters at the last focused item (the first at the start) and leaves
 * on the next Tab; the arrow keys, Home and End move between the items (wrapping, unless `loopFocus={false}`),
 * so eight buttons cost one Tab, not eight. The name is required: a toolbar is a landmark-like group that a
 * screen reader announces by it.
 *
 * A toolbar is for buttons, toggles, menus and links. A native text field or select inside it keeps its own
 * arrow keys and adds a tab stop of its own; put those next to the toolbar instead.
 */
export function Toolbar({ className, variant = "plain", sticky = false, contain, onKeyDown, ...props }: ToolbarProps) {
  return (
    <BaseToolbar.Root
      onKeyDown={(event) => {
        (onKeyDown as ((event: KeyboardEvent<HTMLDivElement>) => void) | undefined)?.(event as KeyboardEvent<HTMLDivElement>);
        moveToEdge(event as KeyboardEvent<HTMLDivElement>);
      }}
      data-slot="toolbar"
      data-variant={variant}
      data-sticky={sticky && variant === "bar" ? "" : undefined}
      data-contain={(contain ?? variant === "bar") ? "" : undefined}
      className={classes("fui-toolbar", className)}
      {...props}
    />
  );
}

export type ToolbarGroupProps = StyledProps<BaseToolbar.Group.Props> & Named;

/** Related items of a `Toolbar`, named for assistive technology (`aria-label` is required). `disabled` disables the group's items. */
export function ToolbarGroup({ className, ...props }: ToolbarGroupProps) {
  return <BaseToolbar.Group data-slot="toolbar-group" className={classes("fui-toolbar-group", className)} {...props} />;
}

/** A hairline between groups. It separates vertically in a horizontal toolbar; `tier="low"` hides it with the low-tier items. */
export function ToolbarSeparator({
  className,
  tier,
  ...props
}: StyledProps<BaseToolbar.Separator.Props> & { tier?: "high" | "low" }) {
  return (
    <BaseToolbar.Separator
      data-slot="toolbar-separator"
      data-tier={tier === "low" ? tier : undefined}
      className={classes("fui-toolbar-separator", className)}
      {...props}
    />
  );
}

export type ToolbarButtonProps = Omit<
  StyledProps<BaseToolbar.Button.Props>,
  "aria-label" | "aria-labelledby" | "title" | "children"
> &
  Pick<ButtonProps, "variant"> & {
    /** The name, as a text node inside the button (so `textContent`, voice control and find-in-page see it). It is
     * visually hidden until `reveal` shows it. Required: an icon is not a name. */
    label: string;
    /** The icon (16 px, `aria-hidden`). */
    children?: ReactNode;
    /** A tooltip repeats the name for sighted people (default); `false` leaves it out; a node replaces its text. */
    tooltip?: boolean | ReactNode;
    /** Keys shown in the tooltip and exposed as `aria-keyshortcuts`. */
    shortcut?: string | readonly string[];
    size?: IconButtonSize;
    /**
     * Shows the label beside the icon once the toolbar (or the container around it) is wide enough:
     * `early` from 40rem, `middle` from 52rem, `late` from 76rem. Below that it is an icon with a tooltip.
     */
    reveal?: "early" | "middle" | "late";
    /**
     * `high` (default) is always there. `low` is hidden below 34rem and belongs in an overflow menu then;
     * `overflow` is the trigger of that menu and is only there below 34rem. Hidden items leave the arrow-key
     * order, so the toolbar never loses its tab stop to an item nobody can see.
     */
    tier?: "high" | "low" | "overflow";
  };

/** True while CSS has taken the element out of the layout (`display: none`), measured after mount and on every resize of it. */
function useLayoutHidden(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const measure = () => setHidden(getComputedStyle(element).display === "none");
    measure();
    if (typeof ResizeObserver === "undefined") return;
    // An element that becomes display: none, or comes back, changes its box, which is what this observes.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);
  return hidden;
}

/**
 * An icon button that belongs to the toolbar's arrow-key order, named by a text node, with a tooltip.
 * A disabled button stays in the order (`aria-disabled`, no click) so its neighbours do not shift under a
 * person who is arrowing; pass `focusableWhenDisabled={false}` to take it out. Spread props let a Base UI trigger
 * render it: `<DropdownMenuTrigger render={<ToolbarButton label="More" tier="overflow"><Ellipsis /></ToolbarButton>} />`.
 * The tooltip wrapper is always mounted, so a control that becomes disabled during a refresh is never remounted.
 */
export function ToolbarButton({
  label,
  children,
  tooltip = true,
  shortcut,
  size = "icon-lg",
  variant = "ghost",
  reveal,
  tier = "high",
  className,
  disabled,
  focusableWhenDisabled = true,
  ref,
  ...props
}: ToolbarButtonProps) {
  const own = useRef<HTMLButtonElement | null>(null);
  const hidden = useLayoutHidden(own, tier !== "high");
  const button = (
    <BaseToolbar.Button
      aria-keyshortcuts={keyShortcutsValue(shortcut)}
      {...props}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-tier={tier === "high" ? undefined : tier}
      data-reveal={reveal}
      className={classes("fui-button", "fui-toolbar-button", className)}
      disabled={disabled || hidden}
      focusableWhenDisabled={hidden ? false : focusableWhenDisabled}
      ref={(node: HTMLButtonElement | null) => {
        own.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
    >
      {children}
      <span className="fui-toolbar-label">{label}</span>
    </BaseToolbar.Button>
  );
  if (tooltip === false) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <IconTooltipContent label={tooltip === true ? label : tooltip} shortcut={shortcut} />
    </Tooltip>
  );
}
