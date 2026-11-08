"use client";

import { useEffect, useState } from "react";
import { AgentMark, AgentThinking, ChatMessage, type AgentActivity } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { ReplayButton } from "./replay";

const STEPS: { activity: AgentActivity; label: string }[] = [
  { activity: "thinking", label: "Thinking" },
  { activity: "reading", label: "Reading the schema" },
  { activity: "searching", label: "Searching the migration notes" },
  { activity: "writing", label: "Drafting the change" },
];

function Thread() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => (value + 1) % STEPS.length), 2600);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 34rem)" }}>
      <ChatMessage from="user">Can you move the invoices table to the new schema without downtime?</ChatMessage>
      <AgentThinking activity={STEPS[step]!.activity} label={STEPS[step]!.label} />
    </div>
  );
}

const KINDS: { activity: AgentActivity; label: string }[] = [
  { activity: "thinking", label: "Thinking" },
  { activity: "searching", label: "Searching the docs" },
  { activity: "reading", label: "Reading 14 files in src/billing" },
  { activity: "writing", label: "Writing the summary" },
  { activity: "running", label: "Running the tests" },
  { activity: "rendering", label: "Rendering the chart" },
  { activity: "uploading", label: "Uploading 3 files" },
];

function Settling() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  useEffect(() => {
    setDone(false);
    setStartedAt(Date.now());
    const timer = window.setTimeout(() => setDone(true), 3200);
    return () => window.clearTimeout(timer);
  }, [run]);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", justifyItems: "start" }}>
      <AgentThinking
        activity="searching"
        label={done ? "Searched 12 sources" : "Searching the docs"}
        startedAt={startedAt}
        status={done ? "done" : "working"}
      />
      <AgentThinking activity="running" endedAt={Date.UTC(2026, 10, 8, 9, 0, 41)} label="The tests failed" startedAt={Date.UTC(2026, 10, 8, 9, 0, 0)} status="failed" />
      <ReplayButton label="Search again" onClick={() => setRun((value) => value + 1)} />
    </div>
  );
}

export const agentThinkingExamples: ExampleSet = {
  preview: () => <Thread />,
  previewCode: `import {
  AgentThinking,
  ChatMessage,
  type AgentActivity,
} from "@fabrials/ai-ui";

// \`step\` is what the agent is doing now, from your stream:
// { activity: "reading", label: "Reading the schema" }.
export function Thread({
  question,
  step,
}: {
  question: string;
  step: { activity: AgentActivity; label: string };
}) {
  return (
    <>
      <ChatMessage from="user">{question}</ChatMessage>
      <AgentThinking activity={step.activity} label={step.label} />
    </>
  );
}`,
  examples: [
    {
      id: "activities",
      title: "One mark per kind of work",
      description:
        "`activity` picks the mark and, without a `label`, the words. Each moves its own way, so a person can tell the work apart at a glance: thinking stays in place, searching sweeps sideways, reading runs down the lines, writing fills in reading order, a tool runs round, rendering resolves from the top and an upload fills up.",
      code: `<AgentThinking activity="thinking" />
<AgentThinking activity="searching" label="Searching the docs" />
<AgentThinking activity="reading" label="Reading 14 files in src/billing" />
<AgentThinking activity="writing" label="Writing the summary" />
<AgentThinking activity="running" label="Running the tests" />
<AgentThinking activity="rendering" label="Rendering the chart" />
<AgentThinking activity="uploading" label="Uploading 3 files" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
          {KINDS.map((kind) => (
            <AgentThinking activity={kind.activity} key={kind.activity} label={kind.label} />
          ))}
        </div>
      ),
    },
    {
      id: "settle",
      title: "When the work ends",
      description:
        "`status=\"done\"` or `\"failed\"` settles the line: the light goes out, the mark holds a tick or a cross in its cells, the label stands still and the time stops. Say it in the past tense. `endedAt` with `startedAt` keeps the time right after a reload.",
      code: `<AgentThinking
  activity="searching"
  status={search.done ? "done" : "working"}
  label={search.done ? "Searched 12 sources" : "Searching the docs"}
  startedAt={search.startedAt}
/>
<AgentThinking activity="running" status="failed" label="The tests failed" startedAt={run.startedAt} endedAt={run.endedAt} />`,
      render: () => <Settling />,
      align: "start",
    },
    {
      id: "label",
      title: "Say what it is doing",
      description:
        "`label` is the only part read out, and it is read again whenever it changes, so name the step in plain words. The ticking time beside it is hidden from assistive technology.",
      code: `<AgentThinking activity="reading" label={step.title} />`,
      render: () => <AgentThinking activity="reading" label="Reading 14 files in src/billing" />,
    },
    {
      id: "tone",
      title: "Light or ink",
      description:
        "`tone=\"light\"` (the default) carries the working light: use it where a person waits for the answer. `tone=\"ink\"` is a muted line for work in the background, such as a row in a sidebar.",
      code: `<AgentThinking tone="light" activity="writing" label="Writing the reply" />
<AgentThinking tone="ink" activity="reading" label="Indexing the mailbox" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <AgentThinking activity="writing" label="Writing the reply" tone="light" />
          <AgentThinking activity="reading" label="Indexing the mailbox" tone="ink" />
        </div>
      ),
    },
    {
      id: "time",
      title: "Time and stillness",
      description:
        "`startedAt` counts from when the work began on the server, so a reload does not reset it. `timer={false}` drops the time and `shimmer={false}` keeps the label still, for a long wait where motion would wear.",
      code: `<AgentThinking activity="running" label="Waiting for the build" startedAt={run.startedAt} />
<AgentThinking label="Queued" timer={false} shimmer={false} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <AgentThinking activity="running" label="Waiting for the build" startedAt={Date.now() - 74_000} />
          <AgentThinking label="Queued" shimmer={false} timer={false} tone="ink" />
        </div>
      ),
    },
    {
      id: "mark",
      title: "The mark on its own",
      description:
        "`AgentMark` is the indicator without words, for a dense row or a button: `variant` is the mark of a kind of work (`wave`, `scan`, `lines`, `type`, `orbit`, `raster`, `fill`, or the `dither`), and `outcome` settles it on a tick or a cross. It is decorative: put the state in the row's text or in a visually hidden label next to it.",
      code: `<span className="row">
  <AgentMark variant="type" />
  Release notes
  <span className="sr-only">An agent is writing this</span>
</span>
<AgentMark outcome="done" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
            <AgentMark variant="type" />
            <span>Release notes</span>
            <span className="fui-sr-only">An agent is writing this</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
            <AgentMark outcome="done" />
            <span>Changelog</span>
            <span className="fui-sr-only">Written</span>
          </div>
        </div>
      ),
    },
  ],
};
