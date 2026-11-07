import type { Meta, StoryObj } from "@storybook/react-vite";
import { Meter } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { meterExamples } from "../../apps/site/components/examples/data";

const description =
  "Where a value sits in its range: a rounded track that turns to warning and danger at its thresholds, or a ruler of ticks.";

const meta = {
  title: "Components/Meter",
  component: Meter,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Weekly quota", value: 42, hint: "Resets Friday at 09:00", variant: "bar" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } }, variant: { control: "inline-radio", options: ["bar", "ruler"] }, tone: { control: "select", options: [undefined, "neutral", "info", "success", "warning", "danger"] } },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={meterExamples} title="Meter" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "24rem" }}>
      <Meter {...args} />
    </div>
  ),
};
