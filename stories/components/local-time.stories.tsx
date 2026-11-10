import type { Meta, StoryObj } from "@storybook/react-vite";
import { LocalTime } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "A time in the reader's own zone and locale. A server knows neither, so it sends a hidden stand-in of the same shape and the real text takes its place after hydration: nothing moves, and nobody reads the server's clock.";

const SENT = "2026-09-27T07:31:00Z";
const NOW = new Date("2026-09-27T12:00:00Z");

const list = { display: "grid", gridTemplateColumns: "auto auto", gap: "var(--fui-space-1) var(--fui-space-5)", margin: 0 } as const;
const term = { color: "var(--muted-foreground)" } as const;

// The examples of the docs site are written in one pass at the end of 0.12; until then the set lives with the story.
const examples: ExampleSet = {
  preview: () => (
    <p style={{ margin: 0 }}>
      Ana replied <LocalTime value={SENT} format="message" now={NOW} />
    </p>
  ),
  previewCode: `<p>
  Ana replied <LocalTime value={message.sentAt} format="message" />
</p>`,
  examples: [
    {
      id: "formats",
      title: "Formats",
      description: "`time`, `message` (the time today, the date with it on another day, the year in another year), `dateTime`, `date` and `shortDate`.",
      code: `<LocalTime value={sentAt} format="time" />
<LocalTime value={sentAt} format="message" />
<LocalTime value={sentAt} format="dateTime" />
<LocalTime value={sentAt} format="date" />
<LocalTime value={sentAt} format="shortDate" />`,
      render: () => (
        <dl style={list}>
          {(["time", "message", "dateTime", "date", "shortDate"] as const).map((format) => (
            <div key={format} style={{ display: "contents" }}>
              <dt style={term}>{format}</dt>
              <dd style={{ margin: 0 }}>
                <LocalTime value={SENT} format={format} now={NOW} />
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "fixed-zone",
      title: "A fixed zone",
      description: "With `timeZone` the text is the same on the server and in the browser, so it is rendered at once. Say the place, since it is not the reader's.",
      code: `<LocalTime value={startsAt} format="dateTime" timeZone="Europe/Madrid" locale="en-GB" /> in Madrid`,
      render: () => (
        <p style={{ margin: 0 }}>
          Doors open <LocalTime value={SENT} format="dateTime" locale="en-GB" timeZone="Europe/Madrid" /> in Madrid
        </p>
      ),
    },
    {
      id: "options",
      title: "Your own options",
      description: "`format` also takes `Intl.DateTimeFormat` options, and `locale` the language of the page.",
      code: `<LocalTime value={sentAt} format={{ weekday: "long", hour: "2-digit", minute: "2-digit" }} locale="es" />`,
      render: () => <LocalTime value={SENT} format={{ weekday: "long", hour: "2-digit", minute: "2-digit" }} locale="es" />,
    },
  ],
};

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
