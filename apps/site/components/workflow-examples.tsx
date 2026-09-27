"use client";
import { ToolPlayground } from "@/components/tool-playground";
import { useState } from "react";
import { Button, Input, Label, NativeSelect } from "@fabrials/ui";
import { Comparison } from "@/registry/components/comparison";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
import { Wizard } from "@/registry/components/wizard";
import { WebMCPProvider, useWebMCPTool } from "@/registry/webmcp/provider";

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
function TravelPlanner() {
  const [budget, setBudget] = useState(200);
  const [ranked, setRanked] = useState(false);
  const [selected, setSelected] = useState("");
  const stays = [
    { id: "canal", title: "Canal House", cost: 160, quiet: true },
    { id: "central", title: "Central Studio", cost: 120, quiet: false },
    { id: "garden", title: "Garden Loft", cost: 240, quiet: true },
  ];
  function recommend(max: number) {
    setBudget(max);
    setRanked(true);
    return stays.filter((s) => s.cost <= max && s.quiet);
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
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="stay-budget">Nightly budget (€)</Label>
          <Input
            id="stay-budget"
            type="number"
            min={50}
            max={500}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-2 w-36"
          />
        </div>
        <Button onClick={() => recommend(budget)}>Find quiet stays</Button>
        <span className="text-xs text-muted-foreground">
          Fictional stays · no booking
        </span>
      </div>
      <Comparison
        caption="A weekend in Amsterdam"
        columns={stays.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: `€${s.cost} / night`,
          action: (
            <Button
              size="sm"
              variant={selected === s.id ? "secondary" : "outline"}
              onClick={() => setSelected(s.id)}
            >
              {selected === s.id ? "Shortlisted" : "Shortlist"}
            </Button>
          ),
        }))}
        rows={[
          {
            id: "budget",
            label: "Within budget",
            highlighted: ranked,
            values: Object.fromEntries(
              stays.map((s) => [
                s.id,
                s.cost <= budget ? "Yes" : "Over budget",
              ]),
            ),
          },
          {
            id: "quiet",
            label: "Quiet location",
            highlighted: ranked,
            values: Object.fromEntries(
              stays.map((s) => [
                s.id,
                s.quiet ? "Courtyard-facing" : "City centre",
              ]),
            ),
          },
        ]}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {selected
          ? `${stays.find((s) => s.id === selected)?.title} is on your shortlist.`
          : ranked
            ? `${stays.filter((s) => s.cost <= budget && s.quiet).length} quiet stays match your budget.`
            : "Compare the tradeoffs before you choose."}
      </p>
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
function SupportQueue() {
  const [priority, setPriority] = useState("All");
  const [review, setReview] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);
  const tickets = [
    { id: "SUP-104", title: "Unable to sign in", priority: "High" },
    { id: "SUP-105", title: "Invoice address update", priority: "Normal" },
    { id: "SUP-106", title: "Export stuck at 99%", priority: "High" },
  ];
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
      return tickets.filter(
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
      setReview(String(a.id));
      return { status: "awaiting_human_review" };
    },
  });
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Support inbox</h3>
        <label className="flex items-center gap-2 text-sm">
          Priority
          <NativeSelect
            className="w-auto"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {["All", "High", "Normal"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </NativeSelect>
        </label>
      </div>
      <ul className="divide-y rounded-xl border">
        {tickets
          .filter((t) => priority === "All" || t.priority === priority)
          .map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  {t.id} · {t.priority}
                </p>
                <p className="mt-1 font-medium">{t.title}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={resolved.includes(t.id)}
                onClick={() => setReview(t.id)}
              >
                {resolved.includes(t.id) ? "Resolved" : "Review resolution"}
              </Button>
            </li>
          ))}
      </ul>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {resolved.length} resolved in this demo. Changes stay in this page.
      </p>
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
        <p className="text-sm">{tickets.find((t) => t.id === review)?.title}</p>
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
function WorkspaceSetup() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [size, setSize] = useState("2–10");
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
  return done ? (
    <div className="rounded-xl border bg-muted/30 p-8">
      <h3 className="text-xl font-medium">{name} is ready.</h3>
      <p role="status" className="my-4 text-sm text-muted-foreground">
        Demo setup complete for {size} people. No real workspace was created.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          setDone(false);
          setStep(0);
        }}
      >
        Start again
      </Button>
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
            <div>
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                placeholder="Design studio"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>
          ),
          validate: () => (name.trim() ? null : "Give your workspace a name."),
        },
        {
          title: "Your team",
          content: (
            <label className="flex flex-col gap-2 text-sm">
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
          ),
        },
        {
          title: "Review",
          content: (
            <div className="rounded-xl bg-muted p-5">
              <p className="font-medium">{name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {size} people · Demo workspace
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
