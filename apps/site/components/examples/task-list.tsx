"use client";

import { TaskList, type TaskItem } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { ReplayButton, useScript, type Frame } from "./replay";

const PLAN: TaskItem[] = [
  { id: "read", title: "Read the billing schema", status: "pending" },
  { id: "plan", title: "Plan the copy in batches", status: "pending" },
  { id: "copy", title: "Copy 48,210 invoices", status: "pending" },
  { id: "verify", title: "Compare the row counts", status: "pending" },
  { id: "switch", title: "Switch reads to the new table", status: "pending" },
];

function step(statuses: TaskItem["status"][], extra: Partial<Record<string, Partial<TaskItem>>> = {}, count = PLAN.length): TaskItem[] {
  return PLAN.slice(0, count).map((task, index) => ({ ...task, status: statuses[index] ?? "pending", ...extra[task.id] }));
}

const FRAMES: Frame<TaskItem[]>[] = [
  { at: 0, state: step(["running"], {}, 1) },
  { at: 900, state: step(["done", "running"], { read: { meta: "0.9s" } }, 3) },
  { at: 1900, state: step(["done", "done", "running"], { read: { meta: "0.9s" }, plan: { meta: "12 batches" } }, 5) },
  {
    at: 3600,
    state: step(["done", "done", "done", "running"], {
      read: { meta: "0.9s" },
      plan: { meta: "12 batches" },
      copy: { meta: "1m 42s", detail: "48,210 rows in 12 batches of 4,018" },
    }),
  },
  {
    at: 4700,
    state: step(["done", "done", "done", "done", "running"], {
      read: { meta: "0.9s" },
      plan: { meta: "12 batches" },
      copy: { meta: "1m 42s", detail: "48,210 rows in 12 batches of 4,018" },
      verify: { meta: "match" },
    }),
  },
  {
    at: 5800,
    state: step(["done", "done", "done", "done", "done"], {
      read: { meta: "0.9s" },
      plan: { meta: "12 batches" },
      copy: { meta: "1m 42s", detail: "48,210 rows in 12 batches of 4,018" },
      verify: { meta: "match" },
      switch: { meta: "0.3s" },
    }),
  },
];

function LivePlan() {
  const { state, replay, done } = useScript(FRAMES);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 30rem)" }}>
      <TaskList tasks={state} title="Move invoices to the new schema" />
      {done ? (
        <div>
          <ReplayButton onClick={replay} />
        </div>
      ) : null}
    </div>
  );
}

export const taskListExamples: ExampleSet = {
  preview: () => <LivePlan />,
  previewCode: `import { TaskList, type TaskItem } from "@fabrials/ai-ui";

// The steps come from the agent's run and change as it works;
// this is the plan once it has finished.
const steps: TaskItem[] = [
  {
    id: "read",
    title: "Read the billing schema",
    status: "done",
    meta: "0.9s",
  },
  {
    id: "plan",
    title: "Plan the copy in batches",
    status: "done",
    meta: "12 batches",
  },
  {
    id: "copy",
    title: "Copy 48,210 invoices",
    status: "done",
    detail: "48,210 rows in 12 batches of 4,018",
    meta: "1m 42s",
  },
  {
    id: "verify",
    title: "Compare the row counts",
    status: "done",
    meta: "match",
  },
  {
    id: "switch",
    title: "Switch reads to the new table",
    status: "done",
    meta: "0.3s",
  },
];

export function MigrationPlan() {
  return <TaskList title="Move invoices to the new schema" tasks={steps} />;
}`,
  examples: [
    {
      id: "title",
      title: "A plan with a title",
      description:
        "With `title`, the header counts the settled steps and draws a bar with one segment per step, so the shape of the plan reads before its words. Steps that arrive after the list is shown rise into place; the ones present at first paint do not move.",
      code: `<TaskList
  title="Move invoices to the new schema"
  tasks={[
    { id: "read", title: "Read the billing schema", status: "done" },
    { id: "copy", title: "Copy 48,210 invoices", status: "running" },
    { id: "verify", title: "Compare the row counts", status: "pending" },
  ]}
/>`,
      render: () => (
        <TaskList
          style={{ width: "min(100%, 28rem)" }}
          tasks={[
            { id: "read", title: "Read the billing schema", status: "done" },
            { id: "copy", title: "Copy 48,210 invoices", status: "running" },
            { id: "verify", title: "Compare the row counts", status: "pending" },
          ]}
          title="Move invoices to the new schema"
        />
      ),
    },
    {
      id: "states",
      title: "Every state",
      description:
        "`status` is `pending`, `running`, `done`, `failed` or `skipped`. Each is said in words to assistive technology; the running step is `aria-current=\"step\"` and carries the working light, a done step draws its tick, and a polite status announces the step that starts or fails.",
      code: `{ id: "a", title: "Lint the package", status: "done" }
{ id: "b", title: "Run the unit tests", status: "running" }
{ id: "c", title: "Upload the coverage", status: "failed" }
{ id: "d", title: "Update the changelog", status: "skipped" }
{ id: "e", title: "Tag the release", status: "pending" }`,
      render: () => (
        <TaskList
          label="Release checks"
          style={{ width: "min(100%, 28rem)" }}
          tasks={[
            { id: "a", title: "Lint the package", status: "done" },
            { id: "b", title: "Run the unit tests", status: "running" },
            { id: "c", title: "Upload the coverage", status: "failed" },
            { id: "d", title: "Update the changelog", status: "skipped" },
            { id: "e", title: "Tag the release", status: "pending" },
          ]}
        />
      ),
    },
    {
      id: "detail",
      title: "Details and readings",
      description:
        "`detail` is a second line (what was found, why it failed, the file it touched) and `meta` a short reading at the end of the row, set in the label voice.",
      code: `{
  id: "copy",
  title: "Copy 48,210 invoices",
  status: "done",
  detail: "12 batches of 4,018 rows",
  meta: "1m 42s",
}`,
      render: () => (
        <TaskList
          label="Copy"
          style={{ width: "min(100%, 28rem)" }}
          tasks={[
            { id: "copy", title: "Copy 48,210 invoices", status: "done", detail: "12 batches of 4,018 rows", meta: "1m 42s" },
            { id: "verify", title: "Compare the row counts", status: "failed", detail: "3 rows missing in batch 7. Run the batch again.", meta: "7 of 12" },
          ]}
        />
      ),
    },
    {
      id: "labels",
      title: "In the reader's language",
      description:
        "`labels` replaces the words for each state, the count and the closing summary. Without a `title`, `label` names the list.",
      code: `<TaskList
  label="Pasos"
  tasks={tasks}
  labels={{
    pending: "Pendiente",
    running: "En curso",
    done: "Hecho",
    failed: "Falló",
    skipped: "Omitido",
    progress: (done, total) => \`\${done} de \${total}\`,
    complete: (total) => \`Los \${total} pasos terminaron\`,
  }}
/>`,
      render: () => (
        <TaskList
          label="Pasos"
          labels={{
            pending: "Pendiente",
            running: "En curso",
            done: "Hecho",
            failed: "Falló",
            skipped: "Omitido",
            progress: (settled, total) => `${settled} de ${total}`,
            complete: (total) => `Los ${total} pasos terminaron`,
          }}
          style={{ width: "min(100%, 28rem)" }}
          tasks={[
            { id: "a", title: "Leer el esquema", status: "done" },
            { id: "b", title: "Copiar las facturas", status: "running" },
          ]}
          title="Mover las facturas"
        />
      ),
    },
  ],
};
