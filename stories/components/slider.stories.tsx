import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { sliderExamples } from "../../apps/site/components/examples/forms";

const description =
  "A value on a track: a sunken well, a Stormlight fill and a raised cap per thumb, with an optional ruler and reading.";

const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { "aria-label": "Batch size", defaultValue: 40, showValue: true, marks: [0, 25, 50, 75, 100] },
  argTypes: {},
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={sliderExamples} title="Slider" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "22rem" }}>
      <Slider {...args} />
    </div>
  ),
};
