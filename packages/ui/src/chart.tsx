"use client";
// Origin: shadcn/ui chart (Recharts), adapted 2026-09-22 for Fabrials metric series. Restyled with fui- classes in 0.4.

import { useId, useMemo, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
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
import { useLabels, useLocale, useProvidedLocale } from "./labels";
import { formatCount } from "./plural";
import { classes } from "./shared";
import { useElementSize } from "./use-element-size";

/** The plot is as wide as the frame's padding box in whole pixels; its height is the `height` prop, never measured. */
const frameSize = (element: HTMLElement) => ({ width: Math.round(element.clientWidth), height: 0 });

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

export type SeriesChartLabels = {
  /** The heading of the first column of the table a screen reader reads. */
  label: string;
  hide: (series: string) => string;
  show: (series: string) => string;
  showOnly: (series: string) => string;
  only: string;
  showAll: string;
  noValue: string;
  total: string;
};

const CHART_LABELS: SeriesChartLabels = {
  label: "Label",
  hide: (series) => `Hide ${series}`,
  show: (series) => `Show ${series}`,
  showOnly: (series) => `Show only ${series}`,
  only: "Only",
  showAll: "Show all",
  noValue: "No value",
  total: "Total",
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
  /** The words of the legend, the tooltip and the table. A `LabelsProvider` sets them for every chart (scope `chart`). */
  labels?: Partial<SeriesChartLabels>;
  /** The locale values are written in when there is no `yFormat`. Without one (here or from a provider) a value is plain digits. */
  locale?: Intl.LocalesArgument;
  className?: string;
};

export function SeriesChart({
  data,
  xKey,
  series,
  kind = "bar",
  stacked = false,
  lineType = "monotone",
  yFormat: yFormatProp,
  titleKey,
  caption,
  height = 288,
  texture = "dither",
  labels: ownLabels,
  locale: ownLocale,
  className,
}: SeriesChartProps) {
  const labels = useLabels("chart", CHART_LABELS, ownLabels);
  const locale = useProvidedLocale(ownLocale);
  const yFormat = yFormatProp ?? ((value: number) => (locale ? formatCount(value, locale) : String(value)));
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { ref: frameRef, width: frameWidth } = useElementSize<HTMLDivElement>(undefined, { measure: frameSize });
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
            labels={labels}
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
            <th>{labels.label}</th>
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
        <ChartLegend>
          {painted.map((item) => {
            const shown = !hidden.has(item.key);
            const paint = kind === "bar" ? item.fill : item.color;
            return (
              <LegendItem
                key={item.key}
                color={paint}
                hidden={!shown}
                label={item.label}
                labels={labels}
                onOnly={() => setHidden(new Set(painted.filter((entry) => entry.key !== item.key).map((entry) => entry.key)))}
                onToggle={() => toggle(item.key)}
              />
            );
          })}
          {visible.length !== painted.length ? (
            <button
              type="button"
              className="fui-chart-legend-reset"
              onClick={() => setHidden(new Set())}
            >
              {labels.showAll}
            </button>
          ) : null}
        </ChartLegend>
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

/** How a key is painted: a solid square, a dashed rule (a dashed line), or the house's 2 px ordered dither. */
export type SwatchPattern = "solid" | "dashed" | "dither";

export type SwatchProps = {
  /** The colour of the key: a token (`var(--chart-1)`), a hue, or a paint a chart defines (`url(#fui-dither-…)`). */
  color?: string;
  /** `solid` (default), `dashed`, or `dither`: the same square of 2 px cells the chart's series are drawn in. */
  pattern?: SwatchPattern;
  className?: string;
};

/** A legend's key: a small square (or dashed rule) in a series' colour, or in the dither that series is painted with. */
export function Swatch({ color, pattern = "solid", className }: SwatchProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (color?.startsWith("url(")) {
    return (
      <svg aria-hidden focusable="false" className={classes("fui-chart-swatch", className)} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <rect width={10} height={10} fill={color} />
      </svg>
    );
  }
  if (pattern === "dither") {
    return (
      <svg aria-hidden focusable="false" className={classes("fui-chart-swatch", className)} viewBox="0 0 10 10" shapeRendering="crispEdges">
        <defs>
          <pattern id={`fui-swatch-${uid}`} width={4} height={4} patternUnits="userSpaceOnUse">
            <rect width={2} height={2} fill={color} />
            <rect x={2} y={2} width={2} height={2} fill={color} />
          </pattern>
        </defs>
        <rect width={10} height={10} fill={`url(#fui-swatch-${uid})`} />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className={classes("fui-chart-swatch", className)}
      data-pattern={pattern === "dashed" ? "dashed" : undefined}
      style={pattern === "dashed" ? { borderColor: color } : { background: color }}
    />
  );
}

export type LegendItemProps = {
  /** The series' name. A screen reader hears it in the toggle's own name ("Hide requests"). */
  label: ReactNode;
  color?: string;
  pattern?: SwatchPattern;
  /** Shown in the legend but off the chart: struck through, its key dimmed. */
  hidden?: boolean;
  /** Given, the item toggles its series: a button with `aria-pressed`, as the chart's own legend has. */
  onToggle?: (shown: boolean) => void;
  /** Given, an "Only" key beside the toggle, which leaves this series alone on the chart. */
  onOnly?: () => void;
  /** The words of the toggle and of "Only". A `LabelsProvider` sets them (scope `chart`). */
  labels?: Partial<SeriesChartLabels>;
  className?: string;
};

/** One row of a legend: a key and a name, static or a toggle (and an "Only" beside it) as a chart's own legend is. */
export function LegendItem({ label, color, pattern = "solid", hidden = false, onToggle, onOnly, labels: ownLabels, className }: LegendItemProps) {
  const labels = useLabels("chart", CHART_LABELS, ownLabels);
  const name = typeof label === "string" ? label : undefined;
  const words = <span data-hidden={hidden ? "" : undefined}>{label}</span>;
  if (!onToggle) {
    return (
      <span className={classes("fui-chart-legend-item", className)}>
        <span className="fui-chart-legend-static">
          <Swatch color={color} pattern={pattern} />
          {words}
        </span>
      </span>
    );
  }
  return (
    <span className={classes("fui-chart-legend-item", className)}>
      <button
        type="button"
        aria-pressed={!hidden}
        aria-label={name ? (hidden ? labels.show(name) : labels.hide(name)) : undefined}
        className="fui-chart-legend-toggle"
        onClick={() => onToggle(hidden)}
      >
        <Swatch color={color} pattern={pattern} />
        {words}
      </button>
      {onOnly ? (
        <button type="button" aria-label={name ? labels.showOnly(name) : undefined} className="fui-chart-legend-only" onClick={onOnly}>
          {labels.only}
        </button>
      ) : null}
    </span>
  );
}

export type ChartLegendProps = ComponentProps<"div">;

/** The legend under a chart, or beside a visual of the host's own: `LegendItem` goes inside, `Swatch` paints its key. */
export function ChartLegend({ className, ...props }: ChartLegendProps) {
  return <div className={classes("fui-chart-legend", className)} {...props} />;
}

export type ColorRampLabels = {
  /** The bar's text alternative: "from 0 to 100". */
  range: (min: string, max: string) => string;
};

export const COLOR_RAMP_LABELS: ColorRampLabels = {
  range: (min, max) => `from ${min} to ${max}`,
};

export type ColorRampMark = { value: number; label?: ReactNode };

export type ColorRampProps = Omit<ComponentProps<"div">, "children"> & {
  /** The lowest value the left end of the ramp stands for. */
  min: number;
  /** The highest, at the right end. */
  max: number;
  /** The colours across the ramp, in order: token colours (`var(--brand)`, `var(--chart-1)`) or any CSS colour. */
  stops: string[];
  /** How many cells the bar is painted with, 8 to 12 (10 unless given): a stepped ramp, which is data, not a gradient. */
  steps?: number;
  /** Ticks under the bar: a value between `min` and `max`, and the word under it. */
  marks?: ColorRampMark[];
  /** What the colour means ("Requests per minute"). */
  label?: ReactNode;
  /** How the ends and the ticks are written; the reader's digits unless given. */
  format?: (value: number) => string;
  /** The bar's text alternative. A `LabelsProvider` sets it (scope `colorRamp`). */
  labels?: Partial<ColorRampLabels>;
  locale?: Intl.LocalesArgument;
};

/**
 * The colours of a map or a heat map, read from one end to the other: the lowest value, a bar painted in steps sampled from
 * `stops`, the highest, and any ticks between. The bar itself is decoration to a screen reader, which hears "from 0 to 100".
 */
export function ColorRamp({ min, max, stops, steps = 10, marks, label, format, labels: ownLabels, locale: ownLocale, className, ...props }: ColorRampProps) {
  const labels = useLabels("colorRamp", COLOR_RAMP_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const write = format ?? ((value: number) => formatCount(value, locale));
  const cells = rampColors(stops, steps);
  const span = max - min || 1;
  return (
    <div className={classes("fui-color-ramp", className)} data-slot="color-ramp" {...props}>
      {label ? <span className="fui-color-ramp-label">{label}</span> : null}
      <div className="fui-color-ramp-scale">
        <span className="fui-color-ramp-end">{write(min)}</span>
        <span aria-hidden="true" className="fui-color-ramp-bar" data-cells={cells.length}>
          {cells.map((paint, index) => (
            <span key={index} style={{ background: paint }} />
          ))}
        </span>
        <span className="fui-color-ramp-end">{write(max)}</span>
        {marks?.length ? (
          <span aria-hidden="true" className="fui-color-ramp-marks">
            {marks.map((mark) => (
              <span
                className="fui-color-ramp-mark"
                data-edge={mark.value <= min ? "start" : mark.value >= max ? "end" : undefined}
                key={mark.value}
                style={{ "--fui-ramp-mark": `${((Math.min(max, Math.max(min, mark.value)) - min) / span) * 100}%` } as CSSProperties}
              >
                {mark.label !== undefined ? <span className="fui-color-ramp-mark-label">{mark.label}</span> : null}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <span className="fui-sr-only">{labels.range(write(min), write(max))}</span>
    </div>
  );
}

/** The cells of a stepped ramp: `steps` colours sampled across `stops`, beside each other with no gradient between them. */
export function rampColors(stops: string[], steps = 10): string[] {
  if (!stops.length) return [];
  const count = Math.max(2, Math.min(12, Math.round(steps)));
  if (stops.length === 1) return Array.from({ length: count }, () => stops[0]!);
  return Array.from({ length: count }, (_, index) => {
    const at = (index / (count - 1)) * (stops.length - 1);
    const low = Math.floor(at);
    const high = Math.min(stops.length - 1, low + 1);
    const mix = at - low;
    if (mix === 0) return stops[low]!;
    return `color-mix(in oklab, ${stops[low]} ${Math.round((1 - mix) * 100)}%, ${stops[high]})`;
  });
}


function SeriesTooltip({
  active,
  payload,
  label,
  paints,
  titleKey,
  yFormat,
  labels,
}: {
  paints: ReadonlyMap<string, string>;
  labels: SeriesChartLabels;
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
                <Swatch color={paints.get(String(item.name ?? "")) ?? item.color} />
                <span>{String(item.name ?? "")}</span>
              </span>
              <span className="fui-chart-tip-value">{yFormat(numeric(item.value))}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>{labels.noValue}</p>
      )}
      {payload.length > 1 ? (
        <p className="fui-chart-tip-total">
          <span>{labels.total}</span>
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
