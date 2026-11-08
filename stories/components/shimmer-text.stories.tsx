import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShimmerText } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { shimmerTextExamples } from "../../apps/site/components/examples/text";

const description = "A pending label crossed by light: a soft band, or letter by letter like a cursor reading the line.";

const meta = {
  title: "Components/Shimmer text",
  component: ShimmerText,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { children: "Reading the release notes", as: "span", tone: "light", variant: "band", duration: 2 },
  argTypes: {
    tone: { control: "inline-radio", options: ["ink", "light"] },
    variant: { control: "inline-radio", options: ["band", "letters"] },
    as: { control: false },
  },
} satisfies Meta<typeof ShimmerText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={shimmerTextExamples} title="Shimmer text" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
