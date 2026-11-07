import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMeter } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { contextMeterExamples } from "../../apps/site/components/examples/context-meter";

const description =
  "How full an agent's context window is: a stacked bar of what fills it, a legend and a reading that turns to warning and danger as the window fills. One meter for assistive technology.";

const meta = {
  title: "Agents/Context meter",
  component: ContextMeter,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    limit: 200_000,
    parts: [
      { label: "System prompt", value: 3_200 },
      { label: "Tools", value: 11_800 },
      { label: "Files", value: 18_400 },
      { label: "Conversation", value: 8_700 },
    ],
  },
  argTypes: {
    warnAt: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    dangerAt: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    format: { control: false },
  },
} satisfies Meta<typeof ContextMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={contextMeterExamples} title="Context meter" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <ContextMeter {...args} />
    </div>
  ),
};
