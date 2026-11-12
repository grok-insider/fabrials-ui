"use client";

import { useId, type CSSProperties, type ComponentProps, type ReactNode } from "react";
import { Meter as BaseMeter } from "@base-ui/react/meter";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useLocale } from "./labels";
import { classes } from "./shared";
import type { Tone } from "./display";

export { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from "./description-list";
export { StatGroup } from "./stat-group";
export { StatusDot } from "./status-dot";

export type Trend = "up" | "down" | "flat";

export type StatProps = Omit<ComponentProps<"div">, "children"> & {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** Change against the comparison period, e.g. "+12%". */
  delta?: ReactNode;
  trend?: Trend;
  /** Whether the trend is good news. Defaults to up = positive. */
  deltaTone?: "positive" | "negative" | "neutral";
  hint?: ReactNode;
  sparkline?: ReadonlyArray<number>;
  /** A ruler under the value: where it sits in its range (a share of a total, a quota). `label` names it for assistive technology. */
  meter?: { value: number; max?: number; label: string };
  loading?: boolean;
};

/** From this many characters on, a figure no longer fits the narrowest cell of a group at its full size. */
const LONG_FIGURE = 10;

/**
 * For a figure given as text or a number and long enough to need it: its length, so that inside a `StatGroup` the
 * styles can set it as large as its cell allows instead of breaking the number in two. A figure that is an element is
 * left as it is: its length is not known here.
 */
function figureFit(value: ReactNode): { "data-fit"?: ""; style?: CSSProperties } {
  if (typeof value !== "string" && typeof value !== "number") return {};
  const length = Array.from(String(value)).length;
  return length < LONG_FIGURE ? {} : { "data-fit": "", style: { "--fui-figure-ch": length } as CSSProperties };
}

export function Stat({
  label,
  value,
  unit,
  delta,
  trend,
  deltaTone,
  hint,
  sparkline,
  meter,
  loading = false,
  className,
  ...props
}: StatProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const tone =
    deltaTone ??
    (trend === "up" ? "positive" : trend === "down" ? "negative" : "neutral");
  return (
    <div
      data-slot="stat"
      aria-busy={loading || undefined}
      className={classes("fui-stat", className)}
      {...props}
    >
      <p className="fui-stat-label">{label}</p>
      {loading ? (
        <span aria-hidden className="fui-skeleton fui-stat-skeleton" />
      ) : (
        <p className="fui-stat-value" {...figureFit(value)}>
          {value}
          {unit ? <span className="fui-stat-unit">{unit}</span> : null}
        </p>
      )}
      {delta || hint ? (
        <p className="fui-stat-meta">
          {delta ? (
            <span className="fui-stat-delta" data-tone={tone}>
              {trend ? <TrendIcon aria-hidden size={14} /> : null}
              {delta}
            </span>
          ) : null}
          {hint ? <span className="fui-stat-hint">{hint}</span> : null}
        </p>
      ) : null}
      {meter && !loading ? (
        <Meter
          variant="ruler"
          value={meter.value}
          max={meter.max ?? 100}
          showValue={false}
          warnAt={101}
          dangerAt={101}
          aria-label={meter.label}
          className="fui-stat-meter"
        />
      ) : null}
      {sparkline && sparkline.length > 1 && !loading ? (
        <Sparkline data={sparkline} className="fui-stat-sparkline" />
      ) : null}
    </div>
  );
}

export function Sparkline({
  data,
  label,
  color = "var(--chart-1)",
  className,
  ...props
}: Omit<ComponentProps<"svg">, "children"> & {
  data: ReadonlyArray<number>;
  /** Accessible summary. Without it the sparkline is decorative. */
  label?: string;
  color?: string;
}) {
  const width = 120;
  const height = 32;
  const finite = data.map((value) => (Number.isFinite(value) ? value : 0));
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const step = finite.length > 1 ? width / (finite.length - 1) : width;
  const points = finite.map(
    (value, index) =>
      [index * step, height - 2 - ((value - min) / span) * (height - 4)] as const,
  );
  const line = points
    .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const hatch = `fui-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={classes("fui-sparkline", className)}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      focusable="false"
      style={{ color }}
      {...props}
    >
      <defs>
        <pattern id={hatch} width={4} height={3} patternUnits="userSpaceOnUse">
          <rect width={4} height={1} fill="currentColor" />
        </pattern>
      </defs>
      <path
        className="fui-sparkline-hatched"
        fill={`url(#${hatch})`}
        d={`${line} L${width} ${height} L0 ${height} Z`}
      />
      <path className="fui-sparkline-line" d={line} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export type MeterProps = Omit<BaseMeter.Root.Props, "className" | "children"> & {
  className?: string;
  label?: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  /** Automatic tone thresholds as a percentage of the range. */
  warnAt?: number;
  dangerAt?: number;
  showValue?: boolean;
  /** `bar` is a filled track; `ruler` is a scale of ticks, inked up to the value, with a Stormlight mark at the value. */
  variant?: "bar" | "ruler";
  /** Ticks on the ruler. */
  ticks?: number;
  /** The language the value is written in ("42%", "42 %"). Default: a `LabelsProvider`'s, else `"en"`, so the server and the browser write it alike. */
  locale?: Intl.LocalesArgument;
};

export function Meter({
  className,
  label,
  hint,
  tone,
  warnAt = 75,
  dangerAt = 90,
  showValue = true,
  variant = "bar",
  ticks = 40,
  value,
  min = 0,
  max = 100,
  locale: ownLocale,
  ...props
}: MeterProps) {
  const locale = useLocale(ownLocale);
  const percent = ((value - min) / (max - min || 1)) * 100;
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * ticks);
  const resolved: Tone =
    tone ?? (percent >= dangerAt ? "danger" : percent >= warnAt ? "warning" : "neutral");
  return (
    <BaseMeter.Root
      value={value}
      min={min}
      max={max}
      locale={locale}
      data-tone={resolved}
      data-variant={variant === "ruler" ? "ruler" : undefined}
      className={classes("fui-meter", className)}
      {...props}
    >
      {label || showValue ? (
        <div className="fui-meter-header">
          {label ? (
            <BaseMeter.Label className="fui-meter-label">{label}</BaseMeter.Label>
          ) : (
            <span />
          )}
          {showValue ? <BaseMeter.Value className="fui-meter-value" /> : null}
        </div>
      ) : null}
      {variant === "ruler" ? (
        <BaseMeter.Track className="fui-meter-ruler">
          <svg viewBox={`0 0 ${ticks * 4 + 2} 10`} preserveAspectRatio="none" aria-hidden focusable="false">
            {Array.from({ length: ticks + 1 }, (_, index) => {
              const major = index % 10 === 0;
              const mid = !major && index % 5 === 0;
              return (
                <rect
                  key={index}
                  x={index * 4}
                  y={major ? 0 : mid ? 3 : 5}
                  width={1}
                  height={major ? 10 : mid ? 7 : 5}
                  style={{ "--i": index } as CSSProperties}
                  className={index <= filled && filled > 0 ? "fui-meter-tick-on" : "fui-meter-tick"}
                />
              );
            })}
            <rect
              x={0}
              y={0}
              width={2}
              height={10}
              className="fui-meter-mark"
              style={{ transform: `translateX(${Math.min(filled * 4, ticks * 4)}px)` }}
            />
          </svg>
        </BaseMeter.Track>
      ) : (
        <BaseMeter.Track className="fui-meter-track">
          <BaseMeter.Indicator className="fui-meter-indicator" />
          {tone
            ? null
            : [warnAt, dangerAt]
                .filter((at) => at > 0 && at < 100)
                .map((at) => <span key={at} aria-hidden className="fui-meter-notch" style={{ insetInlineStart: `${at}%` }} />)}
        </BaseMeter.Track>
      )}
      {hint ? <p className="fui-meter-hint">{hint}</p> : null}
    </BaseMeter.Root>
  );
}
