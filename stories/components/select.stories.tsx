import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "@fabrials/ui";
import { Label, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { selectExamples } from "../../apps/site/components/examples/forms";

const description =
  "A button that opens a short list of choices and shows the chosen one.";

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { defaultValue: "standard" },
  argTypes: {},
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={selectExamples} title="Select" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ display: "grid", gap: "0.5rem", maxWidth: "14rem" }}>
      <Label htmlFor="playground-density">Density</Label>
      <Select {...args} items={{ standard: "Standard", compact: "Compact" }}>
        <SelectTrigger id="playground-density">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="compact">Compact</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
