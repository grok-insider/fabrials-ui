import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, InlineConfirm, useInlineConfirm } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { inlineConfirmExamples as examples } from "../../apps/site/components/examples/states";

const description =
  "A confirmation asked in place, with the page still usable around it: the safe answer takes focus, Escape is the safe answer, and focus goes back to the control that asked.";

const column = { display: "grid", gap: "var(--fui-space-3)", inlineSize: "min(100%, 28rem)" } as const;

const meta = {
  title: "Components/Inline confirm",
  component: InlineConfirm,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    title: "End the session early?",
    description: "What you answered so far is kept.",
    confirmLabel: "End session",
    cancelLabel: "Keep going",
    destructive: false,
    pending: false,
    error: "",
    onConfirm: () => {},
  },
  argTypes: {
    destructive: { control: "boolean" },
    pending: { control: "boolean" },
    error: { control: "text" },
    headingLevel: { control: "inline-radio", options: [undefined, 2, 3, 4] },
    acknowledgement: { control: false },
    returnFocusRef: { control: false },
    open: { control: false },
    onConfirm: { control: false },
  },
} satisfies Meta<typeof InlineConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Inline confirm" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: function Render(args) {
    const confirm = useInlineConfirm();
    return (
      <div style={column}>
        <InlineConfirm {...args} {...confirm.confirmProps} error={args.error || undefined} />
        <div>
          <Button {...confirm.triggerProps} variant="outline">
            End session
          </Button>
        </div>
      </div>
    );
  },
};
