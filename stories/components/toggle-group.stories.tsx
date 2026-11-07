import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleGroup } from "@fabrials/ui";
import { ToggleGroupItem } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { toggleGroupExamples } from "../../apps/site/components/examples/actions";

const description =
  "A segmented choice: the group sits in a well, the chosen segment is raised, and the indicator slides to a new choice.";

const meta = {
  title: "Components/Toggle group",
  component: ToggleGroup,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { size: "default", defaultValue: ["7d"], "aria-label": "Range" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "default", "lg"] } },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={toggleGroupExamples} title="Toggle group" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
      <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
      <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
    </ToggleGroup>
  ),
};
