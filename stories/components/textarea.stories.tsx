import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, FieldContent, FieldDescription, FieldLabel, Input, Textarea, useField } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "The box a person writes in: it grows with the text, counts what it holds as characters, words or graphemes, and says when the text is past the limit it was given.";

const stack = { display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" } as const;
const line = (words: number) => Array.from({ length: words }, () => "kept").join(" ");

function Draft() {
  const [value, setValue] = useState("The relay stopped reporting at 11:42, and nothing was lost: the queue kept every request.");
  return (
    <Field description="Up to 40 words. Past that the count says how far you are." label="What happened" optional>
      {(props) => <Textarea {...props} count={{ max: 40, unit: "words" }} onInput={(event) => setValue(event.currentTarget.value)} rows={3} value={value} />}
    </Field>
  );
}

const examples: ExampleSet = {
  preview: () => <Draft />,
  previewCode: `<Field label="What happened" optional description="Up to 40 words.">
  {(props) => <Textarea {...props} count={{ max: 40, unit: "words" }} rows={3} />}
</Field>`,
  examples: [
    {
      id: "characters",
      title: "A soft limit, under and past it",
      description:
        "The field never truncates: past the limit the counter turns to the danger ink and says how far, and a polite region reads the crossing once. `count={true}` is a bare counter.",
      code: `<Textarea count={{ max: 40 }} defaultValue="Rename the nightly job." rows={2} />
<Textarea count={{ max: 40 }} defaultValue="Rename the nightly job to the relay's own name." rows={2} />
<Textarea count={true} defaultValue="No limit, only a count." rows={2} />`,
      render: () => (
        <div style={stack}>
          <Field label="Release note">{(props) => <Textarea {...props} count={{ max: 40 }} defaultValue="Rename the nightly job." rows={2} />}</Field>
          <Field label="Commit message">
            {(props) => <Textarea {...props} count={{ max: 40 }} defaultValue="Rename the nightly job to the relay's own name." rows={2} />}
          </Field>
          <Field label="Any length">{(props) => <Textarea {...props} count={true} defaultValue="No limit, only a count." rows={2} />}</Field>
        </div>
      ),
    },
    {
      id: "words",
      title: "Words and graphemes",
      description:
        "`unit=\"words\"` counts what the language calls a word, so a Chinese sentence is not one; `unit=\"graphemes\"` counts what a person sees, so a letter with its accents is one.",
      code: `<Textarea count={{ max: 20, unit: "words" }} rows={2} />
<Textarea count={{ max: 60, unit: "graphemes" }} defaultValue="حَرَكَة" rows={2} />`,
      render: () => (
        <div style={stack}>
          <Field label="Summary" optional>
            {(props) => <Textarea {...props} count={{ max: 20, unit: "words" }} defaultValue={line(23)} rows={2} />}
          </Field>
          <Field label="ملاحظة">
            {(props) => <Textarea {...props} count={{ max: 60, unit: "graphemes" }} defaultValue="حَرَكَة" rows={2} />}
          </Field>
        </div>
      ),
    },
    {
      id: "hard",
      title: "A limit that stops the typing",
      description:
        "`soft: false` sets `maxlength`, so a count of characters cannot pass the limit. Words and graphemes cannot be stopped by an input: there the counter still counts, and only counts.",
      code: `<Input count={{ max: 12, soft: false }} />
<Textarea count={{ max: 12, soft: false, unit: "words" }} rows={2} />`,
      render: () => (
        <div style={stack}>
          <Field label="Short code" description="Twelve characters, and not one more.">
            {(props) => <Input {...props} count={{ max: 12, soft: false }} />}
          </Field>
          <Field label="Summary in words" description="Twelve words: counted, not stopped.">
            {(props) => <Textarea {...props} count={{ max: 12, soft: false, unit: "words" }} rows={2} />}
          </Field>
        </div>
      ),
    },
    {
      id: "grow",
      title: "Growing with the text",
      description: "`autoResize` measures the box it needs, between `minRows` and `maxRows`, then it scrolls.",
      code: `<Textarea autoResize maxRows={6} minRows={2} rows={2} />`,
      render: () => (
        <Field label="Notes">
          {(props) => <Textarea {...props} autoResize defaultValue="One line." maxRows={6} minRows={2} rows={2} />}
        </Field>
      ),
    },
    {
      id: "invalid",
      title: "What went wrong",
      description: "A field can say what is wrong with the text; the textarea is marked invalid and described by the error.",
      code: `<Field label="Commit message" error="A commit message is required.">
  {(props) => <Textarea {...props} count={{ max: 72 }} rows={2} />}
</Field>`,
      render: () => (
        <Field error="A commit message is required." label="Commit message" required>
          {(props) => <Textarea {...props} count={{ max: 72 }} rows={2} />}
        </Field>
      ),
    },
    {
      id: "parts",
      title: "Written out as parts",
      description:
        "The same field assembled from `FieldLabel`, `FieldContent`, `FieldDescription` and `FieldError`, with `useField()` for the ids the control needs.",
      code: `<Field id="note">
  <FieldLabel required>Note</FieldLabel>
  <FieldContent>
    <Textarea aria-describedby={field.describedBy} id={field.id} count={{ max: 120 }} rows={2} />
    <FieldDescription>Seen by the whole team.</FieldDescription>
  </FieldContent>
</Field>`,
      render: () => (
        <Field id="story-note">
          <PartsNote />
        </Field>
      ),
    },
  ],
};

function PartsNote() {
  const field = useField();
  return (
    <>
      <FieldLabel required>Note</FieldLabel>
      <FieldContent>
        <Textarea aria-describedby={field.describedBy} aria-invalid={field.invalid || undefined} count={{ max: 120 }} id={field.id} rows={2} />
        <FieldDescription>Seen by the whole team.</FieldDescription>
      </FieldContent>
    </>
  );
}

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { placeholder: "Say what happened", rows: 3, autoResize: false, count: { max: 120 } },
  argTypes: {
    count: { control: "object" },
    autoResize: { control: "boolean" },
    rows: { control: { type: "number", min: 1, max: 12 } },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Textarea" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <Field label="Message">{(props) => <Textarea {...props} {...args} />}</Field>
    </div>
  ),
};
