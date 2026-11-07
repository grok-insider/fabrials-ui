import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@fabrials/ui";
import { Label } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { checkboxExamples } from "../../apps/site/components/examples/forms";

const description =
  "A choice that is on or off, ticked in Stormlight, with its words inside its label.";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { defaultChecked: true, indeterminate: false, disabled: false },
  argTypes: {},
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={checkboxExamples} title="Checkbox" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Label className="fui-choice">
      <Checkbox {...args} /> Include archived records
    </Label>
  ),
};
