"use client";
// The counter under a field (0.12). The count itself is `count.ts`; this is the row a person reads and the region a screen
// reader hears, with the limit crossing said once.

import { useEffect, useRef, useState } from "react";
import {
  COUNT_LABELS,
  countLevel,
  countMilestone,
  countReading,
  countText,
  type CountLabels,
  type CountLevel,
  type CountUnit,
} from "./count";
import { useLabels, useLocale } from "./labels";
import { classes } from "./shared";

/**
 * `count={true}` shows how much the field holds; with `max` it shows the limit too. `unit` defaults to characters, which is
 * what `maxLength` counts. `soft` (the default) never truncates: the counter turns to the danger ink and says how far past
 * the limit the text is. `soft: false` sets `maxLength` for characters; words and graphemes cannot be stopped by an input,
 * so a hard limit there still only counts.
 */
export type CountProps =
  | true
  | {
      max?: number;
      unit?: CountUnit;
      soft?: boolean;
    };

export type FieldCountProps = {
  /** The id the field points at with `aria-describedby`. */
  id: string;
  /** What the field holds. */
  value: string;
  count: CountProps;
  labels?: Partial<CountLabels>;
  locale?: Intl.LocalesArgument;
  className?: string;
};

/** The limit a field is given, resolved: what it counts, whether it can be enforced, and the `maxLength` that enforces it. */
export function countLimit(count: CountProps | undefined) {
  const settings = typeof count === "object" ? count : {};
  const unit: CountUnit = settings.unit ?? "characters";
  const max = typeof settings.max === "number" && Number.isFinite(settings.max) ? Math.max(0, Math.floor(settings.max)) : undefined;
  const soft = settings.soft ?? true;
  return { unit, max, soft, maxLength: !soft && unit === "characters" ? max : undefined };
}

/** How long a crossing waits before it is said, so typing through two lines is said once. */
const SAY_AFTER = 400;

/**
 * The counter under a field, in the label voice, with the words past the limit beside it and a polite region that says a
 * crossing once ("18 of 20 used", "12 over", "Under the limit again"). The field names it with `aria-describedby`.
 */
export function FieldCount({ id, value, count, labels: ownLabels, locale: ownLocale, className }: FieldCountProps) {
  const labels = useLabels("count", COUNT_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const { unit, max } = countLimit(count);
  const n = countText(value, unit, locale);
  const level = countLevel(n, max);
  const { used, max: limit, over } = countReading(n, max, locale);
  const previous = useRef<CountLevel | undefined>(undefined);
  const [said, setSaid] = useState("");
  const timer = useRef<number | undefined>(undefined);
  // What a crossing says when it is said: the count as it is then, not as it was when the line was crossed (a paste overshoots).
  const words =
    level === "over" ? labels.over(over, locale) : level === "under" ? labels.back : labels.of(used, limit ?? "");
  const saying = useRef(words);
  saying.current = words;
  useEffect(() => {
    const milestone = countMilestone(previous.current, level);
    previous.current = level;
    if (!milestone) return;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setSaid(saying.current);
    }, SAY_AFTER);
  }, [level, words]);
  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <>
      <span className={classes("fui-count", className)} data-level={level} data-unit={unit} id={id}>
        <span className="fui-count-value">{labels.counter(used, limit)}</span>
        {over > 0 ? <span className="fui-count-over">{labels.over(over, locale)}</span> : null}
      </span>
      <span className="fui-sr-only" data-slot="count-live" aria-live="polite" role="status">
        {said}
      </span>
    </>
  );
}

/** The id a field's counter is named by: the field's own id with a suffix, or a generated one when the field has none. */
export function countId(id: string | undefined, generated: string) {
  return id ? `${id}-count` : generated;
}

/** The described-by a field ends up with: its own, then the counter's. */
export function mergeDescribedBy(own: string | undefined, added: string | undefined) {
  return [own, added].filter(Boolean).join(" ") || undefined;
}
