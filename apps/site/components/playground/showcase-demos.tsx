"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pause, Play, RefreshCw, SkipForward, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  CardCaption,
  Checkbox,
  DitherCanvas,
  DitherGem,
  FabrialsGem,
  Label,
  Loading,
  NumberTicker,
  Progress,
  RADIANT_ORDERS,
  RADIANT_ORDER_MAP,
  RadiantGlyph,
  Readout,
  ScrambleText,
  Slider,
  Stat,
  StatGroup,
  StatusDot,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  WorkingLight,
  type DitherFieldFactory,
  type RadiantOrder,
} from "@fabrials/ui";
import { gemField, gemRamp, STORM_RAMP, stormBandField, stormField } from "@fabrials/ui/dither";
import {
  AgentThinking,
  ChatMessage,
  ContextMeter,
  CopyMessageAction,
  GenerationFrame,
  MessageActions,
  SourceTally,
  SuggestionChips,
  TaskList,
  ToolCall,
  type AgentActivity,
  type TaskItem,
} from "@fabrials/ai-ui";

type WorkflowKey = "triage" | "migration" | "audit";

type WorkflowStep = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  activity: AgentActivity;
  thinkingLabel: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown>;
  durationMs: number;
  addedTokens: number;
  source?: string;
  streamChunk: string;
};

const WORKFLOWS: Record<
  WorkflowKey,
  {
    name: string;
    prompt: string;
    steps: readonly WorkflowStep[];
    followUps: readonly string[];
  }
> = {
  triage: {
    name: "Relay latency triage",
    prompt: "Investigate why P95 latency crossed 620 ms on station-relay after 14:10 UTC and draft the safest rollback.",
    steps: [
      {
        id: "t1",
        title: "Query edge gateway metrics",
        detail: "Comparing 14:00–14:30 UTC P95 buckets across puck-1 and puck-2",
        meta: "180 ms",
        activity: "searching",
        thinkingLabel: "Searching telemetry buckets on puck-1",
        toolName: "query_relay_metrics",
        toolInput: { key: "station-relay", window: "30m", percentile: 95 },
        toolOutput: { baselineMs: 284, spikeMs: 642, affectedRoute: "/v1/responses" },
        durationMs: 180,
        addedTokens: 14_200,
        source: "https://ui.fabrials.com/docs/stat-group",
        streamChunk: "P95 latency jumped from 284 ms to 642 ms at 14:12 UTC on `/v1/responses`. ",
      },
      {
        id: "t2",
        title: "Inspect recent routing policy diff",
        detail: "Reading commit 4b91e0c in ai-relay fallback chain",
        meta: "240 ms",
        activity: "reading",
        thinkingLabel: "Reading fallback policy changes",
        toolName: "read_policy_diff",
        toolInput: { deployment: "ai-relay-2026-11-22", limit: 2 },
        toolOutput: { changed: ["retry_backoff_ms", "upstream_pool"], culprit: "upstream_pool: eu-west-2 cold start" },
        durationMs: 240,
        addedTokens: 28_600,
        source: "https://ui.fabrials.com/docs/tool-call",
        streamChunk: "The trigger was a cold upstream pool added to `eu-west-2` with zero warm connections. ",
      },
      {
        id: "t3",
        title: "Verify canary rollback headroom",
        detail: "Simulating 100% traffic pinned back to eu-central-1",
        meta: "310 ms",
        activity: "running",
        thinkingLabel: "Running dry-run capacity simulation",
        toolName: "simulate_route_pin",
        toolInput: { region: "eu-central-1", trafficShare: 1.0 },
        toolOutput: { projectedP95Ms: 296, quotaHeadroom: "68%", safeToApply: true },
        durationMs: 310,
        addedTokens: 19_400,
        source: "https://ui.fabrials.com/docs/working-light",
        streamChunk: "Pinning traffic back to `eu-central-1` restores projected P95 to 296 ms with 68% headroom. ",
      },
      {
        id: "t4",
        title: "Prepare operator approval summary",
        detail: "Packaging rollback command and verification check",
        meta: "150 ms",
        activity: "writing",
        thinkingLabel: "Writing operator handoff",
        toolName: "draft_rollback_plan",
        toolInput: { target: "eu-central-1", verifyWindow: "5m" },
        toolOutput: { status: "ready_for_approval", reversible: true },
        durationMs: 150,
        addedTokens: 11_800,
        source: "https://ui.fabrials.com/docs/agent-thinking",
        streamChunk: "Rollback is staged and awaiting human approval — no production state has changed.",
      },
    ],
    followUps: [
      "Pin traffic to eu-central-1",
      "Keep 10% warm canary in eu-west-2",
      "Export incident timeline",
    ],
  },
  migration: {
    name: "0.12 token migration",
    prompt: "Check our surface tokens for legacy #161a21 literals and prepare a clean OKLCH migration patch.",
    steps: [
      {
        id: "m1",
        title: "Scan stylesheets for hex literals",
        detail: "Inspecting apps/console/src/styles across 18 files",
        meta: "210 ms",
        activity: "searching",
        thinkingLabel: "Scanning CSS files for legacy hex tokens",
        toolName: "scan_css_literals",
        toolInput: { root: "apps/console/src", ignoreVendor: true },
        toolOutput: { matches: 6, files: ["shell.css", "billing.css"] },
        durationMs: 210,
        addedTokens: 16_800,
        source: "https://ui.fabrials.com/docs/design",
        streamChunk: "Found 6 legacy hex colours across `shell.css` and `billing.css`. ",
      },
      {
        id: "m2",
        title: "Map tokens to Deep Stormwall",
        detail: "Matching surface, inset and separator roles",
        meta: "190 ms",
        activity: "thinking",
        thinkingLabel: "Mapping surfaces to 0.12 semantic tokens",
        toolName: "resolve_token_map",
        toolInput: { targetVersion: "0.12.0" },
        toolOutput: { mapped: 6, contrastVerified: "WCAG AA (light + dark)" },
        durationMs: 190,
        addedTokens: 21_500,
        source: "https://ui.fabrials.com/docs/tokens",
        streamChunk: "All 6 map cleanly to `--background`, `--card`, and `--fui-surface-inset` with AA contrast in both themes. ",
      },
      {
        id: "m3",
        title: "Verify forced-colors & RTL rules",
        detail: "Checking logical properties and active-state indicators",
        meta: "270 ms",
        activity: "running",
        thinkingLabel: "Validating forced-colors and logical CSS",
        toolName: "check_style_contracts",
        toolInput: { checks: ["forced-colors", "logical-props", "reduced-motion"] },
        toolOutput: { passed: 3, warnings: 0 },
        durationMs: 270,
        addedTokens: 14_900,
        source: "https://ui.fabrials.com/docs/installation",
        streamChunk: "Forced-colors, logical properties, and reduced-motion checks all pass with zero warnings.",
      },
    ],
    followUps: [
      "Generate diff patch",
      "Run visual regression check",
      "Preview light mode contrast",
    ],
  },
  audit: {
    name: "Accessibility sweep",
    prompt: "Audit keyboard focus order, aria-live announcements and target sizes across the billing settings flow.",
    steps: [
      {
        id: "a1",
        title: "Inspect landmark and heading tree",
        detail: "Checking main landmark, heading levels and skip links",
        meta: "140 ms",
        activity: "reading",
        thinkingLabel: "Reading accessibility tree snapshots",
        toolName: "inspect_a11y_tree",
        toolInput: { route: "/settings/billing", viewports: [390, 1440] },
        toolOutput: { landmarks: 4, skippedHeadings: 0 },
        durationMs: 140,
        addedTokens: 12_400,
        source: "https://ui.fabrials.com/docs/page-header",
        streamChunk: "Landmark hierarchy and heading levels are clean across desktop and 390 px mobile. ",
      },
      {
        id: "a2",
        title: "Check coarse-pointer target sizes",
        detail: "Measuring icon buttons and table row actions",
        meta: "220 ms",
        activity: "running",
        thinkingLabel: "Measuring interactive hit targets",
        toolName: "measure_targets",
        toolInput: { minPx: 44, pointer: "coarse" },
        toolOutput: { checked: 24, belowMinimum: 1, element: "revoke-key-icon" },
        durationMs: 220,
        addedTokens: 18_100,
        source: "https://ui.fabrials.com/docs/icon-button",
        streamChunk: "One icon trigger (`revoke-key-icon`) measured 32 px on touch; switching it to `size=\"touch\"` fixes it cleanly.",
      },
    ],
    followUps: [
      "Apply size='touch' fix",
      "Test RTL keyboard traversal",
      "Re-run axe check",
    ],
  },
};

export function AgentWorkbenchDemo() {
  const [workflowKey, setWorkflowKey] = useState<WorkflowKey>("triage");
  const [stepIndex, setStepIndex] = useState(1);
  const [autoRun, setAutoRun] = useState(true);
  const [extraContext, setExtraContext] = useState(0);
  const [genEffect, setGenEffect] = useState<"ripple" | "refine" | "scan">("refine");
  const [genStatus, setGenStatus] = useState<"generating" | "done">("generating");
  const [pickedFollowUp, setPickedFollowUp] = useState<string | null>(null);

  const workflow = WORKFLOWS[workflowKey];
  const totalSteps = workflow.steps.length;
  const finished = stepIndex >= totalSteps;
  const activeStep = workflow.steps[Math.min(stepIndex, totalSteps - 1)]!;
  const previewField = useCallback<DitherFieldFactory>(
    (_theme, size) => stormField(size.width / Math.max(1, size.height), 1, { front: [0.05, 0.55] }),
    [],
  );

  useEffect(() => {
    if (!autoRun || finished) return;
    const timer = window.setTimeout(() => {
      setStepIndex((current) => Math.min(totalSteps, current + 1));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [autoRun, finished, stepIndex, totalSteps, workflowKey]);

  const switchWorkflow = (next: WorkflowKey) => {
    setWorkflowKey(next);
    setStepIndex(0);
    setAutoRun(true);
    setPickedFollowUp(null);
  };

  const tasks: TaskItem[] = workflow.steps.map((step, idx) => ({
    id: step.id,
    title: step.title,
    detail: step.detail,
    meta: idx < stepIndex ? step.meta : idx === stepIndex ? "live" : undefined,
    activity: step.activity,
    status: idx < stepIndex ? "done" : idx === stepIndex ? "running" : "pending",
  }));

  const completedSteps = workflow.steps.slice(0, stepIndex);
  const sources = workflow.steps
    .slice(0, Math.min(stepIndex + 1, totalSteps))
    .map((s) => s.source)
    .filter((s): s is string => Boolean(s));

  const toolTokens = completedSteps.reduce((sum, s) => sum + s.addedTokens, 0) + (finished ? 0 : Math.round(activeStep.addedTokens * 0.45));
  const streamText =
    completedSteps.map((s) => s.streamChunk).join("") +
    (finished ? "" : activeStep.streamChunk.slice(0, Math.floor(activeStep.streamChunk.length * 0.65)));

  const contextParts = [
    { label: "System prompt", value: 18_400 },
    { label: "Tool results", value: Math.max(8_000, toolTokens) },
    { label: "Attached docs", value: 24_000 + extraContext },
    { label: "Conversation", value: 9_600 + stepIndex * 2_400 },
  ];

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div className="pg-toolbar-group">
          <ToggleGroup
            aria-label="Agent workflow preset"
            size="sm"
            value={[workflowKey]}
            onValueChange={(next) => {
              if (next[0]) switchWorkflow(next[0] as WorkflowKey);
            }}
          >
            <ToggleGroupItem value="triage">Relay triage</ToggleGroupItem>
            <ToggleGroupItem value="migration">Token migration</ToggleGroupItem>
            <ToggleGroupItem value="audit">A11y sweep</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="pg-toolbar-group">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (finished) {
                setStepIndex(0);
                setAutoRun(true);
              } else {
                setAutoRun((prev) => !prev);
              }
            }}
          >
            {finished ? <RefreshCw /> : autoRun ? <Pause /> : <Play />}
            {finished ? "Replay run" : autoRun ? "Pause" : "Resume"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={finished}
            onClick={() => {
              setAutoRun(false);
              setStepIndex((c) => Math.min(totalSteps, c + 1));
            }}
          >
            <SkipForward />
            Step
          </Button>
        </div>
      </div>

      <div className="pg-split">
        <div className="pg-column">
          <div className="pg-well">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {finished ? (
                <AgentThinking
                  activity="writing"
                  status="done"
                  label={`Completed ${totalSteps} steps for ${workflow.name.toLowerCase()}`}
                  timer={false}
                />
              ) : (
                <AgentThinking activity={activeStep.activity} label={activeStep.thinkingLabel} timer={false} />
              )}
              <Badge tone={finished ? "success" : "info"} dot size="sm">
                {finished ? "Settled" : `Step ${stepIndex + 1} of ${totalSteps}`}
              </Badge>
            </div>

            <ChatMessage from="user">
              <p className="m-0 text-sm">{workflow.prompt}</p>
            </ChatMessage>

            <ChatMessage
              from="assistant"
              streaming={!finished}
              pinActions={finished}
              actions={
                finished ? (
                  <MessageActions>
                    <CopyMessageAction text={streamText} />
                  </MessageActions>
                ) : undefined
              }
            >
              <p className="m-0 text-sm leading-relaxed">
                {streamText || "Inspecting system telemetry and gathering evidence…"}
              </p>
            </ChatMessage>

            <div className="grid gap-2.5">
              {workflow.steps.slice(0, Math.min(stepIndex + 1, totalSteps)).map((step, idx) => {
                const isDone = idx < stepIndex;
                return (
                  <ToolCall
                    key={step.id}
                    name={step.toolName}
                    state={isDone ? "done" : "running"}
                    duration={isDone ? step.durationMs : undefined}
                    input={step.toolInput}
                    output={isDone ? step.toolOutput : undefined}
                  />
                );
              })}
            </div>

            {sources.length > 0 && (
              <SourceTally sources={sources} label={finished ? "Verified references" : "Reading references"} />
            )}

            {finished && (
              <div className="grid gap-2 pt-1">
                <SuggestionChips
                  items={workflow.followUps.map((label) => ({ id: label, label }))}
                  onSelect={(item) => setPickedFollowUp(item.label)}
                />
                {pickedFollowUp && (
                  <p role="status" className="m-0 font-mono text-xs text-muted-foreground">
                    Queued next action: &ldquo;{pickedFollowUp}&rdquo; (synthetic sandbox)
                  </p>
                )}
              </div>
            )}

            {!finished && <WorkingLight />}
          </div>
        </div>

        <div className="pg-column">
          <TaskList title="Execution plan" tasks={tasks} />

          <div className="pg-well">
            <ContextMeter parts={contextParts} limit={200_000} />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="pg-section-label">Test warning/danger threshold</span>
              <div className="flex gap-1.5">
                <Button size="xs" variant="outline" onClick={() => setExtraContext((v) => Math.min(140_000, v + 42_000))}>
                  +42k docs
                </Button>
                <Button size="xs" variant="ghost" disabled={extraContext === 0} onClick={() => setExtraContext(0)}>
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="pg-well">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="pg-section-label">GenerationFrame · working-light material</span>
              <div className="flex items-center gap-2">
                <ToggleGroup
                  aria-label="Generation effect"
                  size="sm"
                  value={[genEffect]}
                  onValueChange={(next) => {
                    if (next[0]) {
                      setGenEffect(next[0] as "ripple" | "refine" | "scan");
                      setGenStatus("generating");
                    }
                  }}
                >
                  <ToggleGroupItem value="ripple">Ripple</ToggleGroupItem>
                  <ToggleGroupItem value="refine">Refine</ToggleGroupItem>
                  <ToggleGroupItem value="scan">Scan</ToggleGroupItem>
                </ToggleGroup>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setGenStatus((s) => (s === "generating" ? "done" : "generating"))}
                >
                  <Sparkles />
                  {genStatus === "generating" ? "Finish" : "Generate"}
                </Button>
              </div>
            </div>
            <GenerationFrame
              status={genStatus}
              effect={genEffect}
              kind="image"
              aspectRatio="16 / 9"
              alt="Synthetic Highstorm architectural render"
              label={genStatus === "generating" ? `Rendering ${genEffect} pass` : "Render complete"}
              caption="Ordered 8×8 Bayer stormlight study · working light settles on completion"
            >
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-background p-4">
                <DitherCanvas ramp={STORM_RAMP} order="ramp" cell={3} field={previewField} />
                <div className="relative z-10 flex items-center gap-3 rounded-lg border bg-card/90 px-4 py-2.5 shadow-xs">
                  <RadiantGlyph order="elsecaller" size={28} colored />
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium text-foreground">Render complete</span>
                    <span className="font-mono text-[11px] text-muted-foreground">8×8 Bayer · Deep Stormwall</span>
                  </div>
                </div>
              </div>
            </GenerationFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

type FieldKind = "storm" | "gem" | "band";

export function InstrumentLabDemo() {
  const [order, setOrder] = useState<RadiantOrder>("elsecaller");
  const [fieldKind, setFieldKind] = useState<FieldKind>("storm");
  const [cell, setCell] = useState(3);
  const [stars, setStars] = useState(true);
  const [useStormRamp, setUseStormRamp] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [quota, setQuota] = useState(68);
  const [readoutStep, setReadoutStep] = useState(0);
  const [strictMotion, setStrictMotion] = useState(true);

  const meta = RADIANT_ORDER_MAP[order];
  const ramp = useMemo(() => (useStormRamp ? STORM_RAMP : gemRamp(meta.gem)), [meta.gem, useStormRamp]);

  const field = useCallback<DitherFieldFactory>(
    (_theme, size, progress) => {
      const aspect = size.width / Math.max(1, size.height);
      if (fieldKind === "gem") return gemField(size.width, size.height, progress, 0.44);
      if (fieldKind === "band") return stormBandField(aspect, meta.number * 11);
      return stormField(aspect, progress, { front: [0.06, 0.58], seed: meta.number * 7 });
    },
    [fieldKind, meta.number],
  );

  const readouts = [
    `SYNC 14:32:08 UTC · ${meta.gem.toUpperCase()}`,
    `BAYER 8×8 · CELL ${cell}PX · ORDER 0${meta.number}`,
    `QUOTA ${quota}% · ${meta.surges[0].toUpperCase()}`,
  ];

  return (
    <div className="grid gap-5" data-density={compactDensity ? "compact" : undefined}>
      <div className="pg-toolbar">
        <div className="pg-toolbar-group">
          <Label className="fui-choice">
            <Switch checked={skeletonMode} onCheckedChange={setSkeletonMode} />
            <span>First-load skeleton mode</span>
          </Label>
          <Label className="fui-choice">
            <Switch checked={compactDensity} onCheckedChange={setCompactDensity} />
            <span>Compact density (32 px)</span>
          </Label>
        </div>

        <div className="pg-toolbar-group">
          <Button size="sm" variant="outline" onClick={() => setReadoutStep((n) => (n + 1) % readouts.length)}>
            Cycle readout
          </Button>
          <Button size="sm" variant="accent" onClick={() => setRevealKey((k) => k + 1)}>
            <RefreshCw />
            Replay dither reveal
          </Button>
        </div>
      </div>

      <div className="pg-split">
        <div className="pg-column">
          <div className="pg-dither-stage">
            <DitherCanvas
              key={`${order}-${fieldKind}-${revealKey}`}
              ramp={ramp}
              order="ramp"
              cell={cell}
              reveal={700}
              field={field}
              stars={stars ? { density: 1.8, reach: 0.72, seed: meta.number * 13 } : undefined}
              paintKey={`${order}-${fieldKind}-${cell}-${useStormRamp}-${stars}`}
            />

            <div className="pg-dither-overlay">
              <RadiantGlyph order={order} size={40} colored title={`${meta.name} glyph`} />
              <div className="grid gap-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-foreground">{meta.plural}</strong>
                  <Badge size="sm">{meta.gem}</Badge>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  <ScrambleText>{`${meta.surges[0]} & ${meta.surges[1]} · Herald ${meta.herald}`}</ScrambleText>
                </span>
              </div>
              <div className="flex items-center gap-2 border-s pl-3">
                <DitherGem gem={meta.gem} size={24} />
                <FabrialsGem gem={meta.gem} size={22} />
              </div>
            </div>
          </div>

          <div className="pg-well">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="pg-section-label">Choose a Knights Radiant order &amp; polestone</span>
              <Readout value={readouts[readoutStep]!} />
            </div>

            <div className="pg-polestone-grid" role="group" aria-label="Knights Radiant orders">
              {RADIANT_ORDERS.map((item) => (
                <button
                  key={item.order}
                  type="button"
                  className="pg-polestone-btn"
                  aria-pressed={item.order === order}
                  onClick={() => setOrder(item.order)}
                >
                  <RadiantGlyph order={item.order} size={18} colored />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <span className="pg-section-label">Dither field</span>
                <ToggleGroup
                  aria-label="Dither field mode"
                  size="sm"
                  value={[fieldKind]}
                  onValueChange={(next) => {
                    if (next[0]) setFieldKind(next[0] as FieldKind);
                  }}
                >
                  <ToggleGroupItem value="storm">Highstorm</ToggleGroupItem>
                  <ToggleGroupItem value="gem">Cut gem</ToggleGroupItem>
                  <ToggleGroupItem value="band">Cloud band</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-2">
                <Slider
                  label="Dot cell"
                  unit="px"
                  min={2}
                  max={5}
                  step={1}
                  value={cell}
                  onValueChange={(v) => {
                    if (typeof v === "number") setCell(v);
                  }}
                  showValue
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Label className="fui-choice">
                <Checkbox checked={stars} onCheckedChange={(v) => setStars(Boolean(v))} />
                <span>Dark-mode starfield</span>
              </Label>
              <Label className="fui-choice">
                <Checkbox checked={useStormRamp} onCheckedChange={(v) => setUseStormRamp(Boolean(v))} />
                <span>Use STORM_RAMP instead of polestone ramp</span>
              </Label>
            </div>
          </div>
        </div>

        <div className="pg-column">
          <Loading when={skeletonMode} label="Loading instrument telemetry">
            <div className="pg-column">
              <StatGroup>
                <Stat
                  label="Throughput"
                  value={<NumberTicker value={184_200 + quota * 1_420} locale="en" />}
                  delta={`+${(quota / 8).toFixed(1)}%`}
                  trend="up"
                />
                <Stat
                  label="Buffer headroom"
                  value={`${quota}%`}
                  meter={{ value: quota, max: 100, label: `${quota}% of rate ceiling` }}
                />
              </StatGroup>

              <div className="pg-well">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusDot tone={quota > 85 ? "warning" : "success"} pulse label={quota > 85 ? "Approaching ceiling" : "Calibrated & live"} />
                  <Badge tone="info" dot size="sm">
                    Stormlight interaction
                  </Badge>
                </div>

                <Slider
                  label="Instrument load"
                  unit="%"
                  min={15}
                  max={98}
                  step={1}
                  value={quota}
                  onValueChange={(v) => {
                    if (typeof v === "number") setQuota(v);
                  }}
                  showValue
                />

                <Progress
                  label="Pipeline stages"
                  value={quota}
                  steps={6}
                  tone={quota > 85 ? "warning" : "info"}
                  hint="Segmented progress inks discrete cells in order"
                />

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Progress variant="ring" size="lg" value={quota} label="Sync ring" showValue tone="info" />
                  <div className="min-w-0 flex-1">
                    <Progress variant="scan" label="Live index scan" hint="Working light sweeps until a total arrives" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button size="sm">Primary ink</Button>
                  <Button size="sm" variant="accent">
                    Stormlight accent
                  </Button>
                  <Button size="sm" variant="outline">
                    Outline plate
                  </Button>
                  <Button size="sm" variant="destructive">
                    Revoke
                  </Button>
                </div>

                <Label className="fui-choice">
                  <Checkbox checked={strictMotion} onCheckedChange={(v) => setStrictMotion(Boolean(v))} />
                  <span>Respect prefers-reduced-motion</span>
                </Label>
              </div>
            </div>
          </Loading>

          <CardCaption>
            <span>Flip “First-load skeleton mode” above to verify zero layout shift</span>
            <span>@fabrials/ui 0.12</span>
          </CardCaption>
        </div>
      </div>
    </div>
  );
}
