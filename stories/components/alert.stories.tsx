import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "@fabrials/ui";
import { AlertDescription, AlertTitle } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { alertExamples } from "../../apps/site/components/examples/status";

const description =
  "A message about the page in a tinted plate: what happened and what to do, with the icon in the tone's ink.";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { variant: "warning" },
  argTypes: { variant: { control: "select", options: ["default", "info", "success", "warning", "destructive"] }, layout: { control: "inline-radio", options: ["stacked", "inline"] } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={alertExamples} title="Alert" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Alert {...args} style={{ maxWidth: "34rem" }}>
      <AlertTitle>Observation is 3 hours old</AlertTitle>
      <AlertDescription>The relay has not reported since 11:42.</AlertDescription>
    </Alert>
  ),
};
