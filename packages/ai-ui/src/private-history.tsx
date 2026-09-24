"use client";
import { Button, StatePanel } from "@fabrials/ui";

import * as React from "react";
import type { PrivateRecentPage, PrivateStoredObservation, ProviderOutput } from "./contracts";

export function PrivateHistoryView({
  fetchPage,
  description,
  heading = true,
}: {
  fetchPage: (before: number | null) => Promise<PrivateRecentPage>;
  description: string;
  /** The host already shows the page title. */
  heading?: boolean;
}) {
  const [pages, setPages] = React.useState<PrivateRecentPage[]>([]);
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const generation = React.useRef(0);
  const load = React.useCallback(
    async (before: number | null = null) => {
      const current = ++generation.current;
      try {
        const page = await fetchPage(before);
        if (current === generation.current) {
          setError(null);
          setPages((previous) => (before === null ? [page] : [...previous, page]));
        }
      } catch (cause) {
        if (current === generation.current) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (current === generation.current) setBusy(false);
      }
    },
    [fetchPage],
  );
  const invalidate = React.useCallback(() => {
    generation.current++;
  }, []);
  React.useEffect(() => {
    const current = ++generation.current;
    fetchPage(null)
      .then((page) => {
        if (current === generation.current) setPages([page]);
      })
      .catch((cause) => {
        if (current === generation.current) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (current === generation.current) setBusy(false);
      });
    return invalidate;
  }, [fetchPage, invalidate]);
  const observations = pages.flatMap((page) => page.observations);
  const last = pages.at(-1);
  return (
    <section className="fb-history" aria-label={heading ? undefined : "Private history"}>
      {heading ? (
        <div className="fb-heading">
          <h2>Private history</h2>
          {description ? <p>{description}</p> : null}
        </div>
      ) : description ? (
        <p className="fb-muted">{description}</p>
      ) : null}
      {error ? (
        <p className="fb-error" role="alert">
          {error}
        </p>
      ) : null}
      {busy && observations.length === 0 ? <p role="status">Loading private history…</p> : null}
      {!busy && !error && observations.length === 0 ? (
        <StatePanel
          description="Observations appear after a Spanreed installation shares quota or requests with this relay."
          headingLevel={3}
          state="empty"
          title="No synchronized observations yet"
        />
      ) : null}
      {observations.length > 0 ? (
        <ol className="fb-log">
          {observations.map((item) => (
            <Observation item={item} key={item.cursor} />
          ))}
        </ol>
      ) : null}
      {last?.has_more ? (
        <Button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void load(last.before);
          }}
          variant="outline"
        >
          {busy ? "Loading older observations…" : "Load older observations"}
        </Button>
      ) : null}
    </section>
  );
}

function Observation({ item }: { item: PrivateStoredObservation }) {
  const { event, source } = item.observation;
  const at = event.kind === "quota" ? event.at_ms : event.kind === "history" ? event.sample.ts_ms : event.record.ts_ms;
  const title = event.kind === "quota" ? event.output.displayName || source : source;
  const detail =
    event.kind === "quota"
      ? quotaDetail(event.output)
      : event.kind === "history"
        ? historyDetail(event.sample.label, event.sample.used, event.sample.limit, event.sample.resets_at)
        : requestDetail(event.record.model, event.record.input_tokens, event.record.output_tokens);
  return (
    <li className="fb-log-item">
      <div className="fb-row">
        <strong>{title}</strong>
        <time dateTime={new Date(at).toISOString()}>{formatStamp(at)}</time>
      </div>
      <p>{detail}</p>
      <p className="fb-muted">
        {kindLabel(event.kind)} · machine <span className="fb-mono">{shortId(item.device)}</span>
      </p>
    </li>
  );
}

function kindLabel(kind: "quota" | "history" | "request"): string {
  if (kind === "quota") return "Quota reading";
  if (kind === "history") return "Limit sample";
  return "Request";
}

function quotaDetail(output: ProviderOutput): string {
  const plan = output.plan ? `${output.plan}. ` : "";
  const progress = output.lines.find((line) => line.type === "progress");
  if (progress && progress.type === "progress") {
    if (progress.format.kind === "percent") return `${plan}${progress.label}: ${Math.round(progress.used)}%`;
    const used = formatCount(progress.used);
    const limit = progress.limit > 0 ? formatCount(progress.limit) : null;
    return `${plan}${progress.label}: ${limit ? `${used} of ${limit}` : used}`;
  }
  const text = output.lines.find((line) => line.type === "text");
  if (text && text.type === "text") return `${plan}${text.label}: ${text.value}`;
  const badge = output.lines.find((line) => line.type === "badge");
  if (badge && badge.type === "badge") return `${plan}${badge.label}: ${badge.text}`;
  return plan.trim() ? output.plan ?? "Quota not reported" : "Quota not reported";
}

function historyDetail(label: string, used: number, limit: number, resetsAt?: string | null): string {
  const amount = limit > 0 ? `${formatCount(used)} of ${formatCount(limit)}` : formatCount(used);
  const reset = resetsAt ? Date.parse(resetsAt) : Number.NaN;
  const when = Number.isFinite(reset) ? ` Resets ${formatStamp(reset)}.` : "";
  return `${label}: ${amount}.${when}`;
}

function requestDetail(model: string | null | undefined, input: number, output: number): string {
  return `${model || "Unknown model"} · ${formatCount(input)} in · ${formatCount(output)} out`;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trimNumber(value / 1_000_000)}M`;
  if (abs >= 10_000) return `${trimNumber(value / 1_000)}k`;
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

function trimNumber(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}

function formatStamp(ms: number): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);
}

function shortId(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
