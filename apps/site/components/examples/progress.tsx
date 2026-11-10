"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemGroup,
  Progress,
  ProgressLabel,
  ProgressValue,
  SearchInput,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";
import { ReplayButton, useScript, type Frame } from "./replay";

const stack = { display: "grid", gap: "var(--fui-space-5)", width: "min(100%, 26rem)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;

type Mailbox = { name: string; value: number | null; hint: string; tone?: "success" };

const MAILBOXES: Mailbox[] = [
  { name: "North workspace", value: 62, hint: "Indexing headers · 1,204 of 1,940 messages · about 1 min left" },
  { name: "Relay staging", value: null, hint: "Counting messages · the total arrives with the first page" },
  { name: "Archive", value: 100, hint: "3,412 messages · synced 2 min ago", tone: "success" },
];

function Imports() {
  return (
    <Card style={{ width: "min(100%, 30rem)" }}>
      <CardHeader>
        <CardTitle>Importing mailboxes</CardTitle>
        <CardDescription>Each mailbox syncs in turn; you can keep working.</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {MAILBOXES.map((mailbox) => (
            <Item key={mailbox.name}>
              <ItemContent>
                <Progress hint={mailbox.hint} label={mailbox.name} tone={mailbox.tone} value={mailbox.value} />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

type Job = { done: number; total: number | null };

const IMPORT: readonly Frame<Job>[] = [
  { at: 0, state: { done: 0, total: null } },
  { at: 2200, state: { done: 180, total: 1940 } },
  { at: 2900, state: { done: 610, total: 1940 } },
  { at: 3600, state: { done: 1204, total: 1940 } },
  { at: 4300, state: { done: 1690, total: 1940 } },
  { at: 5000, state: { done: 1940, total: 1940 } },
];

function ImportDemo() {
  const { state, replay } = useScript(IMPORT);
  const done = state.total !== null && state.done === state.total;
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 26rem)", justifyItems: "start" }}>
      <Progress
        hint={state.total === null ? "Counting messages" : `${state.done.toLocaleString("en")} of ${state.total.toLocaleString("en")} messages`}
        label={done ? "Imported" : "Importing"}
        max={state.total ?? undefined}
        style={{ width: "100%" }}
        tone={done ? "success" : "neutral"}
        value={state.total === null ? null : state.done}
      />
      <ReplayButton onClick={replay} />
    </div>
  );
}

type Search = { searching: boolean; results: string[] };

const SEARCH: readonly Frame<Search>[] = [
  { at: 0, state: { searching: true, results: [] } },
  { at: 2400, state: { searching: false, results: ["Rotate a virtual key", "Key budgets and limits", "Revoking a key"] } },
];

function SearchDemo() {
  const { state, replay } = useScript(SEARCH);
  return (
    <div style={stack}>
      <div style={{ display: "grid", gap: "var(--fui-space-1-5)" }}>
        <SearchInput aria-label="Search the docs" defaultValue="virtual keys" />
        {state.searching ? <Progress aria-label="Searching the docs" size="sm" variant="scan" /> : null}
      </div>
      {state.results.length ? (
        <ItemGroup>
          {state.results.map((result) => (
            <Item key={result}>
              <ItemContent>{result}</ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
      <div style={row}>
        <ReplayButton label="Search again" onClick={replay} />
      </div>
    </div>
  );
}

const STEPS = ["Account", "Workspace", "Billing", "Invite your team"];

const PARTS = [
  { label: "Warm-up", state: "done", weight: 1 },
  { label: "Listening", state: "done", weight: 2 },
  { label: "Reading", state: "current", weight: 2 },
  { label: "Writing", state: "todo", weight: 1 },
  { label: "Speaking", state: "todo", weight: 1 },
] as const;

const QUIZ = [
  { label: "Where is the harbour?", state: "correct" },
  { label: "Who wrote the note?", state: "correct" },
  { label: "What comes after six?", state: "incorrect" },
  { label: "How do you greet someone?", state: "skipped" },
  { label: "What does a ferry carry?", state: "current" },
] as const;

const QUESTIONS = ["Where is the harbour?", "Who wrote the note?", "What comes after six?", "How do you greet someone?", "What does a ferry carry?"];

function SegmentsDemo() {
  const [current, setCurrent] = useState(2);
  return (
    <div style={stack}>
      <Progress hint="Reading, from 6:10 to 8:00" label="Thursday's session" segments={PARTS} />
      <Progress hint="Four questions answered, one missed" label="Quiz" segments={QUIZ} />
      <Progress
        hint={QUESTIONS[current]}
        label="Questions"
        onSegmentSelect={setCurrent}
        segments={QUESTIONS.map((label, index) => ({ label, state: index < current ? "done" : index === current ? "current" : "todo" }))}
      />
      <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>
        Question {current + 1} of {QUESTIONS.length}: the parts are keys now, one tab stop, the arrow keys between them.
      </p>
    </div>
  );
}

function MarksDemo() {
  return (
    <div style={stack}>
      <Progress
        hint="38 of 60 minutes, a trial test"
        label="Time per test"
        marks={[
          { caption: true, label: "A1 ends here", value: 15 },
          { caption: true, label: "A2", value: 30 },
          { caption: true, label: "B1", value: 45 },
        ]}
        max={60}
        value={38}
      />
      <Progress hint="A mark with no caption is only spoken" label="Reading" marks={[{ label: "The shortest test ends here", value: 26 }]} max={60} value={26} />
    </div>
  );
}


function StepsDemo() {
  const [step, setStep] = useState(2);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-5)", width: "min(100%, 26rem)" }}>
      <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
        <Progress hint={STEPS[step - 1]} label={`Step ${step} of ${STEPS.length}`} max={STEPS.length} showValue={false} steps={STEPS.length} value={step} />
        <div style={row}>
          <Button disabled={step === 1} onClick={() => setStep(step - 1)} size="sm" variant="secondary">
            Back
          </Button>
          <Button disabled={step === STEPS.length} onClick={() => setStep(step + 1)} size="sm">
            Next
          </Button>
        </div>
      </div>
      <Progress hint="3 of 8 files" label="Uploading" max={8} showValue={false} size="sm" steps={8} value={3} />
    </div>
  );
}

export const progressExamples: ExampleSet = {
  preview: () => <Imports />,
  previewCode: `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Item,
  ItemContent,
  ItemGroup,
  Progress,
} from "@fabrials/ui";

type Mailbox = {
  name: string;
  value: number | null;
  hint: string;
  tone?: "success";
};

export function Imports({ mailboxes }: { mailboxes: Mailbox[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Importing mailboxes</CardTitle>
        <CardDescription>
          Each mailbox syncs in turn; you can keep working.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {mailboxes.map((mailbox) => (
            <Item key={mailbox.name}>
              <ItemContent>
                <Progress
                  label={mailbox.name}
                  value={mailbox.value}
                  tone={mailbox.tone}
                  hint={mailbox.hint}
                />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}`,
  examples: [
    {
      id: "label",
      title: "Label, value and hint",
      description:
        "`label` names the bar and puts the value at the end of its row, a percentage of `max` (100 unless you say otherwise); `hint` is the line under it: counts, the time left. Assistive technology hears the label, the value and the hint. A bar with no words beside it takes an `aria-label`.",
      code: `<Progress label="Indexing headers" value={62} hint="1,204 of 1,940 messages · about 1 min left" />
<Progress aria-label="Weekly export" value={0.4} max={1} />`,
      render: () => (
        <div style={stack}>
          <Progress hint="1,204 of 1,940 messages · about 1 min left" label="Indexing headers" value={62} />
          <Progress aria-label="Weekly export" max={1} value={0.4} />
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      description:
        "`size=\"sm\"` (4 px) fits a row in a list, the default (6 px) a card, `size=\"lg\"` (8 px) the one task a page is about. The label row follows the size.",
      code: `<Progress size="sm" label="report-q3.pdf" value={30} />
<Progress label="Weekly export" value={55} />
<Progress size="lg" label="Moving 12,408 messages" value={80} hint="About 4 min left" />`,
      render: () => (
        <div style={stack}>
          <Progress label="report-q3.pdf" size="sm" value={30} />
          <Progress label="Weekly export" value={55} />
          <Progress hint="About 4 min left" label="Moving 12,408 messages" size="lg" value={80} />
        </div>
      ),
    },
    {
      id: "outcomes",
      title: "How it ended",
      description:
        "`tone` repeats what the words say: `success` when it is done, `warning` when it is slow, `danger` when it failed. A task that failed keeps its bar where it stopped, and the hint says what to do next.",
      code: `<Progress label="Archive" tone="success" value={100} hint="3,412 messages · synced 2 min ago" />
<Progress label="Relay staging" tone="warning" value={33} hint="Slow: the server asked us to wait 30 s" />
<Progress label="Harbour lab" tone="danger" value={48} hint="Stopped at 48%: update the password and try again" />`,
      render: () => (
        <div style={stack}>
          <Progress hint="3,412 messages · synced 2 min ago" label="Archive" tone="success" value={100} />
          <Progress hint="Slow: the server asked us to wait 30 s" label="Relay staging" tone="warning" value={33} />
          <Progress hint="Stopped at 48%: update the password and try again" label="Harbour lab" tone="danger" value={48} />
        </div>
      ),
    },
    {
      id: "unknown",
      title: "Before the total is known",
      description:
        "Leave `value` out, or pass `null`, while the total is not known yet: the working light crosses the track instead of an invented percentage, and under reduced motion it holds still as a dashed line. When the total arrives the bar fills, and it eases to each new value. Work that will never have a total takes a `Spinner`.",
      code: `<Progress
  label={done ? "Imported" : "Importing"}
  value={job.total === null ? null : job.done}
  max={job.total ?? undefined}
  tone={done ? "success" : "neutral"}
  hint={job.total === null ? "Counting messages" : \`\${job.done} of \${job.total} messages\`}
/>`,
      render: () => <ImportDemo />,
    },
    {
      id: "scan",
      title: "A search",
      description:
        "`variant=\"scan\"` turns the track into square cells where a head of the working light hops across with a trail, for a search whose results have not arrived: under a search field, above a list that is filling. It runs in reading order, rests a third of the way under reduced motion, and becomes a bar if a value arrives. Name it with an `aria-label`.",
      code: `<SearchInput aria-label="Search the docs" value={query} onValueChange={setQuery} />
{searching ? <Progress aria-label="Searching the docs" size="sm" variant="scan" /> : null}`,
      render: () => <SearchDemo />,
      align: "start",
    },
    {
      id: "steps",
      title: "Steps",
      description:
        "`steps` cuts the bar into that many segments, for a task made of known steps: a form in steps, the files of a batch. The segments ink in order, and a value between two steps fills part of one. Say the step in words as well.",
      code: `<Progress
  label={\`Step \${step} of 4\`}
  value={step}
  max={4}
  steps={4}
  showValue={false}
  hint={steps[step - 1]}
/>
<Progress size="sm" label="Uploading" value={3} max={8} steps={8} showValue={false} hint="3 of 8 files" />`,
      render: () => <StepsDemo />,
    },
    {
      id: "ring",
      title: "A ring",
      description:
        "`variant=\"ring\"` is a circle that closes clockwise, with its label and hint beside it, for a small place: a file in a list, a card's corner. It is 16, 24 or 48 px (`sm`, the default, `lg`); at `lg` the value sits inside. Without a value the light turns round it.",
      code: `<Progress variant="ring" size="sm" label="report-q3.pdf" value={40} />
<Progress variant="ring" label="Uploading 3 files" value={40} hint="2.4 of 6 MB · about 20 s left" />
<Progress variant="ring" size="lg" label="Profile" value={60} hint="Add a photo and a time zone to finish" />
<Progress variant="ring" label="Preparing" hint="Checking the files" />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-4)", justifyItems: "start" }}>
          <Progress label="report-q3.pdf" size="sm" value={40} variant="ring" />
          <Progress hint="2.4 of 6 MB · about 20 s left" label="Uploading 3 files" value={40} variant="ring" />
          <Progress hint="Add a photo and a time zone to finish" label="Profile" size="lg" value={60} variant="ring" />
          <Progress hint="Checking the files" label="Preparing" variant="ring" />
        </div>
      ),
      align: "start",
    },
    {
      id: "parts",
      title: "Counts, with shadcn's parts",
      description:
        "Progress composes the way shadcn's does: put `ProgressLabel` and `ProgressValue` inside it and it draws the track after them. A function child of `ProgressValue` writes the value itself, here a count instead of a percentage, and `getAriaValueText` says the same to assistive technology. For units, `format` takes `Intl.NumberFormat` options; `locale` the page's language.",
      code: `<Progress value={1204} max={3000} getAriaValueText={(_, value) => \`\${value} of 3,000 messages\`}>
  <ProgressLabel>Importing</ProgressLabel>
  <ProgressValue>{(_, value) => \`\${value?.toLocaleString("en")} of 3,000\`}</ProgressValue>
</Progress>`,
      render: () => (
        <div style={stack}>
          <Progress getAriaValueText={(_, value) => `${value} of 3,000 messages`} max={3000} value={1204}>
            <ProgressLabel>Importing</ProgressLabel>
            <ProgressValue>{(_, value) => `${value?.toLocaleString("en")} of 3,000`}</ProgressValue>
          </Progress>
        </div>
      ),
    },
    {
      id: "segments",
      title: "A track of named parts",
      description:
        "`segments` draws a plan as its parts: each is as wide as its `weight` and in its own state, `done`, `current` or `todo`, so the bar says where a session stands. With `onSegmentSelect` every part is a key: the parts become one toolbar, the arrow keys move between them, and a press says which one. A quiz uses the other ladder, `correct`, `incorrect` and `skipped`.",
      code: `<Progress
  label="Thursday's session"
  segments={[
    { label: "Warm-up", state: "done", weight: 1 },
    { label: "Listening", state: "done", weight: 2 },
    { label: "Reading", state: "current", weight: 2 },
    { label: "Writing", state: "todo", weight: 1 },
  ]}
  hint="Reading, from 6:10 to 8:00"
/>
<Progress label="Questions" segments={questions} onSegmentSelect={setCurrent} hint={questions[current].label} />`,
      render: () => <SegmentsDemo />,
      align: "start",
    },
    {
      id: "marks",
      title: "Marks on the track",
      description:
        "`marks` puts ticks on an ordinary bar at their `value`, each with a `label` that is part of the bar's description and, with `caption`, a line under the tick. A right-to-left page mirrors them.",
      code: `<Progress
  label="Time per test"
  value={38}
  max={60}
  hint="38 of 60 minutes, a trial test"
  marks={[
    { value: 15, label: "A1 ends here", caption: true },
    { value: 30, label: "A2", caption: true },
    { value: 45, label: "B1", caption: true },
  ]}
/>`,
      render: () => <MarksDemo />,
      align: "start",
    },
  ],
};
