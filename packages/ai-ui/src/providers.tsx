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

export function RoutingExplanation() {
  return (
    <p className="fb-muted">
      Autosteer selects an eligible account within the same provider. Pinned
      account routes keep their selected account. It does not switch models or
      providers.
    </p>
  );
}

export function RoutingPolicyForm({
  provider,
  enabled,
  threshold,
  pending,
  onSave,
}: {
  provider: string;
  enabled: boolean;
  threshold: number;
  pending: boolean;
  onSave: (enabled: boolean, threshold: number) => Promise<void>;
}) {
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
      className="fb-form"
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
          Enable {provider} autosteer
        </span>
      </Label>
      <p className="fb-muted">
        {on
          ? "The highest-ranked eligible account receives the next unpinned request."
          : "Unpinned requests use the active account."}
      </p>
      <Label>
        Skip accounts at quota usage (%)
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
        {pending ? "Saving…" : "Save routing preferences"}
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
}: {
  observation?: Observation<ResetCredits> | null;
}) {
  const now = useClock();
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
    <section className="fb-observation" aria-label="Limit reset credits">
      <div className="fb-row">
        <span className="fb-label">Limit reset credits</span>
        <strong>
          {inventory
            ? `${inventory.available} ${lastReported ? "last reported" : "available"}`
            : "Unavailable"}
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
          <ul aria-label="Next reported reset credit expiries">
            {upcoming.map((expiry, index) => (
              <li key={`${expiry}-${index}`}>
                <time
                  dateTime={new Date(expiry).toISOString()}
                  title={new Date(expiry).toLocaleString()}
                >
                  {resetExpiryLabel(expiry, now)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!expirySummary?.expiring && (
        <p className="fb-reset-warning" role="status">
          {expirySummary.expiring} reset credit
          {expirySummary.expiring === 1 ? " expires" : "s expire"} within 24
          hours.
        </p>
      )}
      {!!expirySummary?.expired && (
        <p className="fb-muted" role="status">
          A reported expiry has passed. Refresh inventory to check remaining
          credits.
        </p>
      )}
      {expirySummary?.stale && inventory && (
        <p className="fb-muted">
          Refresh inventory to check current availability.
        </p>
      )}
      {inventory && inventory.credits.length > 0 && (
        <details className="fb-reset-details">
          <summary>View expiry dates</summary>
          <ul>
            {inventory.credits.map((credit, index) => {
              const expiry = validTimestamp(credit.expiresAtMs)
                ? credit.expiresAtMs
                : null;
              return (
                <li key={index} className="fb-row">
                  <span>Reset {index + 1}</span>
                  <span>
                    {expiry === null ? (
                      "Expiry unavailable"
                    ) : (
                      <time
                        dateTime={new Date(expiry).toISOString()}
                        title={
                          now === null
                            ? undefined
                            : new Date(expiry).toLocaleString()
                        }
                      >
                        {resetExpiryLabel(expiry, now)}
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
        <p className="fb-muted">Some expiry dates are unavailable.</p>
      )}
      <ObservationStatus observation={observation} />
    </section>
  );
}

export function ObservationStatus({
  observation,
}: {
  observation: Observation<unknown>;
}) {
  return (
    <div className="fb-observation-status">
      {observation.freshness === "stale" && <span>Last known reading · </span>}
      {validTimestamp(observation.observedAtMs) && (
        <time dateTime={new Date(observation.observedAtMs).toISOString()}>
          Updated{" "}
          {new Date(observation.observedAtMs).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      )}
      {observation.error && <p>{observation.error}</p>}
    </div>
  );
}

const dollars = (value: number | null) =>
  value === null
    ? "Not reported"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
export function BalanceCard({
  observation,
}: {
  observation?: Observation<CreditBalance> | null;
}) {
  if (!observation) return null;
  const value = observation.value;
  return (
    <section className="fb-observation" aria-label="Credit balance">
      <div className="fb-row">
        <span className="fb-label">Available balance</span>
        <strong>{dollars(value?.remainingUsd ?? null)}</strong>
      </div>
      {value?.subscriptionRemainingUsd != null && (
        <div className="fb-row fb-muted">
          <span>Subscription</span>
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
          <span>Purchased credits</span>
          <span>{dollars(value.purchasedRemainingUsd)}</span>
        </div>
      )}
      <ObservationStatus observation={observation} />
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
export function ProviderCard({ provider }: { provider: ProviderOutput }) {
  const lines = provider.lines.filter(
    (line) =>
      line.type !== "barChart" &&
      !(
        provider.resetInventory &&
        (line.label.startsWith("Reset") || line.label === "Limit reset credits")
      ),
  );
  return (
    <Card className="fb-card-layout">
      <CardHeader className="fb-row">
        <div>
          <h2>{provider.displayName}</h2>
          <Badge>{provider.plan || "Connected provider"}</Badge>
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
                    : `${Math.round(line.used ?? 0)}${line.format?.kind === "percent" ? "%" : ""}`}
                </strong>
              </div>
              <Progress
                aria-label={line.label}
                max={Math.max(1, line.limit ?? 100)}
                value={line.used ?? 0}
              />
              {line.resetsAt && (
                <p className="fb-muted">
                  Resets{" "}
                  <time dateTime={line.resetsAt}>
                    {new Date(line.resetsAt).toLocaleString()}
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
        {!lines.length && (
          <p className="fb-muted">No quota reported by this provider.</p>
        )}
        <ResetInventory observation={provider.resetInventory} />
      </CardContent>
    </Card>
  );
}
