import type { Meta, StoryObj } from "@storybook/react-vite";
import { Item } from "@fabrials/ui";
import { ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { itemExamples } from "../../apps/site/components/examples/structure";

const description =
  "A record as a row: media, a title and a description, actions at the end, and current, selected and unread states.";

const meta = {
  title: "Components/Item",
  component: Item,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { current: false, selected: false, unread: false, variant: "default" },
  argTypes: { variant: { control: "inline-radio", options: ["default", "outline", "muted"] } },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={itemExamples} title="Item" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <ItemGroup bordered aria-label="Messages" style={{ maxWidth: "30rem" }}>
      <Item {...args}>
        <ItemContent>
          <ItemTitle>Quarterly planning notes</ItemTitle>
          <ItemDescription>Ana Ruiz · Attached are the notes from Tuesday.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
