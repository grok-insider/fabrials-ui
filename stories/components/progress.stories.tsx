import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { progressExamples } from "../../apps/site/components/examples/progress";

const description =
  "How far a task has gone: a bar or a ring with its label, value and hint, cut into steps when the task has them, and carrying the working light while the total is not known yet.";

const meta = {
  title: "Components/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Indexing headers", value: 62, hint: "1,204 of 1,940 messages · about 1 min left", variant: "bar", size: "default", tone: "neutral" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    variant: { control: "inline-radio", options: ["bar", "ring"] },
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
    steps: { control: { type: "number", min: 0, max: 24 } },
    showValue: { control: "boolean" },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={progressExamples} title="Progress" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "26rem" }}>
      <Progress {...args} />
    </div>
  ),
};

export const UnknownTotal: Story = {
  name: "Total not known yet",
  parameters: { layout: "padded" },
  args: { value: null, label: "Counting messages", hint: "The total arrives with the first page" },
  render: (args) => (
    <div style={{ maxWidth: "26rem" }}>
      <Progress {...args} />
    </div>
  ),
};

const SESSION = [
  { id: "warm", label: "Warm-up", weight: 2, state: "done" },
  { id: "new", label: "New words", weight: 5, state: "done" },
  { id: "listen", label: "Listening", weight: 4, state: "current" },
  { id: "speak", label: "Speaking", weight: 3 },
  { id: "review", label: "Review", weight: 6 },
] as const;

/** A session in segments: a block for each part of the plan, as wide as the minutes it takes, the current one standing taller. */
export const Segments: Story = {
  name: "Segments",
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--fui-space-6)", maxWidth: "32rem" }}>
      <Progress hint="About 12 minutes left." label="Today's session" segments={SESSION} />
      <Progress aria-label="A short session" segments={SESSION.slice(0, 3)} size="sm" />
      <Progress aria-label="A finished session" segments={SESSION.map((segment) => ({ ...segment, state: "done" as const }))} size="lg" />
    </div>
  ),
};

/** The questions of a quiz: each one a button that opens it, with the state it ended in. Arrow keys move, Home and End reach the ends. */
export const SegmentButtons: Story = {
  name: "Segments that open a step",
  parameters: { layout: "padded" },
  render: () => {
    function Quiz() {
      const [picked, setPicked] = useState<string | null>(null);
      return (
        <div style={{ display: "grid", gap: "var(--fui-space-3)", maxWidth: "32rem" }}>
          <Progress
            hint="Go back to any question."
            label="Questions"
            onSegmentSelect={(index) => setPicked(["One", "Two", "Three", "Four", "Five", "Six"][index] ?? null)}
            segments={[
              { id: "q1", label: "Question 1", state: "correct" },
              { id: "q2", label: "Question 2", state: "incorrect" },
              { id: "q3", label: "Question 3", state: "skipped" },
              { id: "q4", label: "Question 4", state: "current" },
              { id: "q5", label: "Question 5" },
              { id: "q6", label: "Question 6" },
            ]}
          />
          <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>Opened: {picked ?? "none"}</p>
        </div>
      );
    }
    return <Quiz />;
  },
};

/** Marks on the track: where a test may end, where it usually ends. The one with `caption` shows its words under the bar. */
export const Marks: Story = {
  name: "Marks on the track",
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--fui-space-6)", maxWidth: "32rem" }}>
      <Progress
        hint="The test stops when it is sure, between 10 and 25 questions."
        label="Placement test"
        marks={[
          { value: 10, label: "The shortest test ends here", caption: true },
          { value: 20, label: "Most tests are over by here" },
        ]}
        max={25}
        showValue={false}
        value={6}
      />
      <Progress aria-label="Storage" marks={[{ value: 80, label: "The warning begins here", caption: true }]} size="lg" value={62} />
    </div>
  ),
};
