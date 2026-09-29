import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Bell, ContactRound, Folder, Inbox, Mail, PenLine, Search, Trash2, Wrench } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AppHeader,
  AppHeaderBrand,
  Badge,
  BulkActions,
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandOption,
  CommandOptionList,
  CommandShortcut,
  CommandTrigger,
  Field,
  Input,
  Kbd,
  KbdGroup,
  Loading,
  PageHeader,
  SectionHeader,
  Textarea,
  TooltipProvider,
  placeholderText,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Commands",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <TooltipProvider delay={500}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="catalogue">
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}

function Frame({ width, dir, children, flush }: { width?: number; dir?: "rtl"; children: ReactNode; flush?: boolean }) {
  return (
    <div
      dir={dir}
      style={{
        width: "100%",
        boxSizing: "border-box",
        maxWidth: width ? `${width}px` : undefined,
        minWidth: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--fui-radius-lg)",
        background: "var(--popover)",
        padding: flush ? 0 : "var(--fui-space-3)",
        overflow: flush ? "clip" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} description={description} />
      <div className="catalogue-stack" style={{ marginTop: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" }}>
        {children}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Launcher

/** A slot of a given width: a container named `command`, the way the header's command slot is. */
function Slot({ width, children }: { width: string; children: ReactNode }) {
  return (
    <div style={{ containerType: "inline-size", containerName: "command", width: `min(${width}, 100%)`, minWidth: 0 }}>{children}</div>
  );
}

function LauncherPage() {
  return (
    <Page title="Command launcher" description="A button that looks like the field it opens. It is icon-only when its container named command is under 12rem, and hides the key hint on touch.">
      <Block title="Default and states" description="Labelled with keys, compact (forced), disabled, and with a plain key sequence.">
        <Frame width={480}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
            <CommandTrigger label="Search or run a command" keys={["mod", "K"]} />
            <CommandTrigger label="Search or run a command" keys={["mod", "K"]} disabled />
            <CommandTrigger label="Search or run a command" keys={["G", "K"]} sequence />
            <CommandTrigger label="Search or run a command" />
            <div style={{ width: "3rem" }}>
              <CommandTrigger label="Search or run a command" keys={["mod", "K"]} compact />
            </div>
          </div>
        </Frame>
      </Block>
      <Block title="In a command slot" description="The same markup at 22, 14, 11 and 8rem: the label and keys give way to the icon under 12rem. The name stays.">
        <Frame width={480}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
            {["22rem", "14rem", "11rem", "8rem"].map((width) => (
              <Slot key={width} width={width}>
                <CommandTrigger label="Search or run a command" keys={["mod", "K"]} />
              </Slot>
            ))}
          </div>
        </Frame>
      </Block>
      <Block title="Long label, right to left, 358 px">
        <Frame width={358}>
          <CommandTrigger label="Search mail, contacts, folders, settings and commands from one place" keys={["mod", "K"]} />
        </Frame>
        <Frame width={358} dir="rtl">
          <CommandTrigger label="ابحث أو نفّذ أمراً" keys={["mod", "K"]} />
        </Frame>
      </Block>
      <Block title="In the application header" description="The command slot of AppHeader answers to the container: the launcher needs no prop.">
        <Frame flush>
          <AppHeader
            brand={<AppHeaderBrand href="#">Open Email</AppHeaderBrand>}
            command={<CommandTrigger label="Search or run a command" keys={["mod", "K"]} />}
          />
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------- Options

const options = [
  { icon: <PenLine aria-hidden />, label: "Compose a message", group: "Actions", keys: ["C"] },
  { icon: <Inbox aria-hidden />, label: "Go to Inbox", detail: "12 unread", group: "Navigation", keys: ["G", "I"], active: true },
  { icon: <Folder aria-hidden />, label: "Move to Archive", group: "Folders", disabled: true, reason: "Select a message first." },
  { icon: <ContactRound aria-hidden />, label: "Open Contacts", detail: "a longer detail that has to wrap in a narrow list", group: "Navigation" },
  { icon: <Wrench aria-hidden />, label: "The reallylongunbrokenidentifier-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789 tool", group: "Tools" },
];

function OptionRows({ activeIndex = 1 }: { activeIndex?: number }) {
  return (
    <CommandOptionList aria-label="Commands" style={{ "--fui-command-list-max": "none" } as React.CSSProperties}>
      {options.map((option, index) => (
        <CommandOption
          key={option.label}
          icon={option.icon}
          label={option.label}
          detail={option.detail}
          group={option.group}
          reason={option.reason}
          disabled={option.disabled}
          active={index === activeIndex}
          keys={option.keys ? <KbdGroup sequence>{option.keys.map((key) => <Kbd key={key}>{key}</Kbd>)}</KbdGroup> : undefined}
        />
      ))}
    </CommandOptionList>
  );
}

function OptionsPage() {
  return (
    <Page title="Command rows" description="Rows for a listbox that is not cmdk, and the shared look of cmdk's own rows: the active row has the accent fill and a 2 px Stormlight bar, a disabled one is muted but still selectable.">
      <Block title="A listbox you drive yourself" description="aria-activedescendant on your input names the active row; the row carries data-active and aria-selected.">
        <Frame width={640}>
          <OptionRows />
        </Frame>
        <Frame width={358}>
          <OptionRows activeIndex={3} />
        </Frame>
        <Frame width={358} dir="rtl">
          <OptionRows />
        </Frame>
        <div data-density="compact">
          <Frame width={640}>
            <OptionRows activeIndex={0} />
          </Frame>
        </div>
      </Block>
      <Block title="cmdk rows, same states" description="Selected takes the bar; a cmdk disabled row stays inert (data-disabled).">
        <Frame width={420} flush>
          <Command label="Destinations" value="Go to Inbox">
            <CommandInput aria-label="Search destinations" placeholder="Search destinations" />
            <CommandList>
              <CommandGroup heading="Navigate">
                <CommandItem value="Go to Inbox"><Inbox aria-hidden />Go to Inbox<CommandShortcut>G I</CommandShortcut></CommandItem>
                <CommandItem value="Open Contacts"><ContactRound aria-hidden />Open Contacts</CommandItem>
                <CommandItem value="Open Archive" disabled><Archive aria-hidden />Open Archive</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------ Command dialog

function CommandDialogPage() {
  return (
    <Page title="Command dialog" description="6 px corners, the overlay shadow and highlight, and a height that follows the window: the top and the maximum height share one variable.">
      <CommandDialog defaultOpen title="Command palette" description="Search for a page or an action.">
        <Command label="Command palette">
        <CommandInput placeholder="Search commands" />
        <CommandList>
          <CommandEmpty>No matching command.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem><Inbox aria-hidden />Go to Inbox<CommandShortcut>G I</CommandShortcut></CommandItem>
            <CommandItem><ContactRound aria-hidden />Open Contacts</CommandItem>
            <CommandItem><Mail aria-hidden />Open Mail settings</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem><PenLine aria-hidden />Compose a message<CommandShortcut>C</CommandShortcut></CommandItem>
            <CommandItem><Search aria-hidden />Search mail</CommandItem>
            <CommandItem><Trash2 aria-hidden />Empty Trash</CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </Page>
  );
}

// --------------------------------------------------------------------- Tools

function Tool({ value, title, icon, aside, disabled, children }: { value: string; title: string; icon: ReactNode; aside?: ReactNode; disabled?: boolean; children: ReactNode }) {
  return (
    <AccordionItem value={value} disabled={disabled}>
      <AccordionTrigger headingLevel={2} icon={icon} aside={aside}>
        {title}
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function ToolRows() {
  return (
    <Accordion variant="rows" multiple defaultValue={["reminders"]}>
      <Tool value="reminders" title="Reminders" icon={<Bell aria-hidden />} aside={<><Badge tone="warning" dot>Needs review</Badge><Badge>3</Badge></>}>
        <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
          <Field label="Remind me about">{(props) => <Input {...props} defaultValue="Renewal quote" />}</Field>
          <Field label="Note">{(props) => <Textarea {...props} rows={3} defaultValue="Typed text stays when the row closes." />}</Field>
        </div>
      </Tool>
      <Tool value="labels" title="Labels" icon={<Folder aria-hidden />} aside={<Badge>12</Badge>}>
        <p style={{ margin: 0 }}>Twelve labels. Rename one from its row.</p>
      </Tool>
      <Tool value="rules" title="Rules that move messages between folders as they arrive, with a very long name" icon={<Wrench aria-hidden />} aside={<Badge tone="danger" dot>Failed</Badge>}>
        <p style={{ margin: 0 }}>The last run failed at 09:31.</p>
      </Tool>
      <Tool value="import" title="Import" icon={<Archive aria-hidden />} disabled>
        <p style={{ margin: 0 }}>Unavailable.</p>
      </Tool>
    </Accordion>
  );
}

function ToolsPage() {
  return (
    <Page title="Tool rows" description="An accordion for a stack of independent tools: a 44 px header with an icon, the title, tags outside the trigger and a chevron; the body stays mounted while closed.">
      <Block title="A drawer width and a phone" description="The open row is marked like the current item. Type in Reminders, close it and open it again: the text is still there.">
        <Frame width={544} flush>
          <ToolRows />
        </Frame>
        <Frame width={358} flush>
          <ToolRows />
        </Frame>
        <Frame width={358} dir="rtl" flush>
          <Accordion variant="rows" defaultValue={["a"]}>
            <Tool value="a" title="التذكيرات" icon={<Bell aria-hidden />} aside={<Badge>3</Badge>}>
              <p style={{ margin: 0 }}>ثلاثة تذكيرات.</p>
            </Tool>
            <Tool value="b" title="القواعد" icon={<Wrench aria-hidden />}>
              <p style={{ margin: 0 }}>لا شيء.</p>
            </Tool>
          </Accordion>
        </Frame>
      </Block>
      <Block title="Heading levels and the plain accordion with an aside" description="A level 3 heading with a count outside its trigger, in the default look.">
        <Frame width={544}>
          <Accordion defaultValue={["x"]}>
            <AccordionItem value="x">
              <AccordionTrigger headingLevel={3} aside={<Badge>4</Badge>}>Attachments</AccordionTrigger>
              <AccordionContent>Four files.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="y">
              <AccordionTrigger>Plain trigger</AccordionTrigger>
              <AccordionContent>Unchanged.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Frame>
      </Block>
      <Block title="Loading" description="The same rows inside Loading, with placeholder data.">
        <Frame width={544} flush>
          <Loading when label="Loading tools">
            <Accordion variant="rows" defaultValue={["r"]}>
              <Tool value="r" title={placeholderText(10)} icon={<Bell aria-hidden />} aside={<Badge>3</Badge>}>
                <p style={{ margin: 0 }}>{placeholderText(60)}</p>
              </Tool>
              <Tool value="s" title={placeholderText(8)} icon={<Folder aria-hidden />} aside={<Badge>12</Badge>}>
                <p style={{ margin: 0 }}>{placeholderText(40)}</p>
              </Tool>
            </Accordion>
          </Loading>
        </Frame>
      </Block>
    </Page>
  );
}

// ---------------------------------------------------------------------- Bulk

function BulkPage() {
  const [count, setCount] = useState(0);
  return (
    <Page title="Bulk actions that stay mounted" description="With keepMounted the region is in the DOM at a count of 0: the actions are hidden and the status is there to announce the first selection.">
      <Block title="keepMounted" description="Select some rows, then clear. The visible bar appears from 1.">
        <Frame width={720}>
          <div style={{ display: "flex", gap: "var(--fui-space-2)", marginBottom: "var(--fui-space-3)" }}>
            <Button variant="secondary" size="sm" onClick={() => setCount(3)}>Select 3</Button>
            <Button variant="secondary" size="sm" onClick={() => setCount(0)}>Clear</Button>
          </div>
          <BulkActions count={count} keepMounted regionLabel="Selection actions">
            <Button size="sm" variant="secondary"><Archive aria-hidden />Archive</Button>
            <Button size="sm" variant="secondary"><Trash2 aria-hidden />Delete</Button>
          </BulkActions>
        </Frame>
      </Block>
      <Block title="Selected, kept mounted (358 px)">
        <Frame width={358}>
          <BulkActions count={3} keepMounted>
            <Button size="sm" variant="secondary">Archive</Button>
            <Button size="sm" variant="secondary">Delete</Button>
          </BulkActions>
        </Frame>
      </Block>
    </Page>
  );
}

export const Launcher: Story = { render: () => <LauncherPage /> };
export const Options: Story = { render: () => <OptionsPage /> };
export const PaletteDialog: Story = { render: () => <CommandDialogPage /> };
export const Tools: Story = { render: () => <ToolsPage /> };
export const Bulk: Story = { render: () => <BulkPage /> };
