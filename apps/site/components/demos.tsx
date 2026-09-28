"use client";
import { ToolPlayground } from "@/components/tool-playground";
import { ComparisonDemo } from "@/components/comparison-demo";
import { useState } from "react";
import {
  Braces,
  RotateCcw,
  Check,
  LoaderCircle,
  Play,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Label,
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
  { id: "01", name: "WebMCP", category: "Browser", status: "Preview" },
  {
    id: "02",
    name: "Model Context Protocol",
    category: "Protocol",
    status: "Stable",
  },
  { id: "03", name: "shadcn/ui", category: "Interface", status: "Stable" },
  { id: "04", name: "Fabrials UI", category: "Interface", status: "Preview" },
  { id: "05", name: "Chrome DevTools", category: "Browser", status: "Stable" },
  { id: "06", name: "Base UI", category: "Interface", status: "Stable" },
];
function Explorer({ compact = false }: { compact?: boolean }) {
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Project explorer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Interactive demo · shared state for people and agents.
          </p>
        </div>
        <SupportBadge support={mcp.support} error={mcp.error} />
      </div>
      {mcp.support === "unsupported" && (
        <p className="text-xs leading-5 text-muted-foreground">
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
      <DataTable
        key={resetKey}
        rows={rows}
        pageSize={compact ? 4 : 5}
        columns={[
          { key: "name", label: "Project" },
          { key: "category", label: "Category" },
          {
            key: "status",
            label: "Status",
            render: (p) => (
              <Badge
                variant="outline"
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
      <div className="overflow-hidden rounded-xl border bg-muted/25">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium">
            <Braces className="size-4 text-muted-foreground" /> Simulated tool
          </span>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="size-3.5" />
            Reset demo
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <code className="block whitespace-pre-wrap font-mono text-xs leading-6 [overflow-wrap:anywhere]">
            filter_projects({`{ query: "", category: "Browser" }`})
          </code>
          <Button
            size="sm"
            variant="outline"
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
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="border-t bg-background/60 px-4 py-3 text-xs leading-5"
        >
          {last ? (
            <div key={last.id} className="space-y-2">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                <Check aria-hidden="true" className="size-3.5" />
                {last.source === "human"
                  ? "Manual"
                  : last.source === "agent"
                    ? "Native agent"
                    : "Simulator"}{" "}
                · {last.status} · Call {mcp.executions.length}
              </p>
              <code className="block text-muted-foreground [overflow-wrap:anywhere]">
                {last.name}({JSON.stringify(last.args)})
              </code>
              <p className="font-mono [overflow-wrap:anywhere]">
                {last.error ||
                  JSON.stringify(last.result) ||
                  "Waiting for result…"}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Run the tool to filter the table to Browser projects. The result
              will appear here.
            </p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {!compact && (
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
function Booking() {
  const mcp = useWebMCP();
  const [step, setStep] = useState(0);
  const [dates, setDates] = useState({ from: "", to: "" });
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  return (
    <div className="space-y-6">
      <SupportBadge support={mcp.support} />
      {confirmed ? (
        <Alert variant="success">
          <AlertTitle>Example reservation confirmed</AlertTitle>
          <AlertDescription>
            {name} · {dates.from} → {dates.to}
          </AlertDescription>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setConfirmed(false);
              setStep(0);
            }}
          >
            Start again
          </Button>
        </Alert>
      ) : (
        <Wizard
          step={step}
          onStepChange={setStep}
          steps={[
            {
              title: "Dates",
              content: (
                <DateRangePicker value={dates} onChange={setDates} required />
              ),
              validate: () =>
                !dates.from || !dates.to || dates.to < dates.from
                  ? "Choose a valid date range."
                  : null,
            },
            {
              title: "Details",
              content: (
                <div className="space-y-2">
                  <Label htmlFor="reservation-name">Guest name</Label>
                  <Input
                    id="reservation-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              ),
              validate: () => (name.trim() ? null : "Enter a guest name."),
            },
            {
              title: "Review",
              content: (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p>{name}</p>
                  <p className="mt-2 text-muted-foreground">
                    {dates.from} → {dates.to}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    This demo does not make a real booking.
                  </p>
                </div>
              ),
              validate: () =>
                name.trim() && dates.from && dates.to && dates.to >= dates.from
                  ? null
                  : "Complete the reservation details.",
            },
          ]}
          onComplete={() => setConfirmOpen(true)}
        />
      )}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm this example?"
        description="Your reservation will be shown in this page only."
        onConfirm={() => setConfirmed(true)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          void mcp.run(
            "prepare_reservation",
            { name: "Alex Morgan", from: "2026-10-12", to: "2026-10-16" },
            "simulator",
          )
        }
      >
        Simulate an agent preparing the reservation
      </Button>
      <ExecutionLog executions={mcp.executions} onClear={mcp.clearHistory} />
    </div>
  );
}
export function BookingDemo({ playground = false }: { playground?: boolean }) {
  return (
    <WebMCPProvider>
      <Booking />
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
