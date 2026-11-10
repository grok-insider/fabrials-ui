"use client";
import { Button, StatePanel } from "@fabrials/ui";

import * as React from "react";
import type { PrivateRecentPage, PrivateStoredObservation, ProviderOutput } from "./contracts";
import {
  accountsClasses,
  accountsReason,
  privateHistoryLabels,
  type AccountsHeadingLevel,
  type PrivateHistoryLabels,
} from "./accounts-labels";

export function PrivateHistoryView({
  fetchPage,
  description,
  heading = true,
  labels,
  locale,
  headingLevel = 2,
  className,
  ["aria-label"]: ariaLabel,
  ...props
}: React.ComponentProps<"section"> & {
  fetchPage: (before: number | null) => Promise<PrivateRecentPage>;
  description: string;
  /** The host already shows the page title. */
  heading?: boolean;
  labels?: Partial<PrivateHistoryLabels>;
  locale?: Intl.LocalesArgument;
  /** The section's title. The empty state inside it follows; every level looks the same. */
  headingLevel?: AccountsHeadingLevel;
}) {
  const text = { ...privateHistoryLabels, ...labels };
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
        if (current === generation.current) setError(accountsReason(cause));
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
        if (current === generation.current) setError(accountsReason(cause));
      })
      .finally(() => {
        if (current === generation.current) setBusy(false);
      });
    return invalidate;
  }, [fetchPage, invalidate]);
  const observations = pages.flatMap((page) => page.observations);
  const last = pages.at(-1);
  const Heading = `h${headingLevel}` as "h2";
  return (
    <section
      {...props}
      className={accountsClasses("fb-history", className)}
      aria-label={ariaLabel ?? (heading ? undefined : text.region)}
    >
      {heading ? (
        <div className="fb-heading">
          <Heading>{text.title}</Heading>
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
      {busy && observations.length === 0 ? <p role="status">{text.loading}</p> : null}
      {!busy && !error && observations.length === 0 ? (
        <StatePanel
          description={text.emptyDescription}
          headingLevel={Math.min(4, Math.max(2, headingLevel + 1)) as 2 | 3 | 4}
          state="empty"
          title={text.emptyTitle}
        />
      ) : null}
      {observations.length > 0 ? (
        <ol className="fb-log">
          {observations.map((item) => (
            <Observation item={item} key={item.cursor} labels={text} locale={locale} />
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
          {busy ? text.loadingOlder : text.loadOlder}
        </Button>
      ) : null}
    </section>
  );
}

function Observation({ item, labels, locale }: { item: PrivateStoredObservation; labels: PrivateHistoryLabels; locale?: Intl.LocalesArgument }) {
  const { event, source } = item.observation;
  const at = event.kind === "quota" ? event.at_ms : event.kind === "history" ? event.sample.ts_ms : event.record.ts_ms;
  const title = event.kind === "quota" ? event.output.displayName || source : source;
  const detail =
    event.kind === "quota"
      ? quotaDetail(event.output, labels, locale)
      : event.kind === "history"
        ? historyDetail(event.sample.label, event.sample.used, event.sample.limit, event.sample.resets_at, labels, locale)
        : requestDetail(event.record.model, event.record.input_tokens, event.record.output_tokens, labels, locale);
  return (
    <li className="fb-log-item">
      <div className="fb-row">
        <strong>{title}</strong>
        <time dateTime={new Date(at).toISOString()}>{formatStamp(at, locale)}</time>
      </div>
      <p>{detail}</p>
      <p className="fb-muted">
        {labels.kinds[event.kind]} · {labels.machine}{" "}
        <span className="fb-mono">{shortId(item.device)}</span>
      </p>
    </li>
  );
}

function quotaDetail(output: ProviderOutput, labels: PrivateHistoryLabels, locale?: Intl.LocalesArgument): string {
  const plan = output.plan ? `${output.plan}. ` : "";
  const progress = output.lines.find((line) => line.type === "progress");
  if (progress && progress.type === "progress") {
    if (progress.format.kind === "percent")
      return `${plan}${labels.quotaPercent(progress.label, String(Math.round(progress.used)))}`;
    const used = formatCount(progress.used, labels, locale);
    const limit = progress.limit > 0 ? formatCount(progress.limit, labels, locale) : null;
    return `${plan}${labels.quotaLine(progress.label, limit ? labels.quotaOf(used, limit) : used)}`;
  }
  const text = output.lines.find((line) => line.type === "text");
  if (text && text.type === "text") return `${plan}${labels.quotaLine(text.label, text.value)}`;
  const badge = output.lines.find((line) => line.type === "badge");
  if (badge && badge.type === "badge") return `${plan}${labels.quotaLine(badge.label, badge.text)}`;
  return plan.trim() ? output.plan ?? labels.quotaNotReported : labels.quotaNotReported;
}

function historyDetail(
  label: string,
  used: number,
  limit: number,
  resetsAt: string | null | undefined,
  labels: PrivateHistoryLabels,
  locale?: Intl.LocalesArgument,
): string {
  const amount =
    limit > 0
      ? labels.quotaOf(formatCount(used, labels, locale), formatCount(limit, labels, locale))
      : formatCount(used, labels, locale);
  const reset = resetsAt ? Date.parse(resetsAt) : Number.NaN;
  const when = Number.isFinite(reset) ? formatStamp(reset, locale) : null;
  return labels.historyLine(label, amount, when);
}

function requestDetail(
  model: string | null | undefined,
  input: number,
  output: number,
  labels: PrivateHistoryLabels,
  locale?: Intl.LocalesArgument,
): string {
  return labels.requestLine(
    model || labels.unknownModel,
    formatCount(input, labels, locale),
    formatCount(output, labels, locale),
  );
}

function formatCount(value: number, labels: PrivateHistoryLabels, locale?: Intl.LocalesArgument): string {
  if (!Number.isFinite(value)) return labels.zero;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trimNumber(value / 1_000_000, locale)}M`;
  if (abs >= 10_000) return `${trimNumber(value / 1_000, locale)}k`;
  return new Intl.NumberFormat(locale ?? "en", { maximumFractionDigits: 0 }).format(value);
}

function trimNumber(value: number, locale?: Intl.LocalesArgument): string {
  return new Intl.NumberFormat(locale ?? "en", { maximumFractionDigits: 1 }).format(value);
}

function formatStamp(ms: number, locale?: Intl.LocalesArgument): string {
  return new Intl.DateTimeFormat(locale ?? "en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ms);
}

function shortId(value: string): string {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
