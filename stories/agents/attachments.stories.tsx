import type { Meta, StoryObj } from "@storybook/react-vite";
import { Attachments } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { attachmentsExamples } from "../../apps/site/components/examples/composer";

const description =
  "Files given to an agent, as tiles, chips or rows. An upload with a progress draws a ring round its tile and counts; at 100 % the count fades out. Files that arrive rise into place.";

const meta = {
  title: "Agents/Attachments",
  component: Attachments,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    variant: "grid",
    size: "md",
    items: [
      { id: "a", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.64 },
      { id: "b", name: "migration-notes.pdf", mediaType: "application/pdf", size: 96_000, status: "ready" },
    ],
    onRemove: () => {},
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["grid", "inline", "list"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Attachments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={attachmentsExamples} title="Attachments" />,
};

export const Playground: Story = { parameters: { layout: "padded" } };
