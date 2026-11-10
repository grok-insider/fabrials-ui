"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { ShimmerText, WorkingLight, formatCount, plural, useLabels, useLocale, useScramble } from "@fabrials/ui";
import { formatPercent, formatTokens } from "./format";

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ time */

/** "0.4s", "2.8s", "12s", "1m 04s", "1h 02m": the time an agent has been at it, short enough to sit beside a label. */
export function formatWorkTime(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  if (total < 10) return `${(Math.floor(total * 10) / 10).toFixed(1)}s`;
  if (total < 60) return `${Math.floor(total)}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m ${String(Math.floor(total % 60)).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function toTime(value: number | Date | undefined) {
  return value instanceof Date ? value.getTime() : value;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Milliseconds since `startedAt` (or since the first effect), ticking while `running`. Null until mounted, so the server and
 * the first client render agree. Under reduced motion it ticks once a second instead of ten times.
 */
export function useWorkTime(startedAt?: number | Date, running = true): number | null {
  const start = toTime(startedAt);
  const origin = useRef<number | null>(start ?? null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (start !== undefined) origin.current = start;
    else if (origin.current === null) origin.current = Date.now();
    setNow(Date.now());
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), prefersReducedMotion() ? 1000 : 100);
    return () => window.clearInterval(timer);
  }, [start, running]);
  if (now === null || origin.current === null) return null;
  return Math.max(0, now - origin.current);
}

/* ------------------------------------------------------------------ mark */

export type AgentMarkVariant = "wave" | "orbit" | "dither" | "scan" | "lines" | "type" | "raster" | "fill";
export type AgentTone = "light" | "ink";
/** How work ended: the mark settles on a tick or a cross drawn in its cells. */
export type AgentOutcome = "done" | "failed";
/** The kind of work an agent is doing. Each has its own mark, moving in its own direction, and its own words. */
export type AgentActivity = "thinking" | "searching" | "reading" | "writing" | "running" | "rendering" | "uploading";

/**
 * The mark and the words of each kind of work. Thinking stays in place, searching sweeps sideways, reading runs down the
 * lines, writing fills in reading order, a tool runs round, rendering resolves from the top and an upload fills up.
 */
export const agentActivities: Record<AgentActivity, { variant: AgentMarkVariant; label: string }> = {
  thinking: { variant: "wave", label: "Thinking" },
  searching: { variant: "scan", label: "Searching" },
  reading: { variant: "lines", label: "Reading" },
  writing: { variant: "type", label: "Writing" },
  running: { variant: "orbit", label: "Running" },
  rendering: { variant: "raster", label: "Rendering" },
  uploading: { variant: "fill", label: "Uploading" },
};

/** The words of each kind of work, when an `AgentThinking` is given no `label`. */
export type AgentLabels = Record<AgentActivity, string>;

const AGENT_LABELS: AgentLabels = {
  thinking: agentActivities.thinking.label,
  searching: agentActivities.searching.label,
  reading: agentActivities.reading.label,
  writing: agentActivities.writing.label,
  running: agentActivities.running.label,
  rendering: agentActivities.rendering.label,
  uploading: agentActivities.uploading.label,
};

// The 3x3 grid of the busy mark (11 px, cells of 3 with 1 px between), by diagonal.
const GRID = [0, 4, 8].flatMap((y) => [0, 4, 8].map((x) => ({ x, y, step: x / 4 + y / 4 })));
// The ring of the busy mark, clockwise from the top left.
const RING = [
  [0, 0],
  [4, 0],
  [8, 0],
  [8, 4],
  [8, 8],
  [4, 8],
  [0, 8],
  [0, 4],
] as const;
// A 4x4 grid of 2 px cells on a 3 px pitch, in reading order, banded by diagonal for the working light's gems.
const QUAD = [0, 1, 2, 3].flatMap((row) =>
  [0, 1, 2, 3].map((col) => ({ col, row, index: row * 4 + col, band: col + row < 3 ? 1 : col + row < 5 ? 2 : 3 })),
);
// The settled marks in the same cells: a tick, and a cross.
const OUTCOME_CELLS: Record<AgentOutcome, ReadonlySet<number>> = {
  done: new Set([7, 8, 10, 13]),
  failed: new Set([0, 3, 5, 6, 9, 10, 12, 15]),
};
// The still frame of a mark whose cells take turns: the head, then a fading trail.
const TRAIL = [1, 0.5, 0.25];
const trail = (distance: number) => TRAIL[distance] ?? 0.14;
// A 4x4 ordered dither: the order in which the cells light.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export type AgentMarkProps = Omit<ComponentProps<"svg">, "children"> & {
  /**
   * `wave`: a diagonal wave crosses a 3x3 grid (thinking). `orbit`: a head with a fading tail runs round the ring (a tool
   * running). `dither`: a 4x4 ordered dither fills with light and empties again. `scan`: a column sweeps sideways with a
   * trail (searching). `lines`: a head runs along each of four lines, top to bottom, and the lines it has read go faint
   * (reading). `type`: the cells fill in reading order and stay (writing). `raster`: rows resolve from the top behind a
   * bright band (rendering). `fill`: rows fill up from the bottom (uploading).
   */
  variant?: AgentMarkVariant;
  /** `light`: the cells take the working light's gems. `ink`: the current text colour. */
  tone?: AgentTone;
  /** The work has ended: the cells hold a tick (`done`) or a cross (`failed`) in the success or danger ink, still. */
  outcome?: AgentOutcome;
};

/** The agent at work, as a mark: square cells in the dither's voice. Decorative; pair it with words (see `AgentThinking`). */
export function AgentMark({ variant = "wave", tone = "light", outcome, className, ...props }: AgentMarkProps) {
  let cells: ReactNode;
  if (outcome) {
    const shape = OUTCOME_CELLS[outcome];
    cells = QUAD.map(({ col, row, index }) => (
      <rect data-on={shape.has(index) || undefined} height={2} key={index} width={2} x={col * 3} y={row * 3} />
    ));
  } else if (variant === "scan" || variant === "lines" || variant === "type" || variant === "raster" || variant === "fill") {
    cells = QUAD.map(({ col, row, index, band }) => {
      // Which cell (or column, or row) each one is in the order the variant lights them; a scan's cells hold a still frame.
      const step = variant === "scan" ? col : variant === "lines" || variant === "type" ? index : variant === "raster" ? row : 3 - row;
      const extra: Record<string, number> = variant === "scan" ? { "--fui-agent-still": trail((2 - col + 4) % 4) } : variant === "lines" ? { "--fui-agent-row": row } : {};
      return (
        <rect
          data-band={band}
          height={2}
          key={index}
          style={{ "--fui-agent-step": step, ...extra } as CSSProperties}
          width={2}
          x={col * 3}
          y={row * 3}
        />
      );
    });
  } else if (variant === "orbit") {
    cells = (
      <>
        {RING.map(([x, y], index) => (
          <rect height={3} key={index} style={{ "--fui-agent-step": index } as CSSProperties} width={3} x={x} y={y} data-band={index < 3 ? 1 : index < 6 ? 2 : 3} />
        ))}
        <rect className="fui-agent-core" data-band={3} height={3} width={3} x={4} y={4} />
      </>
    );
  } else if (variant === "dither") {
    cells = BAYER.flatMap((row, y) =>
      row.map((order, x) => (
        <rect
          data-band={x + y < 3 ? 1 : x + y < 5 ? 2 : 3}
          data-on={order % 2 === 0 || undefined}
          height={2}
          key={`${x}-${y}`}
          style={{ "--fui-agent-step": order } as CSSProperties}
          width={2}
          x={x * 3}
          y={y * 3}
        />
      )),
    );
  } else {
    cells = GRID.map(({ x, y, step }) => (
      <rect data-band={step < 2 ? 1 : step < 3 ? 2 : 3} height={3} key={`${x}-${y}`} style={{ "--fui-agent-step": step } as CSSProperties} width={3} x={x} y={y} />
    ));
  }
  return (
    <svg
      aria-hidden="true"
      className={join("fui-agent-mark", className)}
      data-outcome={outcome}
      data-tone={tone}
      data-variant={outcome ? undefined : variant}
      focusable="false"
      shapeRendering="crispEdges"
      viewBox="0 0 11 11"
      {...props}
    >
      {cells}
    </svg>
  );
}

/* -------------------------------------------------------------- thinking */

export type AgentThinkingProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * The kind of work: `thinking` (default), `searching`, `reading`, `writing`, `running`, `rendering` or `uploading`. It
   * picks the mark, each moving its own way, and the words when there is no `label`.
   */
  activity?: AgentActivity;
  /** What the agent is doing, in words ("Thinking", "Searching the docs"). Read out when it changes. */
  label?: string;
  /** The words of each activity, used when there is no `label`. A `LabelsProvider` sets them (scope `agent`). */
  labels?: Partial<AgentLabels>;
  /** The mark, when it should differ from the activity's: `wave`, `orbit`, `dither`, `scan`, `lines`, `type`, `raster`, `fill`. */
  variant?: AgentMarkVariant;
  /** `light` (default): the mark and the label carry the working light. `ink`: a quieter, muted line. */
  tone?: AgentTone;
  /** A band of light crosses the label (default). Off: the label is still. */
  shimmer?: boolean;
  /** The time the agent has been at it, beside the label ("2.8s"). It is not read out on every tick. */
  timer?: boolean;
  /** When the work began. Defaults to when the indicator first appeared. */
  startedAt?: number | Date;
  /**
   * `working` (default), or how it ended: `done` or `failed`. Settled, the light goes out, the mark holds a tick or a cross,
   * the label is still and the time stops. Say it in the past tense ("Searched 12 sources").
   */
  status?: "working" | AgentOutcome;
  /** When the work ended, so the time beside a settled line reads the same after a reload. */
  endedAt?: number | Date;
};

/**
 * The line that says an agent is working on a reply: a mark, a label and the time it has taken. It is a polite status, so
 * the label is announced when it changes and the ticking time is not. Each kind of work (`activity`) has its own mark, so a
 * person can tell searching from thinking at a glance; when the work ends the line settles. Under reduced motion the mark
 * holds a still pattern, the label is plain and the time counts in whole seconds.
 */
export function AgentThinking({
  activity = "thinking",
  label,
  labels: ownLabels,
  variant,
  tone = "light",
  shimmer = true,
  timer = true,
  startedAt,
  status = "working",
  endedAt,
  className,
  ...props
}: AgentThinkingProps) {
  const labels = useLabels("agent", AGENT_LABELS, ownLabels);
  const working = status === "working";
  const kind = agentActivities[activity] ?? agentActivities.thinking;
  const words = label ?? labels[activity] ?? labels.thinking;
  // A line that worked here counts its own time; one that arrives settled shows a time only when it was given one.
  const worked = useRef(working);
  if (working) worked.current = true;
  const elapsed = useWorkTime(startedAt, timer && working);
  const start = toTime(startedAt);
  const end = toTime(endedAt);
  const time = !working && start !== undefined && end !== undefined ? Math.max(0, end - start) : working || worked.current || start !== undefined ? elapsed : null;
  // A new label (the next step, or the words of the end) scrambles into place; the light on it waits until it has settled.
  const frame = useScramble(words);
  return (
    <div className={join("fui-agent-thinking", className)} data-status={working ? undefined : status} data-tone={tone} role="status" {...props}>
      <AgentMark outcome={working ? undefined : status} tone={tone} variant={variant ?? kind.variant} />
      <WorkLabel className="fui-agent-thinking-label" duration={1.8} frame={frame} shimmer={shimmer && working} tone={tone}>
        {words}
      </WorkLabel>
      {timer ? (
        <span aria-hidden="true" className="fui-agent-thinking-time">
          {time === null ? "" : formatWorkTime(time)}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The words of a piece at work: the light crosses them while it works (`shimmer`), and a new text scrambles into place
 * (`frame`, from `useScramble`). One element throughout, so a label that changes as the work ends still settles in.
 */
export function WorkLabel({
  children,
  frame,
  shimmer,
  tone = "light",
  duration = 1.8,
  className,
}: {
  children: string;
  frame: string | null;
  shimmer: boolean;
  tone?: AgentTone;
  duration?: number;
  className?: string;
}) {
  return (
    <span
      className={join(className, "fui-scramble-text", shimmer && "fui-shimmer-text")}
      data-scrambling={frame !== null || undefined}
      data-tone={shimmer && tone === "light" ? "light" : undefined}
      style={shimmer ? ({ "--fui-shimmer-spread": `${children.length * 2}px`, "--fui-shimmer-duration": `${duration}s` } as CSSProperties) : undefined}
    >
      {children}
      {frame !== null ? (
        <span aria-hidden="true" className="fui-scramble-text-frame">
          {frame}
        </span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------- arrivals */

/**
 * Which items arrived after the first render, each with its place in the batch it came with (for `--fui-stagger`). Items
 * present at first render never animate: a screen people revisit shows what it has at once.
 */
export function useArrivals(ids: readonly string[]): ReadonlyMap<string, number> {
  const state = useRef<{ initial: Set<string>; stagger: Map<string, number> } | null>(null);
  if (state.current === null) state.current = { initial: new Set(ids), stagger: new Map() };
  const { initial, stagger } = state.current;
  let batch = 0;
  for (const id of ids) {
    if (initial.has(id) || stagger.has(id)) continue;
    stagger.set(id, batch);
    batch += 1;
  }
  return stagger;
}

function arrival(stagger: ReadonlyMap<string, number>, id: string) {
  const index = stagger.get(id);
  return index === undefined ? undefined : ({ "--fui-stagger": index } as CSSProperties);
}

/* ------------------------------------------------------------- task list */

export type TaskStatus = "pending" | "running" | "done" | "failed" | "skipped";

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  /** A second line: what was found, what failed, the file it touched. */
  detail?: ReactNode;
  /** A short reading at the end of the row ("3 files", "1.2s"). */
  meta?: ReactNode;
  /** The kind of work the step is (`searching`, `reading`, `writing`…): its mark while it runs. A tool's orbit by default. */
  activity?: AgentActivity;
};

export type TaskListLabels = {
  pending: string;
  running: string;
  done: string;
  failed: string;
  skipped: string;
  /** The count in the header and the summary read out when everything has settled. Both are given the list's locale. */
  progress: (done: number, total: number, locale?: Intl.LocalesArgument) => string;
  complete: (total: number, locale?: Intl.LocalesArgument) => string;
};

const TASK_LABELS: TaskListLabels = {
  pending: "To do",
  running: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  progress: (done, total, locale) => `${formatCount(done, locale)} of ${formatCount(total, locale)}`,
  complete: (total, locale) => plural(total, { one: "All {count} task settled", other: "All {count} tasks settled" }, locale),
};

function TaskMark({ status, activity }: { status: TaskStatus; activity?: AgentActivity }) {
  if (status === "running") return <AgentMark className="fui-task-mark-running" variant={activity ? (agentActivities[activity]?.variant ?? "orbit") : "orbit"} />;
  return (
    <svg aria-hidden="true" className="fui-task-mark-icon" focusable="false" viewBox="0 0 16 16">
      <circle className="fui-task-mark-disc" cx={8} cy={8} r={7.25} />
      {status === "done" ? <path className="fui-task-mark-tick" d="M4.75 8.25 7 10.5l4.25-4.75" pathLength={1} /> : null}
      {status === "failed" ? <path className="fui-task-mark-tick" d="M5.5 5.5l5 5m0-5-5 5" pathLength={1} /> : null}
      {status === "skipped" ? <path className="fui-task-mark-tick" d="M5 8h6" pathLength={1} /> : null}
    </svg>
  );
}

export type TaskListProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  /** The steps in order: an id, a title, a status (`pending`, `running`, `done`, `failed`, `skipped`), and optionally a
   * detail line and a reading. */
  tasks: readonly TaskItem[];
  /** A heading for the plan ("Plan", "Migrating the schema"). With it, the header shows the count and a bar of the steps. */
  title?: ReactNode;
  /** The list's accessible name when there is no title. */
  label?: string;
  /** The words for each state, the count and the closing summary, in the reader's language. A `LabelsProvider` sets them (scope `taskList`). */
  labels?: Partial<TaskListLabels>;
  /** The locale of the counts; "en" unless a `LabelsProvider` says otherwise. */
  locale?: Intl.LocalesArgument;
};

/**
 * The steps of an agent's plan as they are worked through. Each row says its state in words to assistive technology and by
 * its mark to the eye; the running row carries the working light and `aria-current="step"`. Rows that arrive after the list
 * is shown rise into place, a done tick is drawn, and one polite status announces the step that started, failed or the end.
 */
export function TaskList({ tasks, title, label = "Tasks", labels: labelOverrides, locale: ownLocale, className, ...props }: TaskListProps) {
  const titleId = useId();
  const labels = useLabels("taskList", TASK_LABELS, labelOverrides);
  const locale = useLocale(ownLocale);
  const stagger = useArrivals(tasks.map((task) => task.id));
  const settled = tasks.filter((task) => task.status === "done" || task.status === "skipped").length;
  const running = tasks.find((task) => task.status === "running");
  const failed = [...tasks].reverse().find((task) => task.status === "failed");
  const allSettled = tasks.length > 0 && tasks.every((task) => task.status !== "pending" && task.status !== "running");
  const announcement = running
    ? `${labels.running}: ${running.title}`
    : failed
      ? `${labels.failed}: ${failed.title}`
      : allSettled
        ? labels.complete(tasks.length, locale)
        : "";
  return (
    <section
      aria-label={title ? undefined : label}
      aria-labelledby={title ? titleId : undefined}
      className={join("fui-task-list", className)}
      data-settled={allSettled || undefined}
      {...props}
    >
      {title ? (
        <header className="fui-task-list-head">
          <span className="fui-task-list-title" id={titleId}>
            {title}
          </span>
          <span className="fui-task-list-count">{labels.progress(settled, tasks.length, locale)}</span>
          <span aria-hidden="true" className="fui-task-list-bar">
            {tasks.map((task) => (
              <span data-status={task.status} key={task.id} />
            ))}
          </span>
        </header>
      ) : null}
      <ol className="fui-task-list-items">
        {tasks.map((task) => (
          <li
            aria-current={task.status === "running" ? "step" : undefined}
            className={join("fui-task", stagger.has(task.id) && "fui-rise")}
            data-status={task.status}
            key={task.id}
            style={arrival(stagger, task.id)}
          >
            <span className="fui-task-mark">
              <TaskMark activity={task.activity} status={task.status} />
            </span>
            <span className="fui-task-body">
              <span className="fui-task-title">
                <span className="fui-sr-only">{`${labels[task.status]}: `}</span>
                {task.status === "running" ? (
                  <ShimmerText as="span" duration={1.8} tone="light">
                    {task.title}
                  </ShimmerText>
                ) : (
                  task.title
                )}
              </span>
              {task.detail ? <span className="fui-task-detail">{task.detail}</span> : null}
            </span>
            {task.meta ? <span className="fui-task-meta">{task.meta}</span> : null}
          </li>
        ))}
      </ol>
      <p className="fui-sr-only" role="status">
        {announcement}
      </p>
    </section>
  );
}

/* --------------------------------------------------------- context meter */

export type ContextPart = {
  /** What fills this part, as the legend and the tooltip name it. */
  label: string;
  /** Tokens (or any unit) this part takes. */
  value: number;
};

export type ContextMeterProps = Omit<ComponentProps<"div">, "children"> & {
  /** What fills the window, in the order it is drawn: system prompt, tools, files, conversation. */
  parts: readonly ContextPart[];
  /** The size of the window, in the unit of the parts. */
  limit: number;
  /** Names the meter, above it and for assistive technology. */
  label?: string;
  /** How a number reads: "42.1k" by default. */
  format?: (value: number) => string;
  /** Unit for the accessible value ("tokens"). */
  unit?: string;
  /** The share of the limit (0 to 1) where the reading turns to the warning ink; 0.8 by default. */
  warnAt?: number;
  /** The share of the limit where it turns to the danger ink; 0.95 by default. */
  dangerAt?: number;
  /** Hide the legend under the bar (the meter keeps its accessible value). */
  legend?: boolean;
  /** The meter's words; `label` and `unit` win over theirs. A `LabelsProvider` sets them for every meter (scope `contextMeter`). */
  labels?: Partial<ContextMeterLabels>;
  /** The locale of the percentage and of the spoken counts; "en" unless a `LabelsProvider` says otherwise. */
  locale?: Intl.LocalesArgument;
};

export type ContextMeterLabels = {
  label: string;
  unit: string;
  /** The room left, in the legend. */
  free: string;
  /** How much of the window is used, given the two numbers as they are written: "42.1k of 200k". */
  of: (used: string, limit: string) => string;
};

const CONTEXT_METER_LABELS: ContextMeterLabels = {
  label: "Context window",
  unit: "tokens",
  free: "Free",
  of: (used, limit) => `${used} of ${limit}`,
};

export { formatTokens } from "./format";

/**
 * How full an agent's context window is: a stacked bar of what fills it and a legend, with a reading ("42.1k of 200k, 21 %")
 * that turns to the warning and danger inks as the window fills. It is one `meter` for assistive technology.
 */
export function ContextMeter({
  parts,
  limit,
  label: ownLabel,
  format = formatTokens,
  unit: ownUnit,
  warnAt = 0.8,
  dangerAt = 0.95,
  legend = true,
  labels: ownLabels,
  locale: ownLocale,
  className,
  ...props
}: ContextMeterProps) {
  const labels = useLabels("contextMeter", CONTEXT_METER_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const label = ownLabel ?? labels.label;
  const unit = ownUnit ?? labels.unit;
  const used = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  const safeLimit = Math.max(1, limit);
  const share = Math.min(1, used / safeLimit);
  const tone = share >= dangerAt ? "danger" : share >= warnAt ? "warning" : undefined;
  const percent = formatPercent(Math.round(share * 100), locale);
  const reading = labels.of(format(used), format(limit));
  return (
    <div className={join("fui-context-meter", className)} data-tone={tone} {...props}>
      <div className="fui-context-meter-head">
        <span className="fui-context-meter-label">{label}</span>
        <span className="fui-context-meter-reading">
          {reading}
          <span className="fui-context-meter-percent">{percent}</span>
        </span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={limit}
        aria-valuemin={0}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${labels.of(formatCount(used, locale), formatCount(limit, locale))} ${unit}, ${percent}`}
        className="fui-context-meter-track"
        role="meter"
      >
        {parts.map((part, index) => (
          <span
            className="fui-context-meter-part"
            data-series={(index % 5) + 1}
            key={part.label}
            style={{ inlineSize: `${(Math.max(0, part.value) / safeLimit) * 100}%` }}
            title={`${part.label}: ${format(part.value)}`}
          />
        ))}
      </div>
      {legend ? (
        <ul className="fui-context-meter-legend">
          {parts.map((part, index) => (
            <li key={part.label}>
              <span aria-hidden="true" className="fui-context-meter-swatch" data-series={(index % 5) + 1} />
              <span className="fui-context-meter-name">{part.label}</span>
              <span className="fui-context-meter-value">{format(part.value)}</span>
            </li>
          ))}
          <li data-free>
            <span aria-hidden="true" className="fui-context-meter-swatch" data-free />
            <span className="fui-context-meter-name">{labels.free}</span>
            <span className="fui-context-meter-value">{format(Math.max(0, limit - used))}</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------ generation frame */

export type GenerationStatus = "queued" | "generating" | "done" | "failed";

/** The rows of a page being written: how far across each one reaches; 0 is the gap between paragraphs. */
const PAGE_ROWS = [0.46, 0, 0.94, 0.9, 0.97, 0.58, 0, 0.92, 0.88, 0.95, 0.9, 0.36, 0, 0.6, 0.93, 0.86, 0.71];

export type GenerationFrameProps = Omit<ComponentProps<"figure">, "children"> & {
  /** `queued` and `generating` show the field and the working light, `done` the image, `failed` the error. */
  status: GenerationStatus;
  /** `image` (default), or `document`: a page whose rows are written from the top, the row being written in the light. */
  kind?: "image" | "document";
  /**
   * How a picture being made looks: `ripple` (default), light rippling through a field of square dots; `refine`, square
   * cells that grow finer, pass after pass, behind a band moving down; `scan`, a band of light sweeping down the field.
   */
  effect?: "ripple" | "refine" | "scan";
  /** What shows in the frame when it is done and there is no `src`: the document itself, a preview of it. */
  children?: ReactNode;
  /** Known progress, 0 to 1. Without it the frame says how long it has been working instead. */
  progress?: number;
  /** The finished image. */
  src?: string;
  /** The image's text alternative: what it shows, usually the prompt in plain words. */
  alt: string;
  /** Width over height (a number) or a CSS ratio ("4 / 3"). Default 1. */
  aspectRatio?: number | string;
  /** What the frame is doing, in words. */
  label?: string;
  /** Shown under the image, in the label voice. */
  caption?: ReactNode;
  /** When it failed: what happened and what to do (a retry button). */
  error?: ReactNode;
  /** Read out when the image is ready. */
  doneLabel?: string;
  /** When the work began, for the time shown without a known progress. */
  startedAt?: number | Date;
  /** The status sentences; `label` and `doneLabel` win over them. A `LabelsProvider` sets them (scope `generation`). */
  labels?: Partial<GenerationLabels>;
  /** The locale of the percentage; "en" unless a `LabelsProvider` says otherwise. */
  locale?: Intl.LocalesArgument;
};

export type GenerationLabels = {
  queued: string;
  /** While it works, for an image and for a document. */
  image: string;
  document: string;
  imageFailed: string;
  documentFailed: string;
  /** Read out when the result is ready. */
  imageReady: string;
  documentReady: string;
};

const GENERATION_LABELS: GenerationLabels = {
  queued: "Waiting to start",
  image: "Making the image",
  document: "Writing the document",
  imageFailed: "The image could not be made",
  documentFailed: "The document could not be written",
  imageReady: "Image ready",
  documentReady: "Document ready",
};

/**
 * A picture (or a document) being made. While it works, the field inside the frame moves (`effect`: light ripples through
 * square dots, cells grow finer behind a band, or a band sweeps down; a document's rows are written from the top) and the
 * working light turns along its edge; a polite status says what it is doing and how far it got. The finished image arrives
 * through the dither. Under reduced motion the field and the edge hold still and the image appears at once.
 */
export function GenerationFrame({
  status,
  kind = "image",
  effect = "ripple",
  children,
  progress,
  src,
  alt,
  aspectRatio = 1,
  label,
  caption,
  error,
  doneLabel,
  startedAt,
  labels: ownLabels,
  locale: ownLocale,
  className,
  style,
  ...props
}: GenerationFrameProps) {
  const labels = useLabels("generation", GENERATION_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const working = status === "queued" || status === "generating";
  const page = kind === "document";
  const elapsed = useWorkTime(startedAt, working);
  // An image still on its way when it mounts waits hidden and arrives through the dither; one that is already there (cached,
  // or loaded before hydration) just shows. Set on the element, not rendered, so the server's markup never hides it.
  const watchImage = useCallback((node: HTMLImageElement | null) => {
    if (node && !node.complete) node.dataset.fuiReveal = "pending";
  }, []);
  const share = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));
  const percent = share === undefined ? undefined : Math.round(share * 100);
  const words =
    label ??
    (status === "queued"
      ? labels.queued
      : status === "failed"
        ? page
          ? labels.documentFailed
          : labels.imageFailed
        : page
          ? labels.document
          : labels.image);
  // A known progress places the field instead of the clock: how far down the page, or which pass and how far down it.
  const pass = share === undefined ? undefined : Math.min(2, Math.floor(share * 3));
  const field: CSSProperties | undefined =
    share === undefined
      ? undefined
      : page
        ? ({ "--fui-page-t": share * PAGE_ROWS.length } as CSSProperties)
        : ({ "--fui-refine-pass": pass, "--fui-refine-band": `${(share * 3 - pass!) * 100}%`, "--fui-scan-band": `${share * 100}%` } as CSSProperties);
  const reading = working ? (percent !== undefined ? formatPercent(percent, locale) : elapsed === null ? "" : formatWorkTime(elapsed)) : "";
  return (
    <figure
      className={join("fui-generation", className)}
      data-effect={page || effect === "ripple" ? undefined : effect}
      data-kind={page ? "document" : undefined}
      data-status={status}
      style={{ "--fui-generation-ratio": String(aspectRatio), ...style } as CSSProperties}
      {...props}
    >
      <div className="fui-generation-frame">
        {status === "done" && src ? (
          <img
            alt={alt}
            className="fui-generation-image"
            decoding="async"
            key={src}
            onError={(event) => {
              delete event.currentTarget.dataset.fuiReveal;
            }}
            onLoad={(event) => {
              if (event.currentTarget.dataset.fuiReveal === "pending") event.currentTarget.dataset.fuiReveal = "in";
            }}
            ref={watchImage}
            src={src}
          />
        ) : null}
        {status === "done" && !src && children ? <div className="fui-generation-content">{children}</div> : null}
        {working ? (
          <>
            {page ? (
              <span aria-hidden="true" className="fui-generation-page" data-progress={share !== undefined || undefined} style={field}>
                {PAGE_ROWS.map((length, index) => (
                  <span key={index} style={{ "--i": index, "--length": length } as CSSProperties} />
                ))}
              </span>
            ) : effect === "refine" ? (
              <span aria-hidden="true" className="fui-generation-refine" data-progress={share !== undefined || undefined} style={field}>
                <span data-layer="coarse" />
                <span data-layer="fine" />
                <span className="fui-generation-band" />
              </span>
            ) : effect === "scan" ? (
              <>
                <span aria-hidden="true" className="fui-generation-field" />
                <span aria-hidden="true" className="fui-generation-scan" data-progress={share !== undefined || undefined} style={field} />
              </>
            ) : (
              <>
                <span aria-hidden="true" className="fui-generation-field" />
                <span aria-hidden="true" className="fui-generation-ripple" />
              </>
            )}
            <WorkingLight />
          </>
        ) : null}
        <span className={working ? "fui-generation-status" : "fui-sr-only"} role="status">
          {working ? (
            <>
              <AgentMark variant={page ? "type" : effect === "ripple" ? "dither" : "raster"} />
              <span className="fui-generation-words">{words}</span>
              <span aria-hidden="true" className="fui-generation-reading">
                {reading}
              </span>
              {percent !== undefined ? (
                <>
                  <span className="fui-sr-only">{formatPercent(percent, locale)}</span>
                  <span aria-hidden="true" className="fui-generation-progress">
                    <span style={{ inlineSize: `${percent}%` }} />
                  </span>
                </>
              ) : null}
            </>
          ) : status === "done" ? (
            (doneLabel ?? (page ? labels.documentReady : labels.imageReady))
          ) : null}
        </span>
        {status === "failed" ? (
          <div className="fui-generation-failed" role="alert">
            <span className="fui-generation-words">{words}</span>
            {error ? <div className="fui-generation-error">{error}</div> : null}
          </div>
        ) : null}
      </div>
      {caption ? <figcaption className="fui-generation-caption">{caption}</figcaption> : null}
    </figure>
  );
}
