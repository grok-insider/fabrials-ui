import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownCallout, type MarkdownCalloutProps } from "@fabrials/ai-ui";
import { Block, Frame, Page } from "../story-frame";

// The callout as a page: what a kind says, how a host writes the same markup without React, and a playground of its props.

const description =
  "A note, a tip or a warning inside an answer, from GitHub's `> [!NOTE]` blockquote and the four kinds a lesson adds. A tint of its tone with the title and the mark in that tone's ink, read as a note named by its title. Never a coloured side bar.";

function PageBody() {
  return (
    <Page
      description="Notes, tips and warnings in an answer: five GitHub kinds, four teaching kinds, and the same classes a host's own renderer writes."
      title="Markdown callout"
    >
      <Block description="Nine kinds over five tones: a note, an example and a question stay neutral, so a warning is still the loudest thing on the page." title="Kinds">
        <Frame width={620}>
          <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            <MarkdownCallout kind="note">
              <p>The cache is warm, so the next import reads from disk.</p>
            </MarkdownCallout>
            <MarkdownCallout kind="tip">
              <p>Multiply after converting, never before: the rounding climbs otherwise.</p>
            </MarkdownCallout>
            <MarkdownCallout kind="warning">
              <p>Two of the four jobs failed, and the run continues with the rest.</p>
            </MarkdownCallout>
            <MarkdownCallout kind="caution">
              <p>Deleting the workspace removes its history as well. There is no undo.</p>
            </MarkdownCallout>
          </div>
        </Frame>
      </Block>
      <Block description="In an answer, between two paragraphs, with a list inside one of them." title="In a markdown answer">
        <Frame width={620}>
          <div className="fui-markdown">
            <p>The import reads the mailbox once and then only what arrived since the last run.</p>
            <MarkdownCallout kind="important" title="Set the variable before the first run">
              <p>
                Without <code>PALANAEUM_MAILBOX</code> the screen offers every folder of every account, which is a long list to
                read on a phone.
              </p>
            </MarkdownCallout>
            <p>Then read the senders screen: it groups by address, not by subject.</p>
            <MarkdownCallout kind="summary">
              <ul>
                <li>Import once, then incrementally.</li>
                <li>Group by sender.</li>
                <li>Nothing is ever moved or deleted.</li>
              </ul>
            </MarkdownCallout>
          </div>
        </Frame>
      </Block>
      <Block description="A parser of your own writes the classes; the renderer needs no React at all." title="Written by a host">
        <Frame width={620}>
          <aside aria-label="Note" className="fui-callout" data-kind="note" role="note">
            <p className="fui-callout-title" dir="auto">
              <span aria-hidden="true" className="fui-callout-icon">
                <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </span>
              Note
            </p>
            <div className="fui-callout-body">
              <p>`calloutOf` reads the first line of the quote and hands back the kind, the title and the rest.</p>
            </div>
          </aside>
        </Frame>
      </Block>
    </Page>
  );
}

function PlaygroundBody({ kind, title, icon }: MarkdownCalloutProps) {
  return (
    <div style={{ maxWidth: "38rem" }}>
      <div className="fui-markdown">
        <MarkdownCallout icon={icon} kind={kind} title={title}>
          <p>Convert once, at the end, or the rounding climbs.</p>
          <p>The second paragraph keeps the answer&apos;s own rhythm inside the plate.</p>
        </MarkdownCallout>
      </div>
    </div>
  );
}

const meta = {
  title: "Agents/Markdown callout",
  component: MarkdownCallout,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { kind: "tip", title: undefined },
  argTypes: {
    kind: {
      control: "select",
      options: ["note", "tip", "important", "warning", "caution", "example", "definition", "summary", "question"],
    },
    title: { control: "text" },
    icon: { control: false },
    labels: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof MarkdownCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <PageBody />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => <PlaygroundBody {...args} />,
};
