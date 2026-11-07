import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "@fabrials/ui";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { cardExamples } from "../../apps/site/components/examples/data";

const description =
  "One plate: a header with its title and action, the content, and a footer or a caption on the same surface.";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { interactive: false },
  argTypes: {},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={cardExamples} title="Card" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Card {...args} style={{ maxWidth: "26rem" }}>
      <CardHeader>
        <CardTitle>North workspace</CardTitle>
        <CardDescription>Two accounts, last sync 4 minutes ago.</CardDescription>
      </CardHeader>
      <CardContent>Synthetic summary. No provider was contacted.</CardContent>
    </Card>
  ),
};
