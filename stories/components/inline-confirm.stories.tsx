import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, InlineConfirm, useInlineConfirm } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "A confirmation asked in place, with the page still usable around it: the safe answer takes focus, Escape is the safe answer, and focus goes back to the control that asked.";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const column = { display: "grid", gap: "var(--fui-space-3)", inlineSize: "min(100%, 28rem)" } as const;

function EndSession() {
  const confirm = useInlineConfirm();
  const [ended, setEnded] = useState(false);
  return (
    <div style={column}>
      <InlineConfirm
        {...confirm.confirmProps}
        cancelLabel="Keep going"
        confirmLabel="End session"
        description="What you answered so far is kept."
        onConfirm={() => setEnded(true)}
        title="End the session early?"
      />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
        <Button {...confirm.triggerProps} variant="outline">
          End session
        </Button>
        <span style={{ color: "var(--muted-foreground)" }}>{ended ? "Session ended." : "Step 3 of 12"}</span>
      </div>
    </div>
  );
}

function Abandon() {
  const confirm = useInlineConfirm({ defaultOpen: true });
  const [tries, setTries] = useState(0);
  return (
    <div style={column}>
      <InlineConfirm
        {...confirm.confirmProps}
        autoFocus={false}
        cancelLabel="Keep going"
        confirmLabel="Abandon the exam"
        description="An abandoned exam has no result. The first try fails here, so you can see the error."
        destructive
        onConfirm={async () => {
          await wait(900);
          setTries(tries + 1);
          if (tries === 0) throw new Error("The connection dropped. Try again.");
        }}
        pendingLabel="Abandoning"
        title="Abandon the exam?"
      />
      <Button {...confirm.triggerProps} variant="outline">
        Abandon
      </Button>
    </div>
  );
}

function KeepRecording() {
  const confirm = useInlineConfirm({ defaultOpen: true });
  const [days, setDays] = useState(30);
  return (
    <div style={column}>
      <InlineConfirm
        {...confirm.confirmProps}
        acknowledgement={{ label: `I agree that this recording is kept for ${days} days and then deleted.`, error: "Tick the box to keep the recording" }}
        acknowledgementKey={days}
        autoFocus={false}
        cancelLabel="Not now"
        confirmLabel="Keep the recording"
        onConfirm={() => {}}
        title="Keep this recording?"
      >
        <div>
          <Button onClick={() => setDays(days === 30 ? 90 : 30)} size="sm" variant="secondary">
            Keep it for {days === 30 ? 90 : 30} days instead
          </Button>
        </div>
      </InlineConfirm>
      <Button {...confirm.triggerProps} variant="outline">
        Keep this recording
      </Button>
    </div>
  );
}

const examples: ExampleSet = {
  preview: () => <EndSession />,
  previewCode: `const confirm = useInlineConfirm();

<InlineConfirm
  {...confirm.confirmProps}
  title="End the session early?"
  description="What you answered so far is kept."
  cancelLabel="Keep going"
  confirmLabel="End session"
  onConfirm={endSession}
/>
<Button variant="outline" {...confirm.triggerProps}>End session</Button>`,
  examples: [
    {
      id: "destructive",
      title: "Destructive, with a request",
      description:
        "`destructive` tints the block and the answer. When `onConfirm` returns a promise the answer loads and ignores a second press; a rejection is shown in the question, which stays open to try again.",
      code: `<InlineConfirm
  {...confirm.confirmProps}
  destructive
  title="Abandon the exam?"
  description="An abandoned exam has no result."
  cancelLabel="Keep going"
  confirmLabel="Abandon the exam"
  pendingLabel="Abandoning"
  onConfirm={() => abandonExam()}
/>`,
      render: () => <Abandon />,
      align: "start",
    },
    {
      id: "acknowledgement",
      title: "A box that must be ticked",
      description:
        "`acknowledgement` adds a required box. The answer is never disabled: pressed with the box empty, it says what is missing and moves to the box. A new `acknowledgementKey` empties it, because what is agreed to has changed.",
      code: `<InlineConfirm
  {...confirm.confirmProps}
  title="Keep this recording?"
  acknowledgement={{
    label: \`I agree that this recording is kept for \${days} days and then deleted.\`,
    error: "Tick the box to keep the recording",
  }}
  acknowledgementKey={days}
  cancelLabel="Not now"
  confirmLabel="Keep the recording"
  onConfirm={keepRecording}
/>`,
      render: () => <KeepRecording />,
      align: "start",
    },
  ],
};

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
