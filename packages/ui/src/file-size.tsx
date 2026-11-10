// Origin: Fabrials, 0.8 (promoted from Open Email's platform/format.ts).
import type { ComponentProps } from "react";
import { formatBytes } from "./format";
import { classes } from "./shared";

export { formatBytes } from "./format";

/**
 * A `formatBytes` size as a tabular, unbroken span, with the exact count in the `title`. Rendering never throws:
 * an unknown or invalid size shows `fallback` (nothing by default).
 */
export function FileSize({
  bytes,
  locale = "en",
  fallback = null,
  className,
  title,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  bytes: number | null | undefined;
  locale?: string;
  fallback?: ComponentProps<"span">["children"];
}) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    return fallback === null ? null : (
      <span className={classes("fui-file-size", className)} {...props}>
        {fallback}
      </span>
    );
  }
  return (
    <span
      data-slot="file-size"
      className={classes("fui-file-size", className)}
      title={title ?? new Intl.NumberFormat(locale, { style: "unit", unit: "byte", unitDisplay: "long" }).format(bytes)}
      {...props}
    >
      {formatBytes(locale, bytes)}
    </span>
  );
}
