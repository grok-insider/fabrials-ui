"use client";

import { useEffect, useState } from "react";
import { AgentMark, AgentThinking, ChatMessage } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";

const STEPS = ["Thinking", "Reading the schema", "Comparing the two migrations", "Drafting the change"];

function Thread() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => (value + 1) % STEPS.length), 2600);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 34rem)" }}>
      <ChatMessage from="user">Can you move the invoices table to the new schema without downtime?</ChatMessage>
      <AgentThinking label={STEPS[step]} />
    </div>
  );
}

export const agentThinkingExamples: ExampleSet = {
  preview: () => <Thread />,
  previewCode: `import { AgentThinking, ChatMessage } from "@fabrials/ai-ui";

// \`step\` is what the agent is doing now, from your stream:
// "Reading the schema".
export function Thread({ question, step }: { question: string; step: string }) {
  return (
    <>
      <ChatMessage from="user">{question}</ChatMessage>
      <AgentThinking label={step} />
    </>
  );
}`,
  examples: [
    {
      id: "marks",
      title: "Three marks",
      description:
        "`variant` picks the mark: a wave crossing a 3x3 grid (the default), a head running round the ring, or a 4x4 ordered dither that fills with light and empties. All three are square cells in the dither's voice.",
      code: `<AgentThinking variant="wave" />
<AgentThinking variant="orbit" label="Searching" />
<AgentThinking variant="dither" label="Rendering" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <AgentThinking variant="wave" />
          <AgentThinking variant="orbit" label="Searching" />
          <AgentThinking variant="dither" label="Rendering" />
        </div>
      ),
    },
    {
      id: "label",
      title: "Say what it is doing",
      description:
        "`label` is the only part read out, and it is read again whenever it changes, so name the step in plain words. The ticking time beside it is hidden from assistive technology.",
      code: `<AgentThinking label={step.title} />`,
      render: () => <AgentThinking label="Reading 14 files in src/billing" variant="orbit" />,
    },
    {
      id: "tone",
      title: "Light or ink",
      description:
        "`tone=\"light\"` (the default) carries the working light: use it where a person waits for the answer. `tone=\"ink\"` is a muted line for work in the background, such as a row in a sidebar.",
      code: `<AgentThinking tone="light" label="Writing the reply" />
<AgentThinking tone="ink" label="Indexing the mailbox" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <AgentThinking label="Writing the reply" tone="light" />
          <AgentThinking label="Indexing the mailbox" tone="ink" variant="dither" />
        </div>
      ),
    },
    {
      id: "time",
      title: "Time and stillness",
      description:
        "`startedAt` counts from when the work began on the server, so a reload does not reset it. `timer={false}` drops the time and `shimmer={false}` keeps the label still, for a long wait where motion would wear.",
      code: `<AgentThinking label="Waiting for the build" startedAt={run.startedAt} />
<AgentThinking label="Queued" timer={false} shimmer={false} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <AgentThinking label="Waiting for the build" startedAt={Date.now() - 74_000} variant="orbit" />
          <AgentThinking label="Queued" shimmer={false} timer={false} tone="ink" />
        </div>
      ),
    },
    {
      id: "mark",
      title: "The mark on its own",
      description:
        "`AgentMark` is the indicator without words, for a dense row or a button. It is decorative: put the state in the row's text or in a visually hidden label next to it.",
      code: `<span className="row">
  <AgentMark variant="orbit" />
  Release notes
  <span className="sr-only">An agent is writing this</span>
</span>`,
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>
          <AgentMark variant="orbit" />
          <span>Release notes</span>
          <span className="fui-sr-only">An agent is writing this</span>
        </div>
      ),
    },
  ],
};
