"use client";

import { useState } from "react";
import {
  Checkbox,
  Field,
  Input,
  Label,
  NumberField,
  PasswordInput,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  SliderGroup,
  Switch,
  Textarea,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const form = { display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 22rem)" } as const;
const choice = { display: "flex", alignItems: "center", gap: "var(--fui-space-2)" } as const;

function Alias() {
  const [alias, setAlias] = useState("");
  return (
    <Field description="Shown in the account list." error={alias.trim() === "" ? "Enter an alias." : undefined} label="Account alias">
      {(props) => <Input {...props} name="alias" onChange={(event) => setAlias(event.currentTarget.value)} placeholder="Engineering" value={alias} />}
    </Field>
  );
}

function Notifications() {
  const [on, setOn] = useState(true);
  return (
    <label style={{ ...choice, justifyContent: "space-between", width: "min(100%, 22rem)" }}>
      <span style={{ display: "grid" }}>
        <span style={{ fontWeight: 500 }}>Quota resets</span>
        <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>A desktop notice when a quota resets.</span>
      </span>
      <Switch checked={on} onCheckedChange={setOn} />
    </label>
  );
}

export const fieldExamples: ExampleSet = {
  examples: [
    {
      id: "field",
      title: "Label, hint and error",
      description:
        "`Field` connects a `label`, a `description` and an `error` to its control: the render function receives `id`, `aria-describedby` and `aria-invalid` to spread on it. The error is announced when it appears.",
      code: `<Field label="Account alias" description="Shown in the account list." error={error}>
  {(props) => <Input {...props} name="alias" value={alias} onChange={update} />}
</Field>`,
      render: () => (
        <div style={form}>
          <Alias />
        </div>
      ),
    },
    {
      id: "kinds",
      title: "Fields for what they hold",
      description: "`SearchInput` clears with Escape and a button, `PasswordInput` shows and hides its value, `NumberField` steps with arrows and keys, `Textarea autoResize` grows with its text.",
      code: `<SearchInput aria-label="Search senders" placeholder="Search senders" />
<PasswordInput aria-label="App password" />
<NumberField aria-label="Batch size" defaultValue={500} min={100} max={5000} step={100} unit="rows" />
<Textarea autoResize minRows={2} maxRows={6} aria-label="Note" />`,
      render: () => (
        <div style={form}>
          <SearchInput aria-label="Search senders" placeholder="Search senders" />
          <PasswordInput aria-label="App password" defaultValue="correct horse" />
          <NumberField aria-label="Batch size" defaultValue={500} max={5000} min={100} step={100} unit="rows" />
          <Textarea aria-label="Note" autoResize maxRows={6} minRows={2} placeholder="What should the operator know?" />
        </div>
      ),
    },
    {
      id: "required",
      title: "Required, optional, and the words for them",
      description:
        "`required` adds an asterisk and the word itself for a screen reader; `optional` writes the word in muted ink, and `required` wins when both are given. A `LabelsProvider` sets both words for every field (scope `field`).",
      code: `<Field label="Street address" required>{(props) => <Input {...props} />}</Field>
<Field label="Second line" optional>{(props) => <Input {...props} />}</Field>`,
      render: () => (
        <div style={form}>
          <Field label="Street address" required>{(props) => <Input {...props} defaultValue="12 North Quay" />}</Field>
          <Field label="Second line" optional>{(props) => <Input {...props} />}</Field>
        </div>
      ),
    },
  ],
};

export const selectExamples: ExampleSet = {
  examples: [
    {
      id: "basic",
      title: "One of a few",
      description:
        "`Select` is a button that opens a list: the trigger shows `SelectValue`, the popup holds `SelectItem`s. `items` maps each value to the words the trigger shows. Name it with a `Label` pointing at the trigger.",
      code: `<Label htmlFor="density">Density</Label>
<Select defaultValue="standard" items={{ standard: "Standard", compact: "Compact" }}>
  <SelectTrigger id="density"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="standard">Standard</SelectItem>
    <SelectItem value="compact">Compact</SelectItem>
  </SelectContent>
</Select>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)", width: "min(100%, 14rem)" }}>
          <Label htmlFor="example-density">Density</Label>
          <Select defaultValue="standard" items={{ standard: "Standard", compact: "Compact" }}>
            <SelectTrigger id="example-density">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ],
};

export const checkboxExamples: ExampleSet = {
  examples: [
    {
      id: "label",
      title: "Inside its label",
      description: "Wrap the box and its words in a `Label` so the words toggle it too. A ticked box is a key in Stormlight; the tick is drawn.",
      code: `<Label className="fui-choice">
  <Checkbox defaultChecked /> Include archived records
</Label>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <Label className="fui-choice">
            <Checkbox defaultChecked /> Include archived records
          </Label>
          <Label className="fui-choice">
            <Checkbox /> Only senders with one-click unsubscribe
          </Label>
        </div>
      ),
      align: "start",
    },
    {
      id: "indeterminate",
      title: "Some of a list",
      description: "`indeterminate` shows a dash for a parent whose children are partly chosen; pressing it chooses all of them.",
      code: `<Checkbox indeterminate={some && !all} checked={all} onCheckedChange={toggleAll} />`,
      render: () => (
        <Label className="fui-choice">
          <Checkbox indeterminate /> 2 of 5 senders
        </Label>
      ),
    },
  ],
};

export const switchExamples: ExampleSet = {
  examples: [
    {
      id: "setting",
      title: "A setting that applies at once",
      description: "A switch changes something now, without a Save. The track fills with Stormlight when on; the thumb stretches while held and springs across.",
      code: `<label className="row">
  Quota resets
  <Switch checked={on} onCheckedChange={setOn} />
</label>`,
      render: () => <Notifications />,
    },
  ],
};

export const radioGroupExamples: ExampleSet = {
  examples: [
    {
      id: "group",
      title: "One of several, all in view",
      description: "`RadioGroup` holds `Radio`s with a `value` each; arrows move between them. Name the group with `aria-label` or a visible legend.",
      code: `<RadioGroup defaultValue="balanced" aria-label="Routing mode">
  <Label className="fui-choice"><Radio value="balanced" /> Balanced across accounts</Label>
  <Label className="fui-choice"><Radio value="drain" /> Drain one account at a time</Label>
  <Label className="fui-choice"><Radio value="manual" /> Manual only</Label>
</RadioGroup>`,
      render: () => (
        <RadioGroup aria-label="Routing mode" defaultValue="balanced">
          <Label className="fui-choice">
            <Radio value="balanced" /> Balanced across accounts
          </Label>
          <Label className="fui-choice">
            <Radio value="drain" /> Drain one account at a time
          </Label>
          <Label className="fui-choice">
            <Radio value="manual" /> Manual only
          </Label>
        </RadioGroup>
      ),
      align: "start",
    },
  ],
};

export const sliderExamples: ExampleSet = {
  examples: [
    {
      id: "value",
      title: "A value with its reading",
      description: "`showValue` prints the value at the end in the label voice; `marks` draws a ruler under the track, each mark optionally labelled.",
      code: `<Slider aria-label="Batch size" defaultValue={40} showValue marks={[0, 25, 50, 75, 100]} />`,
      render: () => (
        <div style={{ width: "min(100%, 22rem)" }}>
          <Slider aria-label="Batch size" defaultValue={40} marks={[0, 25, 50, 75, 100]} showValue />
        </div>
      ),
    },
    {
      id: "range",
      title: "A range",
      description: "Pass an array for two thumbs and `thumbLabels` to name each one.",
      code: `<Slider defaultValue={[20, 80]} thumbLabels={["Minimum price", "Maximum price"]} showValue />`,
      render: () => (
        <div style={{ width: "min(100%, 22rem)" }}>
          <Slider defaultValue={[20, 80]} showValue thumbLabels={["Minimum price", "Maximum price"]} />
        </div>
      ),
    },
    {
      id: "row",
      title: "A name, a track and a reading",
      description:
        "`label` makes the slider a row of name, track and value, and the name is the thumb's; `unit` is said and written after the value, including in `aria-valuetext`. `onValueCommitted` runs once when a drag ends or a key is released. `SliderGroup` lines several of them up column by column.",
      code: `<Slider label="Rows per page" defaultValue={40} max={200} step={10} unit="rows" showValue />
<Slider label="Badge width" defaultValue={72} max={120} unit="px" showValue />

<SliderGroup>
  <Slider label="Warning at" defaultValue={80} unit="%" showValue />
  <Slider label="Danger at" defaultValue={95} unit="%" showValue />
</SliderGroup>`,
      render: () => (
        <div style={form}>
          <Slider defaultValue={40} label="Rows per page" max={200} showValue step={10} unit="rows" />
          <Slider defaultValue={72} label="Badge width" max={120} showValue unit="px" />
          <SliderGroup>
            <Slider defaultValue={80} label="Warning at" showValue unit="%" />
            <Slider defaultValue={95} label="Danger at" showValue unit="%" />
          </SliderGroup>
        </div>
      ),
    },
  ],
};
