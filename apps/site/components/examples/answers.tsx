"use client";

import { useState } from "react";
import { ChoiceFeedback, ChoiceGroup, ChoiceOption, RatingBar, RevealCard, StepControls, useStepPlayer } from "@fabrials/ui";
import type { ExampleSet } from "./types";

const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;
const question = { margin: 0, fontWeight: 600 } as const;
const muted = { margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" } as const;
const plate = { display: "grid", gap: "var(--fui-space-2)", padding: "var(--fui-space-4)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)", background: "var(--card)" } as const;

function OneAnswer() {
  const [value, setValue] = useState<string | null>(null);
  const checked = value != null;
  return (
    <div style={stack}>
      <p id="choice-question" style={question}>
        Which of these do you say in the evening?
      </p>
      <ChoiceGroup
        aria-describedby="choice-hint"
        aria-labelledby="choice-question"
        onValueChange={setValue}
        result={checked ? (value === "bonsoir" ? "correct" : "incorrect") : undefined}
        shortcuts
        value={value}
      >
        <ChoiceOption value="bonjour">
          <span lang="fr">Bonjour</span>
        </ChoiceOption>
        <ChoiceOption description="From about six in the evening." value="bonsoir">
          <span lang="fr">Bonsoir</span>
        </ChoiceOption>
        <ChoiceOption ruledOut value="merci">
          <span lang="fr">Merci</span>
        </ChoiceOption>
        <ChoiceOption value="salut">
          <span lang="fr">Salut</span>
        </ChoiceOption>
      </ChoiceGroup>
      <p id="choice-hint" style={muted}>
        Press A to D, or pick one.
      </p>
      {checked ? (
        value === "bonsoir" || value === "salut" ? (
          <ChoiceFeedback tone={value === "bonsoir" ? "correct" : "partial"}>
            {value === "bonsoir" ? "That is the evening one." : "Salut works any time of day; Bonsoir is the evening one."}
          </ChoiceFeedback>
        ) : (
          <ChoiceFeedback tone="incorrect">
            <span lang="fr">Bonjour</span> is for the day; <span lang="fr">Bonsoir</span> from about six.
          </ChoiceFeedback>
        )
      ) : null}
    </div>
  );
}

function SeveralAnswers() {
  return (
    <div style={stack}>
      <p id="choice-primes" style={question}>
        Which of these are prime?
      </p>
      <ChoiceGroup aria-labelledby="choice-primes" defaultValue={["7"]} markers="numbers" multiple>
        <ChoiceOption description="Seven times one." value="7">
          7
        </ChoiceOption>
        <ChoiceOption description="Three times three." value="9">
          9
        </ChoiceOption>
        <ChoiceOption value="13">13</ChoiceOption>
        <ChoiceOption ruledOut value="21">
          21
        </ChoiceOption>
      </ChoiceGroup>
    </div>
  );
}

function Answered() {
  return (
    <div style={stack}>
      <ChoiceGroup aria-label="Evening, answered" result="incorrect" value="bonjour">
        <ChoiceOption value="bonjour">
          <span lang="fr">Bonjour</span>
        </ChoiceOption>
        <ChoiceOption result="missed" value="bonsoir">
          <span lang="fr">Bonsoir</span>
        </ChoiceOption>
        <ChoiceOption value="salut">
          <span lang="fr">Salut</span>
        </ChoiceOption>
      </ChoiceGroup>
      <ChoiceFeedback tone="incorrect">
        <span lang="fr">Bonsoir</span> is the evening one.
      </ChoiceFeedback>
    </div>
  );
}

export const choiceGroupExamples: ExampleSet = {
  preview: () => <OneAnswer />,
  previewCode: `import { useState } from "react";
import { ChoiceFeedback, ChoiceGroup, ChoiceOption } from "@fabrials/ui";

export function Evening() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <p id="evening-question">Which of these do you say in the evening?</p>
      <ChoiceGroup
        aria-labelledby="evening-question"
        value={value}
        onValueChange={setValue}
        result={
          value ? (value === "bonsoir" ? "correct" : "incorrect") : undefined
        }
        shortcuts
      >
        <ChoiceOption value="bonjour">Bonjour</ChoiceOption>
        <ChoiceOption value="bonsoir" description="From about six.">
          Bonsoir
        </ChoiceOption>
        <ChoiceOption value="merci" ruledOut>
          Merci
        </ChoiceOption>
      </ChoiceGroup>
      {value ? (
        <ChoiceFeedback tone={value === "bonsoir" ? "correct" : "incorrect"}>
          {value === "bonsoir"
            ? "That is the evening one."
            : "Bonsoir is the evening one."}
        </ChoiceFeedback>
      ) : null}
    </>
  );
}`,
  examples: [
    {
      id: "several",
      title: "Several answers",
      description:
        "`multiple` makes a group of checkboxes: each option is its own tab stop, Space ticks it, and the value is the list of what is ticked. `markers=\"numbers\"` counts them in the locale's digits instead of letters, and a hint can take one out.",
      code: `<ChoiceGroup multiple markers="numbers" aria-labelledby="primes" defaultValue={["7"]}>
  <ChoiceOption value="7" description="Seven times one.">7</ChoiceOption>
  <ChoiceOption value="9" description="Three times three.">9</ChoiceOption>
  <ChoiceOption value="13">13</ChoiceOption>
  <ChoiceOption value="21" ruledOut>21</ChoiceOption>
</ChoiceGroup>`,
      render: () => <SeveralAnswers />,
      align: "start",
    },
    {
      id: "answered",
      title: "Answered",
      description:
        "A `result` on the group turns it read-only and marks the pick as right or wrong; `missed` marks the right answer that was not picked. Each mark is an icon and a word, and `ChoiceFeedback` says what became of the answer.",
      code: `<ChoiceGroup result="incorrect" value="bonjour" aria-label="Evening, answered">
  <ChoiceOption value="bonjour">Bonjour</ChoiceOption>
  <ChoiceOption value="bonsoir" result="missed">Bonsoir</ChoiceOption>
  <ChoiceOption value="salut">Salut</ChoiceOption>
</ChoiceGroup>
<ChoiceFeedback tone="incorrect">Bonsoir is the evening one.</ChoiceFeedback>`,
      render: () => <Answered />,
      align: "start",
    },
  ],
};

const RATINGS = [
  { value: "again", label: "Again", hint: "In 1 minute", tone: "danger" as const },
  { value: "hard", label: "Hard", hint: "In 2 days", tone: "warning" as const },
  { value: "good", label: "Good", hint: "In 5 days", tone: "success" as const },
];

const CARDS = [
  { front: "le phare", back: "the lighthouse", translation: "a tower with a light that guides ships" },
  { front: "le port", back: "the harbour", translation: "where boats come in" },
  { front: "la vague", back: "the wave", translation: "water moving on the sea" },
];

function Session() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(0);
  const card = CARDS[index]!;
  const done = index >= CARDS.length;
  return (
    <div style={stack}>
      {done ? (
        <p style={{ margin: 0 }}>That is the session: {rated} cards reviewed.</p>
      ) : (
        <RevealCard
          back={
            <span style={stack}>
              <strong style={{ fontSize: "var(--fui-text-lg)" }}>{card.back}</strong>
              <span style={{ color: "var(--muted-foreground)" }}>{card.translation}</span>
            </span>
          }
          front={<strong style={{ fontSize: "var(--fui-text-xl)" }}>{card.front}</strong>}
          label={`Card ${index + 1} of ${CARDS.length}`}
          onRevealedChange={setRevealed}
          revealed={revealed}
        >
          <RatingBar
            label="How well did you know it?"
            onRate={() => {
              setRated((count) => count + 1);
              setRevealed(false);
              setIndex((at) => at + 1);
            }}
            options={RATINGS}
          />
        </RevealCard>
      )}
      <p style={muted}>Reviewed: {rated}</p>
    </div>
  );
}

export const revealCardExamples: ExampleSet = {
  preview: () => <Session />,
  previewCode: `import { useState } from "react";
import { RatingBar, RevealCard } from "@fabrials/ui";

const RATINGS = [
  { value: "again", label: "Again", hint: "In 1 minute" },
  { value: "hard", label: "Hard", hint: "In 2 days" },
  { value: "good", label: "Good", hint: "In 5 days" },
];

export function ReviewSession({
  cards,
}: {
  cards: { front: string; back: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  return (
    <RevealCard
      front={cards[index].front}
      back={cards[index].back}
      label={\`Card \${index + 1} of \${cards.length}\`}
      revealed={revealed}
      onRevealedChange={setRevealed}
    >
      <RatingBar
        label="How well did you know it?"
        options={RATINGS}
        onRate={() => {
          setRevealed(false);
          setIndex((at) => at + 1);
        }}
      />
    </RevealCard>
  );
}`,
  examples: [
    {
      id: "sides",
      title: "The two sides",
      description:
        "The question is always there and the answer is asked for. `defaultRevealed` shows the answer side with what follows it, so a page can explain both.",
      code: `<RevealCard front={<strong>le port</strong>} back="the harbour" label="Card 2 of 20" shortcuts={false} />
<RevealCard defaultRevealed front={<strong>le port</strong>} back="the harbour" label="Card 2 of 20" shortcuts={false}>
  <RatingBar label="How well did you know it?" options={RATINGS} onRate={rate} shortcuts={false} />
</RevealCard>`,
      render: () => (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "start", gap: "var(--fui-space-4)" }}>
          <div style={{ inlineSize: "100%", maxInlineSize: "20rem", minWidth: 0 }}>
            <RevealCard back={<span>the harbour</span>} front={<strong style={{ fontSize: "var(--fui-text-xl)" }}>le port</strong>} label="Card 2 of 20" shortcuts={false} />
          </div>
          <div style={{ inlineSize: "100%", maxInlineSize: "20rem", minWidth: 0 }}>
            <RevealCard back={<span>the harbour</span>} defaultRevealed front={<strong style={{ fontSize: "var(--fui-text-xl)" }}>le port</strong>} label="Card 2 of 20" shortcuts={false}>
              <RatingBar label="How well did you know it?" onRate={() => {}} options={RATINGS} shortcuts={false} />
            </RevealCard>
          </div>
        </div>
      ),
      align: "start",
    },
  ],
};

const FRAMES = [
  "Compare 4 and 7: they are in order.",
  "Swap them: 7, 4.",
  "Compare 7 and 2: swap.",
  "Now 4, 2: compare again.",
  "Nothing left to swap: the list is sorted.",
];

function Frames() {
  const player = useStepPlayer({ count: FRAMES.length, interval: 1400 });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <div style={{ ...plate, inlineSize: "min(100%, 26rem)" }}>
        <p style={muted}>Frame {player.index + 1}</p>
        <p style={{ margin: 0 }}>{FRAMES[player.index]}</p>
      </div>
      <StepControls {...player} aria-label="Frames of the sort" reset speeds={[0.5, 1, 2]} />
    </div>
  );
}

function Pager() {
  const [index, setIndex] = useState(0);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <p style={{ margin: 0 }}>{FRAMES[index]}</p>
      <StepControls count={FRAMES.length} index={index} locale="en" next={() => setIndex(Math.min(FRAMES.length - 1, index + 1))} previous={() => setIndex(Math.max(0, index - 1))} />
    </div>
  );
}

export const stepControlsExamples: ExampleSet = {
  preview: () => <Frames />,
  previewCode: `import { StepControls, useStepPlayer } from "@fabrials/ui";

const frames = [
  "Compare 4 and 7: they are in order.",
  "Swap them: 7, 4.",
  "Compare 7 and 2: swap.",
  "Nothing left to swap: the list is sorted.",
];

export function SortFrames() {
  const player = useStepPlayer({ count: frames.length, interval: 1400 });
  return (
    <>
      <p>{frames[player.index]}</p>
      <StepControls
        {...player}
        aria-label="Frames of the sort"
        reset
        speeds={[0.5, 1, 2]}
      />
    </>
  );
}`,
  examples: [
    {
      id: "pager",
      title: "A pager: previous and next",
      description:
        "Without `toggle` there is no play key, so previous and next alone make a pager: a walk-through someone drives. The counter says where they are and the ends turn their key off.",
      code: `<StepControls
  count={frames.length}
  index={index}
  next={() => setIndex(Math.min(frames.length - 1, index + 1))}
  previous={() => setIndex(Math.max(0, index - 1))}
/>`,
      render: () => <Pager />,
      align: "start",
    },
    {
      id: "direction",
      title: "In a right-to-left page",
      description:
        "The chevrons and the order follow the direction: `dir=\"rtl\"` on the page or the panel is enough, and the arrow keys keep their meaning for the reader.",
      code: `<div dir="rtl" lang="ar">
  <StepControls {...player} aria-label="إطارات الترتيب" />
</div>`,
      render: () => (
        <div dir="rtl" lang="ar">
          <Frames />
        </div>
      ),
      align: "start",
    },
  ],
};
