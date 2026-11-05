"use client";
// Origin: shadcn/ui chart (Recharts), adapted 2026-09-22 for Fabrials metric series. Restyled with fui- classes in 0.4.

import { useEffect, useId, useMemo, useRef, useState } from "react";
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

/**
 * The 0.10 series material. Bars are 2 px ordered dither: the first series dense in Stormlight, the second and third
 * in ink at half and a quarter, so the chart reads in greyscale and print; from the fourth on, the chart hues. Lines
 * follow the same order (Stormlight, ink, dashed ink). A series with its own `color` is always solid.
 */
const DITHER = [
  { id: "a", color: "var(--brand)", cells: [[0, 0], [2, 0], [2, 2]] },
  { id: "b", color: "var(--foreground)", cells: [[0, 0], [2, 2]] },
  { id: "c", color: "var(--foreground)", cells: [[0, 0]] },
] as const;

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
  /** `dither` (default) draws the Fabrials series material; `solid` fills with the chart hues. */
  texture?: "dither" | "solid";
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
  texture = "dither",
  className,
}: SeriesChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
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
      series.map((item, index) => {
        const material = texture === "dither" && !item.color ? DITHER[index] : undefined;
        return {
          ...item,
          label: item.label ?? item.key,
          dashed: item.dashed ?? (texture === "dither" && !item.color && index === 2),
          color: item.color ?? material?.color ?? PALETTE[index % PALETTE.length],
          fill: material ? `url(#fui-dither-${uid}-${material.id})` : item.color ?? PALETTE[index % PALETTE.length],
        };
      }),
    [series, texture, uid],
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
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 3" />
      <XAxis
        dataKey={xKey}
        axisLine={{ stroke: "var(--fui-mark)" }}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={16}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--fui-font-label)" }}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={72}
        tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--fui-font-label)" }}
        tickFormatter={(value: number) => yFormat(value)}
      />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.45 }}
        content={(props) => (
          <SeriesTooltip
            active={props.active}
            label={props.label}
            payload={props.payload}
            paints={new Map(painted.map((item) => [item.label, kind === "bar" ? item.fill : item.color]))}
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
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                aria-label={caption}
              >
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
              <BarChart
                data={data}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="22%"
                aria-label={caption}
              >
                {axes}
                <DitherPatterns uid={uid} />
                {visible.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    name={item.label}
                    fill={item.fill}
                    stackId={stacked ? "series" : undefined}
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
            // By position: two rows can share a label (two weeks, a repeated date) and a duplicate key makes React reuse the wrong row.
            <tr key={index}>
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
                  <Swatch paint={kind === "bar" ? item.fill : item.color} />
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

function DitherPatterns({ uid }: { uid: string }) {
  return (
    <defs>
      {DITHER.map((material) => (
        <pattern key={material.id} id={`fui-dither-${uid}-${material.id}`} width={4} height={4} patternUnits="userSpaceOnUse">
          {material.cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={2} height={2} fill={material.color} />
          ))}
        </pattern>
      ))}
    </defs>
  );
}

/** A legend or tooltip key: a solid square, or a square of the series' dither when its paint is a pattern. */
function Swatch({ paint }: { paint?: string }) {
  if (paint?.startsWith("url(")) {
    return (
      <svg aria-hidden focusable="false" className="fui-chart-swatch" viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect width={10} height={10} fill={paint} />
      </svg>
    );
  }
  return <span aria-hidden className="fui-chart-swatch" style={{ background: paint }} />;
}

function SeriesTooltip({
  active,
  payload,
  label,
  paints,
  titleKey,
  yFormat,
}: {
  paints: ReadonlyMap<string, string>;
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
          {rows.map((item, index) => (
            // By position: two series may carry the same label.
            <li className="fui-chart-tip-row" key={index}>
              <span className="fui-chart-tip-name">
                <Swatch paint={paints.get(String(item.name ?? "")) ?? item.color} />
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
