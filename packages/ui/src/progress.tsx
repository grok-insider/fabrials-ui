"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { Tone } from "./display";
import { classes, type StyledProps } from "./shared";

export type ProgressSegmentState = "done" | "current" | "todo" | "correct" | "incorrect" | "skipped";

export type ProgressSegment = {
  id?: string;
  /** How much of the track the segment takes, against the others. Default 1. */
  weight?: number;
  /** Default `todo`. */
  state?: ProgressSegmentState;
  /** What the segment stands for ("Listening", "Question 3"): spoken with its state, and its tooltip. */
  label: string;
};

export type ProgressMark = {
  /** Where on the track, between `min` and `max`. */
  value: number;
  /** What the mark means ("The shortest test ends here"). It is part of the bar's description. */
  label: string;
  /** Shows the label under the bar, at the mark. Default: the label is only spoken. */
  caption?: boolean;
};

export type ProgressLabels = {
  /** A segmented bar's value while a segment is current: "Step 3 of 8, Listening". Numbers come in the reader's digits. */
  step: (current: string, total: string, label: string) => string;
  /** Its value when none is current: "5 of 8 done". */
  settled: (done: string, total: string) => string;
  /** A segment's spoken name: "Listening, current". */
  segment: (label: string, state: ProgressSegmentState) => string;
  /** Names the group of segment buttons when there is no `label`. */
  segments: string;
};

const SEGMENT_STATES: Record<ProgressSegmentState, string> = {
  done: "done",
  current: "current",
  todo: "to do",
  correct: "correct",
  incorrect: "incorrect",
  skipped: "skipped",
};

const LABELS: ProgressLabels = {
  step: (current, total, label) => `Step ${current} of ${total}, ${label}`,
  settled: (done, total) => `${done} of ${total} done`,
  segment: (label, state) => `${label}, ${SEGMENT_STATES[state]}`,
  segments: "Steps",
};

export type ProgressProps = Omit<BaseProgress.Root.Props, "className" | "children" | "value"> & {
  className?: string;
  /** The language the value is written in ("62%", "62 %"). Default `"en"`, so the server and the browser write it alike; pass the page's. */
  locale?: Intl.LocalesArgument;
  /**
   * How far the task has gone, from `min` (0) to `max` (100). Leave it out, or pass `null`, while the total is not known yet:
   * the track then carries the working light instead of an invented percentage.
   */
  value?: number | null;
  /** What is progressing, at the start of the label row (beside a ring); it names the bar. Without it, give an `aria-label`. */
  label?: ReactNode;
  /** A line under the bar: counts, the time left, what happens next. It describes the bar to assistive technology. */
  hint?: ReactNode;
  /** The value (a percentage, or what `format` makes of it) at the end of the label row. Default: shown with a `label`, and inside a large ring. */
  showValue?: boolean;
  tone?: Tone;
  /** `sm` 4 px for a row, `default` 6 px, `lg` 8 px for a page's task; a ring of 16, 24 or 48 px. */
  size?: "sm" | "default" | "lg";
  /**
   * `bar` (default); `ring`: a circle that closes clockwise, with the label and hint beside it; `scan`: while the total is
   * not known (a search), a strip of square cells where a head of the working light hops across with a trail. With a value,
   * a scan is a bar.
   */
  variant?: "bar" | "ring" | "scan";
  /** Cuts the bar into that many segments, for a task of known steps (a form in steps, the files of a batch); they ink in order. A bar with a value only. */
  steps?: number;
  /**
   * A track of named segments, each as wide as its `weight` and in its own state: the blocks of a session, the questions of a
   * quiz. The bar's value is then the number of segments settled and its spoken value names the current one ("Step 3 of 8,
   * Listening"), unless `value` or `getAriaValueText` say otherwise.
   */
  segments?: readonly ProgressSegment[];
  /**
   * Makes each segment a button that calls back with its place. The segments are then a toolbar (one tab stop, the arrow keys
   * move between them, Home and End reach the ends) named by `label` or `aria-label`, and no longer a progressbar.
   */
  onSegmentSelect?: (index: number) => void;
  /** Ticks on the track of a bar (not a ring, not segments), each with a label that is spoken or shown under it. */
  marks?: readonly ProgressMark[];
  /** The words of a segmented bar. */
  labels?: Partial<ProgressLabels>;
  /** Parts placed before the track, the way shadcn composes it: `ProgressLabel` and `ProgressValue`. */
  children?: ReactNode;
};

const RINGS = { sm: { box: 16, stroke: 2 }, default: { box: 24, stroke: 2.5 }, lg: { box: 48, stroke: 4 } } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function Progress({
  className,
  value = null,
  min = 0,
  max = 100,
  locale = "en",
  label,
  hint,
  showValue,
  tone = "neutral",
  size = "default",
  variant = "bar",
  steps,
  segments: parts,
  onSegmentSelect,
  marks,
  labels,
  children,
  "aria-describedby": describedBy,
  ...props
}: ProgressProps) {
  const hintId = useId();
  if (parts != null && variant !== "ring") {
    return (
      <SegmentedProgress
        aria-describedby={describedBy}
        className={className}
        hint={hint}
        hintId={hintId}
        label={label}
        labels={labels}
        locale={locale}
        onSegmentSelect={onSegmentSelect}
        segments={parts}
        showValue={showValue}
        size={size}
        tone={tone}
        value={value}
        {...props}
      >
        {children}
      </SegmentedProgress>
    );
  }
  const known = value != null && Number.isFinite(value);
  const percent = known ? clamp(((value - min) / (max - min || 1)) * 100, 0, 100) : null;
  const ring = variant === "ring";
  const scan = variant === "scan" && percent == null;
  const segments = !ring && percent != null && steps != null && steps >= 2 ? Math.min(48, Math.round(steps)) : undefined;
  const valueShown = showValue ?? (label != null || (ring && size === "lg"));
  const ticks = !ring && marks != null && marks.length > 0 ? marks : undefined;
  const marksId = `${hintId}-marks`;
  const track = scan ? (
    <ProgressTrack>
      <ProgressScan />
    </ProgressTrack>
  ) : (
    <ProgressTrack data-steps={segments}>
      {segments ? <ProgressSegments count={segments} percent={percent ?? 0} /> : <ProgressIndicator />}
    </ProgressTrack>
  );
  return (
    <BaseProgress.Root
      value={known ? value : null}
      min={min}
      max={max}
      locale={locale}
      data-slot="progress"
      data-tone={tone}
      data-size={size === "default" ? undefined : size}
      data-variant={ring ? "ring" : scan ? "scan" : undefined}
      aria-describedby={[describedBy, hint != null ? hintId : undefined, ticks ? marksId : undefined].filter(Boolean).join(" ") || undefined}
      className={classes("fui-progress", className)}
      {...props}
    >
      {label != null ? <ProgressLabel>{label}</ProgressLabel> : null}
      {valueShown ? <ProgressValue /> : null}
      {children}
      {ring ? (
        <ProgressRing percent={percent} size={size} />
      ) : ticks ? (
        <div className="fui-progress-rail" data-captions={ticks.some((mark) => mark.caption) ? "" : undefined}>
          {track}
          <ProgressMarks id={marksId} marks={ticks} max={max} min={min} />
        </div>
      ) : (
        track
      )}
      {hint != null ? (
        <p className="fui-progress-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </BaseProgress.Root>
  );
}

/**
 * Where each mark sits, as a share of the track from its start (so a right-to-left page mirrors it). What is drawn is hidden
 * from assistive technology; the labels are one hidden sentence that describes the bar.
 */
function ProgressMarks({ id, marks, min, max }: { id: string; marks: readonly ProgressMark[]; min: number; max: number }) {
  return (
    <span className="fui-progress-marks">
      {marks.map((mark, index) => {
        const at = clamp(((mark.value - min) / (max - min || 1)) * 100, 0, 100);
        return (
          <span
            aria-hidden
            className="fui-progress-mark"
            // A caption is centred on its tick, and turns inward near an end of the track so it never leaves the bar.
            data-align={at < 15 ? "start" : at > 85 ? "end" : undefined}
            key={index}
            style={{ "--fui-progress-mark-at": `${at}%` } as CSSProperties}
          >
            <span className="fui-progress-mark-tick" />
            {mark.caption ? <span className="fui-progress-mark-caption">{mark.label}</span> : null}
          </span>
        );
      })}
      <span className="fui-sr-only" id={id}>
        {marks.map((mark) => mark.label).join(". ")}
      </span>
    </span>
  );
}

const SETTLED: ReadonlySet<ProgressSegmentState> = new Set(["done", "correct", "incorrect", "skipped"]);

/** Home and End for the segment buttons: Base UI's toolbar has the arrows but not these two. */
function moveToEdge(event: KeyboardEvent<HTMLDivElement>) {
  if ((event.key !== "Home" && event.key !== "End") || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const items = event.currentTarget.querySelectorAll<HTMLElement>(".fui-progress-part");
  const edge = event.key === "Home" ? items[0] : items[items.length - 1];
  if (!edge) return;
  event.preventDefault();
  edge.focus();
}

type SegmentedProps = Omit<ProgressProps, "segments" | "variant" | "steps" | "marks" | "min" | "max"> & { segments: readonly ProgressSegment[]; hintId: string };

function SegmentedProgress({
  className,
  segments,
  onSegmentSelect,
  value,
  locale = "en",
  label,
  hint,
  hintId,
  showValue,
  tone = "neutral",
  size = "default",
  labels: ownLabels,
  children,
  getAriaValueText,
  format,
  render: _render,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-valuetext": ariaValueText,
  "aria-describedby": describedBy,
  ...props
}: SegmentedProps) {
  const labels = { ...LABELS, ...ownLabels };
  const number = new Intl.NumberFormat(locale);
  const total = segments.length;
  const current = segments.findIndex((segment) => segment.state === "current");
  const settled = segments.filter((segment) => SETTLED.has(segment.state ?? "todo")).length;
  const text = current >= 0 ? labels.step(number.format(current + 1), number.format(total), segments[current]!.label) : labels.settled(number.format(settled), number.format(total));
  const described = [describedBy, hint != null ? hintId : undefined].filter(Boolean).join(" ") || undefined;
  const shared = {
    "data-slot": "progress",
    "data-tone": tone,
    "data-size": size === "default" ? undefined : size,
    "data-variant": "segments",
    className: classes("fui-progress", className),
  };
  const hintLine =
    hint != null ? (
      <p className="fui-progress-hint" id={hintId}>
        {hint}
      </p>
    ) : null;
  const item = (segment: ProgressSegment) => {
    const state = segment.state ?? "todo";
    return {
      "aria-current": state === "current" ? ("step" as const) : undefined,
      className: "fui-progress-part",
      "data-state": state,
      style: { flexGrow: Math.max(segment.weight ?? 1, 0.01) },
      title: segment.label,
      children: <span className="fui-sr-only">{labels.segment(segment.label, state)}</span>,
    };
  };

  if (onSegmentSelect) {
    const labelId = `${hintId}-label`;
    return (
      <div {...shared} data-interactive="" style={typeof style === "function" ? undefined : style} {...props}>
        {label != null ? (
          <span className="fui-progress-label" data-slot="progress-label" id={labelId}>
            {label}
          </span>
        ) : null}
        {showValue ? (
          <span aria-hidden className="fui-progress-value" data-slot="progress-value">
            {text}
          </span>
        ) : null}
        {children}
        <BaseToolbar.Root
          aria-describedby={described}
          aria-label={ariaLabelledBy == null && label == null ? (ariaLabel ?? labels.segments) : ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (label != null && ariaLabel == null ? labelId : undefined)}
          className="fui-progress-parts"
          onKeyDown={moveToEdge}
        >
          {segments.map((segment, index) => (
            <BaseToolbar.Button key={segment.id ?? index} onClick={() => onSegmentSelect(index)} {...item(segment)} />
          ))}
        </BaseToolbar.Root>
        {hintLine}
      </div>
    );
  }

  return (
    <BaseProgress.Root
      value={value ?? settled}
      min={0}
      max={Math.max(total, 1)}
      locale={locale}
      format={format}
      getAriaValueText={getAriaValueText ?? (() => text)}
      aria-describedby={described}
      // Left out when the host gave none: an explicit undefined would erase the name the label gives and the value text.
      {...(ariaLabel != null ? { "aria-label": ariaLabel } : null)}
      {...(ariaLabelledBy != null ? { "aria-labelledby": ariaLabelledBy } : null)}
      {...(ariaValueText != null ? { "aria-valuetext": ariaValueText } : null)}
      style={style}
      {...shared}
      {...props}
    >
      {label != null ? <ProgressLabel>{label}</ProgressLabel> : null}
      {showValue ? <ProgressValue>{() => text}</ProgressValue> : null}
      {children}
      <ol className="fui-progress-parts">
        {segments.map((segment, index) => (
          <li key={segment.id ?? index} {...item(segment)} />
        ))}
      </ol>
      {hintLine}
    </BaseProgress.Root>
  );
}

/**
 * The scan's strip: as many square cells as fit the track (each as wide as the track is tall, 2 px apart), measured once
 * mounted and again when the track changes width. The head's place is one number for the whole strip (--fui-scan-p).
 */
function ProgressScan() {
  const strip = useRef<HTMLSpanElement | null>(null);
  const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const node = strip.current;
    if (!node) return;
    const measure = () => {
      const cell = node.clientHeight;
      if (!cell) return;
      setCount(Math.max(4, Math.floor((node.clientWidth + 2) / (cell + 2))));
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    return () => observer?.disconnect();
  }, []);
  return (
    <span
      aria-hidden
      className="fui-progress-scan"
      ref={strip}
      style={{ "--fui-scan-count": count, "--fui-scan-steps": count + 4, "--fui-scan-duration": `${(count + 4) * 60}ms` } as CSSProperties}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} style={{ "--i": index } as CSSProperties} />
      ))}
    </span>
  );
}

function ProgressSegments({ count, percent }: { count: number; percent: number }) {
  const done = (percent / 100) * count;
  return Array.from({ length: count }, (_, index) => (
    <span
      aria-hidden
      className="fui-progress-segment"
      data-filled={done >= index + 1 || undefined}
      key={index}
      style={{ "--i": index, "--fill": clamp(done - index, 0, 1) } as CSSProperties}
    />
  ));
}

function ProgressRing({ percent, size }: { percent: number | null; size: keyof typeof RINGS }) {
  const { box, stroke } = RINGS[size];
  const centre = box / 2;
  const radius = (box - stroke) / 2;
  return (
    <ProgressTrack
      className="fui-progress-ring"
      style={{ "--fui-progress-ring-size": `${box}px`, "--fui-progress-ring-stroke": `${stroke}px` } as CSSProperties}
    >
      <svg aria-hidden focusable="false" viewBox={`0 0 ${box} ${box}`}>
        <circle className="fui-progress-ring-track" cx={centre} cy={centre} pathLength={100} r={radius} strokeWidth={stroke} />
        {percent ? (
          <circle
            className="fui-progress-ring-fill"
            cx={centre}
            cy={centre}
            pathLength={100}
            r={radius}
            strokeWidth={stroke}
            style={{ strokeDashoffset: 100 - percent }}
          />
        ) : null}
      </svg>
      {percent == null ? <span aria-hidden className="fui-progress-ring-light" /> : null}
    </ProgressTrack>
  );
}

/** Names the bar: Progress labels itself with it (shadcn's `ProgressLabel`). */
export function ProgressLabel({ className, ...props }: StyledProps<BaseProgress.Label.Props>) {
  return <BaseProgress.Label data-slot="progress-label" className={classes("fui-progress-label", className)} {...props} />;
}

/**
 * The value as text, at the end of the label row. A function child writes it yourself (`(formatted, value) => …`, for
 * "1,204 of 3,000"); match it with `getAriaValueText` on Progress. It is hidden from assistive technology, which reads the bar.
 */
export function ProgressValue({ className, ...props }: StyledProps<BaseProgress.Value.Props>) {
  return <BaseProgress.Value data-slot="progress-value" className={classes("fui-progress-value", className)} {...props} />;
}

/** The rounded track Progress draws; exported with shadcn's name. */
export function ProgressTrack({ className, ...props }: StyledProps<BaseProgress.Track.Props>) {
  return <BaseProgress.Track data-slot="progress-track" className={classes("fui-progress-track", className)} {...props} />;
}

/** The fill inside the track; exported with shadcn's name. */
export function ProgressIndicator({ className, ...props }: StyledProps<BaseProgress.Indicator.Props>) {
  return (
    <BaseProgress.Indicator data-slot="progress-indicator" className={classes("fui-progress-indicator", className)} {...props} />
  );
}
