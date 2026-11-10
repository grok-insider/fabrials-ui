import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, NumberTicker, Stat } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "A number that rolls to its value like an odometer: each digit is a column of 0-9 that slides into place, the columns a little apart. It rolls once when it is first seen and again whenever the value changes; the first paint shows the value at rest, and reduced motion jumps with no roll at all.";

const figure = { fontFamily: "var(--fui-font-display)", fontSize: "2rem", fontWeight: 600, lineHeight: 1.1, margin: 0 } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--fui-space-6)" } as const;

function Weekly() {
  const [requests, setRequests] = useState(12_840);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <Stat
        delta="+3.1%"
        hint="vs last 7 days"
        label="Requests this week"
        trend="up"
        value={<NumberTicker locale="en" startOnView={false} value={requests} />}
      />
      <Button onClick={() => setRequests((current) => current + 1_137)} size="sm" variant="outline">
        A day of traffic arrives
      </Button>
    </div>
  );
}

const examples: ExampleSet = {
  preview: () => <Weekly />,
  previewCode: `<NumberTicker locale="en" value={requests} />`,
  examples: [
    {
      id: "when-it-rolls",
      title: "When it rolls",
      description:
        "By default it counts up once, when six tenths of it have come into view, and then only when the value changes. `startOnView={false}` rolls it as soon as it appears, `duration` is the length in seconds and `stagger` sets the columns apart.",
      code: `<NumberTicker value={12840} />
<NumberTicker value={12840} startOnView={false} duration={1.4} stagger={0.08} />`,
      render: () => (
        <div style={row}>
          <p style={figure}>
            <NumberTicker locale="en" value={48_210} />
          </p>
          <p style={figure}>
            <NumberTicker duration={1.4} locale="en" startOnView={false} stagger={0.08} value={12840} />
          </p>
        </div>
      ),
    },
    {
      id: "words-and-locale",
      title: "Words around it, and the reader's digits",
      description:
        "`prefix` and `suffix` are part of what is read aloud but do not roll. `locale` groups the number the reader's way, and a locale with its own digits writes them; `format` writes the whole number itself, decimals and all. `pad` keeps a fixed width with zeros.",
      code: `<NumberTicker prefix="$" suffix=" kg" value={7} />
<NumberTicker locale="de" value={12480} />
<NumberTicker locale="ar-EG" value={12480} />
<NumberTicker format={(value) => value.toFixed(2)} value={12.5} />
<NumberTicker pad={4} value={42} />`,
      render: () => (
        <div style={row}>
          <p style={figure}>
            <NumberTicker prefix="$" startOnView={false} suffix=" kg" value={7} />
          </p>
          <p style={figure}>
            <NumberTicker locale="de" startOnView={false} value={12480} />
          </p>
          <p style={figure}>
            <NumberTicker locale="ar-EG" startOnView={false} value={12480} />
          </p>
          <p style={figure}>
            <NumberTicker format={(value) => value.toFixed(2)} startOnView={false} value={12.5} />
          </p>
          <p style={figure}>
            <NumberTicker pad={4} startOnView={false} value={42} />
          </p>
        </div>
      ),
    },
    {
      id: "blur",
      title: "A blur as it lands",
      description: "`blur` softens each column as it slides and brings it into focus, for a figure that arrives rather than changes.",
      code: `<NumberTicker blur value={12840} startOnView={false} />`,
      render: () => (
        <p style={figure}>
          <NumberTicker blur locale="en" startOnView={false} value={12840} />
        </p>
      ),
    },
    {
      id: "size",
      title: "In the size it is read at",
      description: "The digits take the size, the weight and the font of what surrounds them, and keep their width as they turn.",
      code: `<p style={{ fontSize: "3rem" }}><NumberTicker value={960} /></p>`,
      render: () => (
        <div style={row}>
          <p style={{ ...figure, fontSize: "1rem" }}>
            <NumberTicker locale="en" startOnView={false} value={960} />
          </p>
          <p style={{ ...figure, fontSize: "2rem" }}>
            <NumberTicker locale="en" startOnView={false} value={960} />
          </p>
          <p style={{ ...figure, fontSize: "3rem" }}>
            <NumberTicker locale="en" startOnView={false} value={960} />
          </p>
        </div>
      ),
    },
  ],
};

const meta = {
  title: "Components/Number ticker",
  component: NumberTicker,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { value: 48_210, locale: "en", startOnView: false, duration: 0.9, stagger: 0.04, blur: false },
  argTypes: {
    value: { control: "number" },
    locale: { control: "text" },
    duration: { control: { type: "number", min: 0, max: 3, step: 0.1 } },
    stagger: { control: { type: "number", min: 0, max: 0.2, step: 0.01 } },
    startOnView: { control: "boolean" },
    blur: { control: "boolean" },
    format: { control: false },
    pad: { control: "number" },
    prefix: { control: "text" },
    suffix: { control: "text" },
    digitClassName: { control: false },
  },
} satisfies Meta<typeof NumberTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Number ticker" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <p style={{ ...figure, fontSize: "3rem" }}>
      <NumberTicker {...args} />
    </p>
  ),
};
