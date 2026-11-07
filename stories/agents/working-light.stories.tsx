import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkingLight } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { workingLightExamples } from "../../apps/site/components/examples/context-meter";

const description =
  "The one light in the system besides the dither: a band that turns along the edge of what an agent is working on, with a soft bloom outside it. It shows only while the work lasts, holds still under reduced motion and steps aside in forced colors.";

const meta = {
  title: "Agents/Working light",
  component: WorkingLight,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
} satisfies Meta<typeof WorkingLight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={workingLightExamples} title="Working light" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ position: "relative", maxWidth: "20rem", padding: "2rem", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", background: "var(--card)" }}>
      Summarising 14 messages
      <WorkingLight {...args} />
    </div>
  ),
};
