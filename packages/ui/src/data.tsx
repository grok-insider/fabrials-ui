"use client";

import type { ComponentProps, ReactNode } from "react";
import { Meter as BaseMeter } from "@base-ui/react/meter";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { classes } from "./shared";
import type { Tone } from "./display";

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
  loading?: boolean;
};

export function Stat({
  label,
  value,
  unit,
  delta,
  trend,
  deltaTone,
  hint,
  sparkline,
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
        <p className="fui-stat-value">
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
      {sparkline && sparkline.length > 1 && !loading ? (
        <Sparkline data={sparkline} className="fui-stat-sparkline" />
      ) : null}
    </div>
  );
}

export function StatGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-group"
      className={classes("fui-stat-group", className)}
      {...props}
    />
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
      <path
        className="fui-sparkline-area"
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
};

export function Meter({
  className,
  label,
  hint,
  tone,
  warnAt = 75,
  dangerAt = 90,
  showValue = true,
  value,
  min = 0,
  max = 100,
  ...props
}: MeterProps) {
  const percent = ((value - min) / (max - min || 1)) * 100;
  const resolved: Tone =
    tone ?? (percent >= dangerAt ? "danger" : percent >= warnAt ? "warning" : "neutral");
  return (
    <BaseMeter.Root
      value={value}
      min={min}
      max={max}
      data-tone={resolved}
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
      <BaseMeter.Track className="fui-meter-track">
        <BaseMeter.Indicator className="fui-meter-indicator" />
      </BaseMeter.Track>
      {hint ? <p className="fui-meter-hint">{hint}</p> : null}
    </BaseMeter.Root>
  );
}

export function StatusDot({
  tone = "neutral",
  label,
  hideLabel = false,
  pulse = false,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  tone?: Tone;
  /** Text companion for the color. Required; hide it visually with hideLabel. */
  label: ReactNode;
  hideLabel?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      data-slot="status"
      data-tone={tone}
      data-pulse={pulse || undefined}
      className={classes("fui-status", className)}
      {...props}
    >
      <span aria-hidden className="fui-status-dot" />
      <span className={hideLabel ? "fui-sr-only" : "fui-status-label"}>{label}</span>
    </span>
  );
}

export function DescriptionList({
  className,
  layout = "grid",
  ...props
}: ComponentProps<"dl"> & { layout?: "grid" | "stacked" }) {
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
