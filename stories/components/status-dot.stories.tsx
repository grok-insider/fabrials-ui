import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusDot } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { statusDotExamples } from "../../apps/site/components/examples/status";

const description =
  "A round light with a halo in its tone and the words that say the state, which are always there for assistive technology.";

const meta = {
  title: "Components/Status dot",
  component: StatusDot,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Relay online", tone: "success", pulse: false, hideLabel: false },
  argTypes: { tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] } },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={statusDotExamples} title="Status dot" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
