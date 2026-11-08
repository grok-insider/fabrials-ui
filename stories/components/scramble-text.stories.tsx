import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrambleText } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { scrambleTextExamples } from "../../apps/site/components/examples/text";

const description =
  "Text that scrambles into place when it changes, like a reading on an instrument: only on change, never looping, holding its width.";

const meta = {
  title: "Components/Scramble text",
  component: ScrambleText,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { children: "Reading the schema", duration: 320 },
  argTypes: { children: { control: "select", options: ["Reading the schema", "Comparing the two migrations", "Drafting the change"] } },
} satisfies Meta<typeof ScrambleText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={scrambleTextExamples} title="Scramble text" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
