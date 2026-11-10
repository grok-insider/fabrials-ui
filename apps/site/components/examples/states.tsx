"use client";

import { useState } from "react";
import { Button, Countdown, formatCountdown, InlineConfirm, useCountdown } from "@fabrials/ui";
import type { ExampleSet } from "./types";

const column = { display: "grid", gap: "var(--fui-space-3)", inlineSize: "min(100%, 28rem)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" } as const;
const muted = { margin: 0, color: "var(--muted-foreground)" } as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function EndSession() {
  const [open, setOpen] = useState(true);
  const [ended, setEnded] = useState(false);
  return (
    <div style={column}>
      <InlineConfirm
        autoFocus={false}
        cancelLabel="Keep going"
        confirmLabel="End session"
        description="What you answered so far is kept."
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setEnded(true);
          setOpen(false);
        }}
        open={open}
        title="End the session early?"
      />
      <div style={row}>
        <Button onClick={() => setOpen(true)} variant="outline">
          End session
        </Button>
        <span style={muted}>{ended ? "Session ended." : "Step 3 of 12"}</span>
      </div>
    </div>
  );
}

function Abandon() {
  const [open, setOpen] = useState(true);
  const [tries, setTries] = useState(0);
  return (
    <div style={column}>
      <InlineConfirm
        autoFocus={false}
        cancelLabel="Keep going"
        confirmLabel="Abandon the exam"
        description="An abandoned exam has no result. The first try fails here, so you can see the error."
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          await wait(900);
          setTries(tries + 1);
          if (tries === 0) throw new Error("The connection dropped. Try again.");
        }}
        open={open}
        pendingLabel="Abandoning"
        title="Abandon the exam?"
      />
      <Button onClick={() => setOpen(true)} variant="outline">
        Abandon
      </Button>
    </div>
  );
}

function KeepRecording() {
  const [open, setOpen] = useState(true);
  const [days, setDays] = useState(30);
  return (
    <div style={column}>
      <InlineConfirm
        acknowledgement={{ label: `I agree that this recording is kept for ${days} days and then deleted.`, error: "Tick the box to keep the recording" }}
        acknowledgementKey={days}
        autoFocus={false}
        cancelLabel="Not now"
        confirmLabel="Keep the recording"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        open={open}
        title="Keep this recording?"
      >
        <div>
          <Button onClick={() => setDays(days === 30 ? 90 : 30)} size="sm" variant="secondary">
            Keep it for {days === 30 ? 90 : 30} days instead
          </Button>
        </div>
      </InlineConfirm>
      <Button onClick={() => setOpen(true)} variant="outline">
        Keep this recording
      </Button>
    </div>
  );
}

export const inlineConfirmExamples: ExampleSet = {
  preview: () => <EndSession />,
  previewCode: `import { useState } from "react";
import { Button, InlineConfirm } from "@fabrials/ui";

export function EndSession({ onEnd }: { onEnd: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <InlineConfirm
        open={open}
        onOpenChange={setOpen}
        title="End the session early?"
        description="What you answered so far is kept."
        cancelLabel="Keep going"
        confirmLabel="End session"
        onConfirm={onEnd}
      />
      <Button variant="outline" onClick={() => setOpen(true)}>
        End session
      </Button>
    </>
  );
}`,
  examples: [
    {
      id: "destructive",
      title: "Destructive, with a request",
      description:
        "`destructive` tints the block and the answer. When `onConfirm` returns a promise the answer loads and ignores a second press; a rejection is shown in the question, which stays open to try again.",
      code: `<InlineConfirm
  destructive
  open={open}
  onOpenChange={setOpen}
  title="Abandon the exam?"
  description="An abandoned exam has no result."
  cancelLabel="Keep going"
  confirmLabel="Abandon the exam"
  pendingLabel="Abandoning"
  onConfirm={() => abandonExam()}
/>`,
      render: () => <Abandon />,
      align: "start",
    },
    {
      id: "acknowledgement",
      title: "A box that must be ticked",
      description:
        "`acknowledgement` adds a required box. The answer is never disabled: pressed with the box empty, it says what is missing and moves to the box. A new `acknowledgementKey` empties it, because what is agreed to has changed.",
      code: `<InlineConfirm
  open={open}
  onOpenChange={setOpen}
  title="Keep this recording?"
  acknowledgement={{
    label: \`I agree that this recording is kept for \${days} days and then deleted.\`,
    error: "Tick the box to keep the recording",
  }}
  acknowledgementKey={days}
  cancelLabel="Not now"
  confirmLabel="Keep the recording"
  onConfirm={keepRecording}
/>`,
      render: () => <KeepRecording />,
      align: "start",
    },
  ],
};

function Section() {
  const [deadline, setDeadline] = useState(() => Date.now() + 5 * 60_000 + 8_000);
  const [closed, setClosed] = useState(false);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <Countdown deadline={deadline} label="Section 5" onDone={() => setClosed(true)} />
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
      <span style={muted}>{closed ? "The section closed." : "The section is open."}</span>
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
        <div style={{ background: "var(--brand)", blockSize: "100%", inlineSize: `${share * 100}%` }} />
      </div>
      <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)" }}>
        {done ? "Time is up" : remainingMs === null ? "Starting" : `${(remainingMs / 1000).toFixed(1)} s left to answer`}
      </span>
    </div>
  );
}

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

// Three clocks read at a fixed moment, so the preview never ticks.
function Sections() {
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <Countdown deadline={NOW + 308_000} label="Section 2" now={NOW} />
      <Countdown deadline={NOW + 64_000} label="Section 3" now={NOW} />
      <Countdown deadline={NOW + 6_000} label="Section 4" now={NOW} />
      <span style={muted}>Read at a fixed moment: calm, low under five minutes, urgent under one.</span>
    </div>
  );
}

export const countdownExamples: ExampleSet = {
  preview: () => <Sections />,
  previewCode: `import { Countdown } from "@fabrials/ui";

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

export function Sections({ closes }: { closes: number[] }) {
  return (
    <>
      {closes.map((at, index) => (
        <Countdown
          key={at}
          deadline={at}
          label={\`Section \${index + 2}\`}
          now={NOW}
        />
      ))}
    </>
  );
}`,
  examples: [
    {
      id: "press",
      title: "A clock that starts from a press",
      description:
        "A real countdown reads the clock on every tick, so it is right after the tab slept. `formatCountdown` writes the same digits as a label: here the buttons start a section with that much time left.",
      code: `const [deadline, setDeadline] = useState(() => Date.now() + 5 * 60_000 + 8_000);

<Countdown deadline={deadline} label="Section 5" onDone={closeSection} />
<Button onClick={() => setDeadline(Date.now() + 3_000)} size="sm" variant="outline">
  0:03 left
</Button>`,
      render: () => <Section />,
      align: "start",
    },
    {
      id: "tones",
      title: "Tones, sizes and digits",
      description:
        "Calm, `low` at five minutes and `urgent` at one, as a tint, an edge and an icon (`thresholds` moves them). `size=\"sm\"` fits a table or a tab; `hideLabel` keeps the name for screen readers; `locale` writes the reader's digits.",
      code: `<Countdown deadline={deadline} />
<Countdown deadline={deadline} thresholds={{ low: 900, urgent: 300 }} />
<Countdown deadline={deadline} size="sm" hideLabel label="Section 2 closes in" />
<Countdown deadline={deadline} locale="ar-EG" lang="ar" label="الوقت المتبقي" />`,
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
