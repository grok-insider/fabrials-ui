// Origin: Vercel AI Elements suggestion (ai-sdk.dev/elements) via Radiant, copied 2026-09-26. Restyled with fui- classes and made product-agnostic.
import { Children, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { classes } from "./shared";

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
};

export function SuggestionGrid({
  columns = 2,
  className,
  style,
  children,
  ...props
}: SuggestionGridProps) {
  return (
    <ul
      className={classes("fui-suggestion-grid", className)}
      style={{ "--fui-suggestion-columns": columns, ...style } as CSSProperties}
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
