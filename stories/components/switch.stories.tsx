import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@fabrials/ui";
import { Label } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { switchExamples } from "../../apps/site/components/examples/forms";

const description =
  "A setting that applies at once: a sunken track that fills with Stormlight, and a thumb that springs across.";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { defaultChecked: true, disabled: false },
  argTypes: {},
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={switchExamples} title="Switch" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Label className="fui-choice">
      <Switch {...args} /> Quota resets
    </Label>
  ),
};
