import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarGroup } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { avatarGroupExamples } from "../../apps/site/components/examples/avatar-group";

const description =
  "People as overlapping avatars cut out of the surface under them, initials on a colour of their own, a count for the rest, and presence badges.";

const meta = {
  title: "Components/Avatar group",
  component: AvatarGroup,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { max: 4, size: "md" },
  argTypes: { max: { control: { type: "range", min: 1, max: 7 } }, size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] } },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={avatarGroupExamples} title="Avatar group" />,
};

const people = ["AL", "KN", "PS", "RK", "LF", "TA", "OH"];

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <AvatarGroup {...args}>
      {people.map((initials) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  ),
};
