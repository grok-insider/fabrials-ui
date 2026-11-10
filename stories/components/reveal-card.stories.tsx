import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RatingBar, RevealCard, RevealCardProps } from "@fabrials/ui";
import { Block, Page } from "../story-frame";

const description =
  "A card with a question and an answer the reader asks for: Space or the button reveals it, the answer is announced, focus stays on the card, and the ratings take a number key.";

const meta = {
  title: "Components/Reveal card",
  component: RevealCard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    front: <strong style={{ fontSize: "var(--fui-text-xl)" }}>le phare</strong>,
    back: <span>the lighthouse</span>,
    label: "Card 3 of 20",
    revealLabel: "Show answer",
    revealKeyLabel: "Space",
    shortcuts: true,
  },
  argTypes: {
    revealed: { control: "boolean" },
    shortcuts: { control: "boolean" },
    revealLabel: { control: "text" },
    revealKeyLabel: { control: "text" },
    label: { control: "text" },
  },
} satisfies Meta<RevealCardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;

const RATINGS = [
  { value: "again", label: "Again", hint: "In 1 minute", tone: "danger" },
  { value: "hard", label: "Hard", hint: "In 2 days", tone: "warning" },
  { value: "good", label: "Good", hint: "In 5 days", tone: "success" },
] as const;

/** A review session in place: reveal, rate, and the next card comes up with the focus back on it. */
function Session() {
  const CARDS = [
    { front: "le phare", back: "the lighthouse", translation: "a tower with a light that guides ships" },
    { front: "le port", back: "the harbour", translation: "where boats come in" },
    { front: "la vague", back: "the wave", translation: "water moving on the sea" },
  ];
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
      <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>Reviewed: {rated}</p>
    </div>
  );
}

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Page description="A review session: the card asks, Space reveals, and 1 to 3 rate it, which brings up the next card with the focus on it." title="Reveal card">
      <Block title="A session">
        <div style={{ width: "100%", maxWidth: 480, minWidth: 0 }}>
          <Session />
        </div>
      </Block>
      <Block title="The two sides" description="Hidden with the key to press, and revealed with the ratings and what they mean.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
            <RevealCard back={<span>the harbour</span>} front={<strong style={{ fontSize: "var(--fui-text-xl)" }}>le port</strong>} label="Card 2 of 20" shortcuts={false} />
          </div>
          <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
            <RevealCard back={<span>the harbour</span>} defaultRevealed front={<strong style={{ fontSize: "var(--fui-text-xl)" }}>le port</strong>} label="Card 2 of 20" shortcuts={false}>
              <RatingBar label="How well did you know it?" onRate={() => {}} options={RATINGS} shortcuts={false} />
            </RevealCard>
          </div>
        </div>
      </Block>
    </Page>
  ),
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => {
    const [revealed, setRevealed] = useState(args.revealed ?? false);
    const [rated, setRated] = useState<string | null>(null);
    return (
      <div style={{ maxWidth: "26rem" }}>
        <RevealCard {...args} onRevealedChange={setRevealed} revealed={revealed}>
          <div style={stack}>
            <RatingBar label="How well did you know it?" onRate={(value) => setRated(value)} options={RATINGS} />
            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>Rated: {rated ?? "not yet"}</p>
          </div>
        </RevealCard>
      </div>
    );
  },
};
