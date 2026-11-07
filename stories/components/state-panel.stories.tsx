import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatePanel } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { statePanelExamples } from "../../apps/site/components/examples/status";

const description =
  "Empty, loading, error, stale, offline and done, each with its icon, its role and the next step, on a soft surface.";

const meta = {
  title: "Components/State panel",
  component: StatePanel,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { state: "empty", title: "No folders yet", description: "Create one to sort your mail.", align: "start", size: "md", variant: "panel" },
  argTypes: { state: { control: "select", options: ["empty", "loading", "error", "stale", "offline", "success"] }, align: { control: "inline-radio", options: ["start", "center"] }, size: { control: "inline-radio", options: ["md", "sm"] }, variant: { control: "inline-radio", options: ["panel", "inline"] }, actions: { control: false }, icon: { control: false } },
} satisfies Meta<typeof StatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={statePanelExamples} title="State panel" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "34rem" }}>
      <StatePanel {...args} />
    </div>
  ),
};
