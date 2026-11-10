import type { ComponentProps } from "react";
import { classes } from "./shared";

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

/**
 * A caption strip along the bottom edge of a card: what the figure shows on the start side, a reading (a total, a
 * peak, a source) on the end side. Set in the label voice (Plex Mono). Put it last in the card.
 */
export function CardCaption({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-caption"
      className={classes("fui-card-caption", className)}
      {...props}
    />
  );
}
