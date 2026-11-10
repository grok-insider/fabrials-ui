"use client";
// Origin: Vercel AI Elements suggestion (ai-sdk.dev/elements) via Radiant, copied 2026-09-26. Restyled with fui- classes and made product-agnostic.

import { Children, useRef, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { classes } from "./shared";
import { useOverflowTabStop } from "./use-overflow";

export type SuggestionCardProps = Omit<ComponentProps<"button">, "title" | "children"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

export function SuggestionCard({
  title,
  description,
  icon,
  className,
  type = "button",
  ...props
}: SuggestionCardProps) {
  return (
    <button type={type} className={classes("fui-suggestion-card", className)} {...props}>
      {icon ? (
        <span aria-hidden className="fui-suggestion-card-icon">
          {icon}
        </span>
      ) : null}
      <span className="fui-suggestion-card-text">
        <span className="fui-suggestion-card-title">{title}</span>
        {description ? (
          <span className="fui-suggestion-card-description">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export type SuggestionGridProps = ComponentProps<"ul"> & {
  columns?: 1 | 2 | 3 | 4;
  /** The name of the row, for a screen reader: it shows one suggestion at a time on a phone and scrolls sideways. */
  label?: string;
};

/**
 * Suggestions side by side, a row that scrolls sideways on a phone and a grid from 768 px. While it holds more than it
 * shows it is a tab stop with a name, so the keyboard can reach it and scroll it; when everything fits it is not a stop.
 */
export function SuggestionGrid({
  columns = 2,
  label = "Suggestions",
  className,
  style,
  children,
  ...props
}: SuggestionGridProps) {
  const row = useRef<HTMLUListElement | null>(null);
  return (
    <ul
      className={classes("fui-suggestion-grid", className)}
      style={{ "--fui-suggestion-columns": columns, ...style } as CSSProperties}
      aria-label={props["aria-label"] ?? label}
      ref={row}
      tabIndex={useOverflowTabStop(row)}
      {...props}
    >
      {Children.map(children, (child: ReactNode) =>
        child == null || child === false ? null : (
          <li className="fui-suggestion-grid-item">{child}</li>
        ),
      )}
    </ul>
  );
}
