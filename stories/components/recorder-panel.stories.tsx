import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, RecorderPanel, RecorderPanelView, Textarea, useRecorder } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";
import { fakeMicrophone, toneDataUri } from "../sound-fixtures";

const description =
  "The surface of a spoken answer: record, stop, listen back, then use the take or record again. Nothing leaves the device until the host takes the Blob, every way the microphone can fail has its own sentence, and another way to answer stays in reach.";

const TAKE = toneDataUri(330, 1);

// The stream is an oscillator, so the page records a tone and never asks for a microphone.
function SpokenAnswer() {
  const recorder = useRecorder({ maxDurationMs: 20_000, getStream: fakeMicrophone });
  const [pending, setPending] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  if (typing)
    return (
      <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%", maxInlineSize: "26rem", justifyItems: "start" }}>
        <Textarea aria-label="Your answer" placeholder="Type your answer" rows={3} />
        <Button onClick={() => setTyping(false)} variant="ghost">
          Use the microphone
        </Button>
      </div>
    );
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%", maxInlineSize: "26rem" }}>
      <RecorderPanel
        action={heard ? null : undefined}
        fallback={
          <Button
            onClick={() => {
              recorder.reset();
              setTyping(true);
            }}
            variant="ghost"
          >
            Type instead
          </Button>
        }
        onAgain={() => setHeard(null)}
        onSubmit={(blob) => {
          setPending(true);
          // The host's own work with the take; here it only waits.
          setTimeout(() => {
            setPending(false);
            setHeard(`A take of ${Math.max(1, Math.round(blob.size / 1024))} KB reached the host.`);
          }, 1200);
        }}
        pending={pending}
        recorder={recorder}
        submitLabel="Transcribe"
      />
      {heard ? <p style={{ margin: 0, fontSize: "var(--fui-text-sm)" }}>{heard}</p> : null}
    </div>
  );
}

const examples: ExampleSet = {
  preview: () => <SpokenAnswer />,
  previewCode: `const recorder = useRecorder({ maxDurationMs: 40_000 });
const [pending, setPending] = useState(false);

<RecorderPanel
  recorder={recorder}
  submitLabel="Transcribe"
  pending={pending}
  onSubmit={async (blob) => {
    setPending(true);
    setText(await transcribe(blob)); // the host's request
    setPending(false);
  }}
  fallback={<Button variant="ghost" onClick={typeInstead}>Type instead</Button>}
/>`,
  examples: [
    {
      id: "failures",
      title: "When the microphone gives nothing",
      description:
        "Blocked, missing, held by another app or not there at all: each status has its own sentence and a key to try again, and the `fallback` stays beside it. `RecorderPanelView` draws a status it is given, which is how these are shown without a microphone.",
      code: `<RecorderPanelView status="denied" fallback={<Button variant="ghost">Type instead</Button>} />
<RecorderPanelView status="no-microphone" fallback={<Button variant="ghost">Type instead</Button>} />
<RecorderPanelView status="unsupported" fallback={<Button variant="ghost">Type instead</Button>} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-5)", inlineSize: "100%", maxInlineSize: "26rem" }}>
          <RecorderPanelView aria-label="Recorder, blocked" fallback={<Button variant="ghost">Type instead</Button>} status="denied" />
          <RecorderPanelView aria-label="Recorder, no microphone" fallback={<Button variant="ghost">Type instead</Button>} status="no-microphone" />
          <RecorderPanelView aria-label="Recorder, unsupported" fallback={<Button variant="ghost">Type instead</Button>} status="unsupported" />
        </div>
      ),
      align: "start",
    },
    {
      id: "slow",
      title: "A take the host is working on",
      description: "`pending` makes the primary key busy and holds the take; after `slowAfterMs` (8 seconds) the status says the work is still going.",
      code: `<RecorderPanel recorder={recorder} pending={pending} slowAfterMs={8000} onSubmit={send} submitLabel="Transcribe" />`,
      render: () => (
        <div style={{ inlineSize: "100%", maxInlineSize: "26rem" }}>
          <RecorderPanelView durationMs={7_400} onSubmit={() => {}} pending slow status="recorded" submitLabel="Transcribe" takeUrl={TAKE} />
        </div>
      ),
      align: "start",
    },
  ],
};

const meta = {
  title: "Components/Recorder panel",
  component: RecorderPanelView,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { status: "recording", elapsedMs: 7_400, maxDurationMs: 40_000, level: 0.6, durationMs: 7_400, tooShort: false, autoStopped: false, pending: false, slow: false, disabled: false, locale: "en" },
  argTypes: {
    status: { control: "select", options: ["idle", "requesting", "recording", "recorded", "denied", "no-microphone", "unsupported", "busy", "error"] },
    level: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    elapsedMs: { control: { type: "number", min: 0, step: 1000 } },
    locale: { control: "inline-radio", options: ["en", "ar-EG", "fa", "hi-u-nu-deva"] },
    fallback: { control: false },
    action: { control: false },
    hint: { control: false },
  },
} satisfies Meta<typeof RecorderPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Recorder panel" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "26rem" }}>
      <RecorderPanelView {...args} fallback={<Button variant="ghost">Type instead</Button>} onSubmit={() => {}} takeUrl={TAKE} />
    </div>
  ),
};
