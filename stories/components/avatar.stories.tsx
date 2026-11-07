import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "@fabrials/ui";
import { AvatarFallback } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { avatarExamples } from "../../apps/site/components/examples/data";

const description =
  "A person as a picture or their initials, in five sizes, alone, in a group or with a presence badge.";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={avatarExamples} title="Avatar" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  ),
};
