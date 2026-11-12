import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, NumberTicker, Stat } from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

// Every way a number rolls, in fixed values, for the visual suite: the pictures are taken under reduced motion, so each one
// shows the value at rest. The block marked `ticker-live` is the one the behaviour test drives.
const row = { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--fui-space-6)" } as const;
const figure = { fontFamily: "var(--fui-font-display)", fontSize: "2rem", fontWeight: 600, lineHeight: 1.1, margin: 0 } as const;

function Changing() {
  const [value, setValue] = useState(48_210);
  return (
    <div id="ticker-live" style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <span style={figure}>
        <NumberTicker locale="en" startOnView={false} value={value} />
      </span>
      <div style={{ display: "flex", gap: "var(--fui-space-2)" }}>
        <Button onClick={() => setValue(12_840)} size="sm" variant="outline">
          Set 12,840
        </Button>
        <Button onClick={() => setValue(48_210)} size="sm" variant="outline">
          Set 48,210
        </Button>
        <Button onClick={() => setValue(960)} size="sm" variant="ghost">
          Set 960
        </Button>
      </div>
    </div>
  );
}

function Bench() {
  return (
    <Page description="Fixed values, at rest: an integer, a grouped number, a decimal, a pad, a sign, a locale with its own digits, one inside a figure, one that changes, and a right-to-left frame." title="Number ticker">
      <Block title="A value" description="Digits in the display voice, and the same number grouped for a reader of English.">
        <Frame width={480}>
          <div style={row}>
            <p id="ticker-plain" style={figure}>
              <NumberTicker startOnView={false} value={12480} />
            </p>
            <p id="ticker-grouped" style={figure}>
              <NumberTicker locale="en" startOnView={false} value={12480} />
            </p>
          </div>
        </Frame>
      </Block>
      <Block title="Decimals, a pad and a sign" description="A formatter writes the decimals, a pad keeps four places, a proxy number in front, and a negative.">
        <Frame width={480}>
          <div style={row}>
            <p id="ticker-decimals" style={figure}>
              <NumberTicker format={(value) => value.toFixed(2)} startOnView={false} value={12.5} />
            </p>
            <p id="ticker-pad" style={figure}>
              <NumberTicker pad={4} startOnView={false} value={42} />
            </p>
            <p id="ticker-affixes" style={figure}>
              <NumberTicker prefix="$" startOnView={false} suffix=" kg" value={7} />
            </p>
            <p id="ticker-negative" style={figure}>
              <NumberTicker startOnView={false} value={-3} />
            </p>
          </div>
        </Frame>
      </Block>
      <Block title="A large number" description="Grouped for a reader of English, six digits wider than the frame's own scale.">
        <Frame width={480}>
          <p id="ticker-large" style={{ ...figure, fontSize: "2.5rem" }}>
            <NumberTicker locale="en" startOnView={false} value={1_284_050} />
          </p>
        </Frame>
      </Block>
      <Block title="Its own digits" description="Arabic for Egypt writes Arabic-Indic digits and its own separator; those digits are not the rolling ones.">
        <Frame width={480}>
          <p id="ticker-arabic" lang="ar" style={{ ...figure, fontSize: "2.5rem" }}>
            <NumberTicker locale="ar-EG" startOnView={false} value={12480} />
          </p>
        </Frame>
      </Block>
      <Block title="Inside a figure" description="A total that counts up once it is seen, with its label, its change and a hint.">
        <Frame width={420}>
          <div id="ticker-stat">
            <Stat
              delta="+3.1%"
              hint="vs last 7 days"
              label="Requests this week"
              trend="up"
              value={<NumberTicker locale="en" startOnView={false} value={12840} />}
            />
          </div>
        </Frame>
      </Block>
      <Block title="One that changes" description="A new value rolls from wherever the digits are, and leaving it half way starts the next roll from there.">
        <Frame width={420}>
          <Changing />
        </Frame>
      </Block>
      <Block title="Right to left" description="The same number in a right-to-left frame, with the digits of Arabic for Egypt.">
        <Frame dir="rtl" width={358}>
          <p id="ticker-rtl" lang="ar" style={{ ...figure, margin: 0 }}>
            <NumberTicker locale="ar-EG" startOnView={false} value={48210} />
          </p>
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Number ticker",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };

// A number that is below the fold at first paint: it counts up when it is seen, and not before. The behaviour test scrolls to it.
export const OnView: Story = {
  render: () => (
    <Page description="A figure asked to count up (`rollIn`) that is off screen at first paint: it starts its one roll when six tenths of it have come into view." title="Counting up when it is seen">
      <div aria-hidden="true" style={{ blockSize: "140vh" }} />
      <p id="ticker-on-view" style={{ ...figure, fontSize: "2.5rem" }}>
        <NumberTicker locale="en" rollIn value={48_210} />
      </p>
    </Page>
  ),
};
