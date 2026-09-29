// Origin: Fabrials, 0.8 (promoted from Open Email's platform/format.ts).
import type { ComponentProps } from "react";
import { classes } from "./shared";

const BYTE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

function isEnglish(locale: string) {
  try {
    return new Intl.Locale(locale).language === "en";
  } catch {
    return false;
  }
}

/**
 * A size as people read it: 1024 steps and short unit labels in the given locale ("25 MB", "2,4 MB"); a whole number
 * for bytes and from 100 up, one decimal otherwise. Throws a `RangeError` for a negative or non-finite count: use
 * `FileSize` when the value may be unknown.
 */
export function formatBytes(locale: string, bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError("Invalid byte count");
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < BYTE_UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }
  // English prints the unit "byte" in full ("812 byte") under `unitDisplay: "short"`; a size reads "812 B" everywhere else.
  if (index === 0 && isEnglish(locale)) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} B`;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: BYTE_UNITS[index],
    unitDisplay: "short",
    maximumFractionDigits: index === 0 || value >= 100 ? 0 : 1,
  }).format(value);
}

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
