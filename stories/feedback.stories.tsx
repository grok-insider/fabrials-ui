import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Bell, CircleCheck, CloudOff, Lock, OctagonX, Search, Trash2, WifiOff } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ConfirmActionButton,
  ConfirmDialog,
  ConfirmProvider,
  FileSize,
  IconButton,
  Kbd,
  KbdGroup,
  Loading,
  PageHeader,
  Progress,
  ProgressLabel,
  ProgressValue,
  RelativeTime,
  SectionHeader,
  StatePanel,
  avatarInitials,
  formatBytes,
  useConfirm,
  useModifierKey,
} from "@fabrials/ui";

const meta = {
  title: "Tests/Feedback",
  parameters: { layout: "fullscreen" },
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

/** A width the piece is asked to live in: `358` is a phone pane, and the frame never grows past the window. */
function Frame({ width, dir, height, children }: { width?: number; dir?: "rtl"; height?: number; children: ReactNode }) {
  return (
    <div
      dir={dir}
      style={{
        width: "100%",
        boxSizing: "border-box",
        maxWidth: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        minWidth: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--fui-radius-lg)",
        background: "var(--card)",
        padding: "var(--fui-space-3)",
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

const retry = <Button variant="secondary" size="sm">Retry</Button>;
const states = [
  { state: "loading", title: "Loading folders", description: "This takes a moment." },
  { state: "empty", title: "No folders yet", description: "Create one to sort your mail.", actions: <Button variant="secondary" size="sm">New folder</Button> },
  { state: "error", title: "Folders failed to load", description: "The connection dropped before the list arrived.", actions: retry },
  { state: "stale", title: "Showing the last folders", description: "They may be out of date.", actions: retry },
  { state: "offline", title: "You are offline", description: "Changes wait for the connection." },
  { state: "success", title: "Folders are up to date" },
] as const;

// ------------------------------------------------------------------ StatePanel

function StatePanelsPage() {
  return (
    <Page
      title="State panels"
      description="A compact size and an inline variant for embedded regions: drawers, popovers, sidebars, list slots and palettes."
    >
      <Block title="Every state, size sm (16 px padding)" description="The same icon and text as the default; only the padding changes.">
        <Frame width={358}>
          <div className="catalogue-stack">
            {states.map((item) => (
              <StatePanel key={item.state} size="sm" headingLevel={3} {...item} />
            ))}
          </div>
        </Frame>
      </Block>
      <Block title="Every state, inline (no border, no tint)" description="For an overlay or a palette that already sits in a panel. The icon still carries the state; an error keeps role alert.">
        <Frame width={358}>
          <div className="catalogue-stack">
            {states.map((item) => (
              <StatePanel key={item.state} size="sm" variant="inline" headingLevel={3} {...item} />
            ))}
          </div>
        </Frame>
      </Block>
      <Block title="Default size, for comparison">
        <div className="catalogue-stack">
          <StatePanel state="error" title="Folders failed to load" description="The connection dropped before the list arrived." actions={retry} />
          <StatePanel state="empty" align="center" title="No folders yet" description="Create one to sort your mail." actions={<Button variant="secondary" size="sm">New folder</Button>} />
        </div>
      </Block>
      <Block title="Centred and filling a region" description="fill takes the height of a region that has one: an empty reader pane. inline drops the border; sm keeps 16 px.">
        <div className="catalogue-grid">
          <Frame height={220}>
            <StatePanel state="empty" align="center" variant="inline" size="sm" fill title="Select a message" description="Its content shows here." />
          </Frame>
          <Frame height={220}>
            <StatePanel state="empty" align="center" fill title="Select a message" description="Its content shows here." />
          </Frame>
        </div>
      </Block>
      <Block title="In a 358 px pane: long content" description="Long titles and descriptions wrap; the actions wrap below.">
        <Frame width={358}>
          <StatePanel
            state="error"
            size="sm"
            headingLevel={3}
            title="The folder “Projects/2026/Quarterly planning and budget review” could not be opened"
            description="reallylongunbrokenidentifier-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789-and-more was rejected by the server."
            actions={
              <>
                {retry}
                <Button variant="ghost" size="sm">Copy the reference</Button>
              </>
            }
          />
        </Frame>
      </Block>
      <Block title="Right to left">
        <Frame width={358} dir="rtl">
          <StatePanel state="stale" size="sm" headingLevel={3} title="عرض آخر المجلدات" description="قد تكون قديمة." actions={<Button variant="secondary" size="sm">إعادة المحاولة</Button>} />
        </Frame>
      </Block>
      <Block title="Loading" description="The panel becomes its own skeleton; the icon and text turn into blocks and bars.">
        <Loading when label="Loading the panel">
          <Frame width={358}>
            <StatePanel state="empty" size="sm" headingLevel={3} title="No folders yet" description="Create one to sort your mail." actions={<Button variant="secondary" size="sm">New folder</Button>} />
          </Frame>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Confirmations

function DeleteContactDemo() {
  const [removed, setRemoved] = useState(false);
  const [where, setWhere] = useState("nothing yet");
  const [open, setOpen] = useState(false);
  return (
    <div className="catalogue-stack">
      <div className="catalogue-row">
        {removed ? null : (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Trash2 aria-hidden />
            Delete contact
          </Button>
        )}
        <Button variant="ghost" onClick={() => setRemoved(false)} disabled={!removed}>
          Undo the demo
        </Button>
      </div>
      <p
        id="story-delete-result"
        tabIndex={-1}
        style={{ margin: 0, padding: "var(--fui-space-2)", borderRadius: "var(--fui-radius-sm)", background: "var(--muted)" }}
      >
        {removed ? "Contact deleted. Focus is on this line." : "Contact kept."} Last focus target named: {where}.
      </p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this contact?"
        description="Their addresses leave every list. This example changes nothing."
        confirmLabel="Delete contact"
        destructive
        onConfirm={() => setRemoved(true)}
        finalFocus={(_closeType, outcome) => {
          setWhere(outcome === "confirmed" ? "the result line" : "the trigger (default)");
          return outcome === "confirmed" ? document.getElementById("story-delete-result") : null;
        }}
      />
    </div>
  );
}

function AwaitedConfirmDemo() {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState("No question asked yet.");
  return (
    <div className="catalogue-stack">
      <div className="catalogue-row">
        <Button
          variant="outline"
          onClick={async () => {
            const yes = await confirm({
              title: "Discard this draft?",
              description: "The message is not saved anywhere else.",
              confirmLabel: "Discard",
              cancelLabel: "Keep editing",
              destructive: true,
            });
            setAnswer(yes ? "Confirmed: the draft is discarded." : "Dismissed: the draft is kept.");
          }}
        >
          <Trash2 aria-hidden />
          Discard draft
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const yes = await confirm({ title: "Archive 3 conversations?", confirmLabel: "Archive" });
            setAnswer(yes ? "Confirmed: archived." : "Dismissed: nothing archived.");
          }}
        >
          <Archive aria-hidden />
          Archive selected
        </Button>
      </div>
      <p role="status" style={{ margin: 0 }}>{answer}</p>
    </div>
  );
}

function ConfirmationsPage() {
  return (
    <Page
      title="Confirmations"
      description="ConfirmDialog can name where focus goes, and useConfirm asks a question you can await. Open Email keeps window.confirm for guards that cannot wait (back, forward, unload)."
    >
      <Block title="finalFocus: a confirmed action that removes its trigger" description="Confirm and the button is gone: focus moves to the line that reports the result. Cancel and Escape return to the trigger.">
        <Frame width={560}>
          <DeleteContactDemo />
        </Frame>
      </Block>
      <Block title="ConfirmActionButton" description="finalFocus is passed through, and description is optional.">
        <div className="catalogue-row">
          <ConfirmActionButton buttonProps={{ variant: "outline" }} title="Mark all as read?" confirmLabel="Mark as read" onConfirm={() => undefined}>
            Mark all as read
          </ConfirmActionButton>
        </div>
      </Block>
      <Block title="useConfirm" description="const yes = await confirm({ title, description, destructive }). Escape, Cancel and the backdrop resolve false; focus returns to the control that asked. Without a ConfirmProvider it is window.confirm.">
        <Frame width={560}>
          <ConfirmProvider>
            <AwaitedConfirmDemo />
          </ConfirmProvider>
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ RelativeTime

const NOW = Date.parse("2026-09-29T12:00:00Z");
const at = (offsetSeconds: number) => new Date(NOW - offsetSeconds * 1000).toISOString();
const ROW = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" } as const;
/** The year only when it is not the year of the clock: the rule a mail row applies, owned by the caller. */
const rowFormat = (date: Date, now: number): Intl.DateTimeFormatOptions => ({
  ...ROW,
  ...(date.getUTCFullYear() === new Date(now).getUTCFullYear() ? {} : { year: "numeric" as const }),
});

function TimesPage() {
  return (
    <Page
      title="Relative time"
      description="Deterministic mode prints an absolute date with no timer, and a fixed clock makes the relative text exact. Give it a time zone and the server and the browser print the same text."
    >
      <Block title="Absolute, in a fixed zone" description="absoluteFormat with timeZone: a list renders the same tomorrow, in a screenshot and on the server. The exact instant is in the title.">
        <Frame width={520}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-2)" }}>
            {[at(3600 * 5), at(86_400 * 40), at(86_400 * 900)].map((date) => (
              <li key={date}>
                <RelativeTime date={date} now={NOW} timeZone="Europe/Madrid" absoluteFormat={rowFormat} locale="en" />
              </li>
            ))}
          </ul>
        </Frame>
      </Block>
      <Block title="Relative, with a fixed clock" description="now as a number stops the timer.">
        <Frame width={520}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-2)" }}>
            {[10, 300, 3600 * 3, 86_400 * 2, 86_400 * 12, 86_400 * 45].map((seconds) => (
              <li key={seconds}>
                <RelativeTime date={at(seconds)} now={NOW} timeZone="UTC" />
              </li>
            ))}
          </ul>
        </Frame>
      </Block>
      <Block title="Locales and short styles">
        <Frame width={520}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-2)" }}>
            <li><RelativeTime date={at(3600 * 3)} now={NOW} locale="es" timeZone="UTC" /></li>
            <li><RelativeTime date={at(86_400 * 2)} now={NOW} locale="fr" style="short" timeZone="UTC" /></li>
            <li dir="rtl"><RelativeTime date={at(3600 * 3)} now={NOW} locale="ar" timeZone="UTC" /></li>
            <li dir="rtl"><RelativeTime date={at(86_400 * 40)} now={NOW} locale="ar" timeZone="Africa/Cairo" absoluteFormat={rowFormat} /></li>
          </ul>
        </Frame>
      </Block>
      <Block title="Invalid dates">
        <Frame width={520}>
          <p style={{ margin: 0 }}>
            Received: “<RelativeTime date="not a date" now={NOW} absoluteFormat={ROW} />” (nothing is printed for a date that does not parse).
          </p>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading dates">
          <Frame width={520}>
            <RelativeTime date={at(3600 * 5)} now={NOW} timeZone="Europe/Madrid" absoluteFormat={rowFormat} />
          </Frame>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Kbd

function ModifierHint() {
  const key = useModifierKey();
  return <span>This device prints the modifier as <Kbd>{key}</Kbd>.</span>;
}

function KeysPage() {
  return (
    <Page
      title="Key hints"
      description="Keys pressed together, keys pressed one after the other, and a modifier that reads Ctrl on the server and the command key on Apple devices after hydration."
    >
      <Block title="Together and in sequence">
        <div className="catalogue-row">
          <KbdGroup aria-label="Control K"><Kbd mod /><Kbd>K</Kbd></KbdGroup>
          <KbdGroup sequence aria-label="G then I"><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>
          <KbdGroup sequence separator="luego" aria-label="G luego C"><Kbd>g</Kbd><Kbd>c</Kbd></KbdGroup>
          <KbdGroup sequence separator="ثم" aria-label="G ثم I"><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>
        </div>
      </Block>
      <Block title="useModifierKey">
        <p style={{ margin: 0 }}><ModifierHint /></p>
      </Block>
      <Block title="In a button, a tooltip and a narrow row">
        <div className="catalogue-row">
          <Button variant="outline">
            <Search aria-hidden />
            Search
            <KbdGroup aria-hidden><Kbd mod /><Kbd>K</Kbd></KbdGroup>
          </Button>
          <IconButton label="Go to inbox" variant="outline" shortcut={{ keys: ["g", "i"], sequence: true }}><Bell aria-hidden /></IconButton>
        </div>
        <Frame width={358}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-2)" }}>
            {[["Go to inbox", ["g", "i"]], ["Go to contacts", ["g", "c"]], ["Compose a message", ["c"]]].map(([label, keys]) => (
              <li key={String(label)} style={{ display: "flex", justifyContent: "space-between", gap: "var(--fui-space-3)", alignItems: "center", minWidth: 0 }}>
                <span style={{ minWidth: 0 }}>{label}</span>
                <KbdGroup sequence={keys.length > 1}>{(keys as string[]).map((key) => <Kbd key={key}>{key}</Kbd>)}</KbdGroup>
              </li>
            ))}
          </ul>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading shortcuts">
          <KbdGroup sequence><Kbd>g</Kbd><Kbd>i</Kbd></KbdGroup>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Alert

function NoticeSet({ layout = "inline" }: { layout?: "inline" | "stacked" }) {
  return (
    <div className="catalogue-stack">
      <Alert layout={layout} variant="warning">
        <WifiOff aria-hidden />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>Changes wait for the connection and are sent when it returns.</AlertDescription>
        <AlertAction><Button variant="outline" size="sm">Retry now</Button></AlertAction>
      </Alert>
      <Alert layout={layout} variant="destructive">
        <AlertTitle>Sign-out failed</AlertTitle>
        <AlertDescription>The session could not be closed. Try again.</AlertDescription>
      </Alert>
      <Alert layout={layout} variant="success">
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your preferences are up to date.</AlertDescription>
      </Alert>
      <Alert layout={layout}>
        <AlertTitle>A very long title that keeps going so that the layout has to decide where it breaks</AlertTitle>
        <AlertDescription>reallylongunbrokenidentifier-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789 and then a sentence of normal length.</AlertDescription>
        <AlertAction><Button variant="outline" size="sm">Open details</Button></AlertAction>
      </Alert>
    </div>
  );
}

function NoticesPage() {
  return (
    <Page
      title="Inline alerts"
      description="A slim one-line notice for the top of a page or a pane. From 48rem of its own width the title and the description share a line and the action sits at the end; narrower it stacks like the default alert."
    >
      <Block title="Wide (fills the page)" description="Inline at the page width: one line from 48rem of the alert's own width.">
        <NoticeSet />
      </Block>
      <Block title="Narrow, 358 px" description="Below 48rem it stacks: icon, then title, description and action in one column.">
        <Frame width={358}>
          <NoticeSet />
        </Frame>
      </Block>
      <Block title="Right to left, 900 px">
        <Frame width={900} dir="rtl">
          <Alert layout="inline" variant="warning">
            <WifiOff aria-hidden />
            <AlertTitle>أنت غير متصل</AlertTitle>
            <AlertDescription>تنتظر التغييرات عودة الاتصال ثم ترسل.</AlertDescription>
            <AlertAction><Button variant="outline" size="sm">أعد المحاولة</Button></AlertAction>
          </Alert>
        </Frame>
      </Block>
      <Block title="Stacked (default), for comparison">
        <Frame width={900}>
          <NoticeSet layout="stacked" />
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading the notice">
          <Alert layout="inline" variant="warning">
            <WifiOff aria-hidden />
            <AlertTitle>You are offline</AlertTitle>
            <AlertDescription>Changes wait for the connection.</AlertDescription>
          </Alert>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Badge

const labelTones = [
  { name: "Receipts", tone: "var(--chart-1)" },
  { name: "Travel", tone: "var(--chart-2)" },
  { name: "Family", tone: "var(--chart-3)" },
  { name: "Ruby", tone: "var(--gem-ruby)" },
  { name: "Amethyst", tone: "var(--gem-amethyst)" },
] as const;

function TagsPage() {
  const [picked, setPicked] = useState<string | null>("Receipts");
  return (
    <Page
      title="Tags"
      description="A tag whose colour is data: --fui-badge-solid tints the tag and its dot, --fui-badge-ink is the text, dotColor recolours the dot alone, and truncate keeps a long name in its row."
    >
      <Block title="Sizes, icons and counts" description="sm 18 px, the default 20 px, lg 24 px; an icon is a 12 px glyph (14 px in lg) in the tag's ink; a number on its own sits centred in a tag at least as wide as it is tall.">
        <div className="catalogue-row" style={{ alignItems: "center" }}>
          <Badge size="sm" variant="outline">Team</Badge>
          <Badge>Team</Badge>
          <Badge size="lg" tone="info">Beta</Badge>
          <Badge size="sm">3</Badge>
          <Badge>3</Badge>
          <Badge size="lg">3</Badge>
          <Badge variant="solid">12</Badge>
          <Badge variant="solid" tone="danger">99+</Badge>
          <Badge variant="outline">1,204</Badge>
        </div>
        <div className="catalogue-row" style={{ alignItems: "center" }}>
          <Badge tone="success"><CircleCheck aria-hidden /> Connected</Badge>
          <Badge tone="warning"><CloudOff aria-hidden /> Offline</Badge>
          <Badge tone="danger"><OctagonX aria-hidden /> Failed</Badge>
          <Badge><Lock aria-hidden /> Private</Badge>
          <Badge size="sm" tone="success"><CircleCheck aria-hidden /> Connected</Badge>
          <Badge size="lg" tone="success"><CircleCheck aria-hidden /> Connected</Badge>
        </div>
      </Block>
      <Block title="A live dot" description="pulse ripples the dot while the state is live; it holds still under reduced motion and in a skeleton.">
        <div className="catalogue-row">
          <Badge dot pulse tone="info">Syncing</Badge>
          <Badge dot pulse tone="danger">Recording</Badge>
          <Badge dot="hollow" pulse>Waiting</Badge>
          <Badge size="lg" dot pulse tone="success">Live</Badge>
        </div>
      </Block>
      <Block title="Links and buttons" description="render makes the tag a link or a button: it takes the pointer, deepens its tint under it and shows the focus ring; a pressed or current one keeps the deeper tint and draws its edge in its colour.">
        <div className="catalogue-row" role="group" aria-label="Labels">
          {labelTones.slice(0, 3).map(({ name, tone }) => (
            <Badge
              key={name}
              dot
              render={<button type="button" aria-pressed={picked === name} onClick={() => setPicked(picked === name ? null : name)} />}
              style={{ "--fui-badge-solid": tone } as React.CSSProperties}
            >
              {name}
            </Badge>
          ))}
          <Badge render={<a href="#tags" aria-current="page" />} variant="outline">Current view</Badge>
          <Badge render={<a href="#tags" />} tone="info">Open in Usage</Badge>
          <Badge render={<button type="button" />} variant="solid" tone="info">New</Badge>
        </div>
      </Block>
      <Block title="--fui-badge-solid on a neutral tag" description="The tint, the hairline and the round dot follow the property; the ink stays neutral so the name reads on any colour.">
        <div className="catalogue-row">
          {labelTones.map(({ name, tone }) => (
            <Badge key={name} dot style={{ "--fui-badge-solid": tone } as React.CSSProperties}>{name}</Badge>
          ))}
        </div>
      </Block>
      <Block title="dotColor: the dot alone">
        <div className="catalogue-row">
          {labelTones.map(({ name, tone }) => (
            <Badge key={name} variant="outline" dot dotColor={tone}>{name}</Badge>
          ))}
        </div>
      </Block>
      <Block title="Hollow dot and states" description='dot="hollow" is an outline dot: an archived or inactive item, said in words as well.'>
        <div className="catalogue-row">
          <Badge dot dotColor="var(--chart-2)">Travel</Badge>
          <Badge variant="outline" dot="hollow" dotColor="var(--chart-2)">Travel · archived</Badge>
          <Badge tone="success" dot>Connected</Badge>
          <Badge tone="warning" dot="hollow">Paused</Badge>
        </div>
      </Block>
      <Block title="truncate" description="The tag shrinks to its container and cuts long text with an ellipsis; the full text is in the title. --fui-badge-max caps it.">
        <Frame width={358}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-2)", minWidth: 0 }}>
            <li style={{ display: "flex", gap: "var(--fui-space-2)", minWidth: 0 }}>
              <span style={{ flex: "none" }}>Home</span>
              <Badge truncate variant="outline">A very long address label that must not push the row wider</Badge>
            </li>
            <li style={{ display: "flex", gap: "var(--fui-space-2)", minWidth: 0 }}>
              <span style={{ flex: "none" }}>Work</span>
              <Badge truncate variant="outline" style={{ "--fui-badge-max": "10rem" } as React.CSSProperties}>Capped at ten rem even in a wide row</Badge>
            </li>
            <li style={{ display: "flex", gap: "var(--fui-space-2)", minWidth: 0 }}>
              <span style={{ flex: "none" }}>Mobile</span>
              <Badge truncate variant="outline">Short</Badge>
            </li>
          </ul>
        </Frame>
      </Block>
      <Block title="Right to left">
        <Frame width={358} dir="rtl">
          <div className="catalogue-row">
            <Badge dot dotColor="var(--chart-1)" truncate>إيصالات وفواتير السفر والإقامة والمشتريات الطويلة جدا</Badge>
            <Badge variant="outline" dot="hollow" dotColor="var(--chart-2)">سفر · مؤرشف</Badge>
          </div>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading labels">
          <div className="catalogue-row">
            {labelTones.slice(0, 3).map(({ name, tone }) => (
              <Badge key={name} dot pulse dotColor={tone} style={{ "--fui-badge-solid": tone } as React.CSSProperties}>{name}</Badge>
            ))}
          </div>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Text helpers

const people = ["Ana Lopez Ruiz", "ana@example.com", "élan vital", "🙂 Smile Person", "", "李 小龍"];
const sizes = [0, 812, 1536, 25 * 1024 * 1024, 2.4 * 1024 * 1024 * 1024];

function TextPage() {
  return (
    <Page
      title="Text helpers"
      description="Avatar initials by grapheme, sizes as people read them, and a hit-area helper for anything that paints smaller than 44 px."
    >
      <Block title="avatarInitials" description="First letters of the first and last word, or the first letter of an address; a fallback when there is nothing.">
        <div className="catalogue-row">
          {people.map((person, index) => (
            <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
              <Avatar aria-hidden><AvatarFallback>{avatarInitials(person)}</AvatarFallback></Avatar>
              <span>{person || "(empty)"}</span>
            </span>
          ))}
        </div>
      </Block>
      <Block title="FileSize and formatBytes" description="1024 steps, short units in the locale, the exact count in the title, and it never throws while rendering.">
        <Frame width={420}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--fui-space-1)" }}>
            {sizes.map((bytes) => (
              <li key={bytes} style={{ display: "flex", justifyContent: "space-between", gap: "var(--fui-space-3)" }}>
                <FileSize bytes={bytes} />
                <FileSize bytes={bytes} locale="es" />
                <code>{formatBytes("de", bytes)}</code>
              </li>
            ))}
            <li style={{ display: "flex", justifyContent: "space-between" }}>
              <FileSize bytes={undefined} fallback="Unknown size" />
              <FileSize bytes={-1} fallback="Invalid" />
            </li>
          </ul>
        </Frame>
      </Block>
      <Block title='data-hit="44"' description="The dashed box is the 44 px target (drawn by this story only); the painted control keeps its size and the layout does not move.">
        <style>{`.story-hit-demo [data-hit="44"]::before { outline: 1px dashed var(--brand-ink); }`}</style>
        <div className="story-hit-demo catalogue-row">
          <button type="button" data-hit="44" className="fui-button" data-variant="link" style={{ padding: 0, minHeight: 0, blockSize: "1.25rem" }}>
            Show quoted text
          </button>
          <a href="#hit" data-hit="44" className="fui-link" style={{ fontSize: "0.8125rem" }}>Unsubscribe</a>
        </div>
      </Block>
    </Page>
  );
}

function ProgressPage() {
  return (
    <Page
      title="Progress"
      description="How far a task has gone: a label row, the track and a hint; three sizes, the tones, work whose total is not known yet, steps, a ring, and shadcn's parts."
    >
      <Block title="Label, value and hint" description="label names the bar and shows the value at the end of its row; hint is the line under it and describes the bar. Without a label, aria-label names it.">
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="Indexing headers" value={62} hint="1,204 of 1,940 messages · about 1 min left" />
            <Progress label="Sync progress" value={0.4} max={1} />
            <Progress aria-label="Quota used" value={42} />
          </div>
        </Frame>
      </Block>
      <Block title="Sizes" description="sm 4 px for a row, the default 6 px, lg 8 px for a page's one task; the label row follows the size.">
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="Small" size="sm" value={30} hint="In a list row" />
            <Progress label="Default" value={55} hint="Under a card's title" />
            <Progress label="Large" size="lg" value={80} hint="The task a page is about" />
          </div>
        </Frame>
      </Block>
      <Block title="Tones and outcomes" description="The tone repeats what the words say: done, slow, failed. A failed task keeps its bar where it stopped.">
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="North workspace" value={48} hint="Indexing headers" />
            <Progress label="Preview build" tone="info" value={70} hint="Rendering pages" />
            <Progress label="Archive" tone="success" value={100} hint="3,412 messages · synced 2 min ago" />
            <Progress label="Relay staging" tone="warning" value={33} hint="Slow: the server asked us to wait 30 s" />
            <Progress label="Harbour lab" tone="danger" value={48} hint="Stopped at 48 %: the password was refused" />
          </div>
        </Frame>
      </Block>
      <Block title="Total not known yet" description="Without a value the track carries the working light (a dashed line under reduced motion); a tone that says an outcome paints it in its colour.">
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="Counting messages" hint="The total arrives with the first page" />
            <Progress aria-label="Preparing the upload" size="sm" />
            <Progress label="Retrying" tone="warning" size="lg" hint="Attempt 2 of 5" />
          </div>
        </Frame>
      </Block>
      <Block title="Steps" description="steps cuts the bar into segments that ink in order: a form in steps, the files of a batch. A value between two steps fills part of a segment.">
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="Step 2 of 4" max={4} showValue={false} steps={4} value={2} hint="Account, then workspace, then billing" />
            <Progress label="Uploading" max={8} showValue={false} steps={8} value={3} hint="3 of 8 files" />
            <Progress aria-label="Half a step" size="sm" steps={5} value={50} />
            <Progress aria-label="Large steps" size="lg" steps={3} value={100} tone="success" />
          </div>
        </Frame>
      </Block>
      <Block title="Ring" description='variant="ring" closes clockwise, with its label and hint beside it; at lg the value sits inside. 16, 24 and 48 px.'>
        <Frame width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <div className="catalogue-row" style={{ alignItems: "center" }}>
              <Progress aria-label="Small ring" size="sm" value={25} variant="ring" />
              <Progress aria-label="Ring" value={60} variant="ring" />
              <Progress aria-label="Large ring" size="lg" value={85} variant="ring" />
              <Progress aria-label="Done" size="lg" tone="success" value={100} variant="ring" />
              <Progress aria-label="Small ring, unknown" size="sm" variant="ring" />
              <Progress aria-label="Ring, unknown" variant="ring" />
              <Progress aria-label="Large ring, unknown" size="lg" variant="ring" />
            </div>
            <Progress label="report-q3.pdf" size="sm" value={40} variant="ring" />
            <Progress label="Uploading 3 files" hint="2.4 of 6 MB · about 20 s left" value={40} variant="ring" />
            <Progress label="Profile" size="lg" hint="Add a photo and a time zone to finish" value={60} variant="ring" />
          </div>
        </Frame>
      </Block>
      <Block title="shadcn's parts" description="ProgressLabel and ProgressValue go inside Progress, before its track; a function child writes the value, and getAriaValueText says the same.">
        <Frame width={480}>
          <Progress getAriaValueText={(_, value) => `${value ?? 0} of 3,000 messages`} max={3000} value={1204}>
            <ProgressLabel>Importing</ProgressLabel>
            <ProgressValue>{(_, value) => `${(value ?? 0).toLocaleString("en")} of 3,000`}</ProgressValue>
          </Progress>
        </Frame>
      </Block>
      <Block title="A phone pane and right to left" description="The label wraps before the value moves; in right to left the fill, the light and the segments start at the right.">
        <Frame width={358}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="A label long enough to wrap in a phone pane, beside its value" value={62} hint="1,204 of 1,940 messages · about 1 min left" />
            <Progress label="Ring with a long label that wraps beside it" value={30} variant="ring" hint="And a hint under it" />
          </div>
        </Frame>
        <Frame dir="rtl" width={480}>
          <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <Progress label="مزامنة البريد" value={62} hint="١٬٢٠٤ من ١٬٩٤٠ رسالة" />
            <Progress label="عدّ الرسائل" />
            <Progress aria-label="خطوات" max={4} steps={4} value={2.5} />
            <Progress label="رفع الملفات" value={40} variant="ring" />
          </div>
        </Frame>
      </Block>
      <Block title="Loading" description="In a skeleton the track is one neutral shape and its words are bars.">
        <Frame width={480}>
          <Loading label="Loading imports" when>
            <div className="catalogue-stack" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
              <Progress label="Indexing headers" value={62} hint="1,204 of 1,940 messages" />
              <Progress label="Counting messages" />
              <Progress label="Step 2 of 4" max={4} steps={4} value={2} />
              <Progress label="Uploading 3 files" value={40} variant="ring" />
            </div>
          </Loading>
        </Frame>
      </Block>
    </Page>
  );
}

export const StatePanels: Story = { render: () => <StatePanelsPage /> };
export const Confirmations: Story = { render: () => <ConfirmationsPage /> };
export const Times: Story = { render: () => <TimesPage /> };
export const Keys: Story = { render: () => <KeysPage /> };
export const Notices: Story = { render: () => <NoticesPage /> };
export const Tags: Story = { render: () => <TagsPage /> };
export const ProgressBars: Story = { name: "Progress", render: () => <ProgressPage /> };
export const Text: Story = { render: () => <TextPage /> };
