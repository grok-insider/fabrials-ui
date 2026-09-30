import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, CircleCheck, RefreshCw, Settings, Wrench } from "lucide-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  Input,
  NativeSelect,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SectionHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StatusPopover,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TooltipProvider,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Overlays",
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

const grid = { display: "grid", gap: "var(--fui-space-4)", minWidth: 0 } as const;

// -------------------------------------------------------------- Fixed dialog

const paragraphs = [
  "Offline copies keep the messages of the folders you choose on this device. They are encrypted with a key that only this browser holds.",
  "A copy is refreshed when you open the app with a connection. Messages you delete online are removed from the copy the next time it refreshes.",
  "Attachments larger than 10 MB are not copied unless you ask for them one by one from the message.",
  "You can remove the copy at any time from Settings; removing it does not delete anything from your mailbox.",
];

/** The default: a fixed header, a body that is the only scroller and a fixed footer whose primary action lives in the form's state. */
function FixedDialogPage() {
  const form = useId();
  const [copies, setCopies] = useState("inbox");
  return (
    <Page title="Dialog with a fixed header and footer" description="The dialog opens over this page. Its body is the only scroller; the title, Close and the primary action never scroll away.">
      <p style={{ margin: 0, maxWidth: "48rem" }}>The dialog is open on load. Close it with Escape, the Close button or the scrim, and reopen it below.</p>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>Save a copy</Button>} />
        <DialogContent size="wide" close="footer">
          <DialogHeader>
            <DialogTitle>Save a copy for offline reading</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {/* The header is the title alone; the description is the first line of the body, so a short window keeps room for it. */}
            <DialogDescription style={{ marginBottom: "var(--fui-space-4)" }}>Choose what stays on this device when you are offline.</DialogDescription>
            <form id={form} style={grid} onSubmit={(event) => event.preventDefault()}>
              <Field label="Folders" description="The messages of these folders are copied.">
                {(props) => (
                  <NativeSelect {...props} value={copies} onChange={(event) => setCopies(event.target.value)}>
                    <option value="inbox">Inbox</option>
                    <option value="starred">Starred</option>
                    <option value="all">All folders</option>
                  </NativeSelect>
                )}
              </Field>
              <Field label="Passphrase" description="Used to unlock the copy on this device. It is never sent anywhere.">
                {(props) => <Input {...props} type="password" autoComplete="new-password" />}
              </Field>
              {paragraphs.map((text) => (
                <p key={text} style={{ margin: 0 }}>
                  {text}
                </p>
              ))}
              <Field label="A note for yourself">{(props) => <Textarea {...props} rows={4} defaultValue="Refresh on Mondays." />}</Field>
              {paragraphs.map((text) => (
                <p key={`again-${text}`} style={{ margin: 0 }}>
                  {text}
                </p>
              ))}
            </form>
          </DialogBody>
          <DialogFooter>
            <DialogActions>
              <Button type="submit" form={form}>
                Save a copy
              </Button>
            </DialogActions>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

/** A long unbroken title and three actions: the title wraps and is never clipped; on a narrow dialog the ink action takes the first row. */
function LongTitlePage() {
  return (
    <Page title="Long title, narrow dialog" description="full-narrow keeps the default width and takes the whole screen below 48rem. The footer wraps under 34rem of dialog: the ink action last, on the full bottom row, every button 44 px.">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>Discard the draft</Button>} />
        <DialogContent size="full-narrow" close="footer">
          <DialogHeader>
            <DialogTitle>Discard the draft “Re: The reallylongunbrokenidentifier-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789 renewal”?</DialogTitle>
            <DialogDescription>The draft was last saved 4 minutes ago and has not been sent.</DialogDescription>
          </DialogHeader>
          <DialogBody tabIndex={0} role="region" aria-label="Draft details">
            <p style={{ margin: 0 }}>It has two attachments and three recipients. Discarding removes it from every device.</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline">Keep editing</Button>
            <DialogClose render={<Button variant="destructive">Discard</Button>} />
            <Button>Save as template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

/** The settings window switches its rail for a strip below 48rem, decided by the host from its own width. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 47.99rem)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

const sections = ["Identity", "Appearance", "Notifications", "Keyboard", "Offline"];

/** The settings size: a rail beside panels that scroll on their own, the corner close, the whole screen on a phone. */
function SettingsDialogPage() {
  const narrow = useNarrow();
  return (
    <Page title="Settings-sized dialog" description="62 by 42rem (72 by 48rem from 100rem), the whole screen below 48rem. DialogBody scroll={false} lets the panels scroll themselves.">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}><Settings aria-hidden />Settings</Button>} />
        <DialogContent size="settings" close="corner" closeLabel="Close settings">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Your identity, appearance and how this device keeps mail.</DialogDescription>
          </DialogHeader>
          <DialogBody scroll={false} padding="none">
            <Tabs defaultValue="Identity" orientation={narrow ? "horizontal" : "vertical"} style={{ minHeight: 0, height: "100%" }}>
              <TabsList aria-label="Settings sections" scrollable={narrow}>
                {sections.map((label) => (
                  <TabsTrigger key={label} value={label}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sections.map((label) => (
                <TabsContent key={label} value={label} style={{ overflow: "auto", minHeight: 0, padding: "var(--fui-space-5)" }}>
                  <div style={grid}>
                    <SectionHeader title={label} description={`How ${label.toLowerCase()} works on this device.`} />
                    {Array.from({ length: 6 }, (_, index) => (
                      <Field key={index} label={`${label} option ${index + 1}`} description="A sentence that says what changes.">
                        {(props) => <Input {...props} defaultValue="Value" />}
                      </Field>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

// ------------------------------------------------------------------- Sheets

/** Non-modal: no scrim, no focus trap, the page keeps working and an outside press does not close it. */
function NonModalSheetPage() {
  const [draft, setDraft] = useState("");
  return (
    <Page title="Non-modal sheet" description="A drawer beside the page: type in the field behind it, then Tab. Only Escape, the close control or the trigger close it.">
      <div style={{ ...grid, maxWidth: "32rem" }}>
        <Field label="Reply">
          {(props) => <Textarea {...props} rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write while the drawer is open" />}
        </Field>
        <Sheet modal={false} defaultOpen>
          <SheetTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}><Wrench aria-hidden />Tools</Button>} />
          <SheetContent side="right" closeLabel="Close tools" padding="none">
            <SheetHeader style={{ padding: "var(--fui-space-4)", borderBottom: "1px solid var(--border)", margin: 0 }}>
              <SheetTitle>Tools</SheetTitle>
              <SheetDescription>They stay open while you work.</SheetDescription>
            </SheetHeader>
            <div style={{ padding: "var(--fui-space-4)", ...grid }}>
              <p style={{ margin: 0 }}>Everything in this drawer is optional. The reply stays where it is.</p>
              <Field label="Search the tools">{(props) => <Input {...props} />}</Field>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Page>
  );
}

/** The modal sheet, for contrast: scrim, focus trap, padding. */
function ModalSheetPage() {
  return (
    <Page title="Modal sheet" description="The default: a scrim, focus stays inside, the page behind is inert.">
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>Filters</Button>} />
        <SheetContent side="left" closeLabel="Close filters">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow the list.</SheetDescription>
          </SheetHeader>
          <div style={grid}>
            <Field label="Sender">{(props) => <Input {...props} />}</Field>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}

// ------------------------------------------------------------ Close variant

/** `closeVariant` on the content sets the footer Close once: here an outline, like the other secondary action beside it. */
function CloseVariantPage() {
  return (
    <Page title="Close as an outline" description="The footer Close is a secondary (grey) button by default. A product whose secondary actions are outlines sets closeVariant once on the DialogContent; a DialogFooter closeVariant wins.">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>Discard changes</Button>} />
        <DialogContent close="footer" closeVariant="outline">
          <DialogHeader>
            <DialogTitle>Discard your changes?</DialogTitle>
            <DialogDescription>Close and Keep editing are both outlines; the primary action is the ink one.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Keep editing</Button>
            <DialogClose render={<Button>Discard</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>Footer wins</Button>} />
        <DialogContent close="footer" closeVariant="outline">
          <DialogHeader>
            <DialogTitle>The footer decides</DialogTitle>
            <DialogDescription>The content says outline; this footer says ghost, and the footer wins.</DialogDescription>
          </DialogHeader>
          <DialogFooter closeVariant="ghost">
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

// ------------------------------------------------------------- Long form

/** A long form in a fixed dialog: in a short window the footer sticks and the last field must stay clear of it when it takes focus. */
function LongFormDialogPage() {
  return (
    <Page title="Long form in a short window" description="Under 30rem of window height the dialog scrolls as a whole and only the footer sticks. Tab to the last field: it scrolls into view above the footer, not under it.">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="secondary" style={{ justifySelf: "start" }}>New signature</Button>} />
        <DialogContent size="wide" close="footer">
          <DialogHeader>
            <DialogTitle>New signature</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form style={grid} onSubmit={(event) => event.preventDefault()}>
              {["Name", "Title", "Company", "Street", "City", "Region", "Postal code", "Country", "Phone", "Website"].map((label) => (
                <Field key={label} label={label}>{(props) => <Input {...props} />}</Field>
              ))}
              <Field label="Closing line" description="The last field: it stays clear of the footer when it takes focus.">
                {(props) => <Input {...props} data-last />}
              </Field>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button>Save signature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

// ---------------------------------------------------- A drawer under a header

const headerHeight = "3.5rem";

/**
 * The tools drawer of a workspace, made with the package alone: non-modal, kept mounted, on the inline end, under the header
 * (its top is the header's bottom edge), portalled next to its trigger, not taking focus on open, and closed by Escape only from
 * inside. A composer stands beside it: Escape in the composer leaves the drawer open.
 */
function DrawerUnderHeaderPage({ rtl = false }: { rtl?: boolean }) {
  const [draft, setDraft] = useState("");
  // an element in state, not a ref object: `null` makes the portal wait, and a sheet that is open on the first render finds it
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const style = {
    "--fui-sheet-inset-block-start": headerHeight,
    "--fui-sheet-z": "calc(var(--fui-z-overlay) - 10)",
    "--fui-sheet-width": "24rem",
  } as CSSProperties;
  return (
    <div dir={rtl ? "rtl" : undefined} style={{ minBlockSize: "100dvh", background: "var(--background)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--fui-space-3)",
          boxSizing: "border-box",
          blockSize: headerHeight,
          paddingInline: "var(--fui-space-4)",
          borderBlockEnd: "1px solid var(--border)",
          background: "var(--card)",
          position: "relative",
        }}
      >
        <strong style={{ marginInlineEnd: "auto" }}>Mail</strong>
        <div ref={setSlot} style={{ display: "contents" }}>
          <Sheet modal={false} defaultOpen closeOnEscape="focus-inside">
            <SheetTrigger render={<Button variant="ghost" size="lg"><Wrench aria-hidden />Tools</Button>} />
            <SheetContent
              side="end"
              container={slot}
              keepMounted
              initialFocus={false}
              closeLabel="Close tools"
              padding="none"
              style={style}
            >
              <SheetHeader style={{ padding: "var(--fui-space-4)", borderBottom: "1px solid var(--border)", margin: 0 }}>
                <SheetTitle>Tools</SheetTitle>
                <SheetDescription>Under the header, on the inline end.</SheetDescription>
              </SheetHeader>
              <div style={{ padding: "var(--fui-space-4)", ...grid }}>
                <Field label="Search the tools">{(props) => <Input {...props} />}</Field>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="catalogue">
        <PageHeader title={rtl ? "Drawer under a header, right to left" : "Drawer under a header"} description="Press Escape in the reply: the drawer stays. Press it inside the drawer: it closes and Tools has focus." />
        <div style={{ ...grid, maxWidth: "28rem" }}>
          <Field label="Reply">
            {(props) => <Textarea {...props} rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write while the drawer is open" />}
          </Field>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------- Keep mounted

function KeepMountedPage() {
  return (
    <Page title="Kept mounted" description="Overlay content that is hidden, not removed, while it is closed: what you typed is still there when it opens again.">
      <Block title="Dialog, popover and menu" description="Type in each, close it, open it again.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-3)" }}>
          <Dialog>
            <DialogTrigger render={<Button variant="secondary">Dialog</Button>} />
            <DialogContent keepMounted close="footer">
              <DialogHeader>
                <DialogTitle>Reply</DialogTitle>
                <DialogDescription>The text stays when you close this.</DialogDescription>
              </DialogHeader>
              <Textarea aria-label="Reply text" rows={4} />
              <DialogFooter />
            </DialogContent>
          </Dialog>
          <Popover>
            <PopoverTrigger render={<Button variant="secondary">Popover</Button>} />
            <PopoverContent keepMounted>
              <PopoverHeader>
                <PopoverTitle>Rename</PopoverTitle>
                <PopoverDescription>Kept while closed.</PopoverDescription>
              </PopoverHeader>
              <Input aria-label="New name" />
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary">Menu</Button>} />
            <DropdownMenuContent keepMounted>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Snooze</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------ Status popovers

function StatusPopoversPage() {
  const [checked, setChecked] = useState(false);
  return (
    <Page title="Status popovers" description="A status that is one sentence long: an icon or an icon and a word that opens a popover with what to do about it.">
      <Block title="States" description="Ok, needs a look (warning), failed (danger), a visible word, and compact, which hides the word and keeps it in the name.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)", alignItems: "center" }}>
          <StatusPopover title="Permissions" description="You can move and label messages here." icon={<CircleCheck aria-hidden />} />
          <StatusPopover title="Permissions" description="Some actions are unavailable on this account." icon={<CircleAlert aria-hidden />} attention="warning">
            <Button variant="secondary" size="sm"><RefreshCw aria-hidden />Refresh</Button>
          </StatusPopover>
          <StatusPopover title="Permissions" description="They could not be loaded. Check the connection." icon={<CircleAlert aria-hidden />} attention label="Failed">
            <Button variant="secondary" size="sm"><RefreshCw aria-hidden />Try again</Button>
          </StatusPopover>
          <StatusPopover title="Sync" description="Everything is up to date." icon={<CircleCheck aria-hidden />} label="Synced" />
          <StatusPopover title="Sync" description="Everything is up to date." icon={<CircleCheck aria-hidden />} label="Synced" compact />
        </div>
      </Block>
      <Block title="Open" description="The popup is a dialog named by its title; Escape returns focus to the trigger.">
        <div style={{ minHeight: "12rem" }}>
          <StatusPopover title="Permissions" description="Some actions are unavailable on this account." icon={<CircleAlert aria-hidden />} attention="warning" label="Limited" defaultOpen align="start">
            <Switch checked={checked} onCheckedChange={setChecked} aria-label="Remember" />
          </StatusPopover>
        </div>
      </Block>
      <Block title="Right to left">
        <div dir="rtl" style={{ display: "flex", gap: "var(--fui-space-2)" }}>
          <StatusPopover title="الأذونات" description="بعض الإجراءات غير متاحة." icon={<CircleAlert aria-hidden />} attention="warning" label="محدود" />
        </div>
      </Block>
    </Page>
  );
}

export const FixedDialog: Story = { render: () => <FixedDialogPage /> };
export const LongTitle: Story = { render: () => <LongTitlePage /> };
export const SettingsDialog: Story = { render: () => <SettingsDialogPage /> };
export const NonModalSheet: Story = { render: () => <NonModalSheetPage /> };
export const ModalSheet: Story = { render: () => <ModalSheetPage /> };
export const CloseVariant: Story = { render: () => <CloseVariantPage /> };
export const LongFormDialog: Story = { render: () => <LongFormDialogPage /> };
export const DrawerUnderHeader: Story = { render: () => <DrawerUnderHeaderPage /> };
export const DrawerUnderHeaderRtl: Story = { render: () => <DrawerUnderHeaderPage rtl /> };
export const KeepMounted: Story = { render: () => <KeepMountedPage /> };
export const StatusPopovers: Story = { render: () => <StatusPopoversPage /> };
