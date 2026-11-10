// Pure formatters: no hooks, no browser APIs, no directive, so a Server Component can call them. Each is still exported
// from the module of the component it belongs to (file-size, relative-time, file-thumb).

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
 * for bytes and from 100 up, one decimal otherwise. English when `locale` is not given, so a server and a browser write
 * the same. Throws a `RangeError` for a negative or non-finite count: use `FileSize` when the value may be unknown.
 */
export function formatBytes(locale: string | undefined = "en", bytes: number): string {
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

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

export type RelativeTimeStyle = "long" | "short" | "narrow";

/**
 * "3 minutes ago" in the given locale, English when there is none. Under 45 seconds reads as "now";
 * beyond `absoluteAfterDays` it becomes a date.
 */
export function formatRelativeTime(
  date: Date | string | number,
  now: number,
  locale: string | undefined = "en",
  opts: { style?: RelativeTimeStyle; absoluteAfterDays?: number; timeZone?: string } = {},
): string {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.round((time - now) / 1000);
  const abs = Math.abs(seconds);
  const absoluteAfter = (opts.absoluteAfterDays ?? 30) * 86_400;
  if (abs >= absoluteAfter) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: opts.timeZone }).format(time);
  }
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: opts.style ?? "long" });
  if (abs < 45) return format.format(0, "second");
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === "second") return format.format(Math.round(seconds / size), unit);
  }
  return "";
}

/**
 * Options for `Intl.DateTimeFormat`, or a function that picks them per date: a row that drops the year when it is this
 * year needs the clock (`now`) to decide, and the caller owns that rule.
 */
export type AbsoluteTimeFormat =
  | Intl.DateTimeFormatOptions
  | ((date: Date, now: number) => Intl.DateTimeFormatOptions);

/**
 * A date as an absolute, deterministic string ("29 Sept, 09:41"). English when `locale` is not given. It reads no clock
 * unless the format is a function, which receives `opts.now` (default: the current time). Returns "" for an invalid
 * date. Pass a `timeZone` (in the format or in `opts`) for a string that is the same on the server and in the browser.
 */
export function formatAbsoluteTime(
  date: Date | string | number,
  locale: string | undefined = "en",
  format: AbsoluteTimeFormat,
  opts: { now?: number; timeZone?: string } = {},
): string {
  const value = new Date(date);
  if (!Number.isFinite(value.getTime())) return "";
  const options = typeof format === "function" ? format(value, opts.now ?? Date.now()) : format;
  return new Intl.DateTimeFormat(locale, { timeZone: opts.timeZone, ...options }).format(value);
}

/** A short type label for a file tile, from the extension or else the MIME type ("PDF", "JSON", "FILE"). */
export function fileTypeLabel(filename?: string | null, mime?: string | null) {
  const fromName = filename?.match(/\.([a-z0-9]{1,5})$/i)?.[1];
  const fromMime = mime?.split("/")[1]?.split(/[+;.-]/)[0];
  return (fromName || fromMime || "file").slice(0, 4).toUpperCase();
}
