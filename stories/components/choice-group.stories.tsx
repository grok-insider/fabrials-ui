import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceFeedback, ChoiceGroup, ChoiceOption, type ChoiceGroupProps } from "@fabrials/ui";
import { Block, Frame, Page } from "../story-frame";

const description =
  "The answers to a question as tiles: one answer is a radio group and several are checkboxes, each with a letter or a number, its own key, and the verdict once the question is answered.";

/** The playground shows one answer per question; several are in the overview and the tests bench. */
type ChoiceGroupSingleProps = Extract<ChoiceGroupProps, { multiple?: false }>;

const meta = {
  title: "Components/Choice group",
  component: ChoiceGroup,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { markers: "letters", orientation: "vertical", size: "default", shortcuts: true },
  argTypes: {
    markers: { control: "inline-radio", options: ["letters", "numbers", "none"] },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    columns: { control: { type: "number", min: 1, max: 4 } },
    shortcuts: { control: "boolean" },
    readOnly: { control: "boolean" },
    disabled: { control: "boolean" },
    result: { control: "inline-radio", options: [undefined, "correct", "incorrect"] },
  },
} satisfies Meta<ChoiceGroupSingleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const question = { margin: 0, fontWeight: 600 } as const;
const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;

/** In context: the question of a lesson, its answers, and what comes back once one is picked. */
export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    const checked = value != null;
    return (
      <Page
        description="In a lesson the answers are tiles under the question: the letter and the answer, a second line when the answer needs one, and the verdict under the group once it is checked."
        title="Choice group"
      >
        <Block title="One answer" description="A question with four answers, one of them ruled out by a hint.">
          <Frame width={480}>
            <div style={stack}>
              <p id="overview-question" style={question}>
                Which of these do you say in the evening?
              </p>
              <ChoiceGroup
                aria-describedby="overview-hint"
                aria-labelledby="overview-question"
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
              <p id="overview-hint" style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
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
          </Frame>
        </Block>
        <Block title="Several answers" description="Each answer is a checkbox, and a hint took one out.">
          <Frame width={480}>
            <div style={stack}>
              <p id="overview-primes" style={question}>
                Which of these are prime?
              </p>
              <ChoiceGroup aria-labelledby="overview-primes" defaultValue={["7"]} markers="numbers" multiple>
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
          </Frame>
        </Block>
        <Block title="Answered" description="A wrong pick, and the right answer it missed.">
          <Frame width={480}>
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
          </Frame>
        </Block>
      </Page>
    );
  },
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => {
    const props = args as ChoiceGroupSingleProps;
    const [value, setValue] = useState<string | null>(null);
    return (
      <div style={{ maxWidth: "34rem" }}>
        <div style={stack}>
          <p id="playground-question" style={question}>
            Which of these do you say in the evening?
          </p>
          <ChoiceGroup
            {...props}
            aria-labelledby="playground-question"
            onValueChange={setValue}
            value={value}
          >
            <ChoiceOption value="bonjour">
              <span lang="fr">Bonjour</span>
            </ChoiceOption>
            <ChoiceOption description="From about six." value="bonsoir">
              <span lang="fr">Bonsoir</span>
            </ChoiceOption>
            <ChoiceOption ruledOut value="merci">
              <span lang="fr">Merci</span>
            </ChoiceOption>
          </ChoiceGroup>
        </div>
      </div>
    );
  },
};
