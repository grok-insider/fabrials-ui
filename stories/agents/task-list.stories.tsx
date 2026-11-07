import type { Meta, StoryObj } from "@storybook/react-vite";
import { TaskList } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { taskListExamples } from "../../apps/site/components/examples/task-list";

const description =
  "The steps of an agent's plan as they are worked through: a mark per step, a rail between them, the running step in the working light, a tick drawn when a step settles, and a header that counts.";

const meta = {
  title: "Agents/Task list",
  component: TaskList,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    title: "Move invoices to the new schema",
    tasks: [
      { id: "read", title: "Read the billing schema", status: "done", meta: "0.9s" },
      { id: "copy", title: "Copy 48,210 invoices", status: "running", detail: "Batch 7 of 12" },
      { id: "verify", title: "Compare the row counts", status: "pending" },
      { id: "switch", title: "Switch reads to the new table", status: "pending" },
    ],
  },
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={taskListExamples} title="Task list" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <TaskList {...args} style={{ maxWidth: "28rem" }} />,
};
