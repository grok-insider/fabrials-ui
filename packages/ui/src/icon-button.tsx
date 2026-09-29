"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's ui/icon-button.tsx).

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./controls";
import { IconTooltipContent, keyShortcutsValue, type ControlShortcut } from "./icon-tooltip";
import { Tooltip, TooltipTrigger } from "./menu";

export type { ControlShortcut } from "./icon-tooltip";

export type IconButtonSize = "icon" | "icon-xs" | "icon-sm" | "icon-lg";

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "title" | "size" | "variant"> & {
  /** The control's name: `aria-label`, or a visually hidden text node with `textName`. Required: an icon is not a name. */
  label: string;
  /** A tooltip repeats the name for sighted people (default), `false` leaves it out, a node replaces its text. */
  tooltip?: boolean | ReactNode;
  /** Keys shown in the tooltip as flat `Kbd`s, and exposed as `aria-keyshortcuts` ("⌘", "K"). Keys pressed one after the other are `{ keys: ["g", "i"], sequence: true }`: the tooltip says "g then i" and no `aria-keyshortcuts` is set (it cannot express steps). */
  shortcut?: ControlShortcut;
  /** The name is a text node inside the button (for toolbars whose tests, voice control or find-in-page read
   * `textContent`) instead of `aria-label`. It is visually hidden. */
  textName?: boolean;
  size?: IconButtonSize;
  variant?: ButtonProps["variant"];
};

/**
 * An icon-only button that always has a name: 44 px, ghost, named by `label`, with a tooltip on hover and on focus.
 * Do not add `title` (it would announce the name twice). It spreads its props on the `Button`, so a Base UI trigger
 * can render it: `<DialogTrigger render={<IconButton label="Rename"><Pencil /></IconButton>} />`.
 * The tooltip wrapper is always mounted, so a control that becomes disabled keeps its identity.
 * `loading` swaps the icon for the spinner and blocks repeated presses.
 */
export function IconButton({
  label,
  tooltip = true,
  shortcut,
  textName = false,
  size = "icon-lg",
  variant = "ghost",
  loading = false,
  children,
  ...props
}: IconButtonProps) {
  const button = (
    <Button
      aria-keyshortcuts={keyShortcutsValue(shortcut)}
      {...props}
      variant={variant}
      size={size}
      loading={loading}
      aria-label={textName ? undefined : label}
    >
      {/* The spinner takes the icon's place: both would not fit a square button. */}
      {loading ? null : children}
      {textName ? <span className="fui-sr-only">{label}</span> : null}
    </Button>
  );
  if (tooltip === false) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <IconTooltipContent label={tooltip === true ? label : tooltip} shortcut={shortcut} />
    </Tooltip>
  );
}
