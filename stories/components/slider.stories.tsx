import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider, SliderGroup } from "@fabrials/ui";
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

/**
 * A slider as a row — its name, the track, then the value and its unit — a step that decides the decimals, a disabled row,
 * and a group whose names and values line up.
 */
export const Rows: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gap: "var(--fui-space-5)", maxWidth: "34rem" }}>
      <Slider defaultValue={40} label="Batch size" marks={[0, 50, 100]} max={100} min={0} step={5} unit="rows" />
      <Slider defaultValue={0.35} label="Opacity" max={1} min={0} step={0.05} />
      <Slider defaultValue={120} label="Timeout" max={600} min={0} step={10} unit="ms" />
      <Slider defaultValue={60} disabled label="Rate limit" max={600} min={0} unit="rpm" />
      <SliderGroup>
        <Slider defaultValue={12} label="Rows" max={48} min={4} onValueCommitted={() => undefined} unit="rows" />
        <Slider defaultValue={4} label="Columns" max={12} min={1} unit="cols" />
        <Slider defaultValue={8} label="Gutter" max={32} min={0} step={2} unit="px" />
      </SliderGroup>
      <Slider defaultValue={30} label="الحجم" max={100} min={0} unit="صفوف" />
    </div>
  ),
};
