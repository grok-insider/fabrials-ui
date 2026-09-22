import {
  Card,
  CardContent,
  CardHeader,
  Label,
  NativeSelect,
  Table,
} from "@fabrials/ui";
import * as React from "react";

import type { ConsumptionReport as Report, SourceStatus } from "./contracts";
export type { ConsumptionTotal } from "./contracts";
export type ConsumptionSource = SourceStatus;
export type ConsumptionReport = Omit<Report, "records" | "records_truncated">;
const number = new Intl.NumberFormat();
const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function ConsumptionView({
  report,
  synchronized = false,
}: {
  report: ConsumptionReport;
  synchronized?: boolean;
}) {
  const [group, setGroup] = React.useState<
    "daily" | "period_totals" | "clients" | "models" | "sessions" | "projects"
  >("daily");
  return (
    <>
      <div className="fb-grid">
        <Card className="fb-card-layout">
          <CardHeader>
            <h2>Tokens</h2>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>{number.format(report.total.tokens)}</strong>
            <p className="fb-muted">
              Recorded by your clients
              {report.total.unknown_token_records > 0 &&
                " · token counts incomplete"}
            </p>
          </CardContent>
        </Card>
        <Card className="fb-card-layout">
          <CardHeader>
            <h2>Known cost</h2>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>{money.format(report.total.known_usd)}</strong>
            <p className="fb-muted">
              {report.total.partial
                ? "Partial · some data or prices are unavailable"
                : "Reported costs and list-price estimates"}
            </p>
          </CardContent>
        </Card>
        <Card className="fb-card-layout">
          <CardHeader>
            <h2>Sources with data</h2>
          </CardHeader>
          <CardContent className="fb-content-layout">
            <strong>
              {report.sources.filter((source) => source.records > 0).length}
            </strong>
            <p className="fb-muted">
              Local consumption, separate from proxy traffic and quotas
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="fb-card-layout">
        <CardHeader className="fb-row fb-consumption-filters">
          <h2>Consumption breakdown</h2>
          <Label>
            Group by{" "}
            <NativeSelect
              value={group}
              onChange={(event) => setGroup(event.target.value as typeof group)}
            >
              <option value="daily">Day</option>
              <option value="period_totals">Session / account totals</option>
              <option value="clients">Client</option>
              {(!synchronized || report.models.length > 0) && (
                <option value="models">Model</option>
              )}
              {!synchronized && (
                <>
                  <option value="sessions">Session</option>
                  <option value="projects">Project</option>
                </>
              )}
            </NativeSelect>
          </Label>
        </CardHeader>
        {group === "daily" && report.period_totals.length > 0 && (
          <p className="fb-content-layout">
            Some sources report session or account totals. See “Session /
            account totals”; these are not split into estimated daily activity.
          </p>
        )}
        <div className="fb-table-wrap">
          <Table className="fb-table-layout">
            <thead>
              <tr>
                <th scope="col">{group}</th>
                {group === "models" && <th scope="col">Requests</th>}
                <th scope="col">Tokens</th>
                <th scope="col">Known cost</th>
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
                    {row.partial ? " · partial" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {!report[group].length && (
          <p className="fb-content-layout">No recorded usage in this period.</p>
        )}
      </Card>
      <details className="fb-card-layout">
        <summary className="fb-content-layout">Source status</summary>
        <CardContent className="fb-content-layout">
          {report.sources.map((source) => (
            <p key={source.client}>
              <strong>{source.client}</strong> ·{" "}
              {source.state.replaceAll("_", " ")}
              {source.detail && <> — {source.detail}</>}
            </p>
          ))}
        </CardContent>
      </details>
    </>
  );
}
