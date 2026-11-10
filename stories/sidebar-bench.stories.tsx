import { useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart3, FolderKanban, LayoutGrid, MoreHorizontal, Plus, Receipt, Settings, Users } from "lucide-react";
import {
  DirectionProvider,
  Input,
  PageHeader,
  SectionHeader,
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSearch,
  SidebarTrigger,
  useSidebar,
} from "@fabrials/ui";

const meta = {
  title: "Tests/Sidebar",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Words = {
  brand: string;
  search: string;
  workspace: string;
  add: string;
  more: (row: string) => string;
  rows: { overview: string; projects: string; invoices: string; members: string; reports: string; settings: string };
  projects: [string, string];
  page: string;
  notes: string;
  toggle: string;
  navigation: { title: string; description: string; close: string };
};

const english: Words = {
  brand: "Harbour",
  search: "Search projects",
  workspace: "Workspace",
  add: "Add a project",
  more: (row) => `More for ${row}`,
  rows: { overview: "Overview", projects: "Projects", invoices: "Invoices", members: "Members", reports: "Reports", settings: "Settings" },
  projects: ["Lighthouse", "Breakwater"],
  page: "Page",
  notes: "Notes",
  toggle: "Toggle navigation",
  navigation: { title: "Navigation", description: "The sections of this workspace.", close: "Close navigation" },
};

const arabic: Words = {
  brand: "المرفأ",
  search: "ابحث في المشاريع",
  workspace: "مساحة العمل",
  add: "أضف مشروعاً",
  more: (row) => `المزيد: ${row}`,
  rows: { overview: "نظرة عامة", projects: "المشاريع", invoices: "الفواتير", members: "الأعضاء", reports: "التقارير", settings: "الإعدادات" },
  projects: ["المنارة", "كاسر الأمواج"],
  page: "الصفحة",
  notes: "ملاحظات",
  toggle: "أظهر التنقل أو أخفه",
  navigation: { title: "التنقل", description: "أقسام مساحة العمل.", close: "أغلق التنقل" },
};

// The sidebar is fixed to the window; a transform makes the frame its containing block, so several fit on one page.
const stage: CSSProperties = {
  position: "relative",
  blockSize: "27rem",
  overflow: "hidden",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  transform: "translateZ(0)",
};
const fill: CSSProperties = { minHeight: 0, blockSize: "100%" };

function Rows({ words, route, onRoute, size, tooltips = false }: { words: Words; route: string; onRoute: (route: string) => void; size?: "default" | "sm" | "lg" | "touch"; tooltips?: boolean }) {
  const row = (id: keyof Words["rows"], icon: ReactNode, extra?: ReactNode, inside?: ReactNode) => (
    <SidebarMenuItem key={id}>
      <SidebarMenuButton isActive={route === id} onClick={() => onRoute(id)} size={size} tooltip={tooltips ? words.rows[id] : undefined}>
        {icon}
        <span>{words.rows[id]}</span>
        {inside}
      </SidebarMenuButton>
      {extra}
    </SidebarMenuItem>
  );
  const more = (id: keyof Words["rows"]) => (
    <SidebarMenuAction aria-label={words.more(words.rows[id])}>
      <MoreHorizontal aria-hidden />
    </SidebarMenuAction>
  );
  return (
    <SidebarMenu>
      {row("overview", <LayoutGrid aria-hidden />)}
      {row(
        "projects",
        <FolderKanban aria-hidden />,
        <>
          {more("projects")}
          <SidebarMenuSub>
            {words.projects.map((name, index) => (
              <SidebarMenuSubItem key={name}>
                <SidebarMenuSubButton href="#" isActive={index === 0 && route === "projects"} onClick={(event) => event.preventDefault()}>
                  <span>{name}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </>,
      )}
      {row("invoices", <Receipt aria-hidden />, <SidebarMenuBadge>12</SidebarMenuBadge>)}
      {row("members", <Users aria-hidden />, undefined, <SidebarMenuBadge>3</SidebarMenuBadge>)}
      {row("reports", <BarChart3 aria-hidden />, more("reports"))}
    </SidebarMenu>
  );
}

/** The product's name; folded to icons, its first letter. */
function Brand({ name }: { name: string }) {
  const { state, isMobile } = useSidebar();
  const folded = state === "collapsed" && !isMobile;
  return (
    <strong style={{ paddingInline: "var(--fui-space-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {folded ? (
        <>
          <span aria-hidden>{[...name][0]}</span>
          <span className="fui-sr-only">{name}</span>
        </>
      ) : (
        name
      )}
    </strong>
  );
}

function Shell({
  words = english,
  dir,
  side,
  collapsible = "offcanvas",
  defaultOpen = true,
  primary = false,
  sheetCloseButton = false,
}: {
  words?: Words;
  dir?: "rtl";
  side?: "left" | "right" | "start" | "end";
  collapsible?: "offcanvas" | "icon";
  defaultOpen?: boolean;
  /** The one sidebar of the page that answers Ctrl+B and remembers its state. */
  primary?: boolean;
  sheetCloseButton?: boolean;
}) {
  const [route, setRoute] = useState("overview");
  const shell = (
    <SidebarProvider defaultOpen={defaultOpen} keyboardShortcut={primary ? "b" : false} navigationKey={route} persist={primary} style={fill}>
      <Sidebar collapsible={collapsible} dir={dir} labels={words.navigation} sheetCloseButton={sheetCloseButton} side={side} style={fill}>
        <SidebarHeader>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--fui-space-2)", minBlockSize: "2.25rem" }}>
            <Brand name={words.brand} />
            {sheetCloseButton ? null : <SidebarClose />}
          </div>
          <SidebarSearch aria-label={words.search} placeholder={words.search} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{words.workspace}</SidebarGroupLabel>
            <SidebarGroupAction aria-label={words.add}>
              <Plus aria-hidden />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <Rows onRoute={setRoute} route={route} tooltips words={words} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={route === "settings"} onClick={() => setRoute("settings")} tooltip={words.rows.settings}>
                <Settings aria-hidden />
                <span>{words.rows.settings}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail label={words.toggle} />
      </Sidebar>
      {/* One page holds several shells, so their insets are plain boxes: the page keeps a single <main>. */}
      <div className="fui-sidebar-inset" style={{ padding: "var(--fui-space-3)", gap: "var(--fui-space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
          <SidebarTrigger label={words.toggle} />
          <span data-testid="route">
            {words.page}: {words.rows[route as keyof Words["rows"]]}
          </span>
        </div>
        <Input aria-label={words.notes} placeholder={words.notes} style={{ maxInlineSize: "18rem" }} />
      </div>
    </SidebarProvider>
  );
  return (
    <div data-testid="shell" dir={dir} style={stage}>
      {dir ? <DirectionProvider direction={dir}>{shell}</DirectionProvider> : shell}
    </div>
  );
}

/** A sidebar that is always in the page (no sheet), so its rows are in every reference, the phone's too. */
function Still({ title, size, dir, words = english, route = "projects", style }: { title: string; size?: "default" | "sm" | "lg" | "touch"; dir?: "rtl"; words?: Words; route?: string; style?: CSSProperties }) {
  const body = (
    <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, inlineSize: "auto" }}>
      <Sidebar aria-label={title} collapsible="none" role="group" style={{ ...style, blockSize: "auto", border: "1px solid var(--sidebar-border)", borderRadius: "var(--fui-radius-lg)", overflow: "hidden" }}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarGroupAction aria-label={words.add}>
              <Plus aria-hidden />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <Rows onRoute={() => undefined} route={route} size={size} words={words} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
  return (
    <div data-testid={`still-${size ?? "default"}${dir ? "-rtl" : ""}${style ? "-tokens" : ""}`} dir={dir}>
      {dir ? <DirectionProvider direction={dir}>{body}</DirectionProvider> : body}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader description={description} title={title} />
      <div style={{ marginBlockStart: "var(--fui-space-3)" }}>{children}</div>
    </section>
  );
}

// A host that retints the current row sets four tokens and overrides no rule.
const retint = {
  "--fui-sidebar-active": "color-mix(in oklab, var(--brand-ink) 13%, transparent)",
  "--fui-sidebar-active-ink": "var(--sidebar-foreground)",
  "--fui-sidebar-active-icon": "var(--brand-ink)",
  "--fui-sidebar-active-shadow": "none",
  "--fui-sidebar-active-bar": "transparent",
} as CSSProperties;

const wrap: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "start", gap: "var(--fui-space-4)" };

function Bench() {
  return (
    <main className="catalogue">
      <PageHeader
        description="The sidebar in fixed states: a product shell with a search, groups, actions, counts and a sub menu; the same from the other edge in a right-to-left page; collapsed to icons; every row size; and a current row retinted with tokens."
        title="Sidebar"
      />
      <Section
        title="A product shell"
        description="Ctrl+B or the trigger folds it. Below 768 px it is a sheet with its own close key, and it closes when the page changes."
      >
        <Shell primary />
      </Section>
      <Section title="Right to left, from the start edge" description={'side="start" is the right edge here: the border, the rail, the actions and the counts follow.'}>
        <Shell dir="rtl" side="start" words={arabic} />
      </Section>
      <Section title="Collapsed to icons" description="A row's name is its tooltip, which opens away from the sidebar: to the right, and to the left in a right-to-left page.">
        <div style={{ display: "grid", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))" }}>
          <Shell collapsible="icon" defaultOpen={false} sheetCloseButton />
          <Shell collapsible="icon" defaultOpen={false} dir="rtl" side="start" words={arabic} />
        </div>
      </Section>
      <Section title="Row sizes" description="Default, small, large and touch. The action and the floating count stay centred on their row, above a sub menu too.">
        <div style={wrap}>
          <Still title="Default" />
          <Still size="sm" title="Small" />
          <Still size="lg" title="Large" />
          <Still size="touch" title="Touch" />
        </div>
      </Section>
      <Section title="Right to left rows, and a retinted current row" description="The same rows mirrored, and a host's tint for the current row: a fill, the icon in the brand ink, no shadow and no bar.">
        <div style={wrap}>
          <Still dir="rtl" title="الصفوف" words={arabic} />
          <Still route="invoices" style={retint} title="Retinted" />
          <Still route="invoices" size="touch" style={retint} title="Retinted, touch" />
        </div>
      </Section>
    </main>
  );
}

export const Pieces: Story = { render: () => <Bench /> };
