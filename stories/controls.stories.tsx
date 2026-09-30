import { useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Archive,
  ArrowDownUp,
  ArrowLeft,
  Bold,
  Ellipsis,
  Forward,
  Italic,
  Mail,
  MailOpen,
  Pencil,
  Reply,
  ReplyAll,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Underline,
  Wrench,
} from "lucide-react";
import {
  Badge,
  Button,
  buttonVariants,
  Disclosure,
  DisclosurePanel,
  DisclosureSummary,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FileInput,
  IconButton,
  Input,
  Label,
  Loading,
  NativeCheckbox,
  NativeRadio,
  NativeRadioGroup,
  PageHeader,
  SectionHeader,
  TabsList,
  TabsTrigger,
  Tabs,
  ThemeSwitcher,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  type ThemePreference,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Controls",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Page({ title, description, wide = false, children }: { title: string; description: string; wide?: boolean; children: ReactNode }) {
  return (
    <main className="catalogue" style={wide ? { maxWidth: "none" } : undefined}>
      <PageHeader title={title} description={description} />
      {children}
    </main>
  );
}

/** A width the component is asked to live in: `358` is a phone pane, and the frame never grows past the window. */
function Frame({ width, dir, children }: { width?: number; dir?: "rtl"; children: ReactNode }) {
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

// ------------------------------------------------------------------ IconButton

function IconButtonsPage() {
  return (
    <Page
      title="Icon buttons"
      description="An icon that always has a name: 44 px, a tooltip on hover and on keyboard focus, and a shortcut when there is one."
    >
      <Block title="Sizes and variants" description="Ghost at 44 px is the default. Every size is 44 px on touch.">
        <div className="catalogue-row">
          <IconButton label="Search"><Search aria-hidden /></IconButton>
          <IconButton label="Search, small" size="icon-sm"><Search aria-hidden /></IconButton>
          <IconButton label="Search, extra small" size="icon-xs"><Search aria-hidden /></IconButton>
          <IconButton label="Search, outline" variant="outline"><Search aria-hidden /></IconButton>
          <IconButton label="Search, secondary" variant="secondary"><Search aria-hidden /></IconButton>
          <IconButton label="Delete" variant="destructive"><Trash2 aria-hidden /></IconButton>
        </div>
      </Block>
      <Block title="States" description="Disabled keeps its tooltip wrapper; loading blocks repeated presses; pressed is for a toggle such as the star.">
        <div className="catalogue-row">
          <IconButton label="Default"><Star aria-hidden /></IconButton>
          <IconButton label="Pressed" aria-pressed="true" variant="outline"><Star aria-hidden fill="currentColor" /></IconButton>
          <IconButton label="Disabled" disabled><Star aria-hidden /></IconButton>
          <IconButton label="Refreshing" loading variant="outline"><Star aria-hidden /></IconButton>
          <IconButton label="With a shortcut" shortcut={["Ctrl", "K"]} variant="outline"><Search aria-hidden /></IconButton>
          <IconButton label="Escape" shortcut="Esc" variant="outline" tooltip="Close the panel"><Wrench aria-hidden /></IconButton>
        </div>
      </Block>
      <Block title="Named by a text node" description="For toolbars whose tests, voice control and find-in-page read textContent: the name is a hidden span, not aria-label.">
        <div className="catalogue-row">
          <IconButton label="Archive" textName variant="outline"><Archive aria-hidden /></IconButton>
          <IconButton label="Mark as unread" textName variant="outline"><Mail aria-hidden /></IconButton>
        </div>
      </Block>
      <Block title="As a menu trigger" description="It spreads its props, so a Base UI trigger can render it.">
        <div className="catalogue-row">
          <DropdownMenu>
            <DropdownMenuTrigger render={<IconButton label="More actions" variant="outline"><Ellipsis aria-hidden /></IconButton>} />
            <DropdownMenuContent>
              <DropdownMenuItem><Forward aria-hidden />Forward</DropdownMenuItem>
              <DropdownMenuItem><ShieldAlert aria-hidden />Report spam</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Block>
      <Block title="In a 358 px pane, and right to left">
        <Frame width={358}>
          <div className="catalogue-row" style={{ gap: "var(--fui-space-1)" }}>
            {[Reply, ReplyAll, Forward, Archive, Trash2, Star, Search, Pencil].map((Icon, index) => (
              <IconButton key={index} label={["Reply", "Reply all", "Forward", "Archive", "Delete", "Star", "Search", "Edit"][index]}>
                <Icon aria-hidden />
              </IconButton>
            ))}
          </div>
        </Frame>
        <Frame width={358} dir="rtl">
          <div className="catalogue-row" style={{ gap: "var(--fui-space-1)" }}>
            <IconButton label="رد"><Reply aria-hidden /></IconButton>
            <IconButton label="أرشفة"><Archive aria-hidden /></IconButton>
            <IconButton label="بحث" shortcut={["Ctrl", "K"]}><Search aria-hidden /></IconButton>
          </div>
        </Frame>
      </Block>
      <Block title="Loading" description="The icons and the fills become one neutral shape each; nothing moves when it ends.">
        <Loading when label="Loading actions">
          <div className="catalogue-row">
            <IconButton label="Search" variant="outline"><Search aria-hidden /></IconButton>
            <IconButton label="Archive" variant="outline"><Archive aria-hidden /></IconButton>
            <IconButton label="Delete" variant="destructive"><Trash2 aria-hidden /></IconButton>
          </div>
        </Loading>
      </Block>
    </Page>
  );
}

// --------------------------------------------------------------------- Toolbar

function MailBar({ label, disabled = false, hideTools = false }: { label: string; disabled?: boolean; hideTools?: boolean }) {
  const [starred, setStarred] = useState(false);
  return (
    <Toolbar aria-label={label} variant="bar" disabled={disabled}>
      <ToolbarGroup aria-label="Respond">
        <ToolbarButton label="Reply" variant="secondary" reveal="early"><Reply aria-hidden /></ToolbarButton>
        <ToolbarButton label="Reply all" variant="secondary" reveal="middle" tier="low"><ReplyAll aria-hidden /></ToolbarButton>
        <ToolbarButton label="Forward" variant="secondary" reveal="middle" tier="low"><Forward aria-hidden /></ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator tier="low" />
      <ToolbarGroup aria-label="Organise">
        <ToolbarButton label="Mark as unread" reveal="late"><MailOpen aria-hidden /></ToolbarButton>
        <ToolbarButton label={starred ? "Remove star" : "Add star"} aria-pressed={starred} reveal="late" tier="low" onClick={() => setStarred(!starred)}>
          <Star aria-hidden fill={starred ? "currentColor" : "none"} />
        </ToolbarButton>
        <ToolbarButton label="Archive" reveal="late"><Archive aria-hidden /></ToolbarButton>
        <ToolbarButton label="Delete" reveal="late"><Trash2 aria-hidden /></ToolbarButton>
      </ToolbarGroup>
      <DropdownMenu>
        <DropdownMenuTrigger render={<ToolbarButton label="More actions" tier="overflow"><Ellipsis aria-hidden /></ToolbarButton>} />
        <DropdownMenuContent align="end">
          <DropdownMenuItem><ReplyAll aria-hidden />Reply all</DropdownMenuItem>
          <DropdownMenuItem><Forward aria-hidden />Forward</DropdownMenuItem>
          <DropdownMenuItem><Star aria-hidden />Add star</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {hideTools ? null : (
        <ToolbarButton label="Tools" reveal="late" style={{ marginInlineStart: "auto" }}><Wrench aria-hidden /></ToolbarButton>
      )}
    </Toolbar>
  );
}

function ToolbarsPage() {
  return (
    <Page
      wide
      title="Toolbars"
      description="One tab stop for a row of controls: Tab enters and leaves once, the arrows, Home and End move between the buttons. Labels appear and low-priority actions fold into a menu as the toolbar narrows."
    >
      <Block title="Wide, 1400 px" description="Every label shows from 76rem; the overflow menu is gone.">
        <Frame width={1400}><MailBar label="Message actions, wide" /></Frame>
      </Block>
      <Block title="Medium, 720 px" description="Only the primary label shows from 40rem.">
        <Frame width={720}><MailBar label="Message actions, medium" /></Frame>
      </Block>
      <Block title="Roomy, 900 px" description="The forward and reply-all labels join from 52rem.">
        <Frame width={900}><MailBar label="Message actions, roomy" /></Frame>
      </Block>
      <Block title="Narrow, 358 px" description="The low tier and the separator are hidden below 34rem and the More menu takes over. Hidden items leave the arrow-key order.">
        <Frame width={358}><MailBar label="Message actions, narrow" /></Frame>
      </Block>
      <Block title="Disabled and right to left" description="A disabled button keeps its place in the arrow order (aria-disabled), so its neighbours never shift under a person who is arrowing.">
        <Frame width={640}>
          <Toolbar aria-label="Refreshing message actions" variant="bar">
            <ToolbarButton label="Reply" variant="secondary" reveal="early" disabled><Reply aria-hidden /></ToolbarButton>
            <ToolbarButton label="Archive" disabled><Archive aria-hidden /></ToolbarButton>
            <ToolbarButton label="Delete"><Trash2 aria-hidden /></ToolbarButton>
          </Toolbar>
        </Frame>
        <Frame width={640} dir="rtl">
          <Toolbar aria-label="إجراءات الرسالة" variant="bar">
            <ToolbarGroup aria-label="الرد">
              <ToolbarButton label="رد" variant="secondary" reveal="early"><Reply aria-hidden /></ToolbarButton>
              <ToolbarButton label="إعادة توجيه"><Forward aria-hidden /></ToolbarButton>
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarButton label="أرشفة"><Archive aria-hidden /></ToolbarButton>
          </Toolbar>
        </Frame>
      </Block>
      <Block title="Plain, with toggles" description="A plain toolbar is a bare row (formatting here). Pressed state is aria-pressed.">
        <Frame width={358}>
          <Toolbar aria-label="Text formatting">
            <ToolbarGroup aria-label="Emphasis">
              <ToolbarButton label="Bold" variant="outline" aria-pressed="true"><Bold aria-hidden /></ToolbarButton>
              <ToolbarButton label="Italic" variant="outline"><Italic aria-hidden /></ToolbarButton>
              <ToolbarButton label="Underline" variant="outline"><Underline aria-hidden /></ToolbarButton>
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarButton label="Sort" variant="outline"><ArrowDownUp aria-hidden /></ToolbarButton>
          </Toolbar>
        </Frame>
      </Block>
      <Block title="Vertical">
        <Frame width={120}>
          <Toolbar aria-label="Tools" orientation="vertical">
            <ToolbarButton label="Search"><Search aria-hidden /></ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton label="Edit"><Pencil aria-hidden /></ToolbarButton>
          </Toolbar>
        </Frame>
      </Block>
      <Block
        title="Touch and a larger text size"
        description="Every target in a toolbar is pinned at 44 px, an icon button, a named ToolbarButton and a Button you put in it (a back link). On a phone (767 px or narrower, or a coarse pointer) the package's touch rule asks for 2.75rem; inside a toolbar the pin wins, so the row keeps its height at a 200 % root font size instead of doubling and wrapping."
      >
        <Frame width={358}>
          <Toolbar aria-label="Message actions, touch">
            <a href="#back" aria-label="Back to the inbox" className={buttonVariants({ variant: "ghost", size: "icon-lg" })}>
              <ArrowLeft aria-hidden />
            </a>
            <Button variant="outline" size="sm">Reply</Button>
            <ToolbarButton label="Archive"><Archive aria-hidden /></ToolbarButton>
            <ToolbarButton label="Delete"><Trash2 aria-hidden /></ToolbarButton>
            <ToolbarButton label="More"><Ellipsis aria-hidden /></ToolbarButton>
          </Toolbar>
        </Frame>
      </Block>
      <Block title="Loading">
        <Frame width={640}>
          <Loading when label="Loading message actions">
            <MailBar label="Message actions, loading" />
          </Loading>
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------- FileInput

function FileInputsPage() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <Page
      title="File inputs"
      description="A file picker that is a button. The browser's own “Choose File” text is never shown; the label is yours, in the interface's language."
    >
      <Block title="Empty" description="Tab reaches the real input; the focus ring is drawn on the button.">
        <FileInput label="Choose a file" name="attachment" description="PDF or an image, up to 5 MB." />
      </Block>
      <Block title="Chosen, with a clear button" description="The name is read with the input. Clearing empties the picker so the same file can be chosen again, and returns focus to it.">
        <FileInput label="Choose a file" fileName={chosen} onFilesChange={(files) => setChosen(files[0]?.name ?? null)} onClear={() => setChosen(null)} clearLabel="Remove file" />
        <FileInput label="Replace the file" fileName="quarterly-report-final-reviewed-v3.pdf" onClear={() => undefined} />
      </Block>
      <Block title="Long name, in a 358 px pane">
        <Frame width={358}>
          <FileInput
            label="Choose a file"
            fileName="a-very-long-file-name-that-does-not-fit-in-a-phone-pane-at-all.pdf"
            onClear={() => undefined}
            description="Names that do not fit are cut and shown in full in a tooltip."
          />
        </Frame>
      </Block>
      <Block title="Error, disabled and sizes">
        <FileInput label="Choose a file" error="The file is larger than 5 MB. Choose a smaller one." fileName="scan.tiff" />
        <FileInput label="Choose a file" disabled />
        <div className="catalogue-row">
          <FileInput label="Small" size="sm" />
          <FileInput label="Default" />
          <FileInput label="Large" size="lg" variant="secondary" />
        </div>
      </Block>
      <Block title="Right to left">
        <Frame width={358} dir="rtl">
          <FileInput label="اختر ملفاً" fileName="تقرير.pdf" onClear={() => undefined} clearLabel="إزالة الملف" description="ملف PDF أو صورة." />
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading the form">
          <FileInput label="Choose a file" fileName="report.pdf" onClear={() => undefined} description="PDF or an image, up to 5 MB." />
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Disclosure

function DisclosuresPage() {
  const rows = ["Ana Lopez", "Kai Nakamura", "Priya Shah"];
  return (
    <Page
      title="Disclosures"
      description="A styled native details element: no JavaScript, exact on the server, and the panel stays in the page."
    >
      <Block title="Sizes and chevrons" description="md is the 44 px default, lg is a section title, sm a quiet line whose 44 px target is invisible.">
        <Frame width={640}>
          <Disclosure>
            <DisclosureSummary>Advanced options</DisclosureSummary>
            <DisclosurePanel>Options that most people never change.</DisclosurePanel>
          </Disclosure>
          <Disclosure open>
            <DisclosureSummary size="lg" chevron="start" count={<Badge variant="outline">3</Badge>}>Conversation</DisclosureSummary>
            <DisclosurePanel>
              <ul className="catalogue-stack" style={{ margin: 0, paddingInlineStart: "var(--fui-space-4)" }}>
                {rows.map((name) => (<li key={name}>{name}</li>))}
              </ul>
            </DisclosurePanel>
          </Disclosure>
          <Disclosure>
            <DisclosureSummary size="sm">To ana@example.com, kai@example.com and 2 more</DisclosureSummary>
            <DisclosurePanel>ana@example.com, kai@example.com, priya@example.com, omar@example.com</DisclosurePanel>
          </Disclosure>
        </Frame>
      </Block>
      <Block title="Long summary, in a 358 px pane">
        <Frame width={358}>
          <Disclosure>
            <DisclosureSummary count={<Badge variant="outline">128</Badge>}>A summary long enough that it has to wrap inside the narrow column</DisclosureSummary>
            <DisclosurePanel>The panel keeps its content mounted while it is closed.</DisclosurePanel>
          </Disclosure>
          <Disclosure open>
            <DisclosureSummary chevron="start">Open, chevron first</DisclosureSummary>
            <DisclosurePanel>Content.</DisclosurePanel>
          </Disclosure>
        </Frame>
      </Block>
      <Block title="Opens itself when a field inside is invalid" description="Press Save with the field empty: the disclosure opens so the browser can focus the field and say why.">
        <Frame width={640}>
          <form onSubmit={(event) => event.preventDefault()} className="catalogue-stack">
            <Disclosure>
              <DisclosureSummary>Advanced</DisclosureSummary>
              <DisclosurePanel>
                <Label htmlFor="story-keyword">Keyword</Label>
                <Input id="story-keyword" name="keyword" required />
              </DisclosurePanel>
            </Disclosure>
            <div><Button type="submit">Save</Button></div>
          </form>
        </Frame>
      </Block>
      <Block title="Right to left" description="The chevron before the label points to the inline end, so it points left.">
        <Frame width={358} dir="rtl">
          <Disclosure>
            <DisclosureSummary chevron="start" count={<Badge variant="outline">3</Badge>}>المحادثة</DisclosureSummary>
            <DisclosurePanel>نص الرسائل.</DisclosurePanel>
          </Disclosure>
          <Disclosure open>
            <DisclosureSummary>خيارات متقدمة</DisclosureSummary>
            <DisclosurePanel>محتوى.</DisclosurePanel>
          </Disclosure>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading the conversation">
          <Frame width={640}>
            <Disclosure open>
              <DisclosureSummary size="lg" chevron="start" count={<Badge variant="outline">3</Badge>}>Conversation</DisclosureSummary>
              <DisclosurePanel>Three messages in this conversation.</DisclosurePanel>
            </Disclosure>
          </Frame>
        </Loading>
      </Block>
    </Page>
  );
}

// -------------------------------------------------------- FieldSet and choices

const colours = ["Red", "Amber", "Green", "Blue", "Violet", "Grey"];

function FieldSetsPage() {
  const [colour, setColour] = useState("Blue");
  return (
    <Page
      title="Field sets and native choices"
      description="Grouped form fields on real fieldsets, and native radios and checkboxes that a disabled fieldset disables."
    >
      <Block title="A form with subsections" description="The hairline above a legend is drawn only between consecutive fieldsets; the first has none.">
        <Frame width={640}>
          <form onSubmit={(event) => event.preventDefault()} className="catalogue-stack">
            <FieldSet>
              <FieldLegend>Name</FieldLegend>
              <FieldGroup layout="columns">
                <div className="catalogue-stack"><Label htmlFor="fs-given">Given name</Label><Input id="fs-given" defaultValue="Ana" /></div>
                <div className="catalogue-stack"><Label htmlFor="fs-family">Family name</Label><Input id="fs-family" defaultValue="Lopez" /></div>
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Email addresses</FieldLegend>
              <FieldSet>
                <FieldLegend variant="label">Email 1</FieldLegend>
                <div className="catalogue-stack"><Label htmlFor="fs-mail-1">Address</Label><Input id="fs-mail-1" defaultValue="ana@example.com" /></div>
              </FieldSet>
              <FieldSet>
                <FieldLegend variant="label">Email 2</FieldLegend>
                <div className="catalogue-stack"><Label htmlFor="fs-mail-2">Address</Label><Input id="fs-mail-2" /></div>
              </FieldSet>
            </FieldSet>
          </form>
        </Frame>
      </Block>
      <Block title="A disabled field set" description="Native controls inside are disabled. A Base UI checkbox or switch is not native: disable those yourself.">
        <Frame width={640}>
          <FieldSet disabled>
            <FieldLegend divider={false}>Saving</FieldLegend>
            <div className="catalogue-stack"><Label htmlFor="fs-d-name">Name</Label><Input id="fs-d-name" defaultValue="Ana" /></div>
            <NativeCheckbox label="Send a copy to me" defaultChecked />
          </FieldSet>
        </Frame>
      </Block>
      <Block title="Native radio groups" description="Stack or grid. The arrow keys move within the group natively.">
        <Frame width={640}>
          <NativeRadioGroup legend="Label colour" layout="grid" name="unused">
            {colours.map((name) => (
              <NativeRadio key={name} name="story-colour" value={name} label={name} checked={colour === name} onChange={() => setColour(name)} />
            ))}
          </NativeRadioGroup>
        </Frame>
        <Frame width={358}>
          <NativeRadioGroup legend="Sort messages by">
            <NativeRadio name="story-sort" value="date" label="Date received" defaultChecked />
            <NativeRadio name="story-sort" value="sender" label="Sender" />
            <NativeRadio name="story-sort" value="off" label="Not available offline" disabled />
          </NativeRadioGroup>
        </Frame>
      </Block>
      <Block title="Native checkboxes" description="Unchecked, checked, mixed (select all with some rows ticked), disabled, and in a whole-row label.">
        <Frame width={358}>
          <div className="catalogue-stack">
            <NativeCheckbox label="Unchecked" />
            <NativeCheckbox label="Checked" defaultChecked />
            <NativeCheckbox label="Mixed: some selected" indeterminate checked={false} onChange={() => undefined} />
            <NativeCheckbox label="Disabled" disabled />
            <NativeCheckbox label="Disabled and checked" disabled defaultChecked />
          </div>
        </Frame>
      </Block>
      <Block title="Right to left">
        <Frame width={358} dir="rtl">
          <NativeRadioGroup legend="لون التسمية">
            <NativeRadio name="story-rtl" value="a" label="أحمر" defaultChecked />
            <NativeRadio name="story-rtl" value="b" label="أزرق" />
          </NativeRadioGroup>
        </Frame>
      </Block>
      <Block title="Loading" description="Native boxes turn into the same neutral shapes as the Base UI ones: no tick, no dash, no dot.">
        <Loading when label="Loading the form">
          <Frame width={358}>
            <NativeRadioGroup legend="Sort messages by">
              <NativeRadio name="story-load" value="date" label="Date received" defaultChecked />
              <NativeRadio name="story-load" value="sender" label="Sender" />
            </NativeRadioGroup>
            <NativeCheckbox label="Select all" indeterminate checked={false} onChange={() => undefined} />
            <NativeCheckbox label="Send a copy to me" defaultChecked />
          </Frame>
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Toggle sizes

function TogglesPage() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <Page
      title="Toggles and segments"
      description="Segmented controls keep their look on touch and narrow screens and get a 44 px hit area; size lg paints the whole height."
    >
      <Block title="Sizes" description="sm 26 px, default 34 px, lg 44 px painted on every pointer (the group's own 3 px padding stays around it, so an lg group is 50 px tall); on touch the others get a 44 px hit area.">
        <div className="catalogue-row">
          {(["sm", "default", "lg"] as const).map((size) => (
            <ToggleGroup key={size} aria-label={`Range, ${size}`} size={size} defaultValue={["7d"]}>
              <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
              <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
              <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
            </ToggleGroup>
          ))}
        </div>
      </Block>
      <Block title="Theme switcher" description="size defaults to sm, as before; lg paints 44 px on every pointer, for a settings row of primary 44 px targets.">
        <div className="catalogue-row">
          <ThemeSwitcher value={theme} onValueChange={setTheme} label="Theme, small" />
          <ThemeSwitcher value={theme} onValueChange={setTheme} label="Theme, default" size="default" />
          <ThemeSwitcher value={theme} onValueChange={setTheme} label="Theme, large" size="lg" />
          <ThemeSwitcher value={theme} onValueChange={setTheme} label="Theme with labels" size="lg" showLabels />
        </div>
      </Block>
      <Block title="Segmented tabs" description="The tabs of a segmented list follow the same rule.">
        <Tabs defaultValue="inbox">
          <TabsList variant="segmented" aria-label="Mailbox">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </Block>
      <Block title="In a 358 px pane">
        <Frame width={358}>
          <div className="catalogue-stack">
            <ThemeSwitcher value={theme} onValueChange={setTheme} label="Theme, narrow" size="lg" showLabels />
            <ToggleGroup aria-label="View" size="lg" defaultValue={["list"]}>
              <ToggleGroupItem value="list"><Mail aria-hidden />List</ToggleGroupItem>
              <ToggleGroupItem value="threads"><Search aria-hidden />Threads</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading settings">
          <ThemeSwitcher value="system" onValueChange={() => undefined} label="Theme, loading" size="lg" showLabels />
        </Loading>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------ Native radio grid, long labels

const longColours = [
  ["Slate", "Gris pizarra azulado muy oscuro"],
  ["Blue", "Azul ultramarino"],
  ["Teal", "Verde azulado intenso"],
  ["Green", "Verde"],
  ["Amber", "Ámbar anaranjado claro"],
  ["Red", "Rojo"],
  ["Violet", "Violeta"],
  ["Ink", "Anticonstitucionalmente"],
] as const;

const arabicColours = [
  ["Slate", "رمادي أردوازي مائل إلى الزرقة الداكنة جدا"],
  ["Blue", "أزرق بحري"],
  ["Teal", "أخضر مزرق مكثف"],
  ["Green", "أخضر"],
  ["Amber", "كهرماني برتقالي فاتح"],
  ["Red", "أحمر"],
] as const;

function Swatch({ tone }: { tone: string }) {
  return <span aria-hidden="true" data-tone={tone} style={{ display: "inline-block", inlineSize: "0.875rem", blockSize: "0.875rem", flex: "none", borderRadius: "var(--fui-radius-xs)", background: "var(--brand)" }} />;
}

function RadioGridPage() {
  const [value, setValue] = useState("Blue");
  const group = (legend: string, style?: CSSProperties, names: typeof longColours | typeof arabicColours = longColours) => (
    <NativeRadioGroup legend={legend} layout="grid" style={style} name={`grid-${legend}`}>
      {names.map(([tone, name]) => (
        <NativeRadio
          key={tone}
          name={`grid-${legend}`}
          value={tone}
          checked={value === tone}
          onChange={() => setValue(tone)}
          label={<span style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-2)" }}><Swatch tone={tone} />{name}</span>}
        />
      ))}
    </NativeRadioGroup>
  );
  return (
    <Page
      title="Native radio grid, long labels"
      description="layout=grid flows the options into columns that are never narrower than --fui-native-radio-min (9rem unless the group sets it) and never wider than the group: a long name wraps at its spaces, and the grid drops to fewer columns as the pane narrows."
    >
      <Block title="The default minimum" description="A 358 px pane: two columns of 9rem. Short names sit on one line; longer names wrap to two or three lines, and one long word (the last) breaks inside its column. Nothing is cut or overlaps. Below two columns' room (a 320 px window) the grid is one column.">
        <div data-frame="default">
          <Frame width={358}>{group("Label colour")}</Frame>
        </div>
      </Block>
      <Block title="A wider minimum" description="A host that knows its names are long sets the minimum on the group, in a style prop or a class: --fui-native-radio-min: 12rem. The same pane is one column and every name is on one line.">
        <div data-frame="wide-min">
          <Frame width={358}>{group("Label colour, wider minimum", { "--fui-native-radio-min": "12rem" } as CSSProperties)}</Frame>
        </div>
      </Block>
      <Block title="A wide pane and right to left" description="The same group in 640 px, and in Arabic. The minimum is a floor: room above it becomes wider columns, not more of them.">
        <div data-frame="wide">
          <Frame width={640}>{group("Label colour, wide pane")}</Frame>
        </div>
        <Frame width={358} dir="rtl">{group("لون التسمية", undefined, arabicColours)}</Frame>
      </Block>
    </Page>
  );
}

export const IconButtons: Story = { render: () => <IconButtonsPage /> };
export const Toolbars: Story = { render: () => <ToolbarsPage /> };
export const FileInputs: Story = { render: () => <FileInputsPage /> };
export const Disclosures: Story = { render: () => <DisclosuresPage /> };
export const FieldSets: Story = { render: () => <FieldSetsPage /> };
export const Toggles: Story = { render: () => <TogglesPage /> };
export const NativeRadioGrid: Story = { render: () => <RadioGridPage /> };
