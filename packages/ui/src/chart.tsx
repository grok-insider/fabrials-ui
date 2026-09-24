"use client";
// Origin: shadcn/ui chart (Recharts), adapted 2026-09-22 for Fabrials metric series. Restyled with fui- classes in 0.4.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { classes } from "./shared";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
  dashed?: boolean;
};

export type SeriesChartProps = {
  data: Array<Record<string, string | number | null | undefined>>;
  xKey: string;
  series: ChartSeries[];
  kind?: "bar" | "line";
  stacked?: boolean;
  lineType?: "monotone" | "step";
  yFormat?: (value: number) => string;
  titleKey?: string;
  caption: string;
  height?: number;
  className?: string;
};

export function SeriesChart({
  data,
  xKey,
  series,
  kind = "bar",
  stacked = false,
  lineType = "monotone",
  yFormat = (value) => String(value),
  titleKey,
  caption,
  height = 288,
  className,
}: SeriesChartProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () => setFrameWidth(Math.round(element.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const painted = useMemo(
    () =>
      series.map((item, index) => ({
        ...item,
        label: item.label ?? item.key,
        color: item.color ?? PALETTE[index % PALETTE.length],
      })),
    [series],
  );
  const visible = painted.filter((item) => !hidden.has(item.key));

  function toggle(key: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === painted.length) return new Set();
      return next;
    });
  }

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={xKey}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={72}
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        tickFormatter={(value: number) => yFormat(value)}
      />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.45 }}
        content={(props) => (
          <SeriesTooltip
            active={props.active}
            label={props.label}
            payload={props.payload}
            titleKey={titleKey}
            yFormat={yFormat}
          />
        )}
      />
    </>
  );

  return (
    <div ref={frameRef} className={classes("fui-chart", className)}>
      <div className="fui-chart-frame" style={{ height }}>
        {frameWidth > 0 ? (
        <ResponsiveContainer
          width={frameWidth}
          height={height}
          initialDimension={{ width: frameWidth, height }}
        >
          {kind === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              {axes}
              {visible.map((item) => (
                <Line
                  key={item.key}
                  type={lineType === "step" ? "stepAfter" : "monotone"}
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2}
                  strokeDasharray={item.dashed ? "5 4" : undefined}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
              {axes}
              {visible.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  stackId={stacked ? "series" : undefined}
                  radius={stacked ? undefined : [4, 4, 0, 0]}
                  maxBarSize={48}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
        ) : null}
      </div>
      <table className="fui-sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Label</th>
            {painted.map((item) => (
              <th key={item.key}>{item.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`${String(row[xKey] ?? index)}`}>
              <th>{String(titleKey ? row[titleKey] ?? row[xKey] : row[xKey] ?? "")}</th>
              {painted.map((item) => (
                <td key={item.key}>{yFormat(numeric(row[item.key]))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {painted.length > 1 ? (
        <div className="fui-chart-legend">
          {painted.map((item) => {
            const shown = !hidden.has(item.key);
            return (
              <span key={item.key} className="fui-chart-legend-item">
                <button
                  type="button"
                  aria-pressed={shown}
                  aria-label={shown ? `Hide ${item.label}` : `Show ${item.label}`}
                  className="fui-chart-legend-toggle"
                  onClick={() => toggle(item.key)}
                >
                  <span aria-hidden className="fui-chart-swatch" style={{ background: item.color }} />
                  <span data-hidden={shown ? undefined : ""}>{item.label}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Show only ${item.label}`}
                  className="fui-chart-legend-only"
                  onClick={() => setHidden(new Set(painted.filter((entry) => entry.key !== item.key).map((entry) => entry.key)))}
                >
                  Only
                </button>
              </span>
            );
          })}
          {visible.length !== painted.length ? (
            <button
              type="button"
              className="fui-chart-legend-reset"
              onClick={() => setHidden(new Set())}
            >
              Show all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SeriesTooltip({
  active,
  payload,
  label,
  titleKey,
  yFormat,
}: {
  active?: boolean;
  label?: unknown;
  titleKey?: string;
  yFormat: (value: number) => string;
  payload?: ReadonlyArray<{
    name?: unknown;
    value?: unknown;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const title = titleKey && row ? row[titleKey] : label;
  const rows = payload.filter((item) => numeric(item.value) !== 0);
  const total = payload.reduce((sum, item) => sum + numeric(item.value), 0);
  return (
    <div className="fui-chart-tip">
      <p className="fui-chart-tip-title">{String(title ?? "")}</p>
      {rows.length ? (
        <ul className="fui-chart-tip-list">
          {rows.map((item) => (
            <li className="fui-chart-tip-row" key={String(item.name)}>
              <span className="fui-chart-tip-name">
                <span aria-hidden className="fui-chart-swatch" style={{ background: item.color }} />
                <span>{String(item.name ?? "")}</span>
              </span>
              <span className="fui-chart-tip-value">{yFormat(numeric(item.value))}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No value</p>
      )}
      {payload.length > 1 ? (
        <p className="fui-chart-tip-total">
          <span>Total</span>
          <span>{yFormat(total)}</span>
        </p>
      ) : null}
    </div>
  );
}

function numeric(value: unknown): number {
  const next = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}
