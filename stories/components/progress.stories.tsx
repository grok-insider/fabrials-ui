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
