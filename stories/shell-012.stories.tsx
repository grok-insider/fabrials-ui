import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, Folder, Keyboard as KeyboardIcon, LayoutGrid, LogOut, Plus, Settings, SquarePen, Users } from "lucide-react";
import {
  Button,
  DitherCanvas,
  DropdownMenuItem,
  DropdownMenuSeparator,
  EditableText,
  IconButton,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  OnScreenKeyboard,
  Sidebar,
  SidebarAccount,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInsetContent,
  SidebarInsetHeader,
  SidebarInsetHeaderActions,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSearch,
  SidebarTrigger,
  useOnScreenKeyboard,
  type OnScreenKey,
  type ThemePreference,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Shell 0.12",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Every state of the shell pieces in fixed data: no clock, no randomness, no network. The two themes come from the suite.

const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;
const pair = { display: "flex", flexWrap: "wrap", gap: "var(--fui-space-3)", alignItems: "flex-start" } as const;
const note = { margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" } as const;
// The sidebar's container is fixed to the window: a stage of its own keeps it in its box, as the sidebar bench does.
const stage = {
  position: "relative",
  overflow: "hidden",
  blockSize: "26rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  transform: "translateZ(0)",
} as const;
const surface = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  blockSize: "9rem",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  background: "var(--background)",
} as const;

// --- the dither canvas: a scene the host paints -------------------------------------------------------------------------

/** A sky the host draws itself: two gradients, at the canvas's working resolution. */
function paintSky(context: CanvasRenderingContext2D, size: { width: number; height: number }, theme: "light" | "dark") {
  const dark = theme === "dark";
  const sky = context.createLinearGradient(0, 0, 0, size.height);
  sky.addColorStop(0, dark ? "#11151d" : "#c9cfd8");
  sky.addColorStop(0.55, dark ? "#5b6b8c" : "#8a94a6");
  sky.addColorStop(1, dark ? "#dfe7ff" : "#eef1f5");
  context.fillStyle = sky;
  context.fillRect(0, 0, size.width, size.height);
  const glow = context.createRadialGradient(size.width * 0.72, size.height * 0.3, 0, size.width * 0.72, size.height * 0.3, size.width * 0.34);
  glow.addColorStop(0, "#ffffff");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, size.width, size.height);
}

/** A star drawn after the dithering, so a single dot stays a dot. */
function paintStar(context: CanvasRenderingContext2D, size: { width: number; height: number }) {
  context.fillStyle = "#fff6e0";
  context.fillRect(Math.round(size.width * 0.24), Math.round(size.height * 0.38), 1, 1);
  context.fillRect(Math.round(size.width * 0.86), Math.round(size.height * 0.62), 1, 1);
}

const SKY_RAMP = ["background", "#1b2029", "#43474e", "#6f7d92", "#a9c3e8", "#dbe8ff"];
const SKY_RAMP_LIGHT = ["background", "#c9ced4", "#a3abb5", "#7b8593", "#56606e", "#3a434f"];

// --- the dither canvas: a picture ---------------------------------------------------------------------------------------

/** A landscape drawn as an SVG, so the picture is the same on every machine. */
const PICTURE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c96b"/><stop offset="0.55" stop-color="#d96a3f"/><stop offset="1" stop-color="#2b2038"/></linearGradient></defs><rect width="320" height="200" fill="url(#s)"/><circle cx="222" cy="66" r="34" fill="#fff4d6"/><path d="M0 152 L58 106 L118 152 L178 94 L248 152 L320 116 L320 200 L0 200Z" fill="#1a1424"/></svg>',
)}`;

const PICTURE_RAMP = ["background", "#241a2e", "#3d2740", "#7a3b45", "#c4693f", "#f2b364", "#fff0c9"];
const PICTURE_RAMP_LIGHT = ["background", "#f4e6d2", "#e7c9a4", "#d59a70", "#a9684f", "#6b3d41", "#3a2437"];

function Picture({
  title,
  mode,
  tone,
  fit,
  src = PICTURE,
  levels,
  testId,
}: {
  title: string;
  mode?: "ramp" | "channels";
  tone?: { min?: number; max?: number; contrast?: number; desaturate?: number };
  fit?: "cover" | "contain";
  src?: string;
  levels?: number;
  testId: string;
}) {
  return (
    <figure style={{ margin: 0, display: "grid", gap: "var(--fui-space-1)", minWidth: 0 }} data-testid={testId}>
      <div style={surface}>
        <DitherCanvas cell={3} fit={fit} levels={levels} mode={mode} ramp={{ dark: PICTURE_RAMP, light: PICTURE_RAMP_LIGHT }} source={src} tone={tone} />
      </div>
      <figcaption style={note}>{title}</figcaption>
    </figure>
  );
}

// --- the account row ----------------------------------------------------------------------------------------------------

const ROWS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "projects", label: "Projects", icon: Folder },
  { key: "members", label: "Members", icon: Users },
] as const;

function AccountMenu() {
  return (
    <>
      <DropdownMenuItem>
        <Settings aria-hidden size={16} />
        Settings
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Users aria-hidden size={16} />
        Members
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <LogOut aria-hidden size={16} />
        Sign out
      </DropdownMenuItem>
    </>
  );
}

function AccountRows() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const account = (
    <SidebarAccount email="ada@harbour.test" name="Ada Lovelace" onThemeChange={setTheme} theme={theme}>
      <AccountMenu />
    </SidebarAccount>
  );
  return (
    <div style={stack}>
      <p data-testid="account-theme" style={note}>
        Theme: {theme}
      </p>
      <div style={pair}>
        <div data-testid="account-expanded" style={{ flex: "0 0 auto", inlineSize: "16rem", border: "1px solid var(--sidebar-border)", borderRadius: "var(--fui-radius-lg)", overflow: "hidden" }}>
          <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, inlineSize: "auto" }}>
            <Sidebar collapsible="none" style={{ blockSize: "auto" }}>
              <SidebarFooter>{account}</SidebarFooter>
            </Sidebar>
          </SidebarProvider>
        </div>
        {/* Folded to icons: the same DOM a collapsed sidebar renders, with its container in the page instead of fixed to the
            window, and shown at every width (below 768 px the library folds the real one into a phone sheet). */}
        <div
          data-testid="account-collapsed"
          className="fui-sidebar"
          data-collapsible="icon"
          data-side="left"
          data-state="collapsed"
          data-variant="sidebar"
          style={{ display: "block", flex: "0 0 auto" }}
        >
          <div className="fui-sidebar-container" data-side="left" style={{ position: "static", inlineSize: "var(--sidebar-width-icon)", blockSize: "auto" }}>
            <div className="fui-sidebar-inner">
              <SidebarProvider keyboardShortcut={false} defaultOpen={false} persist={false} style={{ minHeight: 0, display: "block", inlineSize: "auto" }}>
                <SidebarFooter>{account}</SidebarFooter>
              </SidebarProvider>
            </div>
          </div>
        </div>
        <div data-testid="account-active" style={{ flex: "0 0 auto", inlineSize: "16rem", border: "1px solid var(--sidebar-border)", borderRadius: "var(--fui-radius-lg)", overflow: "hidden" }}>
          <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, inlineSize: "auto" }}>
            <Sidebar collapsible="none" style={{ blockSize: "auto" }}>
              <SidebarFooter>
                <SidebarAccount active email="beacon@harbour.test" name="Beacon Operations" />
              </SidebarFooter>
            </Sidebar>
          </SidebarProvider>
      </div>
      </div>
    </div>
  );
}

function FullSidebar() {
  const [route, setRoute] = useState("projects");
  const [theme, setTheme] = useState<ThemePreference>("system");
  return (
    <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, blockSize: "100%", inlineSize: "auto" }}>
      <Sidebar collapsible="icon" style={{ blockSize: "100%" }}>
        <SidebarHeader>
          <strong style={{ paddingInline: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>Harbour</strong>
          <SidebarSearch aria-label="Search projects" placeholder="Search projects" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ROWS.map(({ key, label, icon: Icon }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton isActive={route === key} onClick={() => setRoute(key)} tooltip={label}>
                      <Icon aria-hidden />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarAccount email="ada@harbour.test" name="Ada Lovelace" onThemeChange={setTheme} theme={theme}>
            <AccountMenu />
          </SidebarAccount>
        </SidebarFooter>
      </Sidebar>
      <div className="fui-sidebar-inset" style={{ padding: "var(--fui-space-3)", gap: "var(--fui-space-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
          <SidebarTrigger label="Toggle navigation" />
          <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>Active: {route}</span>
        </div>
        <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>The account row at the foot, in the sidebar it belongs to.</span>
      </div>
    </SidebarProvider>
  );
}

// --- the inset: header and frame ----------------------------------------------------------------------------------------

function FramedInset({ visibility, title, action }: { visibility: "always" | "mobile"; title: string; action: string }) {
  return (
    <div style={{ ...surface, blockSize: "auto", background: "var(--sidebar)" }} data-testid={`inset-${visibility}`}>
      <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, blockSize: "26rem", inlineSize: "auto" }}>
        <SidebarInset frame skipLabel="Skip to content" style={{ blockSize: "26rem" }}>
          <SidebarInsetHeader
            end={
              <IconButton label="New report" size="touch" variant="ghost">
                <SquarePen aria-hidden />
              </IconButton>
            }
            title={title}
            triggerLabel="Toggle navigation"
            visibility={visibility}
          >
            <IconButton label="Notifications" size="touch" variant="ghost">
              <Bell aria-hidden />
            </IconButton>
          </SidebarInsetHeader>
          <SidebarInsetContent style={{ padding: "var(--fui-space-3)" }} data-testid={`inset-content-${visibility}`}>
            {/* A page deep in the app puts its own key in the bar, wherever the bar is. */}
            <SidebarInsetHeaderActions>
              <IconButton label={action} size="touch" variant="ghost">
                <Plus aria-hidden />
              </IconButton>
            </SidebarInsetHeaderActions>
            <div style={stack}>
              {Array.from({ length: 14 }, (_, index) => (
                <p key={index} style={{ margin: 0, fontSize: "var(--fui-text-sm)" }}>
                  Report {index + 1}: the harbour at {8 + (index % 12)}:00, wind from the north east.
                </p>
              ))}
            </div>
          </SidebarInsetContent>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// --- a title renamed in place -------------------------------------------------------------------------------------------

function RenameExamples() {
  const [title, setTitle] = useState("Harbour at night");
  const [calls, setCalls] = useState(0);
  const [navigations, setNavigations] = useState(0);
  return (
    <div style={stack}>
      <p data-testid="rename-calls" style={note}>
        Commits: {calls}. Navigations: {navigations}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>
        <span style={note}>reading</span>
        <EditableText label="Rename chat" onCommit={setTitle} value={title} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>
        <span style={note}>with a pencil</span>
        <EditableText
          label="Rename chat"
          onCommit={(next) => {
            setCalls((count) => count + 1);
            setTitle(next);
          }}
          showTrigger
          value={title}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)", minInlineSize: "18rem" }}>
        <span style={note}>editing</span>
        <EditableText defaultEditing label="Rename chat" onCommit={() => undefined} value="Harbour at night" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>
        <span style={note}>pending</span>
        <EditableText label="Rename chat" onCommit={() => undefined} pending value="Harbour at night" />
      </div>
      <div style={{ inlineSize: "16rem", border: "1px solid var(--sidebar-border)", borderRadius: "var(--fui-radius-lg)", overflow: "hidden" }}>
        <SidebarProvider keyboardShortcut={false} persist={false} style={{ minHeight: 0, inlineSize: "auto" }}>
          <Sidebar collapsible="none" style={{ blockSize: "auto" }}>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <a
                          href="#harbour"
                          onClick={(event) => {
                            event.preventDefault();
                            setNavigations((count) => count + 1);
                          }}
                        />
                      }
                      size="touch"
                    >
                      <Folder aria-hidden />
                      <EditableText label="Rename chat" onCommit={() => undefined} startOn="doubleClick" value="Harbour at night" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}

// --- the keyboard -------------------------------------------------------------------------------------------------------

const LATIN_ROWS: OnScreenKey[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((value) => ({ value })),
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((value) => ({ value })),
  [{ value: "z" }, { value: "x" }, { value: "c" }, { value: "v" }, { value: "b" }, { value: "n" }, { value: "m" }, { value: "ñ", name: "eñe" }],
  [{ value: "", kind: "shift", name: "Shift", width: 1.5 }, { value: " ", kind: "space", width: 5 }, { value: "", kind: "backspace", width: 1.5 }],
];

const LATIN_ROWS_SHIFTED: OnScreenKey[][] = LATIN_ROWS.map((row) =>
  row.map((key) => (key.kind ? key : { ...key, value: key.value.toUpperCase(), label: key.value.toUpperCase() })),
);

/** A few Arabic letters, as a host would pass them: the package ships no layout of its own. */
const ARABIC_ROWS: OnScreenKey[][] = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه"].map((value) => ({ value, lang: "ar" })),
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن"].map((value) => ({ value, lang: "ar" })),
  [
    { value: "،", name: "Arabic comma", lang: "ar" },
    { value: " ", kind: "space", width: 4, name: "Space" },
    { value: "", kind: "backspace", width: 1.5 },
    { value: "", kind: "enter", width: 1.5, name: "Enter" },
  ],
];

function Keyboard({ dir, rows, layout }: { dir: "ltr" | "rtl"; rows: OnScreenKey[][]; layout: string }) {
  const { open, toggle, inputProps } = useOnScreenKeyboard({ storageKey: `fui-bench-${layout}`, defaultOpen: true });
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [shifted, setShifted] = useState(false);
  const shownRows = layout === "latin" && shifted ? LATIN_ROWS_SHIFTED : rows;
  return (
    <div style={{ ...stack, inlineSize: dir === "rtl" ? "22rem" : "26rem" }} data-testid={`keyboard-${layout}`}>
      <div style={{ display: "flex", gap: "var(--fui-space-2)", alignItems: "center" }}>
        <input
          aria-label={dir === "rtl" ? "Answer" : "Answer"}
          className="fui-input"
          dir={dir}
          onChange={(event) => setValue(event.target.value)}
          value={value}
          {...inputProps}
          data-testid={`keyboard-field-${layout}`}
          ref={field}
          style={{ flex: 1, minWidth: 0 }}
        />
        <IconButton label={open ? "Hide the keyboard" : "Show the keyboard"} onClick={toggle} size="touch" variant="secondary">
          <KeyboardIcon aria-hidden />
        </IconButton>
      </div>
      {open ? (
        <OnScreenKeyboard
          dir={dir}
          label={layout === "latin" ? "Latin keyboard" : "Arabic keyboard"}
          onKey={(key) => {
            if (key.kind === "shift") setShifted((on) => !on);
          }}
          rows={shownRows}
          target={field}
        />
      ) : null}
      <p style={note} data-testid={`keyboard-value-${layout}`}>
        {value || "Nothing typed yet"}
      </p>
    </div>
  );
}

function Bench() {
  return (
    <Page
      description="The shell pieces of 0.12 in fixed states: the dither canvas fed by a scene and by a picture, the account row of a sidebar, a bar that actions reach from anywhere, a frame whose content scrolls, a title renamed in place, and a keyboard for a script the device lacks."
      title="Shell 0.12"
    >
      <Block title="Dither canvas: a scene the host paints" description="The host draws gradients at the canvas's working resolution; their luminance is dithered onto the ramp, with a single dot drawn after it.">
        <div style={pair}>
          <figure style={{ margin: 0, display: "grid", gap: "var(--fui-space-1)", flex: "1 1 18rem" }} data-testid="dither-paint-page">
            <div style={surface}>
              <DitherCanvas after={paintStar} cell={3} paint={paintSky} ramp={{ dark: SKY_RAMP, light: SKY_RAMP_LIGHT }} />
            </div>
            <figcaption style={note}>On the page's own surface, with a star drawn after the dithering.</figcaption>
          </figure>
          <figure style={{ margin: 0, display: "grid", gap: "var(--fui-space-1)", flex: "1 1 18rem" }} data-testid="dither-paint-card">
            <div style={{ ...surface, background: "var(--card)", ["--fui-dither-bg" as string]: "var(--card)" }}>
              <DitherCanvas cell={3} paint={paintSky} ramp={{ dark: SKY_RAMP, light: SKY_RAMP_LIGHT }} />
            </div>
            <figcaption style={note}>On a card: the first stop of the ramp is the card's surface.</figcaption>
          </figure>
        </div>
      </Block>

      <Block title="Dither canvas: a picture" description="A synthetic landscape: mono through the ramp, the same picture toned into a readable range, each colour channel in five steps, and one that does not load at all.">
        <div style={{ display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))" }}>
          <Picture testId="dither-source-ramp" title="ramp, no tone" />
          <Picture testId="dither-source-toned" tone={{ min: 78, max: 198 }} title="ramp, toned into a readable range" />
          <Picture testId="dither-source-channels" mode="channels" title="channels, five steps" />
          <Picture testId="dither-source-channels-toned" mode="channels" tone={{ desaturate: 0.6 }} title="channels, muted" />
          <Picture fit="contain" testId="dither-source-contain" title="contained" />
          <Picture src="data:image/png;base64,AAAA" testId="dither-source-broken" title="a picture that does not load" />
        </div>
      </Block>

      <Block title="The account row of a sidebar" description="The row, folded to icons, and the plate of the page a person is on. The menu opens above the row.">
        <AccountRows />
      </Block>

      <Block title="The account row in its sidebar" description="One real sidebar, with the row at its foot: the menu holds who you are, your items and the theme.">
        <div data-testid="full-sidebar" style={stage}>
          <FullSidebar />
        </div>
      </Block>

      <Block title="A bar actions reach from anywhere" description="A framed inset: the content scrolls, the bar stays, and a key rendered from inside the content lands in the bar's actions slot. The second bar is drawn at every width.">
        <div style={pair}>
          <div style={{ flex: "1 1 20rem", minWidth: 0 }}>
            <FramedInset action="Search the reports" title="Reports from the northern harbour" visibility="mobile" />
          </div>
          <div style={{ flex: "1 1 20rem", minWidth: 0 }}>
            <FramedInset action="Search the settings" title="Settings" visibility="always" />
          </div>
        </div>
      </Block>

      <Block title="A title renamed where it is read" description="Reading, with a pencil, in the field, and with a commit that has not settled. The last one lives in a sidebar row that is a link.">
        <RenameExamples />
      </Block>

      <Block title="A keyboard for a script the device lacks" description="The layout is the host's data. One tab stop, the arrow keys move by what is on screen, a press leaves the caret in the field, and backspace repeats while it is held.">
        <div style={pair}>
          <Keyboard dir="ltr" layout="latin" rows={LATIN_ROWS} />
          <Frame dir="rtl" width={420}>
            <Keyboard dir="rtl" layout="arabic" rows={ARABIC_ROWS} />
          </Frame>
        </div>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };

// --- the rename pieces with their outcomes on show, for the behaviour tests -------------------------------------------------

function RenameSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="secondary">
        Rename inside a sheet
      </Button>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Rename the chat</SheetTitle>
            <SheetDescription>A title renamed in a sheet stays in the sheet.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <EditableText defaultEditing label="Rename chat" onCommit={() => undefined} value="Harbour at night" />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}

function RenameStates() {
  const [value, setValue] = useState("Harbour at night");
  const [calls, setCalls] = useState(0);
  const [errors, setErrors] = useState(0);
  return (
    <Page description="A title renamed in place: what it commits, what it refuses, and a rename that keeps its sheet open." title="Shell 0.12: a title renamed">
      <div style={stack} data-testid="rename-states">
        <p data-testid="rename-state" style={note}>
          Commits: {calls}. Refusals: {errors}. Value: {value}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)", maxInlineSize: "22rem" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", fontSize: "var(--fui-text-sm)", maxInlineSize: "22rem" }}>
          <EditableText
            label="Rename the refused chat"
            onCommit={() => Promise.reject(new Error("the server said no"))}
            onError={() => setErrors((count) => count + 1)}
            showTrigger
            triggerLabel="Rename the refused chat"
            value="Refused title"
          />
        </div>
        <RenameSheet />
      </div>
    </Page>
  );
}

export const RenameBehaviour: Story = { render: () => <RenameStates /> };
