import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatMessage } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { chatMessageExamples } from "../../apps/site/components/examples/chat-message";

const description =
  "A user or assistant turn with its actions. While the answer arrives, a block caret of the working light sits at the end of its text.";

const meta = {
  title: "Agents/Chat message",
  component: ChatMessage,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { from: "assistant", streaming: true, pinActions: false, children: "Import the tokens, the fonts and the styles once, in that order" },
  argTypes: { from: { control: "inline-radio", options: ["user", "assistant", "system"] }, actions: { control: false } },
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={chatMessageExamples} title="Chat message" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "34rem" }}>
      <ChatMessage {...args}>
        <div className="fui-markdown">
          <p>{args.children}</p>
        </div>
      </ChatMessage>
    </div>
  ),
};
