import type { Meta, StoryObj } from "@storybook/react-vite";
import { AgentThinking } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { agentThinkingExamples } from "../../apps/site/components/examples/agent-thinking";

const description =
  "The line that says an agent is working on a reply: a mark in square cells that moves its own way for each kind of work, a label crossed by the working light and the time it has taken. When the work ends it settles on a tick or a cross. A polite status: the label is read out when it changes, the ticking time is not.";

const meta = {
  title: "Agents/Agent thinking",
  component: AgentThinking,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { activity: "thinking", status: "working", tone: "light", shimmer: true, timer: true },
  argTypes: {
    activity: { control: "select", options: ["thinking", "searching", "reading", "writing", "running", "rendering", "uploading"] },
    status: { control: "inline-radio", options: ["working", "done", "failed"] },
    variant: { control: "select", options: [undefined, "wave", "orbit", "dither", "scan", "lines", "type", "raster", "fill"] },
    tone: { control: "inline-radio", options: ["light", "ink"] },
    startedAt: { control: false },
    endedAt: { control: false },
  },
} satisfies Meta<typeof AgentThinking>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={agentThinkingExamples} title="Agent thinking" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
