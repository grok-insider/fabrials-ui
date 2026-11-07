import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "@fabrials/ui";
import { Button, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { dialogExamples } from "../../apps/site/components/examples/structure";

const description =
  "A small task on top of the page: focus moves in, stays in and returns to the trigger.";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {},
  argTypes: {},
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={dialogExamples} title="Dialog" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger render={<Button variant="outline" />}>Rename account</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
          <DialogDescription>The new name shows in the account list.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save name</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
