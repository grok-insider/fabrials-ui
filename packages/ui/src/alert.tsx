import type { ComponentProps } from "react";
import { classes } from "./shared";

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
