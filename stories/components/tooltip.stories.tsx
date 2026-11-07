import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "@fabrials/ui";
import { Button, TooltipContent, TooltipTrigger } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { tooltipExamples } from "../../apps/site/components/examples/structure";

const description =
  "A short line that repeats what a control is for, on hover and on keyboard focus; never the only place a name lives.";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {},
  argTypes: {},
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={tooltipExamples} title="Tooltip" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger render={<Button variant="outline" />}>Refresh</TooltipTrigger>
      <TooltipContent>Refresh the records</TooltipContent>
    </Tooltip>
  ),
};
