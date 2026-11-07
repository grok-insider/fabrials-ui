import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownMenu } from "@fabrials/ui";
import { Button, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { dropdownMenuExamples } from "../../apps/site/components/examples/structure";

const description =
  "Actions on one thing, opened from a button: labels, shortcuts, kept states, groups and the action that removes.";

const meta = {
  title: "Components/Dropdown menu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {},
  argTypes: {},
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={dropdownMenuExamples} title="Dropdown menu" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger render={<Button variant="outline" />}>Sender actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Open messages</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete all</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
