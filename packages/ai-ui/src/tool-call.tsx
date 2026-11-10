"use client";
// Origin: Fabrials, 0.12 (from Radiant's features/core/tool-part.tsx and AI Elements' tool.tsx, rewritten on
// ActivityDisclosure and the agent marks: no stock palette, no dependency).

import type { ComponentProps, ReactNode } from "react";
import { ActivityDisclosure } from "./activity";
import { AgentMark, formatWorkTime } from "./agent";
import { CodeLines } from "@fabrials/ui";

export type ToolCallState = "pending" | "running" | "done" | "error" | "denied";

export type ToolCallLabels = {
  /** The row while it waits its turn: the tool's name is appended. */
  pending: (name: string) => string;
  running: (name: string) => string;
  /** The row once it answered; `duration` in milliseconds when the host measured it. */
  done: (name: string) => string;
  error: (name: string) => string;
  denied: (name: string) => string;
  input: string;
  output: string;
  errorTitle: string;
  show: string;
  hide: string;
};

const LABELS: ToolCallLabels = {
  pending: (name) => `Waiting to run ${name}`,
  running: (name) => `Running ${name}`,
  done: (name) => `Ran ${name}`,
  error: (name) => `${name} failed`,
  denied: (name) => `${name} was not allowed`,
  input: "Input",
  output: "Output",
  errorTitle: "Error",
  show: "Show details",
  hide: "Hide details",
};

/** The label a state is said with. Done adds the time when the host measured it ("Ran search_docs in 1.2s"). */
export function toolCallLabel(state: ToolCallState, name: string, duration: number | undefined, labels: Partial<ToolCallLabels> = {}): string {
  const text = { ...LABELS, ...labels };
  const base = state === "pending" ? text.pending(name) : state === "running" ? text.running(name) : state === "done" ? text.done(name) : state === "error" ? text.error(name) : text.denied(name);
  return state === "done" && duration !== undefined && Number.isFinite(duration) ? `${base} in ${formatWorkTime(duration)}` : base;
}

export type ToolPayload = { text: string; language: string };

/**
 * What a tool carried, as the code well shows it: an object or an array as highlighted JSON, a string that is itself a JSON
 * document the same, and any other string as plain text.
 */
export function toolPayload(value: unknown): ToolPayload | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^[[{]/.test(trimmed)) {
      try {
        return { text: JSON.stringify(JSON.parse(trimmed), null, 2), language: "json" };
      } catch {
        return { text: value, language: "text" };
      }
    }
    return { text: value, language: "text" };
  }
  try {
    const text = JSON.stringify(value, null, 2);
    return text === undefined ? null : { text, language: "json" };
  } catch {
    return { text: String(value), language: "text" };
  }
}

export type ToolCallProps = Omit<ComponentProps<"div">, "children"> & {
  /** The tool's name, as the host knows it ("search_docs"). */
  name: string;
  state: ToolCallState;
  /** What the call was given: anything that JSON can carry. */
  input?: unknown;
  /** What it answered, while `state` is `done`. */
  output?: unknown;
  /** Why it failed, while `state` is `error`. */
  error?: string | null;
  /** How long it took, in milliseconds. */
  duration?: number;
  /** The mark of the work, in place of the tool's own: an agent's steps already say what they are doing. */
  icon?: ReactNode;
  /** Open by default: only on error, unless a host says otherwise here. */
  defaultOpen?: boolean;
  labels?: Partial<ToolCallLabels>;
  className?: string;
};

const MARK_VARIANTS: Record<ToolCallState, "orbit" | undefined> = { pending: "orbit", running: "orbit", done: undefined, error: undefined, denied: undefined };

/**
 * A tool call in an answer: its name and state in words, with the agent mark of what it is doing, opening onto what it was
 * given and what it answered. Failed and denied calls open by themselves, since their reason is what a reader wants first.
 */
export function ToolCall({ name, state, input, output, error, duration, icon, defaultOpen, labels, className, ...props }: ToolCallProps) {
  const text = { ...LABELS, ...labels };
  const said = toolCallLabel(state, name, duration, labels);
  const mark = icon ?? <AgentMark outcome={state === "done" ? "done" : state === "error" || state === "denied" ? "failed" : undefined} variant={MARK_VARIANTS[state]} />;
  const payload = toolPayload(input);
  const result = toolPayload(output);
  const hasBody = Boolean(payload || result || (state === "error" && error));
  if (!hasBody) {
    return (
      <div {...props} className={["fui-tool-call", className].filter(Boolean).join(" ")} data-slot="tool-call" data-state={state}>
        <ActivityDisclosure icon={<span className="fui-tool-call-mark">{mark}</span>} label={said} live={state === "running"} timer={state === "running"} />
      </div>
    );
  }
  return (
    <div {...props} className={["fui-tool-call", className].filter(Boolean).join(" ")} data-slot="tool-call" data-state={state}>
      <ActivityDisclosure
        defaultOpen={defaultOpen ?? state === "error"}
        icon={<span className="fui-tool-call-mark">{mark}</span>}
        label={said}
        live={state === "running"}
        timer={state === "running"}
        toggleLabel={(open) => (open ? text.hide : text.show)}
      >
        <div className="fui-tool-call-parts">
          {payload ? <ToolPart label={text.input} payload={payload} /> : null}
          {state === "error" && error ? (
            <div className="fui-tool-call-failure">
              <span className="fui-tool-call-part-label">{text.errorTitle}</span>
              <p className="fui-tool-call-error">{error}</p>
            </div>
          ) : null}
          {result ? <ToolPart label={text.output} payload={result} /> : null}
        </div>
      </ActivityDisclosure>
    </div>
  );
}

function ToolPart({ label, payload }: { label: string; payload: ToolPayload }) {
  return (
    <div className="fui-tool-call-part">
      <span className="fui-tool-call-part-label">{label}</span>
      <pre aria-label={label} className="fui-tool-call-code fui-code-panel-body" tabIndex={0}>
        <CodeLines code={payload.text} language={payload.language} />
      </pre>
    </div>
  );
}
