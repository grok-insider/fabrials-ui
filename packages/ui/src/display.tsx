"use client";

import type { ComponentProps, CSSProperties } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { classes, type StyledProps } from "./shared";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export function Badge({
  className,
  tone = "neutral",
  variant = "soft",
  dot = false,
  dotColor,
  truncate = false,
  style,
  title,
  children,
  ...props
}: ComponentProps<"span"> & {
  tone?: Tone | "accent";
  variant?: "soft" | "outline" | "solid";
  /** Adds a leading status dot; the text remains the accessible meaning. `"hollow"` is an outline dot (an archived or inactive item). */
  dot?: boolean | "hollow";
  /**
   * Colours the dot only, with any CSS colour (`var(--label-tone)`); it sets `--fui-badge-dot`. To colour the tag itself
   * (tint, hairline and dot) from data, set `--fui-badge-solid` on the badge itself (a class or `style`); `--fui-badge-ink`
   * is the text colour, set the same way. Both are public properties, and the tone attribute only sets their defaults.
   * (`--fui-badge-dot` is not declared on the badge, so it also works from an ancestor.)
   */
  dotColor?: string;
  /**
   * The tag shrinks to its container and cuts long text with an ellipsis (the full text goes to `title` when it is a
   * string and no title is given). `--fui-badge-max` caps the width (default: 100% of the container).
   */
  truncate?: boolean;
}) {
  return (
    <span
      data-slot="badge"
      className={classes("fui-badge", className)}
      data-tone={tone === "accent" ? "info" : tone}
      data-variant={variant}
      data-truncate={truncate || undefined}
      title={title ?? (truncate && typeof children === "string" ? children : undefined)}
      style={dotColor ? ({ "--fui-badge-dot": dotColor, ...style } as CSSProperties) : style}
      {...props}
    >
      {dot ? <span aria-hidden className="fui-badge-dot" data-hollow={dot === "hollow" || undefined} /> : null}
      {truncate ? <span className="fui-badge-text">{children}</span> : children}
    </span>
  );
}

export function Card({
  className,
  interactive = false,
  ...props
}: ComponentProps<"section"> & {
  /** Hover and focus-within affordance for cards that contain one primary link. */
  interactive?: boolean;
}) {
  return (
    <section
      data-slot="card"
      data-interactive={interactive || undefined}
      className={classes("fui-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={classes("fui-card-header", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Heading = "h2",
  ...props
}: ComponentProps<"h2"> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Heading
      data-slot="card-title"
      className={classes("fui-card-title", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={classes("fui-description", className)}
      {...props}
    />
  );
}

export function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={classes("fui-card-action", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={classes("fui-card-content", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={classes("fui-card-footer", className)}
      {...props}
    />
  );
}

export function Alert({
  className,
  variant = "default",
  layout = "stacked",
  children,
  ...props
}: ComponentProps<"div"> & {
  variant?: "default" | "info" | "success" | "warning" | "destructive";
  /**
   * `inline` is a slim notice for the top of a page or a pane: from a width of 48rem the title and the description share
   * one line and the action sits at the end; narrower it stacks like the default. It measures its own width, so it fills
   * its container (give it `flex: 1` in a flex row). Not for status that refreshes periodically: a notice is a one-off.
   */
  layout?: "stacked" | "inline";
}) {
  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      data-slot="alert"
      data-variant={variant}
      data-layout={layout === "inline" ? "inline" : undefined}
      className={classes("fui-alert", className)}
      {...props}
    >
      {layout === "inline" ? <div className="fui-alert-body">{children}</div> : children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-alert-title", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={classes("fui-description", "fui-alert-description", className)}
      {...props}
    />
  );
}

export function AlertAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={classes("fui-actions", "fui-alert-action", className)}
      {...props}
    />
  );
}

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<"hr"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <hr
      data-orientation={orientation}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      className={classes("fui-separator", className)}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={classes("fui-skeleton", className)}
      {...props}
    />
  );
}

export function Progress({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"progress"> & { tone?: Tone }) {
  return (
    <progress
      data-tone={tone}
      className={classes("fui-progress", className)}
      {...props}
    />
  );
}

export function Table({
  className,
  children,
  regionLabel,
  stickyHeader = false,
  ...props
}: ComponentProps<"table"> & { regionLabel?: string; stickyHeader?: boolean }) {
  return (
    <div
      className="fui-table-scroll"
      data-sticky-header={stickyHeader || undefined}
      tabIndex={0}
      role="region"
      aria-label={
        regionLabel ??
        (typeof props["aria-label"] === "string"
          ? `${props["aria-label"]} table`
          : "Scrollable table")
      }
    >
      <table className={classes("fui-table", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export const Tabs = BaseTabs.Root;

export function TableHeader(props: ComponentProps<"thead">) {
  return <thead {...props} />;
}
export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}
export function TableFooter(props: ComponentProps<"tfoot">) {
  return <tfoot {...props} />;
}
export function TableRow(props: ComponentProps<"tr">) {
  return <tr {...props} />;
}
export function TableHead({
  numeric,
  ...props
}: ComponentProps<"th"> & { numeric?: boolean }) {
  return <th scope="col" data-numeric={numeric || undefined} {...props} />;
}
export function TableCell({
  numeric,
  ...props
}: ComponentProps<"td"> & { numeric?: boolean }) {
  return <td data-numeric={numeric || undefined} {...props} />;
}
export function TableCaption(props: ComponentProps<"caption">) {
  return <caption {...props} />;
}

export function TabsList({
  className,
  variant = "underline",
  ...props
}: StyledProps<BaseTabs.List.Props> & { variant?: "underline" | "segmented" }) {
  return (
    <BaseTabs.List
      data-variant={variant}
      className={classes("fui-tabs-list", className)}
      {...props}
    >
      {props.children}
      {variant === "segmented" ? null : (
        <BaseTabs.Indicator className="fui-tabs-indicator" />
      )}
    </BaseTabs.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: StyledProps<BaseTabs.Tab.Props>) {
  return <BaseTabs.Tab className={classes("fui-tab", className)} {...props} />;
}

export function TabsContent({
  className,
  ...props
}: StyledProps<BaseTabs.Panel.Props>) {
  return (
    <BaseTabs.Panel
      className={classes("fui-tab-panel", className)}
      {...props}
    />
  );
}
