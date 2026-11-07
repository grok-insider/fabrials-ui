import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "@fabrials/ui";
import { Label, Radio } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { radioGroupExamples } from "../../apps/site/components/examples/forms";

const description =
  "One of several choices, all in view, moved through with the arrows.";

const meta = {
  title: "Components/Radio group",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { defaultValue: "balanced", "aria-label": "Routing mode" },
  argTypes: {},
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={radioGroupExamples} title="Radio group" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <RadioGroup {...args}>
      <Label className="fui-choice">
        <Radio value="balanced" /> Balanced across accounts
      </Label>
      <Label className="fui-choice">
        <Radio value="drain" /> Drain one account at a time
      </Label>
    </RadioGroup>
  ),
};
