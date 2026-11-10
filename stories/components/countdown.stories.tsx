import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Countdown, formatCountdown, useCountdown } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "A clock that counts to a deadline: read from the time on every tick, never counted down, so it is right after the tab slept. It speaks only when a mark is passed and when the time is up.";

const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" } as const;

function Section() {
  const [deadline, setDeadline] = useState(() => Date.now() + 5 * 60_000 + 8_000);
  const [closed, setClosed] = useState(false);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <Countdown deadline={deadline} label="Section 2" onDone={() => setClosed(true)} />
      <div style={row}>
        {[308, 64, 6].map((seconds) => (
          <Button
            key={seconds}
            onClick={() => {
              setClosed(false);
              setDeadline(Date.now() + seconds * 1000);
            }}
            size="sm"
            variant="outline"
          >
            {formatCountdown(seconds * 1000)} left
          </Button>
        ))}
      </div>
      <span style={{ color: "var(--muted-foreground)" }}>{closed ? "The section closed." : "The section is open."}</span>
    </div>
  );
}

function Reading() {
  const [deadline] = useState(() => Date.now() + 90_000);
  const { remainingMs, done } = useCountdown(deadline, { precision: 100, tick: 100 });
  const share = remainingMs === null ? 1 : remainingMs / 90_000;
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "min(100%, 20rem)" }}>
      <div aria-hidden style={{ blockSize: "0.375rem", borderRadius: "var(--fui-radius-full)", background: "var(--muted)", overflow: "hidden" }}>
        <div style={{ blockSize: "100%", inlineSize: `${share * 100}%`, background: "var(--brand)" }} />
      </div>
      <span style={{ fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)", color: "var(--muted-foreground)" }}>
        {done ? "Time is up" : remainingMs === null ? "Starting" : `${(remainingMs / 1000).toFixed(1)} s left to answer`}
      </span>
    </div>
  );
}

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

const examples: ExampleSet = {
  preview: () => <Section />,
  previewCode: `<Countdown
  deadline={section.closesAt}
  offset={clockOffset(response.serverNow, receivedAt)}
  label="Section 2"
  onDone={closeSection}
/>`,
  examples: [
    {
      id: "tones",
      title: "Tones, sizes and digits",
      description:
        "Calm, `low` at five minutes and `urgent` at one, as a tint, an edge and an icon (`thresholds` moves them). `size=\"sm\"` fits a table or a tab; `hideLabel` keeps the name for screen readers; `locale` writes the reader's digits.",
      code: `<Countdown deadline={deadline} />
<Countdown deadline={deadline} thresholds={{ low: 900, urgent: 300 }} />
<Countdown deadline={deadline} size="sm" hideLabel label="Section 2 closes in" />
<Countdown deadline={deadline} locale="ar-EG" label="الوقت المتبقي" />`,
      render: () => (
        <div style={row}>
          <Countdown deadline={NOW + 754_000} now={NOW} />
          <Countdown deadline={NOW + 299_000} now={NOW} />
          <Countdown deadline={NOW + 45_000} now={NOW} />
          <Countdown deadline={NOW - 1} now={NOW} />
          <Countdown deadline={NOW + 240_000} hideLabel label="Section 2 closes in" now={NOW} size="sm" />
          <Countdown deadline={NOW + 299_000} label="الوقت المتبقي" lang="ar" locale="ar-EG" now={NOW} />
        </div>
      ),
    },
    {
      id: "hook",
      title: "The hook, for a reading of your own",
      description:
        "`useCountdown` gives the time left, the whole seconds, the tone and the mark just passed. It renders once a second; `precision` and `tick` make it finer for a bar that drains.",
      code: `const { remainingMs, done } = useCountdown(deadline, { precision: 100, tick: 100 });`,
      render: () => <Reading />,
    },
  ],
};

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
