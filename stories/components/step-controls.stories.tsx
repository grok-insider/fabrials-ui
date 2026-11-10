import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StepControls } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { stepControlsExamples as examples } from "../../apps/site/components/examples/answers";

const description =
  "The keys of something shown in steps: previous, play or pause, next, where the reader is, and optionally a reset and a speed. One tab stop, the arrow keys between its controls, and the step announced when a key changes it, never on every tick.";

const meta = {
  title: "Components/Step controls",
  component: StepControls,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { index: 1, count: 5, playing: false, reset: true, locale: "en" },
  argTypes: {
    index: { control: { type: "number", min: 0 } },
    count: { control: { type: "number", min: 0 } },
    playing: { control: "boolean" },
    reset: { control: "boolean" },
    disabled: { control: "boolean" },
    speeds: { control: false },
    locale: { control: "inline-radio", options: ["en", "es", "ar-EG"] },
    next: { control: false },
    previous: { control: false },
    goTo: { control: false },
    play: { control: false },
    pause: { control: false },
    toggle: { control: false },
    restart: { control: false },
    setSpeed: { control: false },
  },
} satisfies Meta<typeof StepControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Step controls" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => {
    const [index, setIndex] = useState(args.index);
    const [playing, setPlaying] = useState(false);
    return (
      <StepControls
        count={args.count}
        index={index}
        locale={args.locale}
        next={() => {
          setPlaying(false);
          setIndex(Math.min(args.count - 1, index + 1));
        }}
        pause={() => setPlaying(false)}
        play={() => setPlaying(true)}
        playing={playing}
        previous={() => {
          setPlaying(false);
          setIndex(Math.max(0, index - 1));
        }}
        reset={args.reset}
        restart={() => {
          setPlaying(false);
          setIndex(0);
        }}
        speeds={[0.5, 1, 2]}
        setSpeed={() => {}}
      />
    );
  },
};
