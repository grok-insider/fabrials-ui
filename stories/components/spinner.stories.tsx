import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { spinnerExamples } from "../../apps/site/components/examples/status";

const description =
  "The busy mark: a ring of square cells lighting in turn, named for assistive technology and paired with words.";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Loading" },
  argTypes: {},
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={spinnerExamples} title="Spinner" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
