"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { ShimmerText, WorkingLight } from "@fabrials/ui";

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

export type AgentMarkVariant = "wave" | "orbit" | "dither";
export type AgentTone = "light" | "ink";

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
// A 4x4 ordered dither: the order in which the cells light.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export type AgentMarkProps = Omit<ComponentProps<"svg">, "children"> & {
  /** `wave`: a diagonal wave crosses a 3x3 grid. `orbit`: a head with a fading tail runs round the ring. `dither`: a 4x4
   * ordered dither fills with light and empties again. */
  variant?: AgentMarkVariant;
  /** `light`: the cells take the working light's gems. `ink`: the current text colour. */
  tone?: AgentTone;
};

/** The agent at work, as a mark: square cells in the dither's voice. Decorative; pair it with words (see `AgentThinking`). */
export function AgentMark({ variant = "wave", tone = "light", className, ...props }: AgentMarkProps) {
  let cells: ReactNode;
  if (variant === "orbit") {
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
      data-tone={tone}
      data-variant={variant}
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
  /** What the agent is doing, in words ("Thinking", "Searching the docs"). Read out when it changes. */
  label?: string;
  /** The mark: `wave` (default), `orbit` or `dither`. */
  variant?: AgentMarkVariant;
  /** `light` (default): the mark and the label carry the working light. `ink`: a quieter, muted line. */
  tone?: AgentTone;
  /** A band of light crosses the label (default). Off: the label is still. */
  shimmer?: boolean;
  /** The time the agent has been at it, beside the label ("2.8s"). It is not read out on every tick. */
  timer?: boolean;
  /** When the work began. Defaults to when the indicator first appeared. */
  startedAt?: number | Date;
};

/**
 * The line that says an agent is working on a reply: a mark, a label and the time it has taken. It is a polite status, so
 * the label is announced when it changes and the ticking time is not. Under reduced motion the mark holds still, the label
 * is plain and the time counts in whole seconds.
 */
export function AgentThinking({
  label = "Thinking",
  variant = "wave",
  tone = "light",
  shimmer = true,
  timer = true,
  startedAt,
  className,
  ...props
}: AgentThinkingProps) {
  const elapsed = useWorkTime(startedAt, timer);
  return (
    <div className={join("fui-agent-thinking", className)} data-tone={tone} role="status" {...props}>
      <AgentMark tone={tone} variant={variant} />
      {shimmer ? (
        <ShimmerText as="span" className="fui-agent-thinking-label" duration={1.8} tone={tone === "light" ? "light" : "ink"}>
          {label}
        </ShimmerText>
      ) : (
        <span className="fui-agent-thinking-label">{label}</span>
      )}
      {timer ? (
        <span aria-hidden="true" className="fui-agent-thinking-time">
          {elapsed === null ? "" : formatWorkTime(elapsed)}
        </span>
      ) : null}
    </div>
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
};

export type TaskListLabels = {
  pending: string;
  running: string;
  done: string;
  failed: string;
  skipped: string;
  /** The count in the header and the summary read out when everything has settled. */
  progress: (done: number, total: number) => string;
  complete: (total: number) => string;
};

const TASK_LABELS: TaskListLabels = {
  pending: "To do",
  running: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
  progress: (done, total) => `${done} of ${total}`,
  complete: (total) => `All ${total} ${total === 1 ? "task" : "tasks"} settled`,
};

function TaskMark({ status }: { status: TaskStatus }) {
  if (status === "running") return <AgentMark className="fui-task-mark-running" variant="orbit" />;
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
  /** The words for each state, the count and the closing summary, in the reader's language. */
  labels?: Partial<TaskListLabels>;
};

/**
 * The steps of an agent's plan as they are worked through. Each row says its state in words to assistive technology and by
 * its mark to the eye; the running row carries the working light and `aria-current="step"`. Rows that arrive after the list
 * is shown rise into place, a done tick is drawn, and one polite status announces the step that started, failed or the end.
 */
export function TaskList({ tasks, title, label = "Tasks", labels: labelOverrides, className, ...props }: TaskListProps) {
  const titleId = useId();
  const labels = { ...TASK_LABELS, ...labelOverrides };
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
        ? labels.complete(tasks.length)
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
          <span className="fui-task-list-count">{labels.progress(settled, tasks.length)}</span>
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
              <TaskMark status={task.status} />
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
};

export function formatTokens(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (abs >= 100_000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

/**
 * How full an agent's context window is: a stacked bar of what fills it and a legend, with a reading ("42.1k of 200k, 21 %")
 * that turns to the warning and danger inks as the window fills. It is one `meter` for assistive technology.
 */
export function ContextMeter({
  parts,
  limit,
  label = "Context window",
  format = formatTokens,
  unit = "tokens",
  warnAt = 0.8,
  dangerAt = 0.95,
  legend = true,
  className,
  ...props
}: ContextMeterProps) {
  const used = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  const safeLimit = Math.max(1, limit);
  const share = Math.min(1, used / safeLimit);
  const tone = share >= dangerAt ? "danger" : share >= warnAt ? "warning" : undefined;
  const percent = Math.round(share * 100);
  const reading = `${format(used)} of ${format(limit)}`;
  return (
    <div className={join("fui-context-meter", className)} data-tone={tone} {...props}>
      <div className="fui-context-meter-head">
        <span className="fui-context-meter-label">{label}</span>
        <span className="fui-context-meter-reading">
          {reading}
          <span className="fui-context-meter-percent">{`${percent}%`}</span>
        </span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={limit}
        aria-valuemin={0}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${used.toLocaleString("en")} of ${limit.toLocaleString("en")} ${unit}, ${percent}%`}
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
            <span className="fui-context-meter-name">Free</span>
            <span className="fui-context-meter-value">{format(Math.max(0, limit - used))}</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------ generation frame */

export type GenerationStatus = "queued" | "generating" | "done" | "failed";

export type GenerationFrameProps = Omit<ComponentProps<"figure">, "children"> & {
  /** `queued` and `generating` show the field and the working light, `done` the image, `failed` the error. */
  status: GenerationStatus;
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
};

/**
 * A picture being made. While it works, light ripples across a field of square dots inside the frame and the working light
 * turns along its edge; a polite status says what it is doing and how far it got. The finished image arrives through the
 * dither. Under reduced motion the field and the edge hold still and the image appears at once.
 */
export function GenerationFrame({
  status,
  progress,
  src,
  alt,
  aspectRatio = 1,
  label,
  caption,
  error,
  doneLabel = "Image ready",
  startedAt,
  className,
  style,
  ...props
}: GenerationFrameProps) {
  const working = status === "queued" || status === "generating";
  const elapsed = useWorkTime(startedAt, working);
  // An image still on its way when it mounts waits hidden and arrives through the dither; one that is already there (cached,
  // or loaded before hydration) just shows. Set on the element, not rendered, so the server's markup never hides it.
  const watchImage = useCallback((node: HTMLImageElement | null) => {
    if (node && !node.complete) node.dataset.fuiReveal = "pending";
  }, []);
  const percent = progress === undefined ? undefined : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const words = label ?? (status === "queued" ? "Waiting to start" : status === "failed" ? "The image could not be made" : "Making the image");
  const reading = working ? (percent !== undefined ? `${percent}%` : elapsed === null ? "" : formatWorkTime(elapsed)) : "";
  return (
    <figure
      className={join("fui-generation", className)}
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
        {working ? (
          <>
            <span aria-hidden="true" className="fui-generation-field" />
            <span aria-hidden="true" className="fui-generation-ripple" />
            <WorkingLight />
          </>
        ) : null}
        <span className={working ? "fui-generation-status" : "fui-sr-only"} role="status">
          {working ? (
            <>
              <AgentMark variant="dither" />
              <span className="fui-generation-words">{words}</span>
              <span aria-hidden="true" className="fui-generation-reading">
                {reading}
              </span>
              {percent !== undefined ? (
                <>
                  <span className="fui-sr-only">{`${percent}%`}</span>
                  <span aria-hidden="true" className="fui-generation-progress">
                    <span style={{ inlineSize: `${percent}%` }} />
                  </span>
                </>
              ) : null}
            </>
          ) : status === "done" ? (
            doneLabel
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
