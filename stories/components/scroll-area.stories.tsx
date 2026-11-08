import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { scrollAreaExamples } from "../../apps/site/components/examples/scroll-area";

const description =
  "A region that scrolls inside while the page stays: a slim round thumb that deepens under the pointer, its own focus ring, and edges that fade where there is more.";

const meta = {
  title: "Components/Scroll area",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { "aria-label": "Labels", fade: true },
  argTypes: { fade: { control: "boolean" } },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={scrollAreaExamples} title="Scroll area" />,
};

const rows = ["Receipts", "Travel", "Invoices", "Newsletters", "Projects", "Taxes 2026", "Reading list", "Family", "Orders", "Health", "School", "Archive 2025"];

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <ScrollArea {...args} style={{ height: "14rem", maxWidth: "20rem", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)" }}>
      <ul style={{ margin: 0, padding: "var(--fui-space-2) var(--fui-space-4)", listStyle: "none" }}>
        {rows.map((row) => (
          <li key={row} style={{ padding: "var(--fui-space-2) 0" }}>
            {row}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};
