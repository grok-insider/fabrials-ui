"use client";

import { AgentThinking, SourceTally } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { ReplayButton, useScript, type Frame } from "./replay";

const SOURCES = [
  "https://www.postgresql.org/docs/current/sql-altertable.html",
  "https://wiki.postgresql.org/wiki/Lock_Monitoring",
  "https://reorg.github.io/pg_repack/",
  "https://github.com/reorg/pg_repack/issues/312",
  "https://www.crunchydata.com/blog/postgres-locks",
  "https://news.ycombinator.com/item?id=31415926",
  "https://stackoverflow.com/questions/6271/alter-table-lock",
  "https://docs.example.org/guides/zero-downtime",
  "https://notes.example.io/migrations",
];

type Search = { done: boolean; found: number };

const SEARCH: readonly Frame<Search>[] = [
  { at: 0, state: { done: false, found: 0 } },
  { at: 500, state: { done: false, found: 2 } },
  { at: 1100, state: { done: false, found: 3 } },
  { at: 1700, state: { done: false, found: 5 } },
  { at: 2300, state: { done: false, found: 6 } },
  { at: 2900, state: { done: false, found: 9 } },
  { at: 3800, state: { done: true, found: 9 } },
];

function Research() {
  const { state, replay, run } = useScript(SEARCH);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", width: "min(100%, 30rem)", justifyItems: "start" }}>
      <AgentThinking
        activity="searching"
        key={run}
        label={state.done ? `Read ${state.found} sources` : "Searching how to move a table without downtime"}
        status={state.done ? "done" : "working"}
      />
      <SourceTally label={state.done ? "Read" : "Reviewing sources"} sources={SOURCES.slice(0, state.found)} />
      <ReplayButton label="Search again" onClick={replay} />
    </div>
  );
}

const HOSTS = ["arxiv", "github", "docs", "blog", "wiki", "news", "forum", "status", "learn", "kb", "ops", "data", "notes", "zine", "radio", "maps", "time", "ink", "yard", "quay", "vault", "echo", "jade"];
const MANY = HOSTS.map((host, index) => `https://${host}.example.org/notes/${index}`);

export const sourceTallyExamples: ExampleSet = {
  preview: () => <Research />,
  previewCode: `import { AgentThinking, SourceTally } from "@fabrials/ai-ui";

// \`search\` comes from your stream: the URLs found so far, and whether it ended.
export function Research({
  search,
}: {
  search: { urls: string[]; done: boolean };
}) {
  return (
    <>
      <AgentThinking
        activity="searching"
        status={search.done ? "done" : "working"}
        label={
          search.done
            ? \`Read \${search.urls.length} sources\`
            : "Searching how to move a table without downtime"
        }
      />
      <SourceTally
        label={search.done ? "Read" : "Reviewing sources"}
        sources={search.urls}
      />
    </>
  );
}`,
  examples: [
    {
      id: "arrive",
      title: "Sources as they arrive",
      description:
        "Pass the URLs found so far, in the order they came; duplicates count once. Each new one rises in as a tile and the count settles like a reading, so a person sees the search widen without anything moving in between.",
      code: `<SourceTally sources={search.urls} />`,
      render: () => <SourceTally sources={SOURCES.slice(0, 5)} />,
    },
    {
      id: "many",
      title: "A long search",
      description:
        "`max` caps the tiles (8 by default) and the count says how many there are. When the search ends, say it in the past tense with `label`.",
      code: `<SourceTally label="Read" sources={urls} max={8} />`,
      render: () => <SourceTally label="Read" sources={MANY} />,
    },
    {
      id: "favicons",
      title: "Your favicons",
      description:
        "`faviconUrl` turns a URL into the site's icon from your own service; without it, or when the icon fails, a tile shows the site's initial. The tiles are decorative: the label and the count are what assistive technology reads.",
      code: `<SourceTally
  sources={urls}
  faviconUrl={(url) => \`/api/favicon?host=\${new URL(url).hostname}\`}
/>`,
      render: () => <SourceTally faviconUrl={() => null} sources={SOURCES.slice(0, 4)} />,
    },
  ],
};
