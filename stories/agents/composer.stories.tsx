import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatComposer } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { composerExamples } from "../../apps/site/components/examples/composer";

const description =
  "Where a person writes to an agent: the message, the files it is given (each counting up as it uploads), tools, and the working light along its edge while the agent answers.";

const meta = {
  title: "Agents/Composer",
  component: ChatComposer,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { placeholder: "Ask about your invoices", status: "ready", onSubmit: () => {}, onStop: () => {} },
  argTypes: {
    status: { control: "inline-radio", options: ["ready", "submitting", "streaming"] },
    attachments: { control: false },
    tools: { control: false },
    trailing: { control: false },
    footer: { control: "text" },
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={composerExamples} title="Composer" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "36rem" }}>
      <ChatComposer {...args} />
    </div>
  ),
};
