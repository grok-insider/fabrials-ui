import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { kbdExamples } from "../../apps/site/components/examples/actions";

const description =
  "Keys as keycaps in mono, alone or as a combination; the modifier key reads ⌘ on Apple systems and Ctrl elsewhere.";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { children: "K" },
  argTypes: {},
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={kbdExamples} title="Kbd" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
