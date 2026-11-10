import type { ComponentProps } from "react";
import { classes } from "./shared";

export function DescriptionList({
  className,
  layout = "grid",
  ...props
}: ComponentProps<"dl"> & {
  /**
   * `grid` aligns every term in one column, `stacked` puts each term above its details. `auto` follows the list's own
   * width: stacked under 30rem, and from 30rem the term in a column of 8 to 11rem beside its details (a drawer, a sheet
   * and a wide panel use the same markup). It makes the list a size container, so it must fill its parent's width.
   */
  layout?: "grid" | "stacked" | "auto";
}) {
  return (
    <dl
      data-layout={layout}
      className={classes("fui-description-list", className)}
      {...props}
    />
  );
}

export function DescriptionItem({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-description-item", className)} {...props} />;
}

export function DescriptionTerm({ className, ...props }: ComponentProps<"dt">) {
  return <dt className={classes("fui-description-term", className)} {...props} />;
}

export function DescriptionDetails({
  className,
  ...props
}: ComponentProps<"dd">) {
  return (
    <dd className={classes("fui-description-details", className)} {...props} />
  );
}
