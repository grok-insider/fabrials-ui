import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClipButton, ClipError, type ClipLoader } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { clipButtonExamples as examples } from "../../apps/site/components/examples/sound";
import { toneWav } from "../sound-fixtures";

const description =
  "A button that plays a clip the host loads: a speaker, a spinner while it loads, a square while it plays. One sound at a time on the page, a slow speed, and a line that says why a clip did not play.";

// The host's loader, played here by tones made in the page: a higher note for each word, a lower one when slow.
const WORDS = ["harbour", "orchard", "quarry"] as const;
const tones: ClipLoader = async (ref, { speed }) => {
  if (ref === "missing") throw new ClipError("unavailable");
  if (ref === "busy") throw new ClipError("rateLimited");
  const step = Math.max(0, WORDS.indexOf(ref as (typeof WORDS)[number]));
  return toneWav((speed === "slow" ? 220 : 330) + step * 55, speed === "slow" ? 1.4 : 0.9);
};

const meta = {
  title: "Components/Clip button",
  component: ClipButton,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { clip: "harbour", size: "default", iconOnly: false, variant: "outline" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    variant: { control: "select", options: ["default", "accent", "outline", "secondary", "ghost"] },
    iconOnly: { control: "boolean" },
    label: { control: "text" },
    player: { control: false },
    load: { control: false },
    labelContent: { control: false },
  },
} satisfies Meta<typeof ClipButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Clip button" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <ClipButton {...args} load={tones} />,
};
