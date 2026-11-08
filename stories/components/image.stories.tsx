import type { Meta, StoryObj } from "@storybook/react-vite";
import { Image } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { imageExamples } from "../../apps/site/components/examples/image";
import { HARBOUR } from "../../apps/site/components/examples/fixtures";

const description =
  "A picture in a frame that keeps its shape while it loads, comes in through the dither when it arrives late, and says what it was when it fails.";

const meta = {
  title: "Components/Image",
  component: Image,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { src: HARBOUR, alt: "Dark hills under a pale sun over the harbour", ratio: "16 / 9", fit: "cover", caption: "The harbour at dusk. Synthetic." },
  argTypes: { fit: { control: "inline-radio", options: ["cover", "contain"] }, ratio: { control: "select", options: ["16 / 9", "4 / 3", "1", "3 / 4"] } },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={imageExamples} title="Image" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "26rem" }}>
      <Image {...args} />
    </div>
  ),
};
