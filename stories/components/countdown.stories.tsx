import type { Meta, StoryObj } from "@storybook/react-vite";
import { Countdown } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { countdownExamples as examples } from "../../apps/site/components/examples/states";

const description =
  "A clock that counts to a deadline: read from the time on every tick, never counted down, so it is right after the tab slept. It speaks only when a mark is passed and when the time is up.";

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

const meta = {
  title: "Components/Countdown",
  component: Countdown,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { deadline: NOW + 299_000, now: NOW, label: "Time left", hideLabel: false, size: "md", format: "auto", locale: "en" },
  argTypes: {
    deadline: { control: "number" },
    now: { control: "number" },
    size: { control: "inline-radio", options: ["sm", "md"] },
    format: { control: "inline-radio", options: ["auto", "mm:ss", "h:mm:ss"] },
    tone: { control: "inline-radio", options: [undefined, "calm", "low", "urgent"] },
    locale: { control: "text" },
    labels: { control: false },
    onDone: { control: false },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Countdown" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <Countdown {...args} />,
};
