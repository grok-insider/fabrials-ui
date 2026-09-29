"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's ui/status-details.tsx and its rules in app/styles/navigation.css).

import type { ComponentProps, ReactNode } from "react";
import { Button } from "./controls";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { classes } from "./shared";

/**
 * A status that is one sentence long, in a toolbar or a header: an icon (or an icon and a word) that opens an anchored popover
 * with the title, the description and what a person can do about it (`children`, usually a button). It is not a modal and not
 * a tooltip: Base UI gives the popup `role="dialog"` named by the title, and Escape returns focus to the trigger.
 *
 * `attention` tints the trigger with a status ink (`true` is danger; `"warning"`), and is never the only signal: the icon
 * should change with the state and `label` adds a visible word. Without `label` the trigger is a 44 px icon button named
 * "title: description". With `label` the name is the title and the label; `compact` hides the label visually (a narrow bar) and keeps it
 * in the name. The trigger carries `title={description}` for hover.
 */
export function StatusPopover({
  title,
  description,
  icon,
  label,
  attention = false,
  compact = false,
  side = "bottom",
  align = "end",
  keepMounted,
  className,
  children,
  ...root
}: Omit<ComponentProps<typeof Popover>, "children"> & {
  title: string;
  description: string;
  icon: ReactNode;
  /** A visible word beside the icon. */
  label?: string;
  attention?: boolean | "warning" | "danger";
  /** Icon only, whatever the width; the label stays in the accessible name. */
  compact?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  keepMounted?: boolean;
  className?: string;
  /** What to do about it, shown under the description. */
  children?: ReactNode;
}) {
  const tone = attention === true ? "danger" : attention || undefined;
  return (
    <span
      className={classes("fui-status-popover", className)}
      data-attention={tone}
      data-compact={compact || undefined}
    >
      <Popover {...root}>
        <PopoverTrigger
          render={
            label ? (
              <Button
                variant="ghost"
                size="lg"
                className="fui-status-popover-trigger"
                title={description}
              >
                {icon}
                <span className="fui-sr-only">{title}: </span>
                <span className={compact ? "fui-sr-only" : "fui-status-popover-label"}>{label}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-lg"
                className="fui-status-popover-trigger"
                aria-label={`${title}: ${description}`}
                title={description}
              >
                {icon}
              </Button>
            )
          }
        />
        <PopoverContent
          side={side}
          align={align}
          keepMounted={keepMounted}
          className="fui-status-popover-content"
        >
          <PopoverHeader>
            <PopoverTitle>{title}</PopoverTitle>
            <PopoverDescription>{description}</PopoverDescription>
          </PopoverHeader>
          {children}
        </PopoverContent>
      </Popover>
    </span>
  );
}
