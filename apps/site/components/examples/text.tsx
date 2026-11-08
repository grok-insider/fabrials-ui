"use client";

import { useEffect, useState } from "react";
import { ScrambleText, ShimmerText, useScramble } from "@fabrials/ui";
import type { ExampleSet } from "./types";

const STEPS = ["Reading the schema", "Comparing the two migrations", "Drafting the change", "Checking the row counts"];

/** Moves to the next step every `every` ms, as a stream of an agent's steps would. */
function useStep(every = 2400) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => (value + 1) % STEPS.length), every);
    return () => window.clearInterval(timer);
  }, [every]);
  return STEPS[step]!;
}

function Steps() {
  const step = useStep();
  return (
    <p style={{ margin: 0, fontSize: "var(--fui-text-sm)", color: "var(--muted-foreground)" }}>
      <ScrambleText>{step}</ScrambleText>
    </p>
  );
}

function Heading() {
  const titles = ["Q3 invoices", "Q3 invoices, by region", "Q3 invoices, by region and plan"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % titles.length), 2800);
    return () => window.clearInterval(timer);
  }, [titles.length]);
  return (
    <ScrambleText as="h3" style={{ margin: 0, fontSize: "var(--fui-text-lg)", fontWeight: "var(--fui-weight-semibold)" }}>
      {titles[index]!}
    </ScrambleText>
  );
}

function OwnElement() {
  const step = useStep(2600);
  const frame = useScramble(step);
  return (
    <span className="fui-scramble-text" data-scrambling={frame !== null || undefined} style={{ fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)", letterSpacing: "var(--fui-tracking-label)" }}>
      {step}
      {frame !== null ? (
        <span aria-hidden="true" className="fui-scramble-text-frame">
          {frame}
        </span>
      ) : null}
    </span>
  );
}

export const scrambleTextExamples: ExampleSet = {
  preview: () => <Steps />,
  previewCode: `import { ScrambleText } from "@fabrials/ui";

// \`step\` is what the work is doing now, from your stream.
export function Step({ step }: { step: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      <ScrambleText>{step}</ScrambleText>
    </p>
  );
}`,
  examples: [
    {
      id: "change",
      title: "Only when it changes",
      description:
        "A new text scrambles into place in 320 ms, settling left to right in reading order, drawn from its own letters so any script keeps its look. The first render, a text that does not change and reduced motion show it at once; it never loops. `AgentThinking` and the activity rows do this for you.",
      code: `<ScrambleText>{step}</ScrambleText>`,
      render: () => <Steps />,
    },
    {
      id: "width",
      title: "It keeps its place",
      description:
        "The real text keeps its place and width the whole time, unseen, and the scramble is drawn over it and clipped to it, so nothing beside it moves. It is the real text that assistive technology reads. `as` picks the element and `duration` the time it takes.",
      code: `<ScrambleText as="h3" duration={400}>{title}</ScrambleText>`,
      render: () => <Heading />,
    },
    {
      id: "hook",
      title: "On your own element",
      description:
        "`useScramble(text)` returns the frame to draw while a new text settles, or null. Draw it over the real text in an element with `fui-scramble-text` and `data-scrambling`, and the styles do the rest.",
      code: `const frame = useScramble(step);

<span className="fui-scramble-text" data-scrambling={frame !== null || undefined}>
  {step}
  {frame !== null ? (
    <span aria-hidden="true" className="fui-scramble-text-frame">{frame}</span>
  ) : null}
</span>`,
      render: () => <OwnElement />,
    },
  ],
};

export const shimmerTextExamples: ExampleSet = {
  preview: () => (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", justifyItems: "start" }}>
      <ShimmerText as="span" tone="light">
        Summarising 14 messages
      </ShimmerText>
      <ShimmerText as="span" tone="light" variant="letters">
        Reading the release notes
      </ShimmerText>
    </div>
  ),
  previewCode: `import { ShimmerText } from "@fabrials/ui";

export function Working() {
  return (
    <>
      <ShimmerText as="span" tone="light">
        Summarising 14 messages
      </ShimmerText>
      <ShimmerText as="span" tone="light" variant="letters">
        Reading the release notes
      </ShimmerText>
    </>
  );
}`,
  examples: [
    {
      id: "band",
      title: "A band of light",
      description:
        "The default crosses the muted text with a soft band. `tone=\"ink\"` sweeps the foreground, for a pending label; `tone=\"light\"` sweeps the working light, for words that name an agent at work. `duration` is one pass, in seconds.",
      code: `<ShimmerText>Loading the history</ShimmerText>
<ShimmerText tone="light" duration={1.6}>Summarising 14 messages</ShimmerText>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <ShimmerText as="span">Loading the history</ShimmerText>
          <ShimmerText as="span" duration={1.6} tone="light">
            Summarising 14 messages
          </ShimmerText>
        </div>
      ),
    },
    {
      id: "letters",
      title: "Letter by letter",
      description:
        "`variant=\"letters\"` steps the light one letter at a time with a trail of two, like a cursor reading the line: for reading and indexing, where a sweep would be too soft. Screen readers read the words once, whole. Under reduced motion it is plain muted text.",
      code: `<ShimmerText tone="light" variant="letters">Reading the release notes</ShimmerText>
<ShimmerText variant="letters" duration={1.4}>Indexing the mailbox</ShimmerText>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <ShimmerText as="span" tone="light" variant="letters">
            Reading the release notes
          </ShimmerText>
          <ShimmerText as="span" duration={1.4} variant="letters">
            Indexing the mailbox
          </ShimmerText>
        </div>
      ),
    },
  ],
};
