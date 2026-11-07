import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "@fabrials/ui";
import { TabsContent, TabsList, TabsTrigger } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { tabsExamples } from "../../apps/site/components/examples/structure";

const description =
  "Views of one subject: an underline that slides, segments in a well, or a vertical rail of sections.";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { defaultValue: "models" },
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={tabsExamples} title="Tabs" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Tabs {...args} style={{ maxWidth: "26rem" }}>
      <TabsList aria-label="Usage">
        <TabsTrigger value="models">Models</TabsTrigger>
        <TabsTrigger value="keys">Proxy keys</TabsTrigger>
      </TabsList>
      <TabsContent value="models" style={{ padding: "0.75rem 0" }}>Usage grouped by model.</TabsContent>
      <TabsContent value="keys" style={{ padding: "0.75rem 0" }}>Usage grouped by proxy key.</TabsContent>
    </Tabs>
  ),
};
