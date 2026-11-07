import type { Meta, StoryObj } from "@storybook/react-vite";
import { GenerationFrame } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { generationExamples } from "../../apps/site/components/examples/generation-frame";

const description =
  "A picture being made: light ripples across a field of square dots inside the frame while the working light turns along its edge, a status counts, and the finished image arrives through the dither.";

const meta = {
  title: "Agents/Generation frame",
  component: GenerationFrame,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { status: "generating", progress: 0.42, alt: "A harbour at dusk", aspectRatio: 1 },
  argTypes: {
    status: { control: "inline-radio", options: ["queued", "generating", "done", "failed"] },
    progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    error: { control: false },
    caption: { control: "text" },
    startedAt: { control: false },
  },
} satisfies Meta<typeof GenerationFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={generationExamples} title="Generation frame" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <GenerationFrame {...args} />
    </div>
  ),
};
