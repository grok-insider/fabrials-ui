"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { Tone } from "./display";
import { classes, type StyledProps } from "./shared";

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
  /** `bar` (default), or `ring`: a circle that closes clockwise, with the label and hint beside it. */
  variant?: "bar" | "ring";
  /** Cuts the bar into that many segments, for a task of known steps (a form in steps, the files of a batch); they ink in order. A bar with a value only. */
  steps?: number;
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
  children,
  "aria-describedby": describedBy,
  ...props
}: ProgressProps) {
  const hintId = useId();
  const known = value != null && Number.isFinite(value);
  const percent = known ? clamp(((value - min) / (max - min || 1)) * 100, 0, 100) : null;
  const ring = variant === "ring";
  const segments = !ring && percent != null && steps != null && steps >= 2 ? Math.min(48, Math.round(steps)) : undefined;
  const valueShown = showValue ?? (label != null || (ring && size === "lg"));
  return (
    <BaseProgress.Root
      value={known ? value : null}
      min={min}
      max={max}
      locale={locale}
      data-slot="progress"
      data-tone={tone}
      data-size={size === "default" ? undefined : size}
      data-variant={ring ? "ring" : undefined}
      aria-describedby={[describedBy, hint != null ? hintId : undefined].filter(Boolean).join(" ") || undefined}
      className={classes("fui-progress", className)}
      {...props}
    >
      {label != null ? <ProgressLabel>{label}</ProgressLabel> : null}
      {valueShown ? <ProgressValue /> : null}
      {children}
      {ring ? (
        <ProgressRing percent={percent} size={size} />
      ) : (
        <ProgressTrack data-steps={segments}>
          {segments ? <ProgressSegments count={segments} percent={percent ?? 0} /> : <ProgressIndicator />}
        </ProgressTrack>
      )}
      {hint != null ? (
        <p className="fui-progress-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </BaseProgress.Root>
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
