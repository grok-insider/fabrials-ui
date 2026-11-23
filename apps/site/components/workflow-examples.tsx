"use client";
import { ToolPlayground } from "@/components/tool-playground";
import { useState } from "react";
import { Check, ShieldCheck, Sparkles, X } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  Label,
  Meter,
  NativeSelect,
  RadiantGlyph,
  Slider,
  StatusDot,
  ToggleGroup,
  ToggleGroupItem,
} from "@fabrials/ui";
import { Comparison } from "@/registry/components/comparison";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
import { Wizard } from "@/registry/components/wizard";
import {
  WebMCPProvider,
  useWebMCP,
  useWebMCPTool,
} from "@/registry/webmcp/provider";

export function TravelExample({
  playground = false,
}: {
  playground?: boolean;
}) {
  return (
    <WebMCPProvider>
      <TravelPlanner />
      {playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

const TRAVEL_STAYS = [
  {
    id: "canal",
    title: "Canal House",
    cost: 160,
    quiet: true,
    district: "Jordaan · 3 min walk",
    noiseDb: 31,
  },
  {
    id: "central",
    title: "Central Studio",
    cost: 120,
    quiet: false,
    district: "Damrak · transit hub",
    noiseDb: 54,
  },
  {
    id: "garden",
    title: "Garden Loft",
    cost: 240,
    quiet: true,
    district: "Oud-West · courtyard",
    noiseDb: 29,
  },
] as const;

const BUDGET_PRESETS = [150, 200, 260] as const;

function TravelPlanner() {
  const mcp = useWebMCP();
  const [budget, setBudget] = useState(200);
  const [ranked, setRanked] = useState(false);
  const [selected, setSelected] = useState("");

  function recommend(max: number) {
    setBudget(max);
    setRanked(true);
    return TRAVEL_STAYS.filter((s) => s.cost <= max && s.quiet);
  }

  useWebMCPTool({
    name: "find_quiet_stays",
    description:
      "Find fictional quiet stays within a nightly budget. Highlights the comparison without making a booking.",
    inputSchema: {
      type: "object",
      properties: { budget: { type: "number", minimum: 50, maximum: 500 } },
      required: ["budget"],
      additionalProperties: false,
    },
    execute: (a) => recommend(Number(a.budget)),
  });

  useWebMCPTool({
    name: "shortlist_stay",
    description:
      "Shortlist a fictional stay in the visible planner. No booking is made.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", enum: ["canal", "central", "garden"] },
      },
      required: ["id"],
      additionalProperties: false,
    },
    execute: (a) => {
      setSelected(String(a.id));
      return { shortlisted: a.id, booked: false };
    },
  });

  const matching = TRAVEL_STAYS.filter((s) => s.cost <= budget && s.quiet);
  const bestId = ranked ? matching[0]?.id : undefined;

  return (
    <div className="grid gap-5">
      <div className="pg-well">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="stay-budget">Nightly budget (€)</Label>
              <Input
                id="stay-budget"
                type="number"
                min={50}
                max={500}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-32 tabular-nums"
              />
            </div>
            <Button variant="accent" onClick={() => recommend(budget)}>
              Find quiet stays
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void mcp.run("find_quiet_stays", { budget }, "simulator")
              }
            >
              <Sparkles />
              Simulate agent
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="pg-preset-row" role="group" aria-label="Budget presets">
              {BUDGET_PRESETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="pg-preset-btn"
                  aria-pressed={budget === amount}
                  onClick={() => recommend(amount)}
                >
                  €{amount}
                </button>
              ))}
            </div>
            <Badge tone={matching.length > 0 ? "info" : "warning"} size="sm">
              {matching.length} of {TRAVEL_STAYS.length} match
            </Badge>
          </div>
        </div>

        <div className="max-w-md pt-1">
          <Slider
            label="Budget ceiling"
            unit="€"
            min={50}
            max={500}
            step={10}
            value={Math.min(500, Math.max(50, budget || 50))}
            onValueChange={(v) => {
              if (typeof v === "number") setBudget(v);
            }}
            showValue
          />
        </div>
      </div>

      <Comparison
        caption="A weekend in Amsterdam"
        columns={TRAVEL_STAYS.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: `€${s.cost} / night`,
          recommended: bestId === s.id,
          action: (
            <Button
              size="sm"
              variant={selected === s.id ? "accent" : "outline"}
              onClick={() => setSelected(s.id)}
            >
              {selected === s.id ? (
                <>
                  <Check /> Shortlisted
                </>
              ) : (
                "Shortlist"
              )}
            </Button>
          ),
        }))}
        rows={[
          {
            id: "budget",
            label: "Within budget",
            highlighted: ranked,
            values: Object.fromEntries(
              TRAVEL_STAYS.map((s) => {
                const ok = s.cost <= budget;
                return [
                  s.id,
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      ok
                        ? "text-[var(--fui-success-ink)]"
                        : "text-[var(--fui-danger-ink)]"
                    }`}
                  >
                    {ok ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <X className="size-3.5" aria-hidden />
                    )}
                    {ok ? "Yes" : `Over budget (+€${s.cost - budget})`}
                  </span>,
                ];
              }),
            ),
          },
          {
            id: "quiet",
            label: "Quiet location",
            highlighted: ranked,
            values: Object.fromEntries(
              TRAVEL_STAYS.map((s) => [
                s.id,
                <span
                  key={s.id}
                  className={
                    s.quiet
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {s.quiet ? "Courtyard-facing" : "City centre"}
                </span>,
              ]),
            ),
          },
          {
            id: "district",
            label: "Neighbourhood",
            values: Object.fromEntries(
              TRAVEL_STAYS.map((s) => [
                s.id,
                <span key={s.id} className="text-xs text-muted-foreground">
                  {s.district}
                </span>,
              ]),
            ),
          },
          {
            id: "acoustics",
            label: "Night acoustics",
            values: Object.fromEntries(
              TRAVEL_STAYS.map((s) => [
                s.id,
                <span
                  key={s.id}
                  className="font-mono text-xs tabular-nums text-foreground"
                >
                  {s.noiseDb} dB
                </span>,
              ]),
            ),
          },
        ]}
      />

      <div className="pg-status-strip">
        <p
          role="status"
          className="m-0 flex items-center gap-2 text-sm text-foreground"
        >
          <StatusDot
            tone={selected ? "success" : ranked ? "info" : "neutral"}
            label={selected ? "Shortlisted" : ranked ? "Filtered" : "Ready"}
            hideLabel
          />
          {selected
            ? `${TRAVEL_STAYS.find((s) => s.id === selected)?.title} is on your shortlist.`
            : ranked
              ? `${matching.length} quiet stays match your budget.`
              : "Compare the tradeoffs before you choose."}
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">
          Fictional stays · no booking created
        </span>
      </div>
    </div>
  );
}

export function SupportExample({
  playground = false,
}: {
  playground?: boolean;
}) {
  return (
    <WebMCPProvider>
      <SupportQueue />
      {playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

const SUPPORT_TICKETS = [
  {
    id: "SUP-104",
    title: "Unable to sign in",
    priority: "High" as const,
    org: "Kestrel Labs",
    channel: "SSO / Auth",
    sla: "14m elapsed",
    summary:
      "SAML assertion clock skew of 42s rejected two operator sign-ins after key rotation.",
    draftAction:
      "Extend clock-skew tolerance to 60s and issue a fresh session verification link for the affected workspace.",
  },
  {
    id: "SUP-105",
    title: "Invoice address update",
    priority: "Normal" as const,
    org: "Northwind Ops",
    channel: "Billing",
    sla: "2h 18m elapsed",
    summary:
      "Finance requested updating the VAT billing street on upcoming monthly receipts.",
    draftAction:
      "Update billing profile metadata and regenerate the pending October PDF invoice preview.",
  },
  {
    id: "SUP-106",
    title: "Export stuck at 99%",
    priority: "High" as const,
    org: "Boreal Studio",
    channel: "Data export",
    sla: "9m elapsed",
    summary:
      "Archive worker stalled finalizing manifest checksum for a 1.4 GB project export.",
    draftAction:
      "Restart checksum finalizer on the staged S3 multipart upload and notify the requester.",
  },
];

function SupportQueue() {
  const mcp = useWebMCP();
  const [priority, setPriority] = useState("All");
  const [focusedId, setFocusedId] = useState<string>(SUPPORT_TICKETS[0]!.id);
  const [review, setReview] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);

  useWebMCPTool({
    name: "filter_support_queue",
    description: "Filter fictional support tickets by priority.",
    inputSchema: {
      type: "object",
      properties: {
        priority: { type: "string", enum: ["All", "High", "Normal"] },
      },
      required: ["priority"],
      additionalProperties: false,
    },
    execute: (a) => {
      setPriority(String(a.priority));
      return SUPPORT_TICKETS.filter(
        (t) => a.priority === "All" || t.priority === a.priority,
      );
    },
  });

  useWebMCPTool({
    name: "prepare_ticket_resolution",
    description:
      "Open a human review before marking a fictional ticket resolved. The agent cannot confirm the resolution.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", enum: ["SUP-104", "SUP-105", "SUP-106"] },
      },
      required: ["id"],
      additionalProperties: false,
    },
    execute: (a) => {
      const id = String(a.id);
      setFocusedId(id);
      setReview(id);
      return { status: "awaiting_human_review" };
    },
  });

  const visibleTickets = SUPPORT_TICKETS.filter(
    (t) => priority === "All" || t.priority === priority,
  );
  const inspected =
    visibleTickets.find((t) => t.id === focusedId) ?? visibleTickets[0];
  const reviewTicket = SUPPORT_TICKETS.find((t) => t.id === review);
  const openHighCount = SUPPORT_TICKETS.filter(
    (t) => t.priority === "High" && !resolved.includes(t.id),
  ).length;

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div className="pg-toolbar-group">
          <div>
            <h3 className="m-0 text-sm font-medium text-foreground">
              Support inbox
            </h3>
            <p className="m-0 mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {visibleTickets.length} shown · {openHighCount} open high priority ·{" "}
              {resolved.length} resolved
            </p>
          </div>
        </div>

        <div className="pg-toolbar-group">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void mcp.run(
                "filter_support_queue",
                { priority: priority === "High" ? "All" : "High" },
                "simulator",
              )
            }
          >
            <Sparkles />
            {priority === "High" ? "Show all via tool" : "Triage high priority"}
          </Button>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Priority
            <NativeSelect
              className="w-auto min-w-28"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {["All", "High", "Normal"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </NativeSelect>
          </label>
        </div>
      </div>

      <div className="pg-split">
        <ul className="pg-index-list" aria-label="Support tickets">
          {visibleTickets.map((t) => {
            const isResolved = resolved.includes(t.id);
            const isSelected = inspected?.id === t.id;
            return (
              <li
                key={t.id}
                className="pg-index-row"
                data-interactive="true"
                data-selected={isSelected || undefined}
                onClick={() => setFocusedId(t.id)}
              >
                <div className="min-w-0 flex-1 grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {t.id}
                    </span>
                    <Badge
                      size="sm"
                      dot
                      tone={
                        isResolved
                          ? "success"
                          : t.priority === "High"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {isResolved ? "Resolved" : t.priority}
                    </Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {t.org} · {t.sla}
                    </span>
                  </div>
                  <p className="m-0 text-sm font-medium text-foreground">
                    {t.title}
                  </p>
                </div>

                <Button
                  size="sm"
                  className="shrink-0"
                  variant={isResolved ? "ghost" : "outline"}
                  disabled={isResolved}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedId(t.id);
                    setReview(t.id);
                  }}
                >
                  {isResolved ? "Resolved" : "Review resolution"}
                </Button>
              </li>
            );
          })}
        </ul>

        {inspected && (
          <aside className="pg-well content-start" aria-label="Ticket inspector">
            <div className="pg-well-head">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium text-foreground">
                  {inspected.id}
                </span>
                <Badge size="sm" tone="neutral">
                  {inspected.channel}
                </Badge>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {inspected.sla}
              </span>
            </div>

            <div className="grid gap-1.5">
              <p className="m-0 text-sm font-semibold text-foreground">
                {inspected.title}
              </p>
              <p className="m-0 text-xs leading-5 text-muted-foreground">
                {inspected.summary}
              </p>
            </div>

            <div className="pg-inset">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 text-[var(--brand-ink)]" aria-hidden />
                Proposed agent resolution
              </span>
              <p className="m-0 text-xs leading-5 text-foreground">
                {inspected.draftAction}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-mono text-[11px] text-muted-foreground">
                Human confirmation required
              </span>
              <Button
                size="xs"
                variant="accent"
                disabled={resolved.includes(inspected.id)}
                onClick={() =>
                  void mcp.run(
                    "prepare_ticket_resolution",
                    { id: inspected.id },
                    "simulator",
                  )
                }
              >
                {resolved.includes(inspected.id)
                  ? "Already resolved"
                  : "Stage via agent tool"}
              </Button>
            </div>
          </aside>
        )}
      </div>

      <div className="pg-status-strip">
        <p
          role="status"
          className="m-0 flex items-center gap-2 text-sm text-foreground"
        >
          <StatusDot
            tone={resolved.length > 0 ? "success" : "neutral"}
            label={resolved.length > 0 ? "Resolved tickets" : "No tickets resolved"}
            hideLabel
          />
          {resolved.length} resolved in this demo. Changes stay in this page.
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">
          Synthetic queue · no external ticket system
        </span>
      </div>

      <ConfirmationDialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
        title="Resolve this ticket?"
        description="Review the fictional support ticket. This only changes the local demo queue."
        confirmLabel="Resolve ticket"
        onConfirm={() => {
          if (review) setResolved((r) => [...new Set([...r, review])]);
        }}
      >
        {reviewTicket && (
          <div className="grid gap-2 rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] p-3.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {reviewTicket.id} · {reviewTicket.org}
              </span>
              <Badge
                size="sm"
                tone={reviewTicket.priority === "High" ? "danger" : "neutral"}
              >
                {reviewTicket.priority}
              </Badge>
            </div>
            <p className="m-0 font-medium text-foreground">
              {reviewTicket.title}
            </p>
            <p className="m-0 text-xs leading-5 text-muted-foreground">
              {reviewTicket.draftAction}
            </p>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}

export function OnboardingExample({
  playground = false,
}: {
  playground?: boolean;
}) {
  return (
    <WebMCPProvider>
      <WorkspaceSetup />
      {playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

const WORKSPACE_PRESETS = ["Kestrel Labs", "Urithiru Ops", "Field studio"] as const;

function slugifyWorkspace(raw: string): string {
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || "your-workspace";
}

function seatCeiling(size: string): number {
  if (size === "Just me") return 1;
  if (size === "11–50") return 50;
  return 10;
}

function WorkspaceSetup() {
  const mcp = useWebMCP();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [size, setSize] = useState("2–10");
  const [region, setRegion] = useState("eu-central");
  const [done, setDone] = useState(false);

  useWebMCPTool({
    name: "prepare_workspace",
    description:
      "Prefill a fictional workspace setup and move to review. Does not create a workspace.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 60 },
        size: { type: "string", enum: ["Just me", "2–10", "11–50"] },
      },
      required: ["name", "size"],
      additionalProperties: false,
    },
    execute: (a) => {
      setName(String(a.name));
      setSize(String(a.size));
      setStep(2);
      setDone(false);
      return { status: "ready_for_review", name: a.name };
    },
  });

  const slug = slugifyWorkspace(name);
  const seats = seatCeiling(size);
  const regionLabel =
    region === "eu-central"
      ? "EU Central"
      : region === "us-east"
        ? "US East"
        : "AP South";

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div>
          <p className="m-0 text-sm font-medium text-foreground">
            Workspace provisioning
          </p>
          <p className="m-0 mt-0.5 font-mono text-[11px] text-muted-foreground">
            Guided onboarding · WebMCP prepare_workspace
          </p>
        </div>
        <Button
          size="sm"
          variant="accent"
          onClick={() =>
            void mcp.run(
              "prepare_workspace",
              { name: "Kestrel Systems", size: "11–50" },
              "simulator",
            )
          }
        >
          <Sparkles />
          Simulate agent prefill
        </Button>
      </div>

      <div className="pg-split">
        <div className="pg-well">
          {done ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-2.5">
                <StatusDot tone="success" label="Provisioned" hideLabel />
                <Badge tone="success" size="sm">
                  Provisioned locally
                </Badge>
              </div>
              <div className="grid gap-1">
                <h3 className="m-0 text-xl font-semibold tracking-tight text-foreground">
                  {name} is ready.
                </h3>
                <p role="status" className="m-0 text-sm text-muted-foreground">
                  Demo setup complete for {size} people. No real workspace was
                  created.
                </p>
              </div>
              <div className="pg-inset">
                <dl className="pg-kv">
                  <div className="pg-kv-row">
                    <dt>Slug</dt>
                    <dd className="font-mono">fabrials.app/{slug}</dd>
                  </div>
                  <div className="pg-kv-row">
                    <dt>Team tier</dt>
                    <dd>{size} people</dd>
                  </div>
                  <div className="pg-kv-row">
                    <dt>Data region</dt>
                    <dd>{regionLabel}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDone(false);
                    setStep(0);
                  }}
                >
                  Start again
                </Button>
              </div>
            </div>
          ) : (
            <Wizard
              step={step}
              onStepChange={setStep}
              onComplete={() => setDone(true)}
              steps={[
                {
                  title: "Workspace",
                  content: (
                    <div className="grid gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="workspace-name">Workspace name</Label>
                        <Input
                          id="workspace-name"
                          placeholder="Design studio"
                          value={name}
                          maxLength={60}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <span className="font-mono text-[11px] text-muted-foreground">
                          URL preview: fabrials.app/{slug}
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        <span className="pg-section-label">
                          Quick synthetic names
                        </span>
                        <div className="pg-preset-row">
                          {WORKSPACE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className="pg-preset-btn"
                              aria-pressed={name === preset}
                              onClick={() => setName(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                  validate: () =>
                    name.trim() ? null : "Give your workspace a name.",
                },
                {
                  title: "Your team",
                  content: (
                    <div className="grid gap-4">
                      <label className="grid gap-1.5 text-sm font-medium text-foreground">
                        Team size
                        <NativeSelect
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                        >
                          {["Just me", "2–10", "11–50"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </NativeSelect>
                      </label>

                      <div className="grid gap-1.5">
                        <span className="pg-section-label">Data residency</span>
                        <ToggleGroup
                          aria-label="Data residency"
                          size="sm"
                          value={[region]}
                          onValueChange={(next) => {
                            if (next[0]) setRegion(next[0]);
                          }}
                        >
                          <ToggleGroupItem value="eu-central">
                            EU Central
                          </ToggleGroupItem>
                          <ToggleGroupItem value="us-east">
                            US East
                          </ToggleGroupItem>
                          <ToggleGroupItem value="ap-south">
                            AP South
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Review",
                  content: (
                    <div className="pg-inset">
                      <dl className="pg-kv">
                        <div className="pg-kv-row">
                          <dt>Workspace</dt>
                          <dd>{name || "—"}</dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>URL slug</dt>
                          <dd className="font-mono">fabrials.app/{slug}</dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>Team size</dt>
                          <dd>{size} people</dd>
                        </div>
                        <div className="pg-kv-row">
                          <dt>Region</dt>
                          <dd>{regionLabel}</dd>
                        </div>
                      </dl>
                      <p className="m-0 font-mono text-[11px] text-muted-foreground">
                        Demo workspace · nothing is provisioned remotely.
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        <aside
          className="pg-well content-start"
          aria-label="Workspace blueprint"
        >
          <div className="pg-well-head">
            <span className="pg-section-label">Live workspace blueprint</span>
            <Badge tone={done ? "success" : "info"} dot size="sm">
              {done ? "Active" : `Step ${step + 1} / 3`}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)]">
              <RadiantGlyph order="elsecaller" size={24} colored />
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-foreground">
                {name.trim() || "Untitled workspace"}
              </p>
              <p className="m-0 font-mono text-[11px] text-muted-foreground">
                fabrials.app/{slug}
              </p>
            </div>
          </div>

          <Meter
            variant="ruler"
            value={seats}
            max={50}
            label={`Seat ceiling · ${seats} ${seats === 1 ? "seat" : "seats"}`}
          />

          <dl className="pg-kv">
            <div className="pg-kv-row">
              <dt>Team tier</dt>
              <dd>{size}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Residency</dt>
              <dd>{regionLabel}</dd>
            </div>
            <div className="pg-kv-row">
              <dt>Confirmation</dt>
              <dd>{done ? "Signed off" : "Awaiting human"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
