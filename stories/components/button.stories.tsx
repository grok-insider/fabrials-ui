import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { buttonExamples } from "../../apps/site/components/examples/actions";

const description =
  "The action control. One primary action per task, in ink; Stormlight only when one action must stand out; quiet alternatives beside it.";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { children: "Save changes", variant: "default", size: "default", loading: false, disabled: false },
  argTypes: { variant: { control: "select", options: ["default", "accent", "outline", "secondary", "ghost", "destructive", "link"] }, size: { control: "inline-radio", options: ["xs", "sm", "default", "lg"] }, render: { control: false } },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={buttonExamples} title="Button" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
