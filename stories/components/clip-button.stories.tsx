import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClipButton, ClipError, ClipNote, SpeedToggle, useClipPlayer, type ClipLoader } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";
import { toneWav } from "../sound-fixtures";

const description =
  "A button that plays a clip the host loads: a speaker, a spinner while it loads, a square while it plays. One sound at a time on the page, a slow speed, and a line that says why a clip did not play.";

// The host's loader, played here by tones made in the page: a higher note for each word, a lower one when slow.
const WORDS = ["harbour", "orchard", "quarry"] as const;
const tones: ClipLoader = async (ref, { speed }) => {
  if (ref === "missing") throw new ClipError("unavailable");
  if (ref === "busy") throw new ClipError("rateLimited");
  const step = Math.max(0, WORDS.indexOf(ref as (typeof WORDS)[number]));
  return toneWav((speed === "slow" ? 220 : 330) + step * 55, speed === "slow" ? 1.4 : 0.9);
};

function WordList() {
  const player = useClipPlayer({ load: tones });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%", maxInlineSize: "22rem" }}>
      <ul style={{ display: "grid", gap: "var(--fui-space-2)", margin: 0, padding: 0, listStyle: "none" }}>
        {WORDS.map((word) => (
          <li key={word} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--fui-space-3)" }}>
            <span>{word}</span>
            <ClipButton clip={word} iconOnly label={`Listen to ${word}`} player={player} size="sm" />
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
        <ClipButton clip="harbour" label="Hear the first word" player={player} />
        <SpeedToggle player={player} />
      </div>
      <ClipNote player={player} />
    </div>
  );
}

function Failures() {
  const player = useClipPlayer({ load: tones });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", justifyItems: "start" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)" }}>
        <ClipButton clip="busy" label="A clip to ask for again" player={player} />
        <ClipButton clip="missing" label="A clip with no voice" player={player} />
      </div>
      <ClipNote player={player} />
    </div>
  );
}

const examples: ExampleSet = {
  preview: () => <WordList />,
  previewCode: `const player = useClipPlayer({
  // The host gets the clip: a Blob, or a URL the browser can play.
  load: async (ref, { speed, signal }) => {
    const response = await getClip(ref, speed, signal);
    if (response.status === 503) throw new ClipError("unavailable");
    return response.blob();
  },
});

<ClipButton clip="harbour" iconOnly label="Listen to harbour" player={player} size="sm" />
<ClipButton clip="harbour" label="Hear the first word" player={player} />
<SpeedToggle player={player} />
<ClipNote player={player} />`,
  examples: [
    {
      id: "alone",
      title: "One clip on its own",
      description: "Without a `player` the button plays through its own, from `load`. Its words change to \"Listen again\" once the clip was heard.",
      code: `<ClipButton clip="harbour" load={loadClip} />`,
      render: () => <ClipButton clip="harbour" load={tones} />,
    },
    {
      id: "failures",
      title: "A clip that does not play",
      description:
        "The loader throws a `ClipError` to say why. `ClipNote` says it in words and offers the clip again only when that can help: here after too many requests, and not when there is no voice.",
      code: `const player = useClipPlayer({
  load: async (ref) => {
    if (ref === "busy") throw new ClipError("rateLimited");
    throw new ClipError("unavailable");
  },
});

<ClipButton clip="busy" label="A clip to ask for again" player={player} />
<ClipButton clip="missing" label="A clip with no voice" player={player} />
<ClipNote player={player} />`,
      render: () => <Failures />,
      align: "start",
    },
    {
      id: "foreign",
      title: "Named in another language",
      description: "`labelContent` is the name as markup, so a word in another language keeps its `lang` and `dir`; on an icon-only button it is read but not shown.",
      code: `<ClipButton
  clip="marhaba"
  iconOnly
  labelContent={<>Listen to <bdi dir="rtl" lang="ar">مرحبا</bdi></>}
  load={loadClip}
/>`,
      render: () => (
        <ClipButton
          clip="harbour"
          iconOnly
          labelContent={
            <>
              Listen to{" "}
              <bdi dir="rtl" lang="ar">
                مرحبا
              </bdi>
            </>
          }
          load={tones}
        />
      ),
    },
  ],
};

const meta = {
  title: "Components/Clip button",
  component: ClipButton,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { clip: "harbour", size: "default", iconOnly: false, variant: "outline" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    variant: { control: "select", options: ["default", "accent", "outline", "secondary", "ghost"] },
    iconOnly: { control: "boolean" },
    label: { control: "text" },
    player: { control: false },
    load: { control: false },
    labelContent: { control: false },
  },
} satisfies Meta<typeof ClipButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Clip button" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <ClipButton {...args} load={tones} />,
};
