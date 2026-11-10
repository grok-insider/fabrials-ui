import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditableText, EditableTextProps, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarMenu } from "@fabrials/ui";
import { Block, Page } from "../story-frame";

const description =
  "A title renamed where it is read: the pencil or the text opens the field with all of it selected, Enter commits, Escape cancels, and a text that did not change calls nobody.";

const meta = {
  title: "Components/Editable text",
  component: EditableText,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    value: "Harbour at night",
    label: "Rename chat",
    showTrigger: true,
    triggerLabel: "Rename the chat",
    onCommit: () => undefined,
  },
  argTypes: {
    value: { control: "text" },
    label: { control: "text" },
    triggerLabel: { control: "text" },
    placeholder: { control: "text" },
    maxLength: { control: "number" },
    showTrigger: { control: "boolean" },
    selectOnEdit: { control: "boolean" },
    truncate: { control: "boolean" },
    startOn: { control: "inline-radio", options: ["none", "doubleClick", "click"] },
    dir: { control: "inline-radio", options: ["auto", "ltr", "rtl"] },
  },
} satisfies Meta<EditableTextProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;
const note = { margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" } as const;

function Rename() {
  const [value, setValue] = useState("Harbour at night");
  const [calls, setCalls] = useState(0);
  return (
    <div style={stack}>
      <div style={{ display: "flex", alignItems: "center", minInlineSize: "20rem", fontSize: "var(--fui-text-sm)" }}>
        <EditableText
          label="Rename chat"
          onCommit={(next) => {
            setCalls((count) => count + 1);
            setValue(next);
          }}
          showTrigger
          triggerLabel="Rename the chat"
          value={value}
        />
      </div>
      <p style={note}>
        Commits: {calls}. The field commits once: the blur it causes does not call again.
      </p>
    </div>
  );
}

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => (
    <Page description="A title in reading, with a pencil, in the field, and while a commit has not settled; then the same piece inside a sidebar row that is a link." title="Editable text">
      <Block title="The four states" description="Nothing here is a dialog and nothing moves: the field takes the place of the text.">
        <div style={stack}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)", fontSize: "var(--fui-text-sm)" }}>
            <span style={{ ...note, inlineSize: "5rem" }}>reading</span>
            <EditableText label="Rename chat" onCommit={() => undefined} value="Harbour at night" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)", fontSize: "var(--fui-text-sm)" }}>
            <span style={{ ...note, inlineSize: "5rem" }}>with a pencil</span>
            <EditableText label="Rename chat" onCommit={() => undefined} showTrigger triggerLabel="Rename the chat" value="Harbour at night" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)", fontSize: "var(--fui-text-sm)", minInlineSize: "20rem" }}>
            <span style={{ ...note, inlineSize: "5rem" }}>in the field</span>
            <EditableText defaultEditing label="Rename chat" onCommit={() => undefined} value="Harbour at night" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)", fontSize: "var(--fui-text-sm)" }}>
            <span style={{ ...note, inlineSize: "5rem" }}>pending</span>
            <EditableText label="Rename chat" onCommit={() => undefined} pending value="Harbour at night" />
          </div>
        </div>
      </Block>
      <Block title="A rename in a live session" description="Type and press Enter: the commit wakes up, and the counter says how many the host received.">
        <Rename />
      </Block>
      <Block title="Inside a row" description="A row that is a link is still a link: a double click opens the field, and from then on the row is left alone.">
        <div style={{ inlineSize: "16rem", border: "1px solid var(--sidebar-border)", borderRadius: "var(--fui-radius-lg)", overflow: "hidden" }}>
          <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, inlineSize: "auto" }}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="#harbour" />} size="touch">
                  <EditableText label="Rename chat" onCommit={() => undefined} startOn="doubleClick" value="Harbour at night" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarProvider>
        </div>
      </Block>
    </Page>
  ),
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    const [calls, setCalls] = useState(0);
    return (
      <div style={{ display: "grid", gap: "var(--fui-space-3)", maxWidth: "22rem" }}>
        <div style={{ display: "flex", alignItems: "center", minInlineSize: "18rem", fontSize: "var(--fui-text-sm)" }}>
          <EditableText
            {...args}
            onCommit={(next) => {
              setCalls((count) => count + 1);
              setValue(next);
            }}
            value={value}
          />
        </div>
        <p style={note}>
          Commits: {calls}. Value: {value}
        </p>
      </div>
    );
  },
};
