"use client";

import type { ComponentProps } from "react";
import { Card, CardContent, CardHeader, Table } from "@fabrials/ui";
import { ProviderCard, useClock } from "./providers";
import type { SynchronizedAccount } from "./contracts";
import {
  accountsClasses,
  linkedAccountUsageLabels,
  synchronizedAccountsLabels,
  type AccountsHeadingLevel,
  type LinkedAccountUsageLabels,
  type SynchronizedAccountsLabels,
} from "./accounts-labels";

const level = (value: AccountsHeadingLevel): AccountsHeadingLevel =>
  Math.min(6, value + 1) as AccountsHeadingLevel;

const amount = (value: number, locale?: Intl.LocalesArgument) =>
  locale === undefined
    ? value.toFixed(2)
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

export function SynchronizedAccounts({
  accounts: allAccounts,
  includeLinked = false,
  labels,
  locale,
  headingLevel = 2,
  providerHeadingLevel = 2,
  now: fixedNow,
  className,
  ["aria-label"]: ariaLabel,
  ...props
}: ComponentProps<"section"> & {
  accounts: SynchronizedAccount[];
  includeLinked?: boolean;
  labels?: Partial<SynchronizedAccountsLabels>;
  locale?: Intl.LocalesArgument;
  /** The section's title. The log inside it follows; every level looks the same. */
  headingLevel?: AccountsHeadingLevel;
  /** The provider's name inside each account. Two by default, as 0.11 wrote it. */
  providerHeadingLevel?: AccountsHeadingLevel;
  /** The moment the readings are compared to. By default the shared clock, which the server cannot read. */
  now?: number | null;
}) {
  const clockNow = useClock();
  const now = fixedNow === undefined ? clockNow : fixedNow;
  const text = {
    ...synchronizedAccountsLabels,
    ...labels,
    provider: { ...synchronizedAccountsLabels.provider, ...labels?.provider },
  };
  const accounts = allAccounts.filter(
    (account) => includeLinked || !account.linked_account_id,
  );
  if (!accounts.length) return null;
  const Heading = `h${headingLevel}` as "h2";
  const SubHeading = `h${level(headingLevel)}` as "h3";
  return (
    <section
      {...props}
      aria-label={ariaLabel ?? text.region}
      className={accountsClasses("fb-synchronized-accounts", className)}
    >
      {!includeLinked && (
        <header>
          <Heading>{text.title}</Heading>
          <p className="fb-muted">{text.description}</p>
        </header>
      )}
      <div
        className={
          includeLinked ? "fb-synchronized-linked" : "fb-synchronized-grid"
        }
      >
        {accounts.map((account) => (
          <div
            key={`${account.device}:${account.source}`}
            className="fb-synchronized-account"
          >
            <div className="fb-row">
              <strong>{account.source}</strong>
              <span>
                {account.linked_account_id ? text.verified : text.synchronized}
              </span>
            </div>
            <p className="fb-muted">
              {text.installation(account.device.slice(0, 8))}{" · "}
              {now !== null && now - account.observed_at_ms > 900_000
                ? text.stale
                : ""}
              <time dateTime={new Date(account.observed_at_ms).toISOString()}>
                {new Date(account.observed_at_ms).toLocaleString(locale ?? [])}
              </time>
            </p>
            <ProviderCard
              headingLevel={providerHeadingLevel}
              labels={text.provider}
              locale={locale}
              provider={account.output}
            />
            {account.local_usage && (
              <Card className="fb-card-layout">
                <CardHeader>
                  <SubHeading>{text.localHistory}</SubHeading>
                  <p className="fb-muted">{text.localHistoryDescription}</p>
                </CardHeader>
                <CardContent className="fb-content-layout">
                  <p>
                    {text.estimate(
                      account.local_usage.days
                        .reduce((sum, day) => sum + day.tokens, 0)
                        .toLocaleString(locale ?? []),
                      amount(
                        account.local_usage.days.reduce(
                          (sum, day) => sum + day.estimated_usd,
                          0,
                        ),
                        locale,
                      ),
                    )}
                    {account.local_usage.partial ? text.partial : ""}
                  </p>
                  <details>
                    <summary>{text.dailyUsage}</summary>
                    <Table>
                      <thead>
                        <tr>
                          <th scope="col">{text.date}</th>
                          <th scope="col">{text.tokens}</th>
                          <th scope="col">{text.estimatedCost}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.local_usage.days.map((day) => (
                          <tr key={day.date}>
                            <td>{day.date}</td>
                            <td>{day.tokens.toLocaleString(locale ?? [])}</td>
                            <td>${amount(day.estimated_usd, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </details>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function LinkedAccountUsage({
  accounts,
  labels,
  accountsLabels,
  locale,
  className,
  ...props
}: ComponentProps<"details"> & {
  accounts: SynchronizedAccount[];
  labels?: Partial<LinkedAccountUsageLabels>;
  /** The words of the accounts under the summary. */
  accountsLabels?: Partial<SynchronizedAccountsLabels>;
  locale?: Intl.LocalesArgument;
}) {
  const text = { ...linkedAccountUsageLabels, ...labels };
  if (!accounts.length) return null;
  return (
    <details
      {...props}
      className={accountsClasses("fb-linked-account-usage", className)}
    >
      <summary>{text.sources(accounts.length)}</summary>
      <SynchronizedAccounts
        accounts={accounts}
        includeLinked
        labels={accountsLabels}
        locale={locale}
      />
    </details>
  );
}
