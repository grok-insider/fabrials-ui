import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxValue,
  Field,
  useComboboxAnchor,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Combobox",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Synthetic workspaces and tags: no real names.
const WORKSPACES = ["North", "South", "East", "West", "Harbour", "Lighthouse"];
const TAGS = ["billing", "invoices", "quarterly", "archive", "draft", "a-tag-with-a-very-long-name-that-has-to-wrap"];
type Region = { value: string; label: string; disabled?: boolean };
const REGIONS: Region[] = [
  { value: "eu-central", label: "Frankfurt" },
  { value: "eu-north", label: "Helsinki" },
  { value: "us-east", label: "Ashburn", disabled: true },
  { value: "ap-south", label: "Singapore" },
];
type Team = { value: string; items: string[] };
const TEAMS: Team[] = [
  { value: "Product", items: ["Design", "Research"] },
  { value: "Platform", items: ["Infrastructure", "Security"] },
];
const ROOMS = Array.from({ length: 40 }, (_, index) => `Room ${String(index + 1).padStart(2, "0")}`);
const ARABIC = ["الشمال", "الجنوب", "الشرق", "الغرب"];

function Options({ empty = "No matches." }: { empty?: string }) {
  return (
    <>
      <ComboboxEmpty>{empty}</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}

function Single({ id, label, items = WORKSPACES, ...root }: { id: string; label: string; items?: string[]; defaultValue?: string; disabled?: boolean; defaultOpen?: boolean }) {
  return (
    <Field id={id} label={label}>
      {(field) => (
        <ComboboxRoot items={items} {...root}>
          <ComboboxInput {...field} placeholder="Choose one" showClear />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </ComboboxRoot>
      )}
    </Field>
  );
}

// `anchored` is the way shadcn's examples write it: a ref on the box of chips, handed to the list as its anchor.
function Multiple({ id, label, items = TAGS, defaultValue, placeholder = "Add a tag", anchored = false, ...root }: { id: string; label: string; items?: string[]; defaultValue?: string[]; placeholder?: string; anchored?: boolean; defaultOpen?: boolean }) {
  const anchor = useComboboxAnchor();
  return (
    <Field id={id} label={label}>
      {(field) => (
        <ComboboxRoot multiple items={items} defaultValue={defaultValue} {...root}>
          <ComboboxChips ref={anchored ? anchor : undefined}>
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((value) => (
                    <ComboboxChip key={value} aria-label={value} removeLabel={`Remove ${value}`}>
                      {value}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput {...field} placeholder={placeholder} />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchored ? anchor : undefined}>
            <Options />
          </ComboboxContent>
        </ComboboxRoot>
      )}
    </Field>
  );
}

function PartsPage() {
  return (
    <Page
      title="Combobox"
      description="The flat parts: a field that filters its list as you type, with a key that opens the list and one that empties the field; several values as chips in the same box. The lists below are closed until someone opens them."
    >
      <Block title="One value" description="Empty, with a value (the clear key appears), and switched off.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={358}>
            <Single id="workspace" label="Workspace" />
          </Frame>
          <Frame width={358}>
            <Single id="workspace-chosen" label="Workspace, chosen" defaultValue="Harbour" />
          </Frame>
          <Frame width={358}>
            <Single id="workspace-off" label="Workspace, off" defaultValue="South" disabled />
          </Frame>
        </div>
      </Block>
      <Block title="Several values" description="Chips sit in the field before the input; when they do not fit one line the box grows.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={358}>
            <Multiple id="tags" label="Tags" />
          </Frame>
          <Frame width={358}>
            <Multiple id="tags-chosen" label="Tags, two chosen" defaultValue={["billing", "invoices"]} />
          </Frame>
          <Frame width={358}>
            <Multiple id="tags-many" label="Tags, more than a line" anchored defaultValue={["billing", "invoices", "quarterly", "a-tag-with-a-very-long-name-that-has-to-wrap"]} />
          </Frame>
        </div>
      </Block>
      <Block title="Lists" description="A row that cannot be chosen, groups with their headings, and a list longer than the screen.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={358}>
            <Field id="region" label="Region">
              {(field) => (
                <Combobox items={REGIONS} defaultValue={REGIONS[1]}>
                  <ComboboxInput {...field} placeholder="Choose a region" />
                  <ComboboxContent>
                    <ComboboxEmpty>No region by that name.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: Region) => (
                        <ComboboxItem key={item.value} value={item} disabled={item.disabled}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            </Field>
          </Frame>
          <Frame width={358}>
            <Field id="team" label="Team">
              {(field) => (
                <ComboboxRoot items={TEAMS}>
                  <ComboboxInput {...field} placeholder="Choose a team" />
                  <ComboboxContent>
                    <ComboboxEmpty>No team by that name.</ComboboxEmpty>
                    <ComboboxList>
                      {(group: Team, index: number) => (
                        <ComboboxGroup key={group.value} items={group.items}>
                          {index > 0 ? <ComboboxSeparator /> : null}
                          <ComboboxLabel>{group.value}</ComboboxLabel>
                          <ComboboxCollection>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                        </ComboboxGroup>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </ComboboxRoot>
              )}
            </Field>
          </Frame>
          <Frame width={358}>
            <Single id="room" label="Room" items={ROOMS} />
          </Frame>
        </div>
      </Block>
      <Block title="Right to left" description="The keys sit at the inline end, the tick at the end of the row, and the chips read from the right.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={358} dir="rtl">
            <Single id="direction" label="الجهة" items={ARABIC} defaultValue="الشرق" />
          </Frame>
          <Frame width={358} dir="rtl">
            <Multiple id="directions" label="الجهات" items={ARABIC} defaultValue={["الشمال", "الغرب"]} placeholder="أضف جهة" />
          </Frame>
        </div>
      </Block>
    </Page>
  );
}

function OpenList() {
  return (
    <Page title="Combobox, open" description="The list as it opens: under the field, as wide as it, with the chosen row ticked.">
      <div className="catalogue-row" style={{ alignItems: "start", minHeight: "24rem" }}>
        <Frame width={358}>
          <Single id="open-workspace" label="Workspace" defaultValue="East" defaultOpen />
        </Frame>
      </div>
    </Page>
  );
}

function OpenChips() {
  return (
    <Page title="Combobox, open with chips" description="The list of a multiple combobox opens under the whole box of chips.">
      <div className="catalogue-row" style={{ alignItems: "start", minHeight: "24rem" }}>
        <Frame width={358}>
          <Multiple id="open-tags" label="Tags" defaultValue={["billing", "draft"]} defaultOpen />
        </Frame>
      </div>
    </Page>
  );
}

export const Parts: Story = { render: () => <PartsPage /> };
export const Open: Story = { render: () => <OpenList /> };
export const OpenWithChips: Story = { render: () => <OpenChips /> };
