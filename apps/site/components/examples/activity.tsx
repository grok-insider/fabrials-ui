"use client";

import { ActivityDisclosure, ReasoningDisclosure, SearchStepsDisclosure, type SearchPhase, type SearchStep } from "@fabrials/ai-ui";
import { Terminal } from "lucide-react";
import type { ExampleSet } from "./types";
import { ReplayButton, useScript, type Frame } from "./replay";

const QUERIES: SearchStep[] = [
  {
    type: "search",
    query: "postgres move table to another schema without downtime",
    sources: ["https://www.postgresql.org/docs/current/sql-altertable.html", "https://wiki.postgresql.org/wiki/Lock_Monitoring", "https://dba.stackexchange.com/questions/ask"],
  },
  {
    type: "search",
    query: "pg_repack locks during swap",
    sources: ["https://reorg.github.io/pg_repack/", "https://github.com/reorg/pg_repack/issues"],
  },
  { type: "open_page", url: "https://www.postgresql.org/docs/current/explicit-locking.html", title: "Explicit locking" },
];

type Research = { phase: SearchPhase; steps: SearchStep[] };

const FRAMES: Frame<Research>[] = [
  { at: 0, state: { phase: "searching", steps: [] } },
  { at: 1100, state: { phase: "searching", steps: QUERIES.slice(0, 1) } },
  { at: 2300, state: { phase: "searching", steps: QUERIES.slice(0, 2) } },
  { at: 3300, state: { phase: "reading", steps: QUERIES } },
  { at: 5200, state: { phase: "done", steps: QUERIES } },
];

function LiveResearch() {
  const { state, replay, done } = useScript(FRAMES);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 34rem)" }}>
      <SearchStepsDisclosure defaultOpen phase={state.phase} sourceCount={5} steps={state.steps} />
      {done ? (
        <div>
          <ReplayButton onClick={replay} />
        </div>
      ) : null}
    </div>
  );
}

export const activityExamples: ExampleSet = {
  preview: () => <LiveResearch />,
  previewCode: `import {
  SearchStepsDisclosure,
  type SearchPhase,
  type SearchStep,
} from "@fabrials/ai-ui";

// \`phase\` and \`steps\` come from the agent's stream:
// searching, then reading, then done.
const steps: SearchStep[] = [
  {
    type: "search",
    query: "postgres move table to another schema without downtime",
    sources: [
      "https://www.postgresql.org/docs/current/sql-altertable.html",
      "https://wiki.postgresql.org/wiki/Lock_Monitoring",
      "https://dba.stackexchange.com/questions/ask",
    ],
  },
  {
    type: "search",
    query: "pg_repack locks during swap",
    sources: [
      "https://reorg.github.io/pg_repack/",
      "https://github.com/reorg/pg_repack/issues",
    ],
  },
  {
    type: "open_page",
    url: "https://www.postgresql.org/docs/current/explicit-locking.html",
    title: "Explicit locking",
  },
];

export function Research({ phase }: { phase: SearchPhase }) {
  return (
    <SearchStepsDisclosure
      defaultOpen
      phase={phase}
      sourceCount={5}
      steps={steps}
    />
  );
}`,
  examples: [
    {
      id: "reasoning",
      title: "Reasoning as it streams",
      description:
        "`ReasoningDisclosure` opens while `streaming`, crosses its label with the working light and counts the time beside it; it closes a second after the stream ends (`autoClose`) and says how long it thought. Pass `durationSeconds` when the server knows.",
      code: `<ReasoningDisclosure streaming={isStreaming} durationSeconds={reasoning.seconds}>
  {reasoning.text}
</ReasoningDisclosure>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-1)", width: "min(100%, 30rem)" }}>
          <ReasoningDisclosure defaultOpen streaming>
            Comparing a rename in place with a copy in batches before choosing one.
          </ReasoningDisclosure>
          <ReasoningDisclosure durationSeconds={4}>Chose the copy in batches: the rename takes a lock the app cannot wait for.</ReasoningDisclosure>
        </div>
      ),
      align: "start",
    },
    {
      id: "phases",
      title: "Search phases",
      description:
        "`phase` is `searching`, `reading` or `done`; the label follows it and, once done, counts the searches and sources. While it is live the time ticks; `timer={false}` drops it.",
      code: `<SearchStepsDisclosure phase="searching" />
<SearchStepsDisclosure phase="reading" />
<SearchStepsDisclosure phase="done" steps={steps} sourceCount={5} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-1)", width: "min(100%, 30rem)" }}>
          <SearchStepsDisclosure phase="searching" />
          <SearchStepsDisclosure phase="reading" />
          <SearchStepsDisclosure phase="done" sourceCount={5} steps={QUERIES} />
        </div>
      ),
      align: "start",
    },
    {
      id: "steps",
      title: "Steps and their sources",
      description:
        "Each `search` step lists the pages it found: the marks of the first four sit stacked beside the count, and the step opens to the list. An `open_page` step links to the page it read. Give `faviconUrl` to show the sites' icons instead of their initials.",
      code: `const steps: SearchStep[] = [
  { type: "search", query: "pg_repack locks during swap", sources: [url1, url2] },
  { type: "open_page", url: lockingDocs, title: "Explicit locking" },
];

<SearchStepsDisclosure phase="done" steps={steps} defaultOpen faviconUrl={(url) => icons.get(url)} />`,
      render: () => (
        <div style={{ width: "min(100%, 30rem)" }}>
          <SearchStepsDisclosure defaultOpen phase="done" sourceCount={5} steps={QUERIES} />
        </div>
      ),
      align: "start",
    },
    {
      id: "generic",
      title: "Any tool at work",
      description:
        "`ActivityDisclosure` is the same row for any tool: an `icon`, a `label` and `live` while it runs. With children it opens to them; `timer` counts while live.",
      code: `<ActivityDisclosure icon={<Terminal />} label="Running the tests" live timer />
<ActivityDisclosure icon={<Terminal />} label="Ran 214 tests">
  <pre>{output}</pre>
</ActivityDisclosure>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-1)", width: "min(100%, 30rem)" }}>
          <ActivityDisclosure icon={<Terminal />} label="Running the tests" live timer />
          <ActivityDisclosure icon={<Terminal />} label="Ran 214 tests" live={false}>
            214 passed, 0 failed, in 6.1 s.
          </ActivityDisclosure>
        </div>
      ),
      align: "start",
    },
  ],
};
