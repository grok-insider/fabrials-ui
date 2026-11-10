import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton, OnScreenKeyboard, OnScreenKeyboardProps, useOnScreenKeyboard, type OnScreenKey } from "@fabrials/ui";
import { Keyboard as KeyboardIcon } from "lucide-react";
import { Block, Frame, Page } from "../story-frame";

const description =
  "A keyboard for a script the device's own keyboard lacks. The layout is the host's data; it is one toolbar with one tab stop, the arrows move by what is on screen, and a press leaves the caret in the field.";

const meta = {
  title: "Components/On-screen keyboard",
  component: OnScreenKeyboard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    label: "Latin keyboard",
    dir: "ltr",
    disabled: false,
    rows: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((value) => ({ value })),
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((value) => ({ value })),
      [{ value: "z" }, { value: "x" }, { value: "c" }, { value: "v" }, { value: "b" }, { value: "n" }, { value: "m" }],
      [
        { value: " ", kind: "space", width: 5 },
        { value: "", kind: "backspace", width: 1.5 },
      ],
    ],
  },
  argTypes: {
    label: { control: "text" },
    dir: { control: "inline-radio", options: ["ltr", "rtl"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<OnScreenKeyboardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const note = { margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" } as const;

const ARABIC: OnScreenKey[][] = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه"].map((value) => ({ value, lang: "ar" })),
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن"].map((value) => ({ value, lang: "ar" })),
  ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز"].map((value) => ({ value, lang: "ar" })),
  [
    { value: "،", name: "Arabic comma", lang: "ar" },
    { value: " ", kind: "space", width: 4 },
    { value: "", kind: "backspace", width: 1.5 },
    { value: "", kind: "enter", width: 1.5 },
  ],
];

/** A field and the keyboard under it, with the duty the hook keeps: open by itself on a touch screen, remembered after. */
function Dock({ dir = "ltr", rows, layout }: { dir?: "ltr" | "rtl"; rows: OnScreenKey[][]; layout: string }) {
  const { open, toggle, inputProps } = useOnScreenKeyboard({ storageKey: `fui-keyboard-${layout}`, defaultOpen: true });
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%", maxInlineSize: "26rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
        <input
          aria-label="Answer"
          className="fui-input"
          dir={dir}
          onChange={(event) => setValue(event.target.value)}
          ref={field}
          style={{ flex: 1, minWidth: 0 }}
          value={value}
          {...inputProps}
        />
        <IconButton label={open ? "Hide the keyboard" : "Show the keyboard"} onClick={toggle} size="touch" variant="secondary">
          <KeyboardIcon aria-hidden />
        </IconButton>
      </div>
      {open ? (
        <OnScreenKeyboard
          dir={dir}
          label={layout === "arabic" ? "Arabic keyboard" : "Latin keyboard"}
          rows={rows}
          target={field}
        />
      ) : null}
      <p style={note}>{value || "Nothing typed yet"}</p>
    </div>
  );
}

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Page description="A field with the keyboard under it, in each direction, and a disabled one. The layout is data: the package ships no language of its own." title="On-screen keyboard">
      <Block title="A field and its keyboard" description="Type with the pointer or the keys: the field keeps the focus and the caret stays where the person left it.">
        <Dock layout="latin" rows={meta.args!.rows as OnScreenKey[][]} />
      </Block>
      <Block title="A script written right to left" description="The same component with the host's Arabic rows: the first key of a row is at the right, and ArrowLeft is the next key.">
        <Frame dir="rtl" width={440}>
          <Dock dir="rtl" layout="arabic" rows={ARABIC} />
        </Frame>
      </Block>
      <Block title="A keyboard that cannot be used" description="Every key is off, and the rows keep their shape.">
        <div style={{ inlineSize: "100%", maxInlineSize: "26rem" }}>
          <OnScreenKeyboard disabled label="Latin keyboard" rows={meta.args!.rows as OnScreenKey[][]} />
        </div>
      </Block>
    </Page>
  ),
};

/** The controls of the page change the keyboard; the field it types into holds its own ref. */
function KeyboardPlayground(props: OnScreenKeyboardProps) {
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", maxWidth: "26rem" }}>
      <input aria-label="Answer" className="fui-input" dir={props.dir} onChange={(event) => setValue(event.target.value)} ref={field} value={value} />
      <OnScreenKeyboard {...props} target={field} />
      <p style={note}>{value || "Nothing typed yet"}. Backspace removes a whole cluster and repeats while it is held.</p>
    </div>
  );
}

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <KeyboardPlayground {...args} />,
};
