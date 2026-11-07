import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "@fabrials/ui";
import { Search } from "lucide-react";
import { Showcase } from "../showcase";
import { iconButtonExamples } from "../../apps/site/components/examples/actions";

const description =
  "An icon-only button that always has a name: the label is its accessible name and the tooltip that shows on hover and on keyboard focus.";

const meta = {
  title: "Components/Icon button",
  component: IconButton,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { label: "Search", variant: "ghost", size: "icon-lg", children: <Search aria-hidden /> },
  argTypes: { variant: { control: "select", options: ["ghost", "outline", "secondary", "default", "destructive"] }, size: { control: "inline-radio", options: ["icon-xs", "icon-sm", "icon", "icon-lg"] }, children: { control: false } },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={iconButtonExamples} title="Icon button" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
