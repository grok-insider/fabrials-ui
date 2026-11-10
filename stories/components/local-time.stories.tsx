import type { Meta, StoryObj } from "@storybook/react-vite";
import { LocalTime } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { localTimeExamples as examples } from "../../apps/site/components/examples/foundations";

const description =
  "A time in the reader's own zone and locale. A server knows neither, so it sends a hidden stand-in of the same shape and the real text takes its place after hydration: nothing moves, and nobody reads the server's clock.";

const SENT = "2026-09-27T07:31:00Z";

const meta = {
  title: "Components/Local time",
  component: LocalTime,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { value: SENT, format: "dateTime", prefix: "" },
  argTypes: {
    value: { control: "text" },
    format: { control: "inline-radio", options: ["time", "message", "dateTime", "date", "shortDate"] },
    locale: { control: "select", options: [undefined, "en", "en-GB", "es", "fr", "ar-EG", "ja"] },
    timeZone: { control: "select", options: [undefined, "UTC", "Europe/Madrid", "America/New_York", "Asia/Tokyo"] },
    prefix: { control: "text" },
    title: { control: "text" },
  },
} satisfies Meta<typeof LocalTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Local time" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <LocalTime {...args} />,
};
