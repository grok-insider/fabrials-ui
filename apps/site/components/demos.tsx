"use client";
import { ToolPlayground } from "@/components/tool-playground";
import { ComparisonDemo } from "@/components/comparison-demo";
import { useState } from "react";
import {
  Braces,
  CalendarRange,
  Check,
  LoaderCircle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Label,
  Progress,
  Stat,
  StatGroup,
  StatusDot,
  ToggleGroup,
  ToggleGroupItem,
} from "@fabrials/ui";
import {
  WebMCPProvider,
  useWebMCP,
  useWebMCPTool,
} from "@/registry/webmcp/provider";
import { WebMCPForm, toolField } from "@/registry/webmcp/form";
import { SearchFilter, DataTable } from "@/registry/components/data-explorer";
import { DateRangePicker } from "@/registry/components/date-range";
import { Wizard } from "@/registry/components/wizard";
import { SupportBadge } from "@/registry/components/support-badge";
import { ExecutionLog } from "@/registry/components/execution-log";
import { ToolCatalog, ToolDetail } from "@/registry/components/tool-catalog";
import { ResultView } from "@/registry/components/result-view";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
import { ActionButton } from "@/registry/components/action-button";
import dynamic from "next/dynamic";
const MCPDashboard = dynamic(() =>
  import("@/registry/components/mcp-dashboard").then((m) => m.MCPDashboard),
);
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { errorMessage } from "@/registry/mcp/types";
import type { ToolDefinition } from "@/registry/mcp/types";
import { UiDemo } from "@/components/ui-demos";
import { uiCatalogItem } from "@/lib/ui-catalog";

export const projects = [
  {
    id: "01",
    name: "WebMCP",
    category: "Browser",
    status: "Preview",
    spec: "W3C draft",
  },
  {
    id: "02",
    name: "Model Context Protocol",
    category: "Protocol",
    status: "Stable",
    spec: "2026-07-28",
  },
  {
    id: "03",
    name: "shadcn/ui",
    category: "Interface",
    status: "Stable",
    spec: "Registry v2",
  },
  {
    id: "04",
    name: "Fabrials UI",
    category: "Interface",
    status: "Preview",
    spec: "0.12.0",
  },
  {
    id: "05",
    name: "Chrome DevTools",
    category: "Browser",
    status: "Stable",
    spec: "M136+",
  },
  {
    id: "06",
    name: "Base UI",
    category: "Interface",
    status: "Stable",
    spec: "React 19",
  },
];

function Explorer({
  compact = false,
  playground = false,
}: {
  compact?: boolean;
  playground?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const mcp = useWebMCP();
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const last = mcp.executions[0];

  const run = async (
    name: string,
    args: Record<string, unknown>,
    source: "human" | "simulator" = "human",
  ) => {
    setError("");
    try {
      await mcp.run(name, args, source);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const reset = () => {
    for (const execution of mcp.executions) mcp.cancel(execution.id);
    setQuery("");
    setCategory("");
    setSelected([]);
    setError("");
    setResetKey((k) => k + 1);
    mcp.clearHistory();
  };

  useWebMCPTool({
    name: "filter_projects",
    title: "Filter projects",
    description: "Filter the visible project table by name and category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search the project name." },
        category: {
          type: "string",
          enum: ["", "Browser", "Protocol", "Interface"],
        },
      },
      required: ["query"],
    },
    execute: ({ query, category }) => {
      setQuery(String(query));
      setCategory(String(category ?? ""));
      return {
        visible: projects.filter(
          (p) =>
            p.name.toLowerCase().includes(String(query).toLowerCase()) &&
            (!category || p.category === category),
        ).length,
      };
    },
  });

  useWebMCPTool({
    name: "select_projects",
    title: "Select projects",
    description: "Select project rows by their IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string", enum: projects.map((p) => p.id) },
        },
      },
      required: ["ids"],
    },
    execute: ({ ids }) => {
      setSelected(ids as string[]);
      return { selected: ids };
    },
  });

  const rows = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (!category || p.category === category),
  );

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div>
          <p className="m-0 text-sm font-medium text-foreground">
            Project explorer
          </p>
          <p className="m-0 mt-0.5 font-mono text-[11px] text-muted-foreground">
            Interactive demo · shared state for people and agents
          </p>
        </div>
        <div className="pg-toolbar-group">
          <SupportBadge support={mcp.support} error={mcp.error} />
          <Button size="xs" variant="outline" onClick={reset}>
            <RotateCcw className="size-3.5" />
            Reset demo
          </Button>
        </div>
      </div>

      {!compact && (
        <StatGroup>
          <Stat
            label="Visible projects"
            value={`${rows.length} / ${projects.length}`}
            meter={{
              value: rows.length,
              max: projects.length,
              label: `${rows.length} of ${projects.length} projects visible`,
            }}
          />
          <Stat label="Selected rows" value={selected.length} />
          <Stat label="Tool calls" value={mcp.executions.length} />
        </StatGroup>
      )}

      {mcp.support === "unsupported" && (
        <p className="m-0 font-mono text-[11px] leading-5 text-muted-foreground">
          Try the controls or run a simulated tool below. Native agent access
          needs a browser with WebMCP enabled.
        </p>
      )}

      <SearchFilter
        query={query}
        onQueryChange={(q) => {
          void run("filter_projects", { query: q, category });
        }}
        filter={category}
        onFilterChange={(c) => {
          void run("filter_projects", { query, category: c });
        }}
        options={["Browser", "Protocol", "Interface"].map((x) => ({
          value: x,
          label: x,
        }))}
      />

      {selected.length > 0 && (
        <div className="pg-callout">
          <span className="font-mono text-xs tabular-nums">
            Selected IDs: <strong>{selected.join(", ")}</strong>
          </span>
          <Button
            size="xs"
            variant="outline"
            onClick={() => void run("select_projects", { ids: [] })}
          >
            Clear selection
          </Button>
        </div>
      )}

      <DataTable
        key={resetKey}
        rows={rows}
        pageSize={compact ? 4 : 5}
        columns={[
          ...(!compact
            ? [
                {
                  key: "id" as const,
                  label: "ID",
                  render: (p: (typeof projects)[number]) => (
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {p.id}
                    </span>
                  ),
                },
              ]
            : []),
          {
            key: "name",
            label: "Project",
            render: (p) => (
              <span className="font-medium text-foreground">{p.name}</span>
            ),
          },
          {
            key: "category",
            label: "Category",
            render: (p) => (
              <Badge size="sm" tone="neutral">
                {p.category}
              </Badge>
            ),
          },
          ...(!compact
            ? [
                {
                  key: "spec" as const,
                  label: "Spec",
                  render: (p: (typeof projects)[number]) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.spec}
                    </span>
                  ),
                },
              ]
            : []),
          {
            key: "status",
            label: "Status",
            render: (p) => (
              <Badge
                size="sm"
                tone={p.status === "Stable" ? "success" : "warning"}
                dot
              >
                {p.status}
              </Badge>
            ),
          },
        ]}
        selected={selected}
        onSelectionChange={(ids) => {
          void run("select_projects", { ids });
        }}
      />

      <div className="pg-well">
        <div className="pg-well-head">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <Braces className="size-3.5" aria-hidden />
            Simulated tool
          </span>
          <Badge size="sm" tone="info">
            filter_projects
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <code className="block rounded-[var(--fui-radius-sm)] border border-[var(--fui-separator)] bg-[var(--fui-code)] px-3 py-2 font-mono text-xs leading-5 text-foreground [overflow-wrap:anywhere]">
            filter_projects({`{ query: "", category: "Browser" }`})
          </code>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="accent"
              disabled={last?.status === "running"}
              onClick={() =>
                void run(
                  "filter_projects",
                  { query: "", category: "Browser" },
                  "simulator",
                )
              }
            >
              {last?.status === "running" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              {last?.status === "running" ? "Running…" : "Run simulated tool"}
            </Button>
            {!compact && (
              <Button
                size="sm"
                variant="outline"
                disabled={last?.status === "running"}
                onClick={() =>
                  void run(
                    "select_projects",
                    { ids: ["03", "04", "06"] },
                    "simulator",
                  )
                }
              >
                Select Interface stack
              </Button>
            )}
          </div>
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pg-inset text-xs leading-5"
        >
          {last ? (
            <div key={last.id} className="grid gap-1.5">
              <p className="m-0 flex flex-wrap items-center gap-2 font-medium text-foreground">
                <Check
                  aria-hidden="true"
                  className="size-3.5 text-[var(--fui-success-ink)]"
                />
                {last.source === "human"
                  ? "Manual"
                  : last.source === "agent"
                    ? "Native agent"
                    : "Simulator"}{" "}
                · {last.status} · Call {mcp.executions.length}
              </p>
              <code className="block font-mono text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
                {last.name}({JSON.stringify(last.args)})
              </code>
              <p className="m-0 font-mono text-xs text-foreground [overflow-wrap:anywhere]">
                {last.error ||
                  JSON.stringify(last.result) ||
                  "Waiting for result…"}
              </p>
            </div>
          ) : (
            <p className="m-0 text-muted-foreground">
              Run the tool to filter the table to Browser projects. The result
              will appear here.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="m-0 text-xs text-[var(--fui-danger-ink)]">
          {error}
        </p>
      )}

      {!compact && !playground && (
        <ExecutionLog
          executions={mcp.executions}
          onCancel={mcp.cancel}
          onClear={mcp.clearHistory}
        />
      )}
    </div>
  );
}

export function ExplorerDemo(props: {
  compact?: boolean;
  playground?: boolean;
}) {
  return (
    <WebMCPProvider>
      <Explorer {...props} />
      {props.playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

function countNights(from: string, to: string): number | null {
  if (!from || !to || to < from) return null;
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000);
}

const STAY_PRESETS = [
  { label: "Oct 12 – Oct 16 (4 nights)", from: "2026-10-12", to: "2026-10-16" },
  { label: "Nov 03 – Nov 06 (3 nights)", from: "2026-11-03", to: "2026-11-06" },
] as const;

function Booking({ playground = false }: { playground?: boolean }) {
  const mcp = useWebMCP();
  const [step, setStep] = useState(0);
  const [dates, setDates] = useState({ from: "", to: "" });
  const [name, setName] = useState("");
  const [preference, setPreference] = useState("courtyard");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nights = countNights(dates.from, dates.to);

  useWebMCPTool({
    name: "prepare_reservation",
    description:
      "Fill the reservation wizard for human review. Does not confirm a reservation.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        from: { type: "string", format: "date" },
        to: { type: "string", format: "date" },
      },
      required: ["name", "from", "to"],
    },
    execute: (args) => {
      if (String(args.to) < String(args.from))
        throw new Error("End date must follow start date.");
      setName(String(args.name));
      setDates({ from: String(args.from), to: String(args.to) });
      setStep(2);
      setConfirmed(false);
      return { status: "ready_for_review" };
    },
  });

  const preferenceLabel =
    preference === "courtyard"
      ? "Quiet courtyard"
      : preference === "desk"
        ? "Corner work desk"
        : "Upper floor";

  const statusTone = confirmed ? "success" : step === 2 ? "info" : "neutral";
  const statusLabel = confirmed
    ? "Confirmed locally"
    : step === 2
      ? "Ready for human review"
      : "Draft in progress";

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div className="pg-toolbar-group">
          <SupportBadge support={mcp.support} />
        </div>
        <div className="pg-toolbar-group">
          <Button
            variant="accent"
            size="sm"
            onClick={() =>
              void mcp.run(
                "prepare_reservation",
                { name: "Alex Morgan", from: "2026-10-12", to: "2026-10-16" },
                "simulator",
              )
            }
          >
            <Sparkles />
            Simulate an agent preparing the reservation
          </Button>
        </div>
      </div>

      <div className="pg-split">
        <div className="pg-well">
          {confirmed ? (
            <Alert variant="success">
              <AlertTitle>Example reservation confirmed</AlertTitle>
              <AlertDescription className="grid gap-3">
                <span className="font-mono text-xs tabular-nums">
                  RES-2026-1012 · {name} · {dates.from} to {dates.to}
                  {nights !== null ? ` (${nights} nights)` : ""}
                </span>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setConfirmed(false);
                      setStep(0);
                    }}
                  >
                    Start again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Wizard
              step={step}
              onStepChange={setStep}
              steps={[
                {
                  title: "Dates",
                  content: (
                    <div className="grid gap-4">
                      <DateRangePicker
                        value={dates}
                        onChange={setDates}
                        required
                      />
                      <div className="grid gap-1.5">
                        <span className="pg-section-label">
                          Quick synthetic stays
                        </span>
                        <div className="pg-preset-row">
                          {STAY_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="pg-preset-btn"
                              aria-pressed={
                                dates.from === preset.from &&
                                dates.to === preset.to
                              }
                              onClick={() =>
                                setDates({ from: preset.from, to: preset.to })
                              }
                            >
                              <CalendarRange className="size-3" aria-hidden />
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                  validate: () =>
                    !dates.from || !dates.to || dates.to < dates.from
                      ? "Choose a valid date range."
                      : null,
                },
                {
                  title: "Details",
                  content: (
                    <div className="grid gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="reservation-name">Guest name</Label>
                        <Input
                          id="reservation-name"
                          placeholder="Alex Morgan"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <span className="pg-section-label">
                          Room preference
                        </span>
                        <ToggleGroup
                          aria-label="Room preference"
                          size="sm"
                          value={[preference]}
                          onValueChange={(next) => {
                            if (next[0]) setPreference(next[0]);
                          }}
                        >
                          <ToggleGroupItem value="courtyard">
                            Quiet courtyard
                          </ToggleGroupItem>
                          <ToggleGroupItem value="desk">
                            Corner desk
                          </ToggleGroupItem>
                          <ToggleGroupItem value="upper">
                            Upper floor
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  ),
                  validate: () => (name.trim() ? null : "Enter a guest name."),
                },
                {
                  title: "Review",
                  content: (
                    <div className="pg-inset">
                      <dl className="pg-kv">
                        <div className="pg-kv-row">
                          <dt>Guest</dt>
                          <dd>{name || "—"}</dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>Stay dates</dt>
                          <dd>
                            {dates.from && dates.to
                              ? `${dates.from} to ${dates.to}`
                              : "—"}
                          </dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>Duration</dt>
                          <dd>
                            {nights !== null
                              ? `${nights} ${nights === 1 ? "night" : "nights"}`
                              : "—"}
                          </dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>Room preference</dt>
                          <dd>{preferenceLabel}</dd>
                        </div>
                      </dl>
                      <p className="m-0 font-mono text-[11px] text-muted-foreground">
                        This demo does not make a real booking.
                      </p>
                    </div>
                  ),
                  validate: () =>
                    name.trim() &&
                    dates.from &&
                    dates.to &&
                    dates.to >= dates.from
                      ? null
                      : "Complete the reservation details.",
                },
              ]}
              onComplete={() => setConfirmOpen(true)}
            />
          )}
        </div>

        <aside className="pg-well content-start" aria-label="Reservation summary">
          <div className="pg-well-head">
            <span className="pg-section-label">Live reservation dossier</span>
            <StatusDot tone={statusTone} pulse={step === 2 && !confirmed} label={statusLabel} />
          </div>

          <Progress
            label="Flow progress"
            value={confirmed ? 100 : Math.round(((step + 1) / 3) * 100)}
            steps={3}
            tone={confirmed ? "success" : "info"}
          />

          <dl className="pg-kv">
            <div className="pg-kv-row">
              <dt>Guest</dt>
              <dd>{name.trim() || "Not set"}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Check-in</dt>
              <dd>{dates.from || "—"}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Check-out</dt>
              <dd>{dates.to || "—"}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Duration</dt>
              <dd>{nights !== null ? `${nights} nights` : "—"}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Room note</dt>
              <dd>{preferenceLabel}</dd>
            </div>
          </dl>

          <div className="pg-inset">
            <span className="pg-section-label">WebMCP safety boundary</span>
            <p className="m-0 text-xs leading-5 text-muted-foreground">
              <code className="font-mono text-[11px]">prepare_reservation</code>{" "}
              validates dates, fills the form and advances to Review — confirmation
              always stays behind a human dialog.
            </p>
          </div>
        </aside>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm this example?"
        description="Your reservation will be shown in this page only."
        onConfirm={() => setConfirmed(true)}
      />

      {!playground && (
        <ExecutionLog executions={mcp.executions} onClear={mcp.clearHistory} />
      )}
    </div>
  );
}

export function BookingDemo({ playground = false }: { playground?: boolean }) {
  return (
    <WebMCPProvider>
      <Booking playground={playground} />
      {playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

export function FormDemo() {
  const [result, setResult] = useState<unknown>();
  return (
    <div className="space-y-5">
      <WebMCPForm
        toolName="find_project"
        toolDescription="Find a project by name."
        className="space-y-3"
        onExecute={async (data) => {
          const result = projects.filter((p) =>
            p.name
              .toLowerCase()
              .includes(String(data.get("query")).toLowerCase()),
          );
          setResult(result);
          return result;
        }}
      >
        <Label htmlFor="find-project">Project name</Label>
        <Input
          id="find-project"
          name="query"
          placeholder="Try WebMCP"
          required
          {...toolField("A project name to search for.")}
        />
        <Button type="submit">Find project</Button>
      </WebMCPForm>
      {result !== undefined && <ResultView result={result} />}
    </div>
  );
}

const exampleTool: ToolDefinition = {
  name: "search_catalog",
  title: "Search the catalog",
  description: "Find projects in your workspace.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "A name or keyword." },
      limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
    },
    required: ["query"],
  },
  annotations: { readOnlyHint: true },
};

export function ComponentDemo({ slug }: { slug: string }) {
  const [result, setResult] = useState<unknown>();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [dates, setDates] = useState({ from: "", to: "" });
  if (uiCatalogItem(slug)) return <UiDemo slug={slug} />;
  if (
    [
      "data-explorer",
      "search-filter",
      "data-table",
      "webmcp-provider",
      "webmcp-tool",
    ].includes(slug)
  )
    return <ExplorerDemo compact />;
  if (slug === "comparison") return <ComparisonDemo />;
  if (slug === "wizard") return <BookingDemo />;
  if (slug === "date-range")
    return <DateRangePicker value={dates} onChange={setDates} />;
  if (slug === "webmcp-form") return <FormDemo />;
  if (slug === "support-badge")
    return (
      <div className="flex flex-col gap-3">
        <SupportBadge support="native" />
        <SupportBadge support="unsupported" />
        <p className="text-xs text-muted-foreground">
          Illustrative support states.
        </p>
      </div>
    );
  if (slug === "action-button")
    return (
      <div className="space-y-3">
        <ActionButton
          action={async () => {
            await new Promise((r) => setTimeout(r, 600));
            setCount((c) => c + 1);
          }}
        >
          Run example action
        </ActionButton>
        <p role="status" className="text-sm text-muted-foreground">
          {count} completed
        </p>
      </div>
    );
  if (slug === "confirmation-dialog")
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open confirmation</Button>
        <ConfirmationDialog
          open={open}
          onOpenChange={setOpen}
          title="Apply these changes?"
          description="This is an interactive example. Nothing will be saved."
          onConfirm={() => setCount((c) => c + 1)}
        />
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          {count} confirmed
        </p>
      </>
    );
  if (slug === "tool-catalog")
    return (
      <ToolCatalog
        tools={[
          exampleTool,
          {
            ...exampleTool,
            name: "get_project",
            title: "Read a project",
            description: "Read details of one project.",
          },
        ]}
        onSelect={(t) => setResult(t.name)}
        selected={typeof result === "string" ? result : undefined}
      />
    );
  if (slug === "tool-detail")
    return (
      <>
        <ToolDetail
          tool={exampleTool}
          onRun={async (args) =>
            setResult({
              projects: projects.filter((p) =>
                p.name.toLowerCase().includes(String(args.query).toLowerCase()),
              ),
            })
          }
        />
        {result !== undefined && <ResultView result={result} />}
      </>
    );
  if (slug === "arguments-form")
    return (
      <>
        <ArgumentsForm
          schema={exampleTool.inputSchema}
          onSubmit={async (args) => setResult(args)}
        />
        {result !== undefined && <ResultView result={result} />}
      </>
    );
  if (slug === "result-view")
    return (
      <ResultView
        result={{
          content: [{ type: "text", text: "Found 2 matching projects." }],
          structuredContent: { projects: projects.slice(0, 2) },
        }}
      />
    );
  if (slug === "execution-log")
    return (
      <ExecutionLog
        executions={[
          {
            id: "demo-1",
            name: "search_catalog",
            args: { query: "WebMCP" },
            source: "agent",
            status: "success",
            startedAt: 0,
            result: { content: [{ type: "text", text: "Found one project." }] },
          },
        ]}
      />
    );
  return <MCPDashboard defaultEndpoint="/api/demo/mcp" />;
}
