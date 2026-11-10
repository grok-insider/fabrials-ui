"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Label,
  NativeSelect,
  Table,
  useLocale,
} from "@fabrials/ui";
import * as React from "react";

import type { ConsumptionReport as Report, SourceStatus } from "./contracts";
import {
  accountsClasses,
  consumptionViewLabels,
  type AccountsHeadingLevel,
  type ConsumptionGroup,
  type ConsumptionViewLabelOverrides,
  type ConsumptionViewLabels,
} from "./accounts-labels";
export type { ConsumptionTotal } from "./contracts";
export type ConsumptionSource = SourceStatus;
export type ConsumptionReport = Omit<Report, "records" | "records_truncated">;

export function ConsumptionView({
  report,
  synchronized = false,
  labels,
  locale: ownLocale,
  headingLevel = 2,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  report: ConsumptionReport;
  synchronized?: boolean;
  labels?: ConsumptionViewLabelOverrides;
  /** The language of the numbers and dates: this prop, else a `LabelsProvider`'s, else English. */
  locale?: Intl.LocalesArgument;
  /** The title of each block. Two by default, as 0.11 wrote it. */
  headingLevel?: AccountsHeadingLevel;
}) {
  const locale = useLocale(ownLocale);
  const text: ConsumptionViewLabels = {
    ...consumptionViewLabels,
    ...labels,
    groupOptions: {
      ...consumptionViewLabels.groupOptions,
      ...labels?.groupOptions,
    },
    groupHeadings: {
      ...consumptionViewLabels.groupHeadings,
      ...labels?.groupHeadings,
    },
    states: { ...consumptionViewLabels.states, ...labels?.states },
  };
  const number = new Intl.NumberFormat(locale);
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  const Heading = `h${headingLevel}` as "h2";
  const [group, setGroup] = React.useState<ConsumptionGroup>("daily");
  const body = (
    <>
      <div className="fb-grid">
        <Card className="fb-card-layout">
          <CardHeader>
            <Heading>{text.tokens}</Heading>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>{number.format(report.total.tokens)}</strong>
            <p className="fb-muted">
              {text.recordedBy(report.total.unknown_token_records > 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="fb-card-layout">
          <CardHeader>
            <Heading>{text.knownCost}</Heading>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>{money.format(report.total.known_usd)}</strong>
            <p className="fb-muted">{text.knownCostNote(report.total.partial)}</p>
          </CardContent>
        </Card>
        <Card className="fb-card-layout">
          <CardHeader>
            <Heading>{text.sourcesWithData}</Heading>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>
              {report.sources.filter((source) => source.records > 0).length}
            </strong>
            <p className="fb-muted">{text.sourcesNote}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="fb-card-layout">
        <CardHeader className="fb-row fb-consumption-filters">
          <Heading>{text.breakdown}</Heading>
          <Label>
            {text.groupBy}{" "}
            <NativeSelect
              value={group}
              onChange={(event) => setGroup(event.target.value as typeof group)}
            >
              <option value="daily">{text.groupOptions.daily}</option>
              <option value="period_totals">
                {text.groupOptions.period_totals}
              </option>
              <option value="clients">{text.groupOptions.clients}</option>
              {(!synchronized || report.models.length > 0) && (
                <option value="models">{text.groupOptions.models}</option>
              )}
              {!synchronized && (
                <>
                  <option value="sessions">{text.groupOptions.sessions}</option>
                  <option value="projects">{text.groupOptions.projects}</option>
                </>
              )}
            </NativeSelect>
          </Label>
        </CardHeader>
        {group === "daily" && report.period_totals.length > 0 && (
          <p className="fb-content-layout">{text.sessionTotalsNote}</p>
        )}
        <div className="fb-table-wrap">
          <Table className="fb-table-layout">
            <thead>
              <tr>
                <th scope="col">{text.groupHeadings[group]}</th>
                {group === "models" && (
                  <th scope="col">{text.requests}</th>
                )}
                <th scope="col">{text.tokensColumn}</th>
                <th scope="col">{text.knownCostColumn}</th>
              </tr>
            </thead>
            <tbody>
              {report[group].map((row) => (
                <tr key={row.key}>
                  <th scope="row" style={{ overflowWrap: "anywhere" }}>
                    {row.key}
                  </th>
                  {group === "models" && <td>{number.format(row.records)}</td>}
                  <td>{number.format(row.tokens)}</td>
                  <td>
                    {money.format(row.known_usd)}
                    {row.partial ? text.partial : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {!report[group].length && (
          <p className="fb-content-layout">{text.empty}</p>
        )}
      </Card>
      <details className="fb-card-layout">
        <summary className="fb-content-layout">{text.sourceStatus}</summary>
        <CardContent className="fb-content-layout">
          {report.sources.map((source) => (
            <p key={source.client}>
              <strong>{source.client}</strong> · {text.states[source.state]}
              {source.detail && <> — {source.detail}</>}
            </p>
          ))}
        </CardContent>
      </details>
    </>
  );
  // Without a class name or any other prop the blocks sit where the host put them, as they did in 0.11; a host that passes one
  // gets them inside a single element that carries it.
  const carries = className !== undefined || Object.keys(props).length > 0;
  if (!carries) return body;
  return (
    <div {...props} className={accountsClasses("fb-consumption", className)}>
      {body}
    </div>
  );
}
