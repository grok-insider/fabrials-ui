import { useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, ContactRound, FileText, FolderOpen, Inbox, Layers, Plus, Search, Send, Settings, Star, Trash2, TriangleAlert, UserRound } from "lucide-react";
import {
  AppHeader,
  AppHeaderAction,
  AppHeaderBrand,
  AppHeaderCaret,
  AppHeaderLabel,
  AppHeaderLink,
  AppHeaderLogo,
  AppHeaderNav,
  AppHeaderPlaceholder,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  IconButton,
  Item,
  ItemActions,
  ItemCheck,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  ItemUnread,
  Kbd,
  Loading,
  NativeCheckbox,
  NavSwitcher,
  NavSwitcherContent,
  NavSwitcherItem,
  NavSwitcherSeparator,
  NavSwitcherTrigger,
  PageHeader,
  ProductLockup,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SectionHeader,
  SettingsSection,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  StatePanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TooltipProvider,
  placeholderList,
  placeholderText,
} from "@fabrials/ui";
import "./structure.css";

const meta = {
  title: "Fabrials/Structure",
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

/** A width the piece is asked to live in: `358` is a phone pane. `flush` has no padding (a header spans its frame). */
function Frame({ width, dir, height, flush, surface, children }: { width?: number | string; dir?: "rtl"; height?: number; flush?: boolean; surface?: "sidebar"; children: ReactNode }) {
  return (
    <div
      dir={dir}
      style={{
        width: "100%",
        boxSizing: "border-box",
        maxWidth: typeof width === "number" ? `${width}px` : width,
        height: height ? `${height}px` : undefined,
        minWidth: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--fui-radius-lg)",
        background: surface === "sidebar" ? "var(--sidebar)" : "var(--card)",
        color: surface === "sidebar" ? "var(--sidebar-foreground)" : undefined,
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

// ------------------------------------------------------------------------ Items

const messages = [
  { id: "m1", from: "Ana Ruiz", subject: "Quarterly planning notes", preview: "Attached are the notes from Tuesday and the open questions for finance.", time: "12:04", unread: true },
  { id: "m2", from: "Build server", subject: "Nightly build 4182 passed", preview: "All 1,204 checks passed in 6 minutes 12 seconds.", time: "09:31", unread: false },
  { id: "m3", from: "Bo Lindqvist", subject: "Re: The reallylongunbrokenidentifier-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789 renewal", preview: "Thanks, I will forward it to the whole procurement group tomorrow morning.", time: "Mon", unread: false },
  { id: "m4", from: "Calendar", subject: "Invitation: Design review", preview: "Thursday 14:00 in the small room.", time: "Sep 21", unread: true },
];

function MessageRow({ message, current, selected, checked, onCheck }: { message: (typeof messages)[number]; current?: boolean; selected?: boolean; checked?: boolean; onCheck?: (value: boolean) => void }) {
  return (
    <Item stretch current={current} selected={selected} unread={message.unread}>
      <ItemCheck>
        <NativeCheckbox aria-label={`Select: ${message.subject}`} checked={checked} onChange={(event) => onCheck?.(event.target.checked)} readOnly={onCheck === undefined} />
      </ItemCheck>
      <ItemContent>
        <ItemTitle render={<h3 />} style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-1-5)" }}>
          {message.unread ? <ItemUnread /> : null}
          <ItemLink href="#message" current={current} dir="auto">
            {message.unread ? <span className="fui-sr-only">Unread · </span> : null}
            {message.subject}
          </ItemLink>
        </ItemTitle>
        <ItemDescription>
          {message.from} · {message.preview}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <time style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)", whiteSpace: "nowrap" }}>{message.time}</time>
        <IconButton label={`Star: ${message.subject}`}>
          <Star aria-hidden />
        </IconButton>
      </ItemActions>
    </Item>
  );
}

function ItemsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({ m2: true });
  return (
    <Page title="Items" description="A record row for master-detail panes: one stretched target, controls above it, current and selected fills, unread weight, and a focus ring inside the row.">
      <Block title="Message rows" description="Row 1 is unread, row 2 is checked, row 3 is the open message with a long subject, row 4 is unread. Tab to a row: the ring is drawn inside it.">
        <Frame flush>
          <ItemGroup bordered aria-label="Messages">
            <MessageRow message={messages[0]!} checked={!!checked.m1} onCheck={(value) => setChecked((state) => ({ ...state, m1: value }))} />
            <MessageRow message={messages[1]!} checked={!!checked.m2} onCheck={(value) => setChecked((state) => ({ ...state, m2: value }))} />
            <MessageRow message={messages[2]!} current checked={!!checked.m3} onCheck={(value) => setChecked((state) => ({ ...state, m3: value }))} />
            <MessageRow message={messages[3]!} selected checked />
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="Narrow pane, 358 px" description="Below 24rem of its own width the actions wrap under the text instead of squeezing it.">
        <Frame width={358} flush>
          <ItemGroup bordered aria-label="Messages, narrow">
            <MessageRow message={messages[0]!} />
            <MessageRow message={messages[2]!} current />
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="Contact rows" description="Media, a name that is the target, and addresses that stay selectable above it.">
        <Frame width={560} flush>
          <ItemGroup bordered aria-label="Contacts">
            {["Ana Ruiz", "Bo Lindqvist", "Ministerio de la Presidencia y Administraciones Territoriales"].map((name, index) => (
              <Item key={name} stretch current={index === 1}>
                <ItemMedia variant="image">
                  <Avatar size="md">
                    <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <ItemLink href="#contact" current={index === 1} dir="auto">
                      {name}
                    </ItemLink>
                  </ItemTitle>
                  <ItemDescription>{index === 0 ? "ana@example.test, ana.ruiz@example.test" : "bo@example.test"}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="outline">Work</Badge>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="Rows whose target is a button" description="The saved copies of the offline reader: the row selects, it does not navigate. aria-pressed says which is open.">
        <Frame width={560} flush>
          <ItemGroup bordered aria-label="Saved messages">
            {["Quarterly planning notes", "Nightly build 4182 passed"].map((subject, index) => (
              <Item key={subject} stretch current={index === 0}>
                <ItemContent>
                  <ItemTitle>
                    <ItemLink render={<button type="button" aria-pressed={index === 0} />}>
                      {subject}
                    </ItemLink>
                  </ItemTitle>
                  <ItemDescription>Ana Ruiz · expires Oct 12</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="Standalone items" description="Outside a group an item is a div. Outline and muted are boxed rows; sm is denser; a separator replaces a row's own hairline.">
        <div className="catalogue-grid">
          <Item variant="outline">
            <ItemMedia variant="icon">
              <FileText aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Export ready</ItemTitle>
              <ItemDescription>3.2 MB · expires in 24 hours</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="secondary">
                Download
              </Button>
            </ItemActions>
          </Item>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              <TriangleAlert aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Mailbox needs authorization</ItemTitle>
            </ItemContent>
          </Item>
          <ItemGroup aria-label="With a separator">
            <Item>
              <ItemContent>
                <ItemTitle>First</ItemTitle>
              </ItemContent>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemContent>
                <ItemTitle>Second</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
      </Block>
      <Block title="Right to left">
        <Frame dir="rtl" width={560} flush>
          <ItemGroup bordered aria-label="رسائل">
            <MessageRow message={{ id: "r1", from: "أنا", subject: "ملاحظات التخطيط الفصلي", preview: "مرفق ملاحظات يوم الثلاثاء والأسئلة المفتوحة.", time: "12:04", unread: true }} />
            <MessageRow message={{ id: "r2", from: "خادم البناء", subject: "نجح البناء الليلي 4182", preview: "اجتازت جميع الفحوصات.", time: "09:31", unread: false }} current />
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="Loading" description="The real rows inside Loading, with placeholder data: nothing moves when the data arrives.">
        <Frame flush>
          <Loading when label="Loading messages">
            <ItemGroup bordered aria-label="Messages loading">
              {placeholderList(3, (index) => ({
                id: `p${index}`,
                from: placeholderText(10, index),
                subject: placeholderText([26, 34, 20][index] ?? 24, index),
                preview: placeholderText(60, index),
                time: "12:04",
                unread: index === 0,
              })).map((message) => (
                <MessageRow key={message.id} message={message} />
              ))}
            </ItemGroup>
          </Loading>
        </Frame>
      </Block>
      <Block title="Empty" description="A list with no rows says what to do, in the same frame.">
        <Frame flush>
          <StatePanel state="empty" size="sm" variant="inline" title="No messages" description="Messages that match will show here." />
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ App header

function Command() {
  return (
    <Button variant="outline" size="lg" className="structure-command" aria-label="Commands">
      <Search aria-hidden />
      <span className="structure-command-label">Commands</span>
      <Kbd className="structure-command-keys">Ctrl K</Kbd>
    </Button>
  );
}

function Header({ name = "Open Email", logo, current = "mail", withCommand = true, withNav = true, ...props }: { name?: string; logo?: boolean; current?: "mail" | "contacts"; withCommand?: boolean; withNav?: boolean } & Partial<React.ComponentProps<typeof AppHeader>>) {
  return (
    <AppHeader
      brand={
        <AppHeaderBrand href="#main">
          <ProductLockup
            product={<bdi dir="auto">{name}</bdi>}
            gem="emerald"
            mark={logo ? <AppHeaderLogo src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='48'%3E%3Crect width='160' height='48' fill='%23888'/%3E%3C/svg%3E" width={160} height={48} /> : undefined}
          />
        </AppHeaderBrand>
      }
      navigation={
        withNav ? (
          <AppHeaderNav label="Workspace">
            <AppHeaderLink href="#main" current={current === "mail"}>
              <Inbox aria-hidden />
              <span>Mail</span>
            </AppHeaderLink>
            <AppHeaderLink href="#main" current={current === "contacts"}>
              <ContactRound aria-hidden />
              <span>Contacts</span>
            </AppHeaderLink>
          </AppHeaderNav>
        ) : undefined
      }
      command={withCommand ? <Command /> : undefined}
      actions={
        <>
          <IconButton label="Settings">
            <Settings aria-hidden />
          </IconButton>
          <AppHeaderAction>
            <Avatar size="sm" aria-hidden>
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <AppHeaderLabel dir="auto">alex@example.test</AppHeaderLabel>
            <AppHeaderCaret />
          </AppHeaderAction>
        </>
      }
      {...props}
    />
  );
}

function AppHeaderPage() {
  return (
    <Page title="Application header" description="One 56 px row, a hairline, no blur, its content on the page gutter. Every mode is a container query on the header's own width.">
      <Block title="Wide, from 72rem" description="The command slot is 14rem here (18 at 90rem, 22 at 120rem); the current link has a Stormlight bar on the hairline.">
        <Frame flush width={1200}>
          <Header />
        </Frame>
      </Block>
      <Block title="Medium, 48 to 72rem" description="Labels stay; the command slot is a 44 px icon (the palette trigger answers to the container named command).">
        <Frame flush width={770}>
          <Header current="contacts" />
        </Frame>
      </Block>
      <Block title="Compact, below 48rem" description="Labels turn into screen-reader text, controls are square 44 px, the navigation keeps its place.">
        <Frame flush width={390}>
          <Header />
        </Frame>
      </Block>
      <Block title="A 64-character installation name and a wide logo" description="The name gives way with an ellipsis; the mark and every control keep their size.">
        <Frame flush width={1000}>
          <Header name="Correo interno de la Dirección General de Sistemas y Comunicaciones" />
        </Frame>
        <Frame flush width={390}>
          <Header name="Correo interno de la Dirección General de Sistemas y Comunicaciones" logo />
        </Frame>
      </Block>
      <Block title="Very narrow boxes" description="At 24rem the name goes; at 19rem the row wraps in two (only very large text gets there).">
        <Frame flush width={360}>
          <Header name="Open Email" />
        </Frame>
        <Frame flush width={288}>
          <Header name="Open Email" />
        </Frame>
      </Block>
      <Block title="Public, without navigation or command" description="Sign-in, session states, the 404: the brand and a preferences menu.">
        <Frame flush width={1000}>
          <AppHeader
            brand={
              <AppHeaderBrand href="#main">
                <ProductLockup product="Open Email" gem="emerald" />
              </AppHeaderBrand>
            }
            actions={
              <AppHeaderAction>
                <AppHeaderLabel>English</AppHeaderLabel>
                <AppHeaderCaret />
              </AppHeaderAction>
            }
          />
        </Frame>
        <Frame flush width={390}>
          <AppHeader
            brand={
              <AppHeaderBrand href="#main">
                <ProductLockup product="Open Email" gem="emerald" />
              </AppHeaderBrand>
            }
            actions={
              <>
                <AppHeaderPlaceholder />
                <AppHeaderAction aria-label="Language">
                  <UserRound aria-hidden />
                  <AppHeaderLabel>English</AppHeaderLabel>
                  <AppHeaderCaret />
                </AppHeaderAction>
              </>
            }
          />
        </Frame>
      </Block>
      <Block title="Right to left">
        <Frame flush width={1000} dir="rtl">
          <Header name="البريد المفتوح" />
        </Frame>
        <Frame flush width={390} dir="rtl">
          <Header name="البريد المفتوح" />
        </Frame>
      </Block>
    </Page>
  );
}

// ------------------------------------------------------------------ Navigation

function Rows({ withState = true }: { withState?: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Mailboxes</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" isActive render={<a href="#inbox" />}>
            <Inbox aria-hidden />
            <span>Inbox</span>
            <SidebarMenuBadge>12</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" render={<a href="#drafts" />}>
            <FileText aria-hidden />
            <span>Drafts</span>
            <SidebarMenuBadge>2</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" render={<a href="#sent" />}>
            <Send aria-hidden />
            <span>Sent</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" depth={1} render={<a href="#projects" />}>
            <FolderOpen aria-hidden />
            <span>Projects</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" depth={2} render={<a href="#long" />}>
            <FolderOpen aria-hidden />
            <span>Quarterly planning and budget review for the whole department</span>
            <SidebarMenuBadge>128</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" render={<a href="#archive" />}>
            <Archive aria-hidden />
            <span>Archive</span>
            {withState ? <Badge tone="warning" dot>Needs review</Badge> : null}
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton size="touch" aria-disabled="true" render={<span />}>
            <Trash2 aria-hidden />
            <span>Trash (unavailable)</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function Switcher({ layout = "block", open = false, current = "ana", many = false }: { layout?: "block" | "inline"; open?: boolean; current?: string; many?: boolean }) {
  const entries = [
    { id: "ana", label: "ana@example.test", detail: "Personal", state: "active" },
    { id: "work", label: "ana.ruiz@a-very-long-company-domain.example.test", detail: "Work", state: "reauth" },
    { id: "shared", label: "shared@example.test", detail: "Shared", state: "down" },
    ...(many ? Array.from({ length: 8 }, (_, index) => ({ id: `x${index}`, label: `alias-${index + 1}@example.test`, detail: "Alias", state: "active" })) : []),
  ];
  const shown = entries.find((entry) => entry.id === current) ?? entries[0]!;
  return (
    <NavSwitcher layout={layout} defaultOpen={open}>
      <NavSwitcherTrigger
        label="Switch mailbox"
        mark={<Avatar size="sm"><AvatarFallback>{shown.label.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>}
        title={shown.label}
        description={shown.detail}
        tag={<Badge tone="warning" aria-label="2 need attention" title="2 need attention"><TriangleAlert aria-hidden />2</Badge>}
      />
      <NavSwitcherContent label="Switch mailbox" listLabel="Connected mailboxes" footer={<StatePanel state="stale" size="sm" variant="inline" headingLevel={3} title="Showing the last list" actions={<Button variant="secondary" size="sm">Retry</Button>} />}>
        <NavSwitcherItem render={<a href="#all" />} mark={<Layers aria-hidden />}>All inboxes</NavSwitcherItem>
        {entries.map((entry) => (
          <NavSwitcherItem
            key={entry.id}
            render={<a href={`#${entry.id}`} />}
            current={entry.id === current}
            mark={<Avatar size="sm"><AvatarFallback>{entry.label.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>}
            description={entry.state === "reauth" ? <Badge tone="warning" dot>Needs authorization</Badge> : entry.state === "down" ? <Badge tone="danger" dot>Unavailable</Badge> : undefined}
          >
            {entry.label}
          </NavSwitcherItem>
        ))}
        <NavSwitcherSeparator />
        <NavSwitcherItem render={<a href="#link" />} mark={<Plus aria-hidden />}>Link a mailbox</NavSwitcherItem>
      </NavSwitcherContent>
    </NavSwitcher>
  );
}

function ResizeDemo({ vertical, withRows }: { vertical?: boolean; withRows?: boolean }) {
  const [saved, setSaved] = useState("nothing saved yet");
  const text = (label: string) => (
    <div style={{ padding: "var(--fui-space-3)", overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
      <strong>{label}</strong>
      <p style={{ color: "var(--muted-foreground)" }}>Drag the line, or focus it and use the arrow keys, Home and End. Double click resets.</p>
    </div>
  );
  return (
    <>
    <ResizablePanelGroup
      orientation={vertical ? "vertical" : "horizontal"}
      style={{ height: vertical ? 320 : 220 }}
      onLayoutChanged={(layout, meta) => {
        // The persistence recipe: save only what a person did. A double click on a handle counts, wherever in its hit target it landed.
        if (meta.isUserInteraction) setSaved(Object.values(layout).map((value) => Math.round(value)).join(" / "));
      }}
    >
      <ResizablePanel id={vertical ? "top" : "nav"} defaultSize={vertical ? "40%" : "24%"} minSize="6rem" style={{ background: vertical ? "var(--card)" : "var(--sidebar)" }}>
        {withRows && !vertical ? (
          <nav aria-label="Mailboxes in a resizable pane" style={{ overflow: "hidden", height: "100%" }}>
            <Rows withState={false} />
          </nav>
        ) : (
          text(vertical ? "List" : "Navigation")
        )}
      </ResizablePanel>
      <ResizableHandle label={vertical ? "Resize the list" : withRows ? "Resize the mailboxes pane" : "Resize the navigation"} />
      <ResizablePanel id={vertical ? "bottom" : "list"} defaultSize={vertical ? "60%" : "36%"} minSize="6rem" style={{ background: "var(--card)" }}>
        {text(vertical ? "Reader" : "List")}
      </ResizablePanel>
      {vertical ? null : (
        <>
          <ResizableHandle label={withRows ? "Resize the reader pane" : "Resize the reader"} disabled />
          <ResizablePanel id="reader" defaultSize="40%" minSize="6rem" style={{ background: "var(--background)" }}>
            {text("Reader (its handle is disabled)")}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
    <output style={{ display: "block", padding: "var(--fui-space-2) var(--fui-space-3)", borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" }}>
      Saved layout: {saved}
    </output>
    </>
  );
}

function NavigationPage() {
  return (
    <Page title="Navigation" description="Navigation rows without a provider, a switcher for where you are, and resizable panes.">
      <Block title="Menu rows, size touch" description="A 44 px target around a 40 px band; the count is inside the link, so it is part of its name. Nothing here needs SidebarProvider.">
        <div className="catalogue-grid">
          <Frame width={280} surface="sidebar">
            <nav aria-label="Mailboxes">
              <Rows />
            </nav>
          </Frame>
          <Frame width={260} surface="sidebar" dir="rtl">
            <nav aria-label="صناديق البريد">
              <Rows withState={false} />
            </nav>
          </Frame>
        </div>
      </Block>
      <Block title="Switcher" description="Block fills a column; inline sizes to its content. The list is links with aria-current; the footer stays in view under the scrolling list.">
        <div className="catalogue-grid">
          <Frame width={340} surface="sidebar">
            <Switcher />
          </Frame>
          <Frame width={340} surface="sidebar">
            <Switcher layout="inline" current="work" />
          </Frame>
        </div>
        <Frame width={188} surface="sidebar">
          <Switcher />
        </Frame>
        <Frame surface="sidebar">
          <Loading when label="Loading mailboxes">
            <div style={{ maxWidth: 280 }}>
              <NavSwitcher>
                <NavSwitcherTrigger label="Switch mailbox" mark="X" title={placeholderText(24)} description={placeholderText(12)} />
                <NavSwitcherContent label="Switch mailbox">
                  <NavSwitcherItem render={<a href="#a" />}>x</NavSwitcherItem>
                </NavSwitcherContent>
              </NavSwitcher>
            </div>
          </Loading>
        </Frame>
      </Block>
      <Block title="Resizable panes" description="A 1 px hairline; a 3 px Stormlight line on hover, drag and keyboard focus. The third handle is disabled and transparent. The second group holds touch menu rows in its navigation pane: drag the line to see them at a narrow width.">
        <Frame flush>
          <ResizeDemo />
        </Frame>
        <Frame flush>
          <ResizeDemo withRows />
        </Frame>
        <Frame flush>
          <ResizeDemo vertical />
        </Frame>
      </Block>
    </Page>
  );
}

function OpenSwitcherPage() {
  return (
    <Page title="Switcher, open" description="The popover of a switcher: entities with status tags, the current one marked, a footer action and a stale note under the scrolling list.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))", gap: "var(--fui-space-6)", minHeight: 520 }}>
        <Frame width={300} surface="sidebar">
          <Switcher open many />
        </Frame>
      </div>
    </Page>
  );
}

// -------------------------------------------------------------------- Sections

function SectionRows() {
  return (
    <>
      <SettingsSection title="Theme" description="Follows your system unless you choose one." headingLevel={3}>
        <Button variant="outline">Choose theme</Button>
      </SettingsSection>
      <SettingsSection title="Language" description="The language of the interface." headingLevel={3}>
        <Button variant="outline">Choose language</Button>
      </SettingsSection>
    </>
  );
}

const tabLabels = ["Mailboxes", "Appearance", "Identity", "Privacy", "Assistant", "Notifications", "Keyboard", "Advanced"];

function TabsDemo({ orientation, scrollable, start = "Assistant", dir, external }: { orientation?: "vertical"; scrollable?: boolean | "narrow"; start?: string; dir?: "rtl"; external?: string }) {
  const [value, setValue] = useState(start);
  return (
    <>
    {external ? (
      <Button variant="secondary" size="sm" style={{ margin: "var(--fui-space-2)" }} onClick={() => setValue(external)}>
        Select {external} from outside
      </Button>
    ) : null}
    <Tabs value={value} onValueChange={(next) => setValue(String(next))} orientation={orientation ?? "horizontal"} dir={dir}>
      <TabsList aria-label="Settings sections" scrollable={scrollable}>
        {tabLabels.map((label) => (
          <TabsTrigger key={label} value={label}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabLabels.map((label) => (
        <TabsContent key={label} value={label}>
          <p style={{ margin: 0, padding: "var(--fui-space-3)" }}>{label} settings.</p>
        </TabsContent>
      ))}
    </Tabs>
    </>
  );
}

function HeadingDemo() {
  const page = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLHeadingElement>(null);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)" }}>
        <Button variant="secondary" onClick={() => page.current?.focus()}>
          Focus the page heading
        </Button>
        <Button variant="secondary" onClick={() => section.current?.focus()}>
          Focus the section heading
        </Button>
      </div>
      <PageHeader title="Tools" description="Level 2 because a page above owns the h1; it still looks like a page title." headingLevel={2} headingRef={page} headingProps={{ tabIndex: -1, id: "tools-heading" }} />
      <SectionHeader title="Recent runs" description="Level 3, focusable, with an id the section can be named by." headingLevel={3} headingRef={section} headingProps={{ tabIndex: -1 }} />
      <SettingsSection title="Signature" headingLevel={4} headingProps={{ id: "signature-title", tabIndex: -1 }} layout="stacked">
        <Button variant="outline">Edit signature</Button>
      </SettingsSection>
    </div>
  );
}

function SectionsPage() {
  return (
    <Page title="Sections and tabs" description="Sections that follow their container, tabs for a rail and a one-line strip, and heading controls.">
      <Block title="A section follows its container" description="Two columns from 36rem of the section's own width, one column below it, whatever the viewport is.">
        <Frame width={416}>
          <SectionRows />
        </Frame>
        <Frame width={992}>
          <SectionRows />
        </Frame>
        <Frame width={992}>
          <SettingsSection title="Stacked on purpose" description="layout=stacked keeps one column at any width." layout="stacked" headingLevel={3}>
            <Button variant="outline">Choose</Button>
          </SettingsSection>
        </Frame>
      </Block>
      <Block title="Vertical tabs, a rail" description="The current row is the sidebar accent with a 2 px Stormlight bar on the inline-start edge. Arrow keys move through the rail.">
        <Frame flush width={720}>
          <TabsDemo orientation="vertical" start="Identity" />
        </Frame>
      </Block>
      <Block title="Scrollable tabs, one line" description="No scrollbar, snap to the tabs, and the selected tab is kept in view (here the fifth of eight starts selected). true is always; narrow only below 48rem.">
        <Frame flush width={358}>
          <TabsDemo scrollable start="Notifications" external="Mailboxes" />
        </Frame>
        <Frame flush width={358} dir="rtl">
          <TabsDemo scrollable start="Notifications" dir="rtl" />
        </Frame>
        <Frame flush width={358}>
          <TabsDemo scrollable="narrow" start="Keyboard" />
        </Frame>
      </Block>
      <Block title="Heading controls" description="A level for the outline of the page, a ref and an id for code that moves focus. A focused heading shows a ring.">
        <Frame>
          <HeadingDemo />
        </Frame>
      </Block>
    </Page>
  );
}

export const Items: Story = { render: () => <ItemsPage /> };
export const ApplicationHeader: Story = { render: () => <AppHeaderPage /> };
/** The header the way an app uses it: it spans the window, outside any page column, so every mode of the command slot is reachable. */
function FullWidthPage() {
  return (
    <div>
      <Header />
      <main className="catalogue">
        <PageHeader title="Full-width header" description="The header answers to the window here: the command slot is 14rem from 72rem, 18rem from 90rem and 22rem from 120rem (a 2560 px window shows the last)." />
      </main>
    </div>
  );
}

export const FullWidthHeader: Story = { render: () => <FullWidthPage /> };
export const Navigation: Story = { render: () => <NavigationPage /> };
export const SwitcherOpen: Story = { render: () => <OpenSwitcherPage /> };
export const Sections: Story = { render: () => <SectionsPage /> };
