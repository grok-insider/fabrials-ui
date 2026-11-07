import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { statExamples } from "../../apps/site/components/examples/data";

const description =
  "A figure with its label in the label voice, its change with a sign and an arrow, a hint, and optionally a ruler or a sparkline.";

const meta = {
  title: "Components/Stat",
  component: Stat,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Requests", value: "48,210", delta: "+3.1%", trend: "up", hint: "vs last 7 days" },
  argTypes: { trend: { control: "inline-radio", options: ["up", "down", "flat"] }, deltaTone: { control: "inline-radio", options: ["positive", "negative", "neutral"] } },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={statExamples} title="Stat" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <Stat {...args} style={{ maxWidth: "16rem" }} />,
};
