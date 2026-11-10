import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceGroup, ChoiceOption, type ChoiceGroupProps } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { choiceGroupExamples as examples } from "../../apps/site/components/examples/answers";

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

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Choice group" />,
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
