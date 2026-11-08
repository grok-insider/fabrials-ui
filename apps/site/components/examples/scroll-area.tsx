"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  ScrollBar,
  Timeline,
  TimelineItem,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

type Event = { time: string; title: string; tone?: "success" | "warning" | "danger" | "info" };

const ACTIVITY: Event[] = [
  { time: "09:42", title: "North workspace synced 214 messages", tone: "success" },
  { time: "09:31", title: "The weekly export finished" },
  { time: "09:18", title: "Relay staging slowed down: the server asked us to wait 30 s", tone: "warning" },
  { time: "09:05", title: "Ana added the label Receipts to 12 threads" },
  { time: "08:57", title: "The team plan reached 80% of its quota", tone: "info" },
  { time: "08:40", title: "Harbour lab stopped: the password was refused", tone: "danger" },
  { time: "08:22", title: "Archive moved to cold storage" },
  { time: "08:10", title: "A new device signed in from Lisbon" },
  { time: "07:55", title: "The rule Newsletters skipped the inbox for 31 messages" },
  { time: "07:31", title: "The backup of North workspace was verified", tone: "success" },
  { time: "07:02", title: "Relay staging reconnected" },
  { time: "06:30", title: "The nightly report went to 3 people" },
  { time: "06:00", title: "The daily sync started" },
];

function Activity() {
  return (
    <Card style={{ width: "min(100%, 30rem)" }}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>North workspace · today</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea aria-label="Activity" fade style={{ height: "17rem" }}>
          <Timeline>
            {ACTIVITY.map((event) => (
              <TimelineItem key={event.time} time={event.time} title={event.title} tone={event.tone} />
            ))}
          </Timeline>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

const LABELS = [
  ["Receipts", 128],
  ["Travel", 42],
  ["Invoices", 96],
  ["Newsletters", 1204],
  ["Projects", 33],
  ["Taxes 2026", 12],
  ["Reading list", 58],
  ["Family", 17],
  ["Orders", 74],
  ["Health", 9],
  ["School", 26],
  ["Archive 2025", 3412],
] as const;

function Labels({ fade = false, name }: { fade?: boolean; name: string }) {
  return (
    <ScrollArea
      aria-label={name}
      fade={fade}
      style={{ height: "14rem", width: "min(100%, 20rem)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)" }}
    >
      <ul style={{ margin: 0, padding: "var(--fui-space-2) var(--fui-space-4)", listStyle: "none" }}>
        {LABELS.map(([label, count]) => (
          <li key={label} style={{ display: "flex", justifyContent: "space-between", gap: "var(--fui-space-3)", padding: "var(--fui-space-2) 0", fontSize: "var(--fui-text-sm)" }}>
            <span>{label}</span>
            <span style={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString("en")}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

const SUGGESTIONS = ["Compare usage", "Open accounts", "Refresh the pool", "Read the last sync", "Export this week", "Invite a teammate", "Show failed runs"];

const LOG = [
  "09:41:58.102  sync     north-workspace  fetched page 14 of 18 (200 messages, 1.2 MB, 412 ms)",
  "09:41:58.517  sync     north-workspace  indexed 200 headers; 3 duplicates skipped (same Message-ID)",
  "09:41:59.004  relay    staging          429 Too Many Requests: retrying in 30 s (attempt 2 of 5)",
  "09:42:00.230  sync     north-workspace  fetched page 15 of 18 (200 messages, 1.1 MB, 398 ms)",
  "09:42:00.651  rules    newsletters      moved 31 messages out of the inbox",
  "09:42:01.118  sync     north-workspace  fetched page 16 of 18 (200 messages, 1.3 MB, 455 ms)",
  "09:42:01.590  export   weekly           wrote usage-2026-w45.csv (1,204 rows)",
  "09:42:02.003  sync     north-workspace  fetched page 17 of 18 (200 messages, 1.0 MB, 377 ms)",
  "09:42:02.414  sync     north-workspace  fetched page 18 of 18 (114 messages, 0.6 MB, 241 ms)",
  "09:42:02.420  sync     north-workspace  done: 3,514 messages in 41 s",
];

const mono = { fontFamily: "var(--fui-font-mono)", fontSize: "var(--fui-text-xs)" } as const;

export const scrollAreaExamples: ExampleSet = {
  preview: () => <Activity />,
  previewCode: `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Timeline,
  TimelineItem,
} from "@fabrials/ui";

type Event = {
  time: string;
  title: string;
  tone?: "success" | "warning" | "danger" | "info";
};

export function Activity({ events }: { events: Event[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>North workspace · today</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea aria-label="Activity" fade style={{ height: "17rem" }}>
          <Timeline>
            {events.map((event) => (
              <TimelineItem
                key={event.time}
                time={event.time}
                title={event.title}
                tone={event.tone}
              />
            ))}
          </Timeline>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}`,
  examples: [
    {
      id: "height",
      title: "A list in a fixed height",
      description:
        "Give the region a height (or a `max-height`) and a name: it scrolls inside while the page stays where it is. While it overflows it is a tab stop with its own focus ring, so the arrow keys, Page Up, Page Down, Home and End scroll it. The scrollbar stays quiet until the pointer is over the region.",
      code: `<ScrollArea aria-label="Labels" style={{ height: "14rem" }}>
  <ul>
    {labels.map((label) => (
      <li key={label.name}>
        {label.name} <span>{label.count}</span>
      </li>
    ))}
  </ul>
</ScrollArea>`,
      render: () => <Labels name="Labels" />,
    },
    {
      id: "fade",
      title: "Fade where it goes on",
      description:
        "`fade` fades the edges that have more behind them, up to 2rem and only as far as there is more: the top does not fade until you scroll. It says there is more without a shadow or a line, on both axes.",
      code: `<ScrollArea aria-label="Labels" fade style={{ height: "14rem" }}>
  …
</ScrollArea>`,
      render: () => <Labels fade name="Labels, faded at the edges" />,
    },
    {
      id: "sideways",
      title: "Sideways",
      description:
        "A row that is wider than its place scrolls sideways: lay it out at its own width (`width: max-content`) and add `<ScrollBar orientation=\"horizontal\" />` inside. A wheel that turns over the bar moves it sideways; with `fade` the far end fades.",
      code: `<ScrollArea aria-label="Suggestions" fade>
  <div style={{ display: "flex", gap: 8, width: "max-content", paddingBlockEnd: 12 }}>
    {suggestions.map((text) => (
      <Button key={text} variant="outline" size="sm">{text}</Button>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`,
      render: () => (
        <ScrollArea aria-label="Suggestions" fade style={{ width: "min(100%, 24rem)" }}>
          <div style={{ display: "flex", gap: "var(--fui-space-2)", width: "max-content", paddingBlockEnd: "var(--fui-space-3)" }}>
            {SUGGESTIONS.map((text) => (
              <Button key={text} size="sm" variant="outline">
                {text}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ),
    },
    {
      id: "both",
      title: "Both ways",
      description:
        "Lines that must not wrap, like a log, scroll both ways: the region has a height, the content keeps its width, and both bars meet at a corner. A region that is the only way to reach its content needs its name.",
      code: `<ScrollArea aria-label="Sync log" style={{ height: "10rem" }}>
  <pre style={{ margin: 0, padding: 12, width: "max-content" }}>{lines.join("\\n")}</pre>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`,
      render: () => (
        <ScrollArea aria-label="Sync log" style={{ height: "10rem", width: "min(100%, 28rem)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)", background: "var(--fui-surface-inset)" }}>
          <pre style={{ ...mono, margin: 0, padding: "var(--fui-space-3)", width: "max-content", lineHeight: 1.7 }}>{LOG.join("\n")}</pre>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ),
    },
  ],
};
