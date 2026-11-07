import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "@fabrials/ui";
import { Input } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { fieldExamples } from "../../apps/site/components/examples/forms";

const description =
  "A control with its label, its hint and its error, connected for assistive technology.";

const meta = {
  title: "Components/Field",
  component: Field,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Account alias", description: "Shown in the account list.", error: "", children: () => null },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={fieldExamples} title="Field" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "22rem" }}>
      <Field {...args} error={args.error || undefined}>
        {(props) => <Input {...props} placeholder="Engineering" />}
      </Field>
    </div>
  ),
};
