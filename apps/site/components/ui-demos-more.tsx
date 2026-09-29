"use client";

// Previews for the controls added to the catalogue in 0.7: brand, data, navigation and chrome.
// Synthetic data only.
import { useEffect, useState, type ReactNode } from "react";
import { Archive, AtSign, ContactRound, Ellipsis, Eye, FileText, Forward, Inbox, Layers, MailOpen, Plus, Reply, Search, Settings, Star, Trash2, UserPlus } from "lucide-react";
import { ProviderIcon } from "@fabrials/ai-ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActivityStrip,
  AuthLayout,
  Avatar,
  AvatarFallback,
  avatarInitials,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
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
  FileSize,
  IconButton,
  Input,
  NativeCheckbox,
  NativeRadio,
  NativeRadioGroup,
  AppHeader,
  AppHeaderAction,
  AppHeaderBrand,
  AppHeaderCaret,
  AppHeaderLabel,
  AppHeaderLink,
  AppHeaderNav,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemMedia,
  ItemTitle,
  NavSwitcher,
  NavSwitcherContent,
  NavSwitcherItem,
  NavSwitcherSeparator,
  NavSwitcherTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  CodePanel,
  CodeTabs,
  DitherBand,
  DitherCanvas,
  DitherGem,
  DitherScene,
  File,
  Files,
  Folder,
  Label,
  Loading,
  Meter,
  MultiSelect,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  NavTab,
  NavTabs,
  PackageInstall,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  placeholderList,
  placeholderText,
  ProductLockup,
  RadioGroup,
  RadioGroupItem,
  RelativeTime,
  RepoInfo,
  SiteHeader,
  Snippet,
  Sparkline,
  Stat,
  StatGroup,
  StatusDot,
  ThemeSwitcher,
  Timeline,
  TimelineItem,
  ToggleGroup,
  ToggleGroupItem,
  type GemName,
  type ThemePreference,
} from "@fabrials/ui";
import { fbm } from "@fabrials/ui/dither";

/**
 * The preview box. Stacked by default; `inline` lays controls out in a row at
 * their own width, so a lone trigger or group is not stretched across the stage.
 */
function Frame({ children, inline = false }: { children: ReactNode; inline?: boolean }) {
  return <div className={inline ? "fui-preview flex flex-wrap items-center gap-3" : "fui-preview grid grid-cols-[minmax(0,1fr)] gap-4"}>{children}</div>;
}

const GEMS: [GemName, string][] = [
  ["stormlight", "Radiant"],
  ["heliodor", "fabrials.com"],
  ["sapphire", "Syl"],
  ["ruby", "Spanreed"],
  ["emerald", "X Tracker"],
  ["zircon", "Fabrials UI"],
  ["smokestone", "News"],
  ["amethyst", "ai.fabrials.com"],
];

// Fixed "now" so server and client render the same relative times.
const NOW = Date.UTC(2026, 8, 27, 12, 0, 0);
const ago = (minutes: number) => new Date(NOW - minutes * 60_000);

let seed = 11;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const days = Array.from({ length: 60 }, (_, i) => ({ label: `Day ${i + 1}`, value: Math.round(random() * random() * 14) }));

const TELEMETRY_RAMP = {
  dark: ["background", "#1c2129", "#252b35", "#3a4351", "#6f7d92", "#9cc4ff"],
  light: ["background", "#dcdfe0", "#b9c0c8", "#8e98a5", "#5f6a79", "#2a63c4"],
};

function FileInputDemo() {
  const [name, setName] = useState<string | null>(null);
  return (
    <FileInput
      label="Choose a file"
      name="attachment"
      description="PDF or an image, up to 5 MB."
      fileName={name}
      onFilesChange={(files) => setName(files[0]?.name ?? null)}
      onClear={() => setName(null)}
    />
  );
}

function NativeChoicesDemo() {
  const [rows, setRows] = useState([true, false, false]);
  const ticked = rows.filter(Boolean).length;
  return (
    <>
      <NativeRadioGroup legend="Sort messages by" name="sort-demo">
        <NativeRadio name="sort-demo" value="date" label="Date received" defaultChecked />
        <NativeRadio name="sort-demo" value="sender" label="Sender" />
        <NativeRadio name="sort-demo" value="size" label="Size" />
      </NativeRadioGroup>
      <div className="grid gap-1">
        <NativeCheckbox
          label="Select all"
          checked={ticked === rows.length}
          indeterminate={ticked > 0 && ticked < rows.length}
          onChange={(event) => setRows(rows.map(() => event.currentTarget.checked))}
        />
        {["Ana Lopez", "Kai Nakamura", "Priya Shah"].map((name, index) => (
          <NativeCheckbox
            key={name}
            label={name}
            checked={rows[index]}
            onChange={() => setRows(rows.map((value, at) => (at === index ? !value : value)))}
          />
        ))}
      </div>
    </>
  );
}

function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>(["grok"]);
  return (
    <MultiSelect
      id="providers-filter"
      label="Providers"
      options={[
        { value: "grok", label: "Grok" },
        { value: "claude", label: "Claude Code" },
        { value: "codex", label: "Codex" },
        { value: "cursor", label: "Cursor" },
      ]}
      value={value}
      onValueChange={setValue}
    />
  );
}

function ToggleGroupDemo() {
  const [range, setRange] = useState(["7d"]);
  return (
    <ToggleGroup aria-label="Range" value={range} onValueChange={(next) => next.length && setRange(next)}>
      <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
      <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
      <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
    </ToggleGroup>
  );
}

function ThemeSwitcherDemo() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ThemeSwitcher value={theme} onValueChange={setTheme} />
      <ThemeSwitcher value={theme} onValueChange={setTheme} showLabels label="Theme with labels" />
      <span className="text-sm text-muted-foreground" role="status">
        Stored preference: {theme}
      </span>
    </div>
  );
}

const LAYOUT_BEFORE = `import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;

const LAYOUT_AFTER = `import "./globals.css";
import { ThemeProvider } from "@fabrials/ui";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}`;

// The layout diff as one sample: removed lines from before, added lines from after.
const LAYOUT_DIFF = `import "./globals.css";
import { ThemeProvider } from "@fabrials/ui";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}`;

/** Live counts through the site's cached GitHub route; nulls until they arrive, and if GitHub fails. */
function useRepoCounts(repository: string) {
  const [counts, setCounts] = useState<{ stars: number | null; forks: number | null }>({ stars: null, forks: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/github?repo=${repository}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { stars?: number | null; forks?: number | null }) => setCounts({ stars: data.stars ?? null, forks: data.forks ?? null }))
      .catch(() => {});
    return () => controller.abort();
  }, [repository]);
  return counts;
}

function RepoInfoDemo() {
  const magic = useRepoCounts("magicuidesign/magicui");
  const kibo = useRepoCounts("haydenbleasel/kibo");
  return (
    <div className="grid w-full max-w-md gap-3">
      <RepoInfo owner="magicuidesign" repo="magicui" stars={magic.stars} forks={magic.forks} description="Magic UI, community tier" />
      <RepoInfo owner="haydenbleasel" repo="kibo" stars={kibo.stars} forks={kibo.forks} />
      <RepoInfo owner="grok-insider" repo="fabrials-ui" description="Counts not given: the link stays, the numbers are left out" />
    </div>
  );
}

const ACCOUNTS = [
  { id: "north", name: "North workspace", plan: "Team", status: "Current", tone: "success" as const, initials: "NW" },
  { id: "relay", name: "Relay staging", plan: "Personal", status: "Stale", tone: "warning" as const, initials: "RS" },
  { id: "archive", name: "Archive", plan: "Team", status: "Paused", tone: "neutral" as const, initials: "AR" },
];
const ACCOUNT_PLACEHOLDERS = placeholderList(3, (i) => ({
  id: `placeholder-${i}`,
  name: placeholderText(15, i),
  plan: placeholderText(6, i + 3),
  status: placeholderText(7, i + 5),
  tone: "neutral" as const,
  initials: "",
}));

function LoadingDemo() {
  const [loading, setLoading] = useState(false);
  const rows = loading ? ACCOUNT_PLACEHOLDERS : ACCOUNTS;
  return (
    <div className="grid w-full max-w-lg gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Accounts</p>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1800);
          }}
        >
          {loading ? "Refreshing" : "Refresh accounts"}
        </Button>
      </div>
      <Loading when={loading} label="Loading accounts">
        <ul className="grid divide-y rounded-lg border bg-card">
          {rows.map((account) => (
            <li key={account.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar className="size-8">
                <AvatarFallback>{account.initials}</AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{account.name}</span>
                <span className="text-xs text-muted-foreground">{account.plan}</span>
              </span>
              <Badge dot tone={account.tone}>
                {account.status}
              </Badge>
            </li>
          ))}
        </ul>
      </Loading>
      <p className="text-xs text-muted-foreground">Synthetic data. Refresh shows the same list as its skeleton for two seconds.</p>
    </div>
  );
}

export const moreDemos: Record<string, () => ReactNode> = {
  loading: () => <LoadingDemo />,
  "code-panel": () => (
    <div className="grid w-full gap-4">
      <CodePanel
        title="app/layout.tsx"
        language="tsx"
        code={LAYOUT_DIFF}
        lineNumbers
        addedLines={[2, 7, 9, 10, 11]}
        removedLines={[6, 8]}
        highlightWords={["ThemeProvider"]}
      />
      <CodePanel bare language="bash" code="bunx --bun shadcn@latest add @fabrials/code-panel" />
    </div>
  ),
  "code-tabs": () => (
    <CodeTabs
      className="w-full"
      label="Layout versions"
      items={[
        { value: "after", label: "With theme", code: LAYOUT_AFTER, language: "tsx", highlightLines: [2, 7, 8, 9] },
        { value: "before", label: "Before", code: LAYOUT_BEFORE, language: "tsx" },
        {
          value: "json",
          label: "components.json",
          code: `{\n  "style": "base-nova",\n  "registries": {\n    "@fabrials": "https://ui.fabrials.com/r/{name}.json"\n  }\n}`,
          language: "json",
        },
      ]}
    />
  ),
  "package-install": () => (
    <div className="grid w-full gap-4">
      <PackageInstall command="shadcn@latest add @fabrials/button @fabrials/files" persistKey={null} />
      <PackageInstall command="@fabrials/ui" kind="install" persistKey={null} />
      <p className="text-sm text-muted-foreground">Choose pnpm in one and the other follows.</p>
    </div>
  ),
  files: () => (
    <Files className="w-full max-w-md">
      <Folder name="app" defaultOpen>
        <File name="layout.tsx" highlighted note="edited" />
        <File name="page.tsx" />
        <File name="globals.css" note="Fabrials styles" />
      </Folder>
      <Folder name="components" defaultOpen>
        <Folder name="ui" defaultOpen note="shims">
          <File name="button.tsx" />
          <File name="dialog.tsx" />
        </Folder>
        <Folder name="kibo-ui">
          <Folder name="kanban">
            <File name="index.tsx" note="MIT" />
          </Folder>
        </Folder>
      </Folder>
      <File name="components.json" />
    </Files>
  ),
  "repo-info": () => <RepoInfoDemo />,
  "dither-scene": () => (
    <div className="relative min-h-72 w-full overflow-hidden rounded-(--fui-radius-lg) border bg-background p-8">
      <DitherScene />
      <div className="relative z-10 max-w-[18rem]">
        <p className="font-display text-3xl leading-none font-semibold">Tools for people who work beside AI agents.</p>
        <p className="mt-3 text-sm text-muted-foreground">Text stays on the calm side of the storm.</p>
      </div>
    </div>
  ),
  "dither-band": () => (
    <div className="w-full overflow-hidden rounded-(--fui-radius-lg) border bg-card [--fui-dither-bg:var(--card)]">
      <DitherBand />
      <div className="grid gap-1 p-4">
        <p className="font-display text-2xl font-semibold">Usage AI</p>
        <p className="text-sm text-muted-foreground">Anonymous weekly totals from Spanreed users who share a snapshot.</p>
      </div>
    </div>
  ),
  "dither-gem": () => (
    <Frame>
      <div className="flex flex-wrap items-center gap-8">
        <DitherGem gem="zircon" size={96} reveal={1200} />
        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          {GEMS.map(([gem, product]) => (
            <li key={gem} className="flex items-center gap-2.5">
              <DitherGem gem={gem} size={20} />
              <span>
                {product}
                <span className="block text-xs text-muted-foreground capitalize">{gem}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  ),
  "dither-canvas": () => (
    <div className="relative isolate h-56 w-full overflow-hidden rounded-(--fui-radius-lg) border bg-background">
      <DitherCanvas
        ramp={TELEMETRY_RAMP}
        order="ramp"
        cell={3}
        field={(_theme, { width, height }) =>
          (u, v) => {
            // A telemetry ridge: noise shaped by a slow wave, brightest along the crest.
            const crest = 0.55 + 0.18 * Math.sin(u * 7) - 0.1 * fbm(u * 3, 1, 5);
            const distance = Math.abs(v - crest);
            return Math.max(0, 1 - distance * 6) * (0.45 + 0.55 * fbm((u * width) / height * 3, v * 3, 9));
          }
        }
      />
    </div>
  ),
  "product-lockup": () => (
    <Frame>
      <div className="flex flex-wrap items-center gap-8">
        <ProductLockup product="Spanreed" gem="ruby" size="lg" tagline="Usage and cost" />
        <ProductLockup product="Syl" gem="sapphire" />
        <ProductLockup product="Fabrials UI" gem="zircon" size="sm" />
      </div>
    </Frame>
  ),
  "radio-group": () => (
    <Frame>
      <RadioGroup defaultValue="balanced" aria-label="Routing mode">
        <Label className="fui-choice">
          <RadioGroupItem value="balanced" /> Balanced across accounts
        </Label>
        <Label className="fui-choice">
          <RadioGroupItem value="drain" /> Drain one account at a time
        </Label>
        <Label className="fui-choice">
          <RadioGroupItem value="manual" /> Manual only
        </Label>
      </RadioGroup>
    </Frame>
  ),
  "icon-button": () => (
    <Frame inline>
      <IconButton label="Search" shortcut={["Ctrl", "K"]}><Search aria-hidden /></IconButton>
      <IconButton label="Star" variant="outline"><Star aria-hidden /></IconButton>
      <IconButton label="Archive" variant="outline" textName><Archive aria-hidden /></IconButton>
      <IconButton label="Delete" variant="destructive" disabled><Trash2 aria-hidden /></IconButton>
      <DropdownMenu>
        <DropdownMenuTrigger render={<IconButton label="More actions" variant="outline"><Ellipsis aria-hidden /></IconButton>} />
        <DropdownMenuContent>
          <DropdownMenuItem><Forward aria-hidden />Forward</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Frame>
  ),
  toolbar: () => (
    <Frame>
      <Toolbar aria-label="Message actions" variant="bar">
        <ToolbarGroup aria-label="Respond">
          <ToolbarButton label="Reply" variant="secondary" reveal="early"><Reply aria-hidden /></ToolbarButton>
          <ToolbarButton label="Forward" variant="secondary" reveal="middle" tier="low"><Forward aria-hidden /></ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator tier="low" />
        <ToolbarGroup aria-label="Organise">
          <ToolbarButton label="Mark as unread" reveal="late"><MailOpen aria-hidden /></ToolbarButton>
          <ToolbarButton label="Archive" reveal="late"><Archive aria-hidden /></ToolbarButton>
          <ToolbarButton label="Delete" reveal="late" disabled><Trash2 aria-hidden /></ToolbarButton>
        </ToolbarGroup>
        <DropdownMenu>
          <DropdownMenuTrigger render={<ToolbarButton label="More actions" tier="overflow"><Ellipsis aria-hidden /></ToolbarButton>} />
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Forward aria-hidden />Forward</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Toolbar>
    </Frame>
  ),
  "file-input": () => (
    <Frame>
      <FileInputDemo />
    </Frame>
  ),
  disclosure: () => (
    <Frame>
      <Disclosure>
        <DisclosureSummary>Advanced options</DisclosureSummary>
        <DisclosurePanel>Options that most people never change.</DisclosurePanel>
      </Disclosure>
      <Disclosure open>
        <DisclosureSummary size="lg" chevron="start" count={<Badge variant="outline">3</Badge>}>Conversation</DisclosureSummary>
        <DisclosurePanel>Three messages in this conversation.</DisclosurePanel>
      </Disclosure>
    </Frame>
  ),
  item: () => (
    <Frame>
      <ItemGroup bordered aria-label="Messages" className="rounded-md border-x">
        {[
          { id: "a", from: "Ana Ruiz", subject: "Quarterly planning notes", preview: "Attached are the notes from Tuesday.", unread: true },
          { id: "b", from: "Build server", subject: "Nightly build 4182 passed", preview: "All 1,204 checks passed.", current: true },
          { id: "c", from: "Calendar", subject: "Invitation: Design review", preview: "Thursday 14:00 in the small room.", unread: false },
        ].map((message) => (
          <Item key={message.id} stretch current={message.current} unread={message.unread}>
            <ItemMedia variant="icon">
              <FileText aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle render={<h3 />}>
                <ItemLink href="#item" current={message.current}>{message.subject}</ItemLink>
              </ItemTitle>
              <ItemDescription>{message.from} · {message.preview}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <IconButton label={`Star: ${message.subject}`}><Star aria-hidden /></IconButton>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </Frame>
  ),
  "app-header": () => (
    <Frame>
      <div className="overflow-hidden rounded-md border">
        <AppHeader
          brand={
            <AppHeaderBrand href="#app-header">
              <ProductLockup product="Open Email" gem="emerald" />
            </AppHeaderBrand>
          }
          navigation={
            <AppHeaderNav label="Workspace">
              <AppHeaderLink href="#app-header" current><Inbox aria-hidden /><span>Mail</span></AppHeaderLink>
              <AppHeaderLink href="#app-header"><ContactRound aria-hidden /><span>Contacts</span></AppHeaderLink>
            </AppHeaderNav>
          }
          actions={
            <>
              <IconButton label="Settings"><Settings aria-hidden /></IconButton>
              <AppHeaderAction>
                <Avatar size="sm" aria-hidden><AvatarFallback>A</AvatarFallback></Avatar>
                <AppHeaderLabel>ana@example.test</AppHeaderLabel>
                <AppHeaderCaret />
              </AppHeaderAction>
            </>
          }
        />
      </div>
    </Frame>
  ),
  "nav-switcher": () => (
    <Frame>
      <div className="grid max-w-72 gap-3 rounded-md bg-sidebar p-2">
        <NavSwitcher>
          <NavSwitcherTrigger label="Switch mailbox" mark={<Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>} title="ana@example.test" description="Personal" />
          <NavSwitcherContent label="Switch mailbox">
            <NavSwitcherItem render={<a href="#all" />} mark={<Layers aria-hidden />}>All inboxes</NavSwitcherItem>
            <NavSwitcherItem render={<a href="#ana" />} current mark={<Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>}>ana@example.test</NavSwitcherItem>
            <NavSwitcherItem render={<a href="#work" />} mark={<Avatar size="sm"><AvatarFallback>W</AvatarFallback></Avatar>} description={<Badge tone="warning" dot>Needs authorization</Badge>}>ana@work.example.test</NavSwitcherItem>
            <NavSwitcherSeparator />
            <NavSwitcherItem render={<a href="#link" />} mark={<Plus aria-hidden />}>Link a mailbox</NavSwitcherItem>
          </NavSwitcherContent>
        </NavSwitcher>
        <nav aria-label="Folders">
          <SidebarGroup className="p-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="touch" isActive render={<a href="#inbox" />}><Inbox aria-hidden /><span>Inbox</span><SidebarMenuBadge>12</SidebarMenuBadge></SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="touch" render={<a href="#drafts" />}><FileText aria-hidden /><span>Drafts</span><SidebarMenuBadge>2</SidebarMenuBadge></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </nav>
      </div>
    </Frame>
  ),
  resizable: () => (
    <Frame>
      <div className="overflow-hidden rounded-md border">
        <ResizablePanelGroup orientation="horizontal" style={{ height: 160 }}>
          <ResizablePanel id="demo-nav" defaultSize="30%" minSize="6rem" className="bg-sidebar p-3 text-sm">Navigation</ResizablePanel>
          <ResizableHandle label="Resize the navigation" />
          <ResizablePanel id="demo-list" defaultSize="70%" minSize="8rem" className="bg-card p-3 text-sm">Drag the line, or focus it and use the arrow keys, Home and End.</ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Frame>
  ),
  "field-set": () => (
    <Frame>
      <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
        <FieldSet>
          <FieldLegend>Name</FieldLegend>
          <FieldGroup layout="columns">
            <div className="grid gap-1.5"><Label htmlFor="demo-given">Given name</Label><Input id="demo-given" defaultValue="Ana" /></div>
            <div className="grid gap-1.5"><Label htmlFor="demo-family">Family name</Label><Input id="demo-family" defaultValue="Lopez" /></div>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Email addresses</FieldLegend>
          <div className="grid gap-1.5"><Label htmlFor="demo-email">Address</Label><Input id="demo-email" type="email" defaultValue="ana@example.com" /></div>
        </FieldSet>
      </form>
    </Frame>
  ),
  "native-radio": () => (
    <Frame>
      <NativeChoicesDemo />
    </Frame>
  ),
  "file-size": () => (
    <Frame>
      <ul className="grid gap-1 text-sm">
        {[812, 1536, 25 * 1024 * 1024].map((bytes) => (
          <li key={bytes} className="flex justify-between gap-3">
            <FileSize bytes={bytes} />
            <FileSize bytes={bytes} locale="es" />
          </li>
        ))}
        <li><FileSize bytes={undefined} fallback="Unknown size" /></li>
      </ul>
    </Frame>
  ),
  "toggle-group": () => (
    <Frame inline>
      <ToggleGroupDemo />
    </Frame>
  ),
  "theme-switcher": () => (
    <Frame>
      <ThemeSwitcherDemo />
    </Frame>
  ),
  "multi-select": () => (
    <Frame>
      <MultiSelectDemo />
    </Frame>
  ),
  "native-select": () => (
    <Frame>
      <Label htmlFor="region">Region</Label>
      <NativeSelect id="region" name="region" defaultValue="fra" className="max-w-64">
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="fra">Frankfurt</NativeSelectOption>
          <NativeSelectOption value="hel">Helsinki</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="United States">
          <NativeSelectOption value="ash">Ashburn</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </Frame>
  ),
  accordion: () => (
    <Frame>
      <Accordion defaultValue={["keys"]} className="max-w-xl">
        <AccordionItem value="keys">
          <AccordionTrigger>Where are keys stored?</AccordionTrigger>
          <AccordionContent>In the operating system&apos;s secret store, never in the browser.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="share">
          <AccordionTrigger>What does a shared snapshot contain?</AccordionTrigger>
          <AccordionContent>Daily totals per provider. No prompts, files or account names.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Frame>
  ),
  breadcrumb: () => (
    <Frame>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#preview">Accounts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#preview">Grok</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Usage</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Frame>
  ),
  pagination: () => (
    <Frame>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#preview" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#preview">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#preview" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#preview">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#preview" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Frame>
  ),
  "nav-tabs": () => (
    <Frame>
      <NavTabs label="Account sections">
        <NavTab href="#preview" current count={128}>
          Feed
        </NavTab>
        <NavTab href="#preview" count={16}>
          Media
        </NavTab>
        <NavTab href="#preview">Live</NavTab>
        <NavTab href="#preview">Costs</NavTab>
      </NavTabs>
    </Frame>
  ),
  "description-list": () => (
    <Frame>
      <DescriptionList className="max-w-xl">
        <DescriptionItem>
          <DescriptionTerm>Relay ID</DescriptionTerm>
          <DescriptionDetails>
            <code className="fui-code">relay_7f3a2c</code>
          </DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Endpoint</DescriptionTerm>
          <DescriptionDetails>
            <StatusDot tone="success" label="https://relay.example.com" />
          </DescriptionDetails>
        </DescriptionItem>
        <DescriptionItem>
          <DescriptionTerm>Webhook</DescriptionTerm>
          <DescriptionDetails>
            <StatusDot label="Configured, not verified" />
          </DescriptionDetails>
        </DescriptionItem>
      </DescriptionList>
    </Frame>
  ),
  avatar: () => (
    <Frame>
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>{avatarInitials("Ada Lovelace")}</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>{avatarInitials("nora@example.org")}</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>{avatarInitials("Paul Kerr Jr")}</AvatarFallback>
        </Avatar>
      </div>
    </Frame>
  ),
  stat: () => (
    <Frame>
      <StatGroup>
        <Stat label="List price" value="$1,284.40" delta="+12.4%" trend="up" deltaTone="negative" hint="vs last 7 days" sparkline={[12, 18, 14, 22, 19, 27, 31]} />
        <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs last 7 days" sparkline={[30, 32, 29, 35, 34, 38, 40]} />
        <Stat label="Cache hit rate" value="61.2%" delta="No change" trend="flat" hint="vs last 7 days" />
      </StatGroup>
    </Frame>
  ),
  sparkline: () => (
    <Frame>
      <div className="flex items-center gap-4">
        <span className="font-display text-2xl font-semibold tabular-nums">$41.20</span>
        <Sparkline data={[12, 18, 14, 22, 19, 27, 31, 29, 34]} label="Cost rose over the week" className="h-8 w-32" />
      </div>
    </Frame>
  ),
  meter: () => (
    <Frame>
      <div className="grid max-w-md gap-4">
        <Meter label="Weekly quota" value={42} hint="Resets Friday at 09:00" />
        <Meter label="Session" value={81} hint="Resets in 2 h 10 min" />
        <Meter label="Monthly credits" value={96} hint="Top up or wait for the reset" />
      </div>
    </Frame>
  ),
  "status-dot": () => (
    <Frame>
      <div className="grid gap-2">
        <StatusDot tone="success" label="Relay online" pulse />
        <StatusDot tone="warning" label="Observation is 3 h old" />
        <StatusDot tone="danger" label="Authorization expired" />
        <StatusDot tone="info" label="Syncing history" />
        <StatusDot label="Configured, not verified" />
      </div>
    </Frame>
  ),
  "activity-strip": () => (
    <Frame>
      <ActivityStrip caption="Posts per day, last 60 days" cells={days} startLabel="60 days ago" endLabel="today" />
    </Frame>
  ),
  timeline: () => (
    <Frame>
      <Timeline>
        <TimelineItem icon={<Eye aria-hidden />} tone="info" title="@fixture posted" time={<RelativeTime date={ago(4)} />} fresh>
          A new post about Spanreed 0.8.
        </TimelineItem>
        <TimelineItem icon={<Trash2 aria-hidden />} tone="danger" title="@fixture deleted a post" time={<RelativeTime date={ago(12)} />} />
        <TimelineItem icon={<AtSign aria-hidden />} tone="warning" title="@fixture changed handle" time={<RelativeTime date={ago(180)} />} />
        <TimelineItem icon={<UserPlus aria-hidden />} tone="success" title="@fixture followed @someone" time={<RelativeTime date={ago(60 * 30)} />} />
      </Timeline>
    </Frame>
  ),
  "relative-time": () => (
    <Frame>
      <p className="text-sm">
        Updated <RelativeTime date={ago(3)} />, published <RelativeTime date={ago(60 * 26)} />, in Spanish{" "}
        <RelativeTime date={ago(60 * 26)} locale="es" />.
      </p>
      <p className="text-sm">
        Deterministic, in a fixed zone:{" "}
        <RelativeTime
          date="2026-09-29T23:41:00Z"
          timeZone="Europe/Madrid"
          absoluteFormat={{ day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }}
        />
      </p>
    </Frame>
  ),
  snippet: () => (
    <Frame>
      <Snippet label="Linux and macOS install">{"curl -fsSL https://fabrials.com/install/spanreed.sh | sh"}</Snippet>
      <Snippet label="Windows install" prompt=">">{"irm https://fabrials.com/install/spanreed.ps1 | iex"}</Snippet>
    </Frame>
  ),
  "site-header": () => (
    <div className="w-full overflow-hidden rounded-(--fui-radius-lg) border">
      <SiteHeader
        sticky={false}
        brand={<ProductLockup product="Fabrials" gem="heliodor" size="sm" />}
        navigation={
          <>
            <a href="#preview">Products</a>
            <a href="#preview">Usage AI</a>
            <a href="#preview" aria-current="page">
              News
            </a>
          </>
        }
        actions={<Button size="sm">Sign in</Button>}
      />
    </div>
  ),
  "auth-layout": () => (
    <div className="w-full overflow-hidden rounded-(--fui-radius-lg) border [&_.fui-auth]:min-h-[30rem]">
      <AuthLayout
        brand={<ProductLockup product="Fabrials" gem="stormlight" />}
        title="Sign in"
        description="One account for fabrials.com, ai.fabrials.com and the admin console."
        aside={<DitherScene variant="full" reveal={0} />}
        footer="We read your X handle and avatar, nothing else."
        headingLevel={2}
      >
        <Button>Continue with X</Button>
      </AuthLayout>
    </div>
  ),
  "provider-icon": () => (
    <Frame>
      <ul className="flex flex-wrap gap-5 text-sm">
        {["openai", "anthropic", "xai", "cursor", "github", "nous", "google", "zai"].map((provider) => (
          <li key={provider} className="flex items-center gap-2">
            <ProviderIcon provider={provider} size={24} />
            <span>{provider}</span>
          </li>
        ))}
      </ul>
    </Frame>
  ),
};
