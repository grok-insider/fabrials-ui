"use client";

// The controls 0.12 added or extended: a counter under a field, a field written part by part, one pressed key, a title
// renamed in place, a keyboard for another script, and the keys of a carousel. Packages only and fixed data.
import { useRef, useState } from "react";
import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EditableText,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldOptionalMark,
  FieldSeparator,
  FieldTitle,
  Input,
  OnScreenKeyboard,
  Textarea,
  Toggle,
  useField,
  useOnScreenKeyboard,
  type OnScreenKey,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const column = {
  display: "grid",
  gap: "var(--fui-space-4)",
  inlineSize: "min(100%, 24rem)",
} as const;
const row = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--fui-space-2)",
} as const;
const muted = { margin: 0, color: "var(--muted-foreground)" } as const;

/* ---------------------------------------------------------------- a count under a field */

export const inputExamples: ExampleSet = {
  examples: [
    {
      id: "count",
      title: "How much is left, without cutting it",
      description:
        "`count={{ max }}` puts a counter under the field in the label voice, and the field names it with `aria-describedby`. A soft limit (the default) never truncates: past it the counter turns to the danger ink and says how far, and a polite region reads the crossing once.",
      code: `<Input aria-label="Display name" count={{ max: 12 }} defaultValue="Ada Rivera" />
<Input aria-label="Room code" count={{ max: 6, soft: false }} placeholder="ABC123" />`,
      render: () => (
        <div style={column}>
          <Input aria-label="Display name" count={{ max: 12 }} defaultValue="Ada Rivera" />
          <Input aria-label="Room code" count={{ max: 6, soft: false }} placeholder="ABC123" />
        </div>
      ),
      align: "start",
    },
    {
      id: "bare",
      title: "Just the number",
      description:
        "`count={true}` shows how much the field holds and nothing else, which is what a search field with a limit of a server's own needs. `unit` counts words or graphemes with `Intl.Segmenter`, and then the limit is the host's to enforce.",
      code: `<Input aria-label="Search" count />
<Input aria-label="Label" count={{ max: 40, unit: "graphemes" }} />`,
      render: () => (
        <div style={column}>
          <Input aria-label="Search" count defaultValue="harbour" />
          <Input aria-label="Label" count={{ max: 40, unit: "graphemes" }} defaultValue="Harbour — 港" />
        </div>
      ),
      align: "start",
    },
  ],
};

export const textareaExamples: ExampleSet = {
  examples: [
    {
      id: "count",
      title: "A limit in words",
      description:
        "The same counter as `Input`'s, which suits a field people write in. A limit in words counts the words a reader sees (a Chinese sentence is many words, a joined emoji is one grapheme), and a soft one only says how far past the line the text is.",
      code: `<Textarea
  aria-label="Note"
  count={{ max: 20, unit: "words" }}
  defaultValue="The harbour opens at six. Bring a warm coat: the wind comes off the water all morning."
  rows={3}
/>`,
      render: () => (
        <div style={column}>
          <Textarea
            aria-label="Note"
            count={{ max: 20, unit: "words" }}
            defaultValue="The harbour opens at six. Bring a warm coat: the wind comes off the water all morning."
            rows={3}
          />
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- a field, piece by piece */

function Scope() {
  const field = useField();
  return <Input aria-describedby={field.describedBy} aria-invalid={field.invalid} defaultValue="chat, models" id={field.id} />;
}

export const fieldPartsExamples: ExampleSet = {
  examples: [
    {
      id: "parts",
      title: "The parts, around other things",
      description:
        "`Field` takes rendered parts instead of a function child: `FieldLabel`, `FieldContent`, `FieldDescription` and `FieldError` draw the same plate one piece at a time, and `useField()` gives a control of the host's own the ids it needs.",
      code: `<Field>
  <FieldLabel required htmlFor="key-name">Key name</FieldLabel>
  <FieldContent>
    <Input id="key-name" aria-describedby="key-name-note" />
  </FieldContent>
  <FieldDescription id="key-name-note">Shown in the panel.</FieldDescription>
</Field>`,
      render: () => (
        <div style={column}>
          <Field>
            <FieldLabel htmlFor="key-name" required>
              Key name
            </FieldLabel>
            <FieldContent>
              <Input aria-describedby="key-name-note" defaultValue="Harbour" id="key-name" />
            </FieldContent>
            <FieldDescription id="key-name-note">Shown in the panel and in every request&apos;s usage.</FieldDescription>
          </Field>
        </div>
      ),
      align: "start",
    },
    {
      id: "titles",
      title: "A title, a rule, an optional field",
      description:
        "`FieldTitle` names a group whose fields have their own labels, `FieldSeparator` is a rule that can hold a word, and `FieldOptionalMark` is the word optional on its own when a host writes the label itself.",
      code: `<FieldTitle>Delivery</FieldTitle>
<Field label="Street" required>{(props) => <Input {...props} />}</Field>
<FieldSeparator>Or keep it private</FieldSeparator>
<Field label={<>Scope <FieldOptionalMark /></>}><Scope /></Field>`,
      render: () => (
        <div style={column}>
          <FieldTitle>Delivery</FieldTitle>
          <Field label="Street" required>
            {(props) => <Input {...props} defaultValue="12 North Quay" />}
          </Field>
          <FieldSeparator>Or keep it private</FieldSeparator>
          <Field
            label={
              <>
                Scope <FieldOptionalMark />
              </>
            }
          >
            <Scope />
          </Field>
        </div>
      ),
      align: "start",
    },
    {
      id: "error",
      title: "An error is read at once",
      description:
        '`FieldError` is a `role="alert"` of its own, and it marks the control invalid through `useField()`. A control is described by the parts that are really rendered, never by ids that point at nothing.',
      code: `<Field>
  <FieldLabel htmlFor="alias">Alias</FieldLabel>
  <FieldContent><Input id="alias" aria-invalid /></FieldContent>
  <FieldError>A key with this name already exists.</FieldError>
</Field>`,
      render: () => (
        <div style={column}>
          <Field>
            <FieldLabel htmlFor="alias">Alias</FieldLabel>
            <FieldContent>
              <Input aria-invalid defaultValue="harbour" id="alias" />
            </FieldContent>
            <FieldError>A key with this name already exists.</FieldError>
          </Field>
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- one key that stays on */

function BookmarkToggle() {
  const [saved, setSaved] = useState(false);
  return (
    <div style={row}>
      <Toggle aria-label="Bookmark this key" onPressedChange={setSaved} pressed={saved}>
        Bookmark
      </Toggle>
      <span style={muted}>{saved ? "Bookmarked." : "Not bookmarked."}</span>
    </div>
  );
}

export const toggleExamples: ExampleSet = {
  examples: [
    {
      id: "pressed",
      title: "A mode, on or off",
      description:
        "`Toggle` is one key that stays on. `pressed` and `onPressedChange` hold it when the host does; Base UI adds `data-pressed` beside `aria-pressed`, so a host can style the state either way.",
      code: `const [saved, setSaved] = useState(false);

<Toggle aria-label="Bookmark this key" pressed={saved} onPressedChange={setSaved}>
  Bookmark
</Toggle>`,
      render: () => <BookmarkToggle />,
      align: "start",
    },
    {
      id: "looks",
      title: "Three looks and three sizes",
      description:
        "`variant` is `default` (a control on the page), `outline` (only its hairline) or `plain` (no look of its own, for a mode inside something else). `size` is `sm` at 26 px, `default` at 34 and `lg` at 44 px on every pointer. A pressed key takes the raised segment's fill, which reads on the page in the `default` look.",
      code: `<Toggle pressed size="sm">Small</Toggle>
<Toggle pressed>Default</Toggle>
<Toggle pressed size="lg">Large</Toggle>
<Toggle size="sm" variant="outline">Off</Toggle>
<Toggle pressed variant="plain" className="…">Plain</Toggle>`,
      render: () => (
        <div style={row}>
          <Toggle pressed size="sm">
            Small
          </Toggle>
          <Toggle pressed>Default</Toggle>
          <Toggle pressed size="lg">
            Large
          </Toggle>
          <Toggle size="sm" variant="outline">
            Off
          </Toggle>
          <Toggle pressed variant="plain">
            <span
              style={{
                fontFamily: "var(--fui-font-label)",
                fontSize: "var(--fui-text-label)",
              }}
            >
              Plain
            </span>
          </Toggle>
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- a title renamed in place */

function RenameTitle() {
  const [title, setTitle] = useState("Harbour notes");
  return (
    <EditableText
      label="Rename chat"
      onCommit={(next) => {
        setTitle(next);
      }}
      showTrigger
      value={title}
    />
  );
}

function DoubleClickTitle() {
  const [title, setTitle] = useState("Orchard survey");
  return (
    <p style={{ margin: 0 }}>
      <EditableText onCommit={(next) => setTitle(next)} startOn="doubleClick" value={title} />
    </p>
  );
}

export const editableTextExamples: ExampleSet = {
  examples: [
    {
      id: "pencil",
      title: "Renamed where it is read",
      description:
        "`showTrigger` puts a pencil beside the text and names it with `triggerLabel`; `onCommit` receives the trimmed text. A promise keeps it pending until it settles, and a rejection puts the old title back.",
      code: `const [title, setTitle] = useState("Harbour notes");

<EditableText
  value={title}
  label="Rename chat"
  showTrigger
  onCommit={async (next) => {
    await renameChat(next);
    setTitle(next);
  }}
/>`,
      render: () => <RenameTitle />,
      align: "start",
    },
    {
      id: "keys",
      title: "Opened by the text itself",
      description:
        '`startOn="doubleClick"` (or `click`) opens the field from the text, which also answers Enter and F2 while it has focus. Enter saves, Escape cancels and stops there, so a sheet around it stays open, and leaving the field saves.',
      code: `<EditableText value={title} onCommit={save} startOn="doubleClick" />`,
      render: () => <DoubleClickTitle />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- another script's keyboard */

const LETTERS: OnScreenKey[][] = [
  [
    { value: "ا", name: "alif" },
    { value: "ب", name: "ba" },
    { value: "ت", name: "ta" },
    { value: "ث", name: "tha" },
    { value: "ج", name: "jim" },
  ],
  [
    { value: "ح", name: "ha" },
    { value: "خ", name: "kha" },
    { value: "د", name: "dal" },
    { value: "ذ", name: "dhal" },
    { value: "ر", name: "ra" },
  ],
  [
    { value: "س", name: "sin" },
    { value: "ش", name: "shin" },
    { value: "ص", name: "sad" },
    { value: "ض", name: "dad" },
    { kind: "backspace", name: "backspace", value: "" },
  ],
  [
    { kind: "space", name: "space", value: " ", width: 4 },
    { value: "،", name: "Arabic comma" },
  ],
];

function ArabicField() {
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  return (
    <div style={column}>
      <label htmlFor="arabic-word">A word, typed with the keyboard below</label>
      <Input
        dir="rtl"
        id="arabic-word"
        lang="ar"
        onChange={(event) => setValue(event.currentTarget.value)}
        ref={field}
        value={value}
      />
      <OnScreenKeyboard dir="rtl" label="Arabic keyboard" rows={LETTERS} target={field} />
      <p style={muted}>{value ? `Typed: ${value}` : "Nothing typed yet."}</p>
    </div>
  );
}

function KeyboardDuty() {
  const keyboard = useOnScreenKeyboard({
    defaultOpen: false,
    storageKey: "fui-example-keyboard",
  });
  return (
    <div style={{ ...column, gap: "var(--fui-space-2)" }}>
      <div style={row}>
        <Button onClick={keyboard.toggle} size="sm" variant="outline">
          {keyboard.open ? "Hide" : "Show"} the keyboard
        </Button>
        <span style={muted}>{keyboard.open ? "Open, and remembered." : "Shut, and remembered."}</span>
      </div>
    </div>
  );
}

export const onScreenKeyboardExamples: ExampleSet = {
  examples: [
    {
      id: "letters",
      title: "Letters under a field",
      description:
        "`rows` is the host's layout and `target` the field the keys write into: a key writes at the caret, replaces the selection and dispatches a real input event, so a controlled field updates. A press never takes the focus from the field, so the caret stays where it was.",
      code: `const field = useRef<HTMLInputElement>(null);

<Input ref={field} dir="rtl" lang="ar" value={word} onChange={update} />
<OnScreenKeyboard rows={LETTERS} target={field} dir="rtl" label="Arabic keyboard" />`,
      render: () => <ArabicField />,
      align: "start",
    },
    {
      id: "duty",
      title: "A keyboard with a duty of its own",
      description:
        "`useOnScreenKeyboard` opens it by itself where the pointer is a finger, and the person holds it open or shut from then on; the choice is remembered. `inputProps` keeps the device's own keyboard down while this one is up.",
      code: `const keyboard = useOnScreenKeyboard({ storageKey: "arabic" });

<Input {...keyboard.inputProps} dir="rtl" />
<Button onClick={keyboard.toggle}>{keyboard.open ? "Hide" : "Show"} the keyboard</Button>`,
      render: () => <KeyboardDuty />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- the keys of a carousel */

const SLIDES = ["North quay", "Orchard road", "Quarry lane", "Market street"];

export const carouselExamples: ExampleSet = {
  examples: [
    {
      id: "keys",
      title: "Its own keys only",
      description:
        "The carousel answers the arrow keys while its region or one of its two buttons has focus: a field or a slider inside a slide keeps its own keys. `aria-label` names the region, and `labels` says the words of the two keys and each slide's place.",
      code: `<Carousel aria-label="Places" labels={{ previous: "Previous place", next: "Next place" }}>
  <CarouselContent>
    {places.map((place) => (
      <CarouselItem key={place}>{place}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
      render: () => (
        <div style={{ inlineSize: "min(100%, 26rem)" }}>
          <Carousel aria-label="Places" labels={{ next: "Next place", previous: "Previous place" }}>
            <CarouselContent>
              {SLIDES.map((place) => (
                <CarouselItem key={place}>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--fui-radius-lg)",
                      display: "grid",
                      minBlockSize: "8rem",
                      placeItems: "center",
                    }}
                  >
                    {place}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ),
      align: "start",
    },
    {
      id: "vertical",
      title: "Up and down",
      description:
        "A vertical carousel answers Up and Down, the other way round in a right-to-left page for the horizontal one; Home and End go to the first and the last slide, and a key with a modifier is left to the browser. At the ends the key is off but keeps focus.",
      code: `<Carousel orientation="vertical" aria-label="Places">
  <CarouselContent>{…}</CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
      render: () => (
        <div style={{ inlineSize: "min(100%, 18rem)" }}>
          <Carousel aria-label="Places, one above the other" orientation="vertical">
            <CarouselContent>
              {SLIDES.slice(0, 3).map((place) => (
                <CarouselItem key={place}>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--fui-radius-lg)",
                      display: "grid",
                      minBlockSize: "4rem",
                      placeItems: "center",
                    }}
                  >
                    {place}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ),
      align: "start",
    },
  ],
};
