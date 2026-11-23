"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  CardCaption,
  Checkbox,
  CornerMarks,
  Label,
  NumberTicker,
  RadiantGlyph,
  Slider,
  Stat,
  StatGroup,
  StatusDot,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  WorkingLight,
} from "@fabrials/ui";
import { AgentThinking, SourceTally, ToolCall } from "@fabrials/ai-ui";

type SurfaceTab = "console" | "agent" | "controls";
type Period = "7d" | "14d" | "30d";

const PERIOD_DATA: Record<
  Period,
  {
    requests: number;
    delta: string;
    latency: number;
    quota: number;
    rows: readonly { key: string; model: string; count: string; status: "active" | "limited" }[];
  }
> = {
  "7d": {
    requests: 418_240,
    delta: "+6.4%",
    latency: 284,
    quota: 42,
    rows: [
      { key: "station-relay", model: "stormfather-2", count: "212,480", status: "active" },
      { key: "radiant-prod", model: "claude-fable-5", count: "148,910", status: "active" },
      { key: "spanreed-capture", model: "grok-5-fast", count: "56,850", status: "limited" },
    ],
  },
  "14d": {
    requests: 1_284_902,
    delta: "+8.2%",
    latency: 312,
    quota: 74,
    rows: [
      { key: "station-relay", model: "stormfather-2", count: "482,113", status: "active" },
      { key: "radiant-prod", model: "claude-fable-5", count: "391,027", status: "active" },
      { key: "spanreed-capture", model: "grok-5-fast", count: "204,880", status: "limited" },
    ],
  },
  "30d": {
    requests: 2_940_615,
    delta: "+14.1%",
    latency: 298,
    quota: 86,
    rows: [
      { key: "station-relay", model: "stormfather-2", count: "1,194,200", status: "active" },
      { key: "radiant-prod", model: "claude-fable-5", count: "982,415", status: "active" },
      { key: "spanreed-capture", model: "grok-5-fast", count: "418,900", status: "limited" },
    ],
  },
};

const AGENT_SOURCES = [
  "https://ui.fabrials.com/docs/tokens",
  "https://ui.fabrials.com/docs/working-light",
  "https://ui.fabrials.com/docs/tool-call",
  "https://ui.fabrials.com/docs/stat-group",
] as const;

export function HeroInstrument() {
  const [surface, setSurface] = useState<SurfaceTab>("console");
  const [period, setPeriod] = useState<Period>("14d");
  const [agentLive, setAgentLive] = useState(true);
  const [ceiling, setCeiling] = useState(120);
  const [strictTokens, setStrictTokens] = useState(true);
  const [auditLog, setAuditLog] = useState(true);

  const data = PERIOD_DATA[period];

  return (
    <div className="landing-specimen-wrap">
      <CornerMarks>
        <section className="landing-specimen" aria-label="Interactive Fabrials UI specimen">
          <div className="landing-specimen-bar">
            <div className="landing-specimen-brand">
              <RadiantGlyph order="elsecaller" size={20} colored />
              <span>ai.fabrials.com</span>
              <span className="landing-specimen-sub">relay · Kholinar</span>
            </div>
            <ToggleGroup
              aria-label="Specimen surface"
              size="sm"
              value={[surface]}
              onValueChange={(next) => {
                if (next[0]) setSurface(next[0] as SurfaceTab);
              }}
            >
              <ToggleGroupItem value="console">Console</ToggleGroupItem>
              <ToggleGroupItem value="agent">Agent</ToggleGroupItem>
              <ToggleGroupItem value="controls">Controls</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="landing-specimen-body">
            {surface === "console" && (
              <>
                <div className="landing-specimen-head">
                  <div className="landing-specimen-caption-line">
                    <strong>Usage telemetry</strong>
                    <span>Synthetic data · switch window to roll figures</span>
                  </div>
                  <ToggleGroup
                    aria-label="Reporting period"
                    size="sm"
                    value={[period]}
                    onValueChange={(next) => {
                      if (next[0]) setPeriod(next[0] as Period);
                    }}
                  >
                    <ToggleGroupItem value="7d">7d</ToggleGroupItem>
                    <ToggleGroupItem value="14d">14d</ToggleGroupItem>
                    <ToggleGroupItem value="30d">30d</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <StatGroup>
                  <Stat
                    label="Requests"
                    value={<NumberTicker value={data.requests} locale="en" />}
                    delta={data.delta}
                    trend="up"
                  />
                  <Stat
                    label="P95 latency"
                    value={<NumberTicker value={data.latency} locale="en" />}
                    unit="ms"
                  />
                  <Stat
                    label="Quota used"
                    value={`${data.quota}%`}
                    meter={{ value: data.quota, max: 100, label: `${data.quota}% of monthly quota` }}
                  />
                </StatGroup>

                <div className="min-w-0 overflow-x-auto">
                  <table className="landing-specimen-table" aria-label="Active relay keys">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th className="landing-specimen-col-model">Model</th>
                        <th>Requests</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row) => (
                        <tr key={row.key}>
                          <td className="landing-specimen-mono">{row.key}</td>
                          <td className="landing-specimen-col-model landing-specimen-mono text-muted-foreground">
                            {row.model}
                          </td>
                          <td>{row.count}</td>
                          <td>
                            {row.status === "active" ? (
                              <Badge tone="success" dot size="sm">
                                Active
                              </Badge>
                            ) : (
                              <Badge tone="warning" dot size="sm">
                                Rate limited
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {surface === "agent" && (
              <>
                <div className="landing-specimen-head">
                  <div className="landing-specimen-caption-line">
                    <strong>@fabrials/ai-ui runtime</strong>
                    <span>Working light turns only while work is active</span>
                  </div>
                  <Label className="fui-choice">
                    <Switch checked={agentLive} onCheckedChange={setAgentLive} />
                    <span>Agent working</span>
                  </Label>
                </div>

                <div className="landing-specimen-agent-stage">
                  {agentLive ? (
                    <AgentThinking activity="searching" label="Inspecting token spend spike on day 13" timer={false} />
                  ) : (
                    <StatusDot tone="success" label="Completed analysis in 1.4 s" />
                  )}
                  <ToolCall
                    name="query_usage_logs"
                    state={agentLive ? "running" : "done"}
                    duration={agentLive ? undefined : 380}
                    input={{ key: "station-relay", window: "14d" }}
                    output={agentLive ? undefined : { matched: 4, peakRequests: 144_000 }}
                  />
                  <SourceTally sources={AGENT_SOURCES} label={agentLive ? "Reviewing sources" : "Read"} />
                  {agentLive && <WorkingLight />}
                </div>
              </>
            )}

            {surface === "controls" && (
              <div className="landing-specimen-controls">
                <div className="landing-specimen-head">
                  <div className="landing-specimen-caption-line">
                    <strong>Material & tactile controls</strong>
                    <span>Key bevel, sunken wells, Stormlight interaction light</span>
                  </div>
                </div>

                <div className="landing-specimen-row">
                  <Button size="sm">Create key</Button>
                  <Button size="sm" variant="accent">
                    Deploy
                  </Button>
                  <Button size="sm" variant="outline">
                    Export CSV
                  </Button>
                  <Button size="sm" variant="destructive">
                    Revoke
                  </Button>
                </div>

                <div className="landing-specimen-row">
                  <Badge tone="info" dot>
                    Stormlight
                  </Badge>
                  <Badge tone="success" dot>
                    Healthy
                  </Badge>
                  <Badge tone="warning" dot>
                    Rate limited
                  </Badge>
                  <Badge tone="danger" dot>
                    Revoked
                  </Badge>
                  <Badge>v0.12</Badge>
                </div>

                <div className="landing-specimen-divider">
                  <Slider
                    label="Rate ceiling"
                    unit="req/s"
                    min={20}
                    max={300}
                    step={10}
                    value={ceiling}
                    onValueChange={(value) => {
                      if (typeof value === "number") setCeiling(value);
                    }}
                    showValue
                  />
                </div>

                <div className="landing-specimen-row landing-specimen-divider">
                  <Label className="fui-choice">
                    <Checkbox checked={strictTokens} onCheckedChange={(value) => setStrictTokens(Boolean(value))} />
                    <span>Enforce token-only CSS</span>
                  </Label>
                  <Label className="fui-choice">
                    <Switch checked={auditLog} onCheckedChange={setAuditLog} />
                    <span>Stream audit trail</span>
                  </Label>
                </div>
              </div>
            )}
          </div>

          <CardCaption>
            <span>Fig. 1 — Live @fabrials/ui &amp; @fabrials/ai-ui specimen</span>
            <span>Interactive · Light &amp; dark</span>
          </CardCaption>
        </section>
      </CornerMarks>
    </div>
  );
}
