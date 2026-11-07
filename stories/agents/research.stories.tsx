import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchStepsDisclosure } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { activityExamples } from "../../apps/site/components/examples/activity";

const description =
  "Where an agent's work went: its reasoning, the searches it ran and the pages it read, as rows that open. While live, the label carries the working light and the time counts; steps that arrive rise into place.";

const meta = {
  title: "Agents/Research and reasoning",
  component: SearchStepsDisclosure,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    phase: "done",
    sourceCount: 3,
    defaultOpen: true,
    steps: [
      { type: "search", query: "pg_repack locks during swap", sources: ["https://reorg.github.io/pg_repack/", "https://github.com/reorg/pg_repack/issues"] },
      { type: "open_page", url: "https://www.postgresql.org/docs/current/explicit-locking.html", title: "Explicit locking" },
    ],
  },
  argTypes: { phase: { control: "inline-radio", options: ["searching", "reading", "done"] } },
} satisfies Meta<typeof SearchStepsDisclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={activityExamples} title="Research and reasoning" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <SearchStepsDisclosure {...args} />
    </div>
  ),
};
