import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, RecorderPanelView } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { recorderPanelExamples as examples } from "../../apps/site/components/examples/sound";
import { toneDataUri } from "../sound-fixtures";

const description =
  "The surface of a spoken answer: record, stop, listen back, then use the take or record again. Nothing leaves the device until the host takes the Blob, every way the microphone can fail has its own sentence, and another way to answer stays in reach.";

const TAKE = toneDataUri(330, 1);

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
