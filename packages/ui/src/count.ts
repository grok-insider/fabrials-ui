// Counting what a field has in it: no hooks, no browser APIs, no directive, so a Server Component can call them. A limit
// counts UTF-16 units, like `maxLength` and like the engines that measure a text; words and graphemes follow the language.

import { formatCount, plural } from "./plural";

/** What a count counts. `characters` is UTF-16 units, the measure of `maxLength` and of a text engine's limit. */
export type CountUnit = "characters" | "words" | "graphemes";

/** How close a count is to its limit: `near` is nine tenths of the way, `at` is the last one allowed, `over` is past it. */
export type CountLevel = "under" | "near" | "at" | "over";

/** What a live region says when a count crosses a line. */
export type CountMilestone = "near" | "at" | "over" | "back";

/** The share of the limit at which a count counts as near it. */
export const COUNT_NEAR = 0.9;

const segmenters = new Map<string, Intl.Segmenter>();

function key(locale: Intl.LocalesArgument | undefined, granularity: "word" | "grapheme") {
  const tag = Array.isArray(locale) ? locale.map(String).join(",") : String(locale ?? "en");
  return `${granularity}:${tag}`;
}

function segmenter(locale: Intl.LocalesArgument | undefined, granularity: "word" | "grapheme") {
  const name = key(locale, granularity);
  let known = segmenters.get(name);
  if (!known) {
    known = new Intl.Segmenter(locale ?? "en", { granularity });
    segmenters.set(name, known);
  }
  return known;
}

/** Whether the engine has `Intl.Segmenter` at all (Firefox before 125 does not: the plain counts take over there). */
export function canSegment(): boolean {
  return typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";
}

/**
 * How many words a text has, the way its own language breaks them (a clitic of Arabic or French stays one word, a number
 * with a hyphen counts once). Without a segmenter, it falls back to the runs of whitespace that hold a letter or a digit,
 * which counts a Chinese sentence as one word: the browser's answer is the one to trust.
 */
export function countWords(value: string, locale: Intl.LocalesArgument = "en", options: { segment?: boolean } = {}): number {
  if (!value.trim()) return 0;
  if (options.segment !== false && canSegment()) {
    let count = 0;
    for (const part of segmenter(locale, "word").segment(value)) if (part.isWordLike) count += 1;
    return count;
  }
  return value
    .trim()
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** How many graphemes a text has: a letter with its accents is one, an emoji joined of several code points is one. */
export function countGraphemes(value: string, locale: Intl.LocalesArgument = "en", options: { segment?: boolean } = {}): number {
  if (!value) return 0;
  if (options.segment !== false && canSegment()) {
    let count = 0;
    for (const _part of segmenter(locale, "grapheme").segment(value)) count += 1;
    return count;
  }
  return Array.from(value).length;
}

/** What a field holds, counted in `unit`: "42", the number of words of a Chinese sentence, the graphemes of an emoji. */
export function countText(value: string, unit: CountUnit = "characters", locale: Intl.LocalesArgument = "en", options: { segment?: boolean } = {}): number {
  if (unit === "characters") return value.length;
  return unit === "words" ? countWords(value, locale, options) : countGraphemes(value, locale, options);
}

/** How close `count` is to `max`: nine tenths is `near`, the last one allowed is `at`, past it is `over`. */
export function countLevel(count: number, max?: number): CountLevel {
  if (max === undefined || max <= 0) return "under";
  if (count > max) return "over";
  if (count === max) return "at";
  return count >= Math.ceil(max * COUNT_NEAR) ? "near" : "under";
}

/**
 * What a live region says when the count moves from `previous` to `level`, or nothing: a crossing is said once (nine tenths,
 * the last one, past it), and coming back under the limit says so. Typing in the middle of a limit says nothing at all.
 */
export function countMilestone(previous: CountLevel | undefined, level: CountLevel): CountMilestone | undefined {
  if (previous === undefined || previous === level) return undefined;
  if (level === "over") return "over";
  if (previous === "over") return "back";
  if (level === "at") return "at";
  if (level === "near" && previous === "under") return "near";
  return undefined;
}

/** A limit as it is counted, written in the reader's digits: "12" of a limit of 280, or "12 over" past it. */
export function countReading(count: number, max: number | undefined, locale: Intl.LocalesArgument = "en") {
  const used = formatCount(count, locale);
  return { used, max: max === undefined ? undefined : formatCount(max, locale), over: max === undefined ? 0 : Math.max(0, count - max) };
}

/**
 * The words of a count: the reading under a field ("42 / 280"), the words past the limit ("12 over"), and the two
 * sentences a live region says ("18 of 20 used", "Under the limit again"). A `LabelsProvider` sets them (scope `count`).
 */
export type CountLabels = {
  /** The counter: the used count, and the limit when there is one. */
  counter: (used: string, max?: string) => string;
  /** Past the limit, in the danger ink and said by a screen reader: "12 over", through the plural rules. */
  over: (count: number, locale: Intl.LocalesArgument) => string;
  /** Said when the count reaches nine tenths of the limit and when it reaches the last one allowed. */
  of: (used: string, max: string) => string;
  /** Said when a count that was past its limit comes back under it. */
  back: string;
};

export const COUNT_LABELS: CountLabels = {
  counter: (used, max) => (max ? `${used} / ${max}` : used),
  over: (count, locale) => plural(count, { one: "{count} over", other: "{count} over" }, locale),
  of: (used, max) => `${used} of ${max} used`,
  back: "Under the limit again",
};

