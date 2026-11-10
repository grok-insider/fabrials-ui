import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RatingBar, RevealCard, RevealCardProps } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { revealCardExamples as examples } from "../../apps/site/components/examples/answers";

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

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Reveal card" />,
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
