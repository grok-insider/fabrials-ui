import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { badgeExamples } from "../../apps/site/components/examples/status";

const description =
  "A short status or fact as a soft tag: tinted by its tone, inked in it, with a round dot for a state that changes.";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { children: "Connected", tone: "success", variant: "soft", dot: true },
  argTypes: { tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] }, variant: { control: "inline-radio", options: ["soft", "outline", "solid"] }, dot: { control: "select", options: [false, true, "hollow"] } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={badgeExamples} title="Badge" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
