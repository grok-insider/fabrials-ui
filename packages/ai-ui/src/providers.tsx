"use client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
  NativeCheckbox,
  Progress,
  useLocale,
} from "@fabrials/ui";

import * as React from "react";
import { ProviderIcon } from "./provider-icon";
import { Badge } from "@fabrials/ui";
import {
  resetExpiryLabel,
  resetExpirySummary,
  upcomingResetExpiries,
  validTimestamp,
} from "./reset-expiry";
import {
  accountsClasses,
  balanceCardLabels,
  observationStatusLabels,
  providerCardLabels,
  resetInventoryLabels,
  routingExplanationLabels,
  routingPolicyFormLabels,
  type BalanceCardLabels,
  type ObservationStatusLabels,
  type ProviderCardLabels,
  type ResetInventoryLabels,
  type RoutingExplanationLabels,
  type RoutingPolicyFormLabels,
} from "./accounts-labels";

export function RoutingExplanation({
  labels,
  className,
  ...props
}: React.ComponentProps<"p"> & {
  /** The sentence. */
  labels?: Partial<RoutingExplanationLabels>;
}) {
  const text = { ...routingExplanationLabels, ...labels };
  return (
    <p {...props} className={accountsClasses("fb-muted", className)}>
      {text.text}
    </p>
  );
}

export function RoutingPolicyForm({
  provider,
  enabled,
  threshold,
  pending,
  onSave,
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit"> & {
  provider: string;
  enabled: boolean;
  threshold: number;
  pending: boolean;
  onSave: (enabled: boolean, threshold: number) => Promise<void>;
  labels?: Partial<RoutingPolicyFormLabels>;
}) {
  const text = { ...routingPolicyFormLabels, ...labels };
  const [on, setOn] = React.useState(enabled);
  const [limit, setLimit] = React.useState(String(threshold));
  const numeric = Number(limit);
  const valid =
    limit.trim() !== "" &&
    Number.isFinite(numeric) &&
    numeric > 0 &&
    numeric <= 100;
  const changed = on !== enabled || numeric !== threshold;
  return (
    <form
      {...props}
      className={accountsClasses("fb-form", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !pending) void onSave(on, numeric);
      }}
    >
      <Label>
        <span>
          <NativeCheckbox
            type="checkbox"
            checked={on}
            disabled={pending}
            onChange={(event) => setOn(event.target.checked)}
          />{" "}
          {text.enable(provider)}
        </span>
      </Label>
      <p className="fb-muted">
        {on ? text.enabledHint : text.disabledHint}
      </p>
      <Label>
        {text.threshold}
        <Input
          type="number"
          min="0.01"
          max="100"
          step="any"
          required
          value={limit}
          disabled={pending}
          onChange={(event) => setLimit(event.target.value)}
        />
      </Label>
      <Button
        className=" "
        disabled={pending || !valid || !changed}
        type="submit"
      >
        {pending ? text.saving : text.save}
      </Button>
    </form>
  );
}

import type {
  Observation,
  CreditBalance,
  ResetInventory as ResetCredits,
  MetricLine,
  ProviderOutput,
} from "./contracts";

let clock: number | null = null;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;
function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  clock = Date.now();
  if (!clockTimer)
    clockTimer = setInterval(() => {
      clock = Date.now();
      for (const notify of clockListeners) notify();
    }, 60_000);
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}
export function useClock() {
  return React.useSyncExternalStore(
    subscribeClock,
    () => clock,
    () => null,
  );
}

export function ResetInventory({
  observation,
  now: fixedNow,
  labels,
  locale: ownLocale,
  timeZone,
  className,
  ["aria-label"]: ariaLabel,
  ...props
}: React.ComponentProps<"section"> & {
  observation?: Observation<ResetCredits> | null;
  /** The moment the credits are counted from. By default the shared clock, which the server cannot read. */
  now?: number | null;
  labels?: Partial<ResetInventoryLabels>;
  /** The language of the numbers and dates: this prop, else a `LabelsProvider`'s, else English. */
  locale?: Intl.LocalesArgument;
  /** The zone the tooltips print. Default: the browser's, which differs from the server's. */
  timeZone?: string;
}) {
  const locale = useLocale(ownLocale);
  const clockNow = useClock();
  const now = fixedNow === undefined ? clockNow : fixedNow;
  const text = {
    ...resetInventoryLabels,
    ...labels,
    expiry: { ...resetInventoryLabels.expiry, ...labels?.expiry },
  };
  if (!observation || observation.availability === "unsupported") return null;
  const inventory = observation.value;
  const expirySummary =
    now === null ? null : resetExpirySummary(observation, now);
  const upcoming = upcomingResetExpiries(inventory, now);
  const lastReported =
    now === null ||
    observation.availability !== "available" ||
    expirySummary?.stale ||
    expirySummary?.expired;
  return (
    <section
      {...props}
      className={accountsClasses("fb-observation", className)}
      aria-label={ariaLabel ?? text.title}
    >
      <div className="fb-row">
        <span className="fb-label">{text.title}</span>
        <strong>
          {inventory
            ? text.count(inventory.available, Boolean(lastReported))
            : text.unavailable}
        </strong>
      </div>
      {upcoming.length > 0 && (
        <div className="fb-reset-preview">
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6H8" />
          </svg>
          <ul aria-label={text.expiries}>
            {upcoming.map((expiry, index) => (
              <li key={`${expiry}-${index}`}>
                <time
                  dateTime={new Date(expiry).toISOString()}
                  title={new Date(expiry).toLocaleString(locale, { timeZone })}
                >
                  {resetExpiryLabel(expiry, now, text.expiry)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!expirySummary?.expiring && (
        <p className="fb-reset-warning" role="status">
          {text.expiring(expirySummary.expiring)}
        </p>
      )}
      {!!expirySummary?.expired && (
        <p className="fb-muted" role="status">
          {text.expired}
        </p>
      )}
      {expirySummary?.stale && inventory && (
        <p className="fb-muted">{text.stale}</p>
      )}
      {inventory && inventory.credits.length > 0 && (
        <details className="fb-reset-details">
          <summary>{text.details}</summary>
          <ul>
            {inventory.credits.map((credit, index) => {
              const expiry = validTimestamp(credit.expiresAtMs)
                ? credit.expiresAtMs
                : null;
              return (
                <li key={index} className="fb-row">
                  <span>{text.credit(index + 1)}</span>
                  <span>
                    {expiry === null ? (
                      text.expiryUnavailable
                    ) : (
                      <time
                        dateTime={new Date(expiry).toISOString()}
                        title={
                          now === null
                            ? undefined
                            : new Date(expiry).toLocaleString(locale, { timeZone })
                        }
                      >
                        {resetExpiryLabel(expiry, now, text.expiry)}
                      </time>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      {inventory && !inventory.detailsComplete && (
        <p className="fb-muted">{text.incomplete}</p>
      )}
      <ObservationStatus
        observation={observation}
        labels={text.status}
        locale={locale}
        timeZone={timeZone}
      />
    </section>
  );
}

export function ObservationStatus({
  observation,
  labels,
  locale: ownLocale,
  timeZone,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  observation: Observation<unknown>;
  labels?: Partial<ObservationStatusLabels>;
  /** The language of the numbers and dates: this prop, else a `LabelsProvider`'s, else English. */
  locale?: Intl.LocalesArgument;
  /** The zone the time is written in. Default: the browser's, which differs from the server's. */
  timeZone?: string;
}) {
  const locale = useLocale(ownLocale);
  const text = { ...observationStatusLabels, ...labels };
  return (
    <div
      {...props}
      className={accountsClasses("fb-observation-status", className)}
    >
      {observation.freshness === "stale" && <span>{text.stale}</span>}
      {validTimestamp(observation.observedAtMs) && (
        <time dateTime={new Date(observation.observedAtMs).toISOString()}>
          {text.updated(
            new Date(observation.observedAtMs).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone,
            }),
          )}
        </time>
      )}
      {observation.error && <p>{observation.error}</p>}
    </div>
  );
}

export function BalanceCard({
  observation,
  labels,
  locale: ownLocale,
  timeZone,
  className,
  ["aria-label"]: ariaLabel,
  ...props
}: React.ComponentProps<"section"> & {
  observation?: Observation<CreditBalance> | null;
  labels?: Partial<BalanceCardLabels>;
  /** The language of the numbers and dates: this prop, else a `LabelsProvider`'s, else English. */
  locale?: Intl.LocalesArgument;
  /** The zone the time is written in. Default: the browser's, which differs from the server's. */
  timeZone?: string;
}) {
  const locale = useLocale(ownLocale);
  const text = {
    ...balanceCardLabels,
    ...labels,
    status: { ...balanceCardLabels.status, ...labels?.status },
  };
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  });
  const dollars = (value: number | null) =>
    value === null ? text.notReported : money.format(value);
  if (!observation) return null;
  const value = observation.value;
  return (
    <section
      {...props}
      className={accountsClasses("fb-observation", className)}
      aria-label={ariaLabel ?? text.title}
    >
      <div className="fb-row">
        <span className="fb-label">{text.available}</span>
        <strong>{dollars(value?.remainingUsd ?? null)}</strong>
      </div>
      {value?.subscriptionRemainingUsd != null && (
        <div className="fb-row fb-muted">
          <span>{text.subscription}</span>
          <span>
            {dollars(value.subscriptionRemainingUsd)}
            {value.subscriptionLimitUsd != null
              ? ` / ${dollars(value.subscriptionLimitUsd)}`
              : ""}
          </span>
        </div>
      )}
      {value?.purchasedRemainingUsd != null && (
        <div className="fb-row fb-muted">
          <span>{text.purchased}</span>
          <span>{dollars(value.purchasedRemainingUsd)}</span>
        </div>
      )}
      <ObservationStatus
        observation={observation}
        labels={text.status}
        locale={locale}
        timeZone={timeZone}
      />
    </section>
  );
}

function metricText(line: MetricLine): string {
  return line.type === "text"
    ? line.value
    : line.type === "badge"
      ? line.text
      : "";
}
export function ProviderCard({
  provider,
  labels,
  locale: ownLocale,
  timeZone,
  headingLevel = 2,
  className,
  ...props
}: React.ComponentProps<"section"> & {
  provider: ProviderOutput;
  labels?: Partial<ProviderCardLabels>;
  /** The language of the numbers and dates: this prop, else a `LabelsProvider`'s, else English. */
  locale?: Intl.LocalesArgument;
  /** The zone the reset times are written in. Default: the browser's, which differs from the server's. */
  timeZone?: string;
  /** The card's title. Nested headings follow it; every level looks the same. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const locale = useLocale(ownLocale);
  const text = {
    ...providerCardLabels,
    ...labels,
    reset: { ...providerCardLabels.reset, ...labels?.reset },
  };
  const Heading = `h${headingLevel}` as "h2";
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  });
  const dollars = (value: number | null) =>
    value === null ? balanceCardLabels.notReported : money.format(value);
  const lines = provider.lines.filter(
    (line) =>
      line.type !== "barChart" &&
      !(
        provider.resetInventory &&
        (line.label.startsWith("Reset") || line.label === "Limit reset credits")
      ),
  );
  return (
    <Card {...props} className={accountsClasses("fb-card-layout", className)}>
      <CardHeader className="fb-row">
        <div>
          <Heading>{provider.displayName}</Heading>
          <Badge>{provider.plan || text.connectedProvider}</Badge>
        </div>
        <ProviderIcon provider={provider.providerId} />
      </CardHeader>
      <CardContent className="fb-content-layout">
        {lines.map((line, index) =>
          line.type === "progress" ? (
            <div className="fb-metric" key={index}>
              <div className="fb-row">
                <span>{line.label}</span>
                <strong>
                  {line.format?.kind === "dollars"
                    ? dollars(line.used ?? null)
                    : line.format?.kind === "percent"
                      ? text.percent(line.used ?? 0)
                      : text.count(
                          String(Math.round(line.used ?? 0)),
                          line.format?.kind === "count" ? line.format.suffix : "",
                        )}
                </strong>
              </div>
              <Progress
                aria-label={line.label}
                max={Math.max(1, line.limit ?? 100)}
                value={line.used ?? 0}
              />
              {line.resetsAt && (
                <p className="fb-muted">
                  {text.resets}{" "}
                  <time dateTime={line.resetsAt}>
                    {new Date(line.resetsAt).toLocaleString(locale, { timeZone })}
                  </time>
                </p>
              )}
            </div>
          ) : line.kind === "error" ? (
            <p role="status" className="fb-error" key={index}>
              {metricText(line)}
            </p>
          ) : (
            <div className="fb-row" key={index}>
              <span className="fb-muted">{line.label}</span>
              <span>{metricText(line)}</span>
            </div>
          ),
        )}
        {!lines.length && <p className="fb-muted">{text.noQuota}</p>}
        <ResetInventory
          observation={provider.resetInventory}
          labels={text.reset}
          locale={locale}
          timeZone={timeZone}
        />
      </CardContent>
    </Card>
  );
}
