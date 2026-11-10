"use client";

// Previews for the rest of 0.12: the tokens every floating surface reads, a viewport that zooms, a panel for a file being
// dragged, a title renamed in place, a keyboard for another script, one pressed key, the key of a chart, the parts of a
// field, and the app a sidebar makes. Synthetic data only, fixed values, and nothing runs until a person presses something.
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Button,
  ChartLegend,
  ColorRamp,
  DropOverlay,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EditableText,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  LegendItem,
  OnScreenKeyboard,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sidebar,
  SidebarAccount,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
  Swatch,
  Toggle,
  useIsMobile,
  useOnScreenKeyboard,
  ZoomPan,
  type OnScreenKey,
} from "@fabrials/ui";
import { Frame } from "@/components/demo-frame";

const column = {
  display: "grid",
  gap: "var(--fui-space-3)",
  inlineSize: "100%",
} as const;
const rows = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--fui-space-2)",
} as const;
const note = { margin: 0, color: "var(--muted-foreground)" } as const;
const mono = {
  margin: 0,
  fontFamily: "var(--fui-font-label)",
  fontSize: "var(--fui-text-label)",
  color: "var(--muted-foreground)",
} as const;
const plate = {
  display: "grid",
  gap: "var(--fui-space-3)",
  padding: "var(--fui-space-4)",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  background: "var(--card)",
} as const;

/* ---------------------------------------------------------------- the surface of what floats */

// What a product that frosts its overlays sets, once per theme. The numbers are a preview's, not a rule.
const frosted = {
  "--fui-overlay-surface": "color-mix(in oklab, var(--popover) 88%, transparent)",
  "--fui-overlay-border": "color-mix(in oklab, var(--foreground) 16%, transparent)",
  "--fui-overlay-shadow": "0 18px 44px -20px oklch(0.45 0.09 255 / 35%)",
  "--fui-overlay-filter": "blur(20px) saturate(1.4)",
  "--fui-dialog-shadow": "var(--fui-overlay-shadow)",
} as CSSProperties;

function OverlaySample({ title }: { title: string }) {
  return (
    <div style={{ ...plate, gap: "var(--fui-space-3)" }}>
      <p style={mono}>{title}</p>
      <div style={rows}>
        <Popover>
          <PopoverTrigger render={<Button size="sm" variant="outline" />}>Popover</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>This week</PopoverTitle>
            </PopoverHeader>
            <p style={{ ...note, marginBlockEnd: "var(--fui-space-3)" }}>Four sessions and one shared key.</p>
            <PopoverClose />
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Session</DropdownMenuLabel>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>End session</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <HoverCard>
          <HoverCardTrigger render={<Button size="sm" variant="outline" />}>Hover card</HoverCardTrigger>
          <HoverCardContent>
            <p style={{ margin: 0 }}>A preview of the key that shared this session.</p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div
        style={{
          background: "var(--fui-overlay-surface)",
          backdropFilter: "var(--fui-overlay-filter)",
          border: "1px solid var(--fui-overlay-border)",
          borderRadius: "var(--fui-radius-md)",
          boxShadow: "var(--fui-overlay-shadow)",
          display: "grid",
          gap: "var(--fui-space-1)",
          padding: "var(--fui-space-3)",
        }}
      >
        <p style={mono}>the surface these three open onto</p>
        <p style={note}>A row about a session, on the panel.</p>
      </div>
    </div>
  );
}

function OverlayTokensDemo() {
  return (
    <Frame width="wide">
      <div
        style={{
          display: "grid",
          gap: "var(--fui-space-3)",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        }}
      >
        <OverlaySample title="The defaults of 0.11" />
        <div style={frosted}>
          <OverlaySample title="Four tokens set on the wrapper" />
        </div>
      </div>
      <p style={note}>
        A host sets the four tokens once per theme and can delete its rules over the menu, the popover and the hover card. Dialogs
        and toasts read them too unless they set their own.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a viewport that zooms */

const WEEK = [18, 26, 21, 34, 29, 12, 31, 24, 38, 27, 19, 33];

function ZoomPlan() {
  return (
    <svg aria-hidden="true" height={180} viewBox="0 0 600 180" width={600}>
      <line stroke="var(--border)" x1="0" x2="600" y1="179" y2="179" />
      {WEEK.map((value, index) => (
        <rect fill="var(--brand)" height={value * 4} key={index} width={30} x={14 + index * 48} y={179 - value * 4} />
      ))}
    </svg>
  );
}

function ZoomPanDemo() {
  return (
    <Frame width="wide">
      <div
        style={{
          blockSize: "18rem",
          border: "1px solid var(--border)",
          borderRadius: "var(--fui-radius-lg)",
          overflow: "hidden",
        }}
      >
        <ZoomPan label="Sessions per day">
          <ZoomPlan />
        </ZoomPan>
      </div>
      <p style={note}>
        Ctrl with the wheel, or a pinch, zooms around the pointer; a drag moves the plan; the keys under it work from the
        keyboard, and Fit brings the whole of it back.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- files being dragged */

const DROPPED = ["harbour.png", "orchard.png", "quarry.png"];

function DropOverlayDemo() {
  const [mode, setMode] = useState<"active" | "refused" | "off">("active");
  const [dropped, setDropped] = useState<string[]>(DROPPED);
  return (
    <Frame width="wide">
      <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
        <div style={{ position: "relative" }}>
          <DropOverlay
            accept="image/png,image/jpeg"
            active={mode === "off" ? false : mode === "active"}
            description="PNG or JPEG, up to 8 MB each."
            label="Drop files to attach"
            onDrop={(files) => setDropped([...dropped, ...files.map((file) => file.name)])}
            refused={mode === "refused"}
          >
            <div style={{ ...plate, blockSize: "9rem" }} />
          </DropOverlay>
        </div>
        <div style={{ ...plate, alignContent: "start", gap: "var(--fui-space-1)" }}>
          <p style={mono}>Attached</p>
          {dropped.map((name) => (
            <p key={name} style={{ ...mono, color: "var(--foreground)" }}>
              {name}
            </p>
          ))}
        </div>
        <div style={rows}>
          <Button onClick={() => setMode("active")} size="sm" variant={mode === "active" ? "secondary" : "outline"}>
            Files that fit
          </Button>
          <Button onClick={() => setMode("refused")} size="sm" variant={mode === "refused" ? "secondary" : "outline"}>
            A file that does not
          </Button>
          <Button onClick={() => setMode("off")} size="sm" variant={mode === "off" ? "secondary" : "outline"}>
            Nothing dragged
          </Button>
        </div>
        <p style={note}>
          Here the panel is shown by the host instead of by a drag, which a test or a story cannot make. Its own area is the box;
          a panel with scope=&quot;page&quot; covers the window.
        </p>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a title renamed where it is read */

function EditableTextDemo() {
  const [title, setTitle] = useState("Harbour notes");
  const [said, setSaid] = useState("Nothing renamed yet.");
  return (
    <Frame width="form">
      <div
        style={{
          ...plate,
          gridTemplateColumns: "1fr",
          gap: "var(--fui-space-2)",
        }}
      >
        <p style={mono}>A title in a row, with its pencil</p>
        <div style={rows}>
          <span style={{ fontWeight: 500 }}>
            <EditableText
              label="Rename chat"
              onCommit={(next) => {
                setTitle(next);
                setSaid(`Saved as “${next}”.`);
              }}
              showTrigger
              value={title}
            />
          </span>
        </div>
        <p style={mono}>A text that opens on a double click, with no pencil</p>
        <p style={{ margin: 0 }}>
          <EditableText onCommit={setTitle} startOn="doubleClick" value={`${title} (draft)`} />
        </p>
        <p style={note} role="status">
          {said}
        </p>
      </div>
      <p style={note}>
        Enter saves, Escape cancels, leaving the field saves, and a title that came back empty or unchanged calls nobody. The
        focus returns to the pencil, or to the text.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a keyboard for another script */

const ARABIC: OnScreenKey[][] = [
  [
    { value: "ا", name: "alif" },
    { value: "ب", name: "ba" },
    { value: "ت", name: "ta" },
    { value: "ث", name: "tha" },
    { value: "ج", name: "jim" },
  ],
  [
    { value: "ح", name: "ha" },
    { value: "خ", name: "kha" },
    { value: "د", name: "dal" },
    { value: "ذ", name: "dhal" },
    { value: "ر", name: "ra" },
  ],
  [
    { value: "س", name: "sin" },
    { value: "ش", name: "shin" },
    { value: "ص", name: "sad" },
    { value: "ض", name: "dad" },
    { kind: "backspace", name: "backspace", value: "" },
  ],
  [
    { kind: "space", width: 4, value: " ", name: "space" },
    { value: "،", name: "Arabic comma" },
  ],
];

function OnScreenKeyboardDemo() {
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const keyboard = useOnScreenKeyboard({
    defaultOpen: true,
    storageKey: "fui-demo-keyboard",
  });
  return (
    <Frame width="form">
      <div style={column}>
        <label htmlFor="arabic-field">A word, typed with the keyboard below</label>
        <Input
          {...keyboard.inputProps}
          dir="rtl"
          id="arabic-field"
          lang="ar"
          onChange={(event) => setValue(event.currentTarget.value)}
          ref={field}
          value={value}
        />
        <div style={rows}>
          <span style={note}>{value ? `The field holds ${value.length} characters.` : "Nothing typed yet."}</span>
          <Button onClick={keyboard.toggle} size="sm" variant="outline">
            {keyboard.open ? "Hide the keyboard" : "Show the keyboard"}
          </Button>
        </div>
        {keyboard.open ? (
          <OnScreenKeyboard
            dir="rtl"
            label="Arabic keyboard"
            labels={{ backspace: "Backspace", space: "Space" }}
            rows={ARABIC}
            target={field}
          />
        ) : null}
      </div>
      <p style={note}>
        The layout is the host&apos;s data: the package ships no language. A press never takes the focus from the field, so the
        caret stays where the person left it, and Backspace deletes a whole letter, repeated while it is held.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- one key that stays on */

function ToggleDemo() {
  const [saved, setSaved] = useState(false);
  const [wrapping, setWrapping] = useState(true);
  return (
    <Frame width="form">
      <div style={column}>
        <div style={rows}>
          <Toggle aria-label="Bookmark this key" onPressedChange={setSaved} pressed={saved}>
            Bookmark
          </Toggle>
          <Toggle onPressedChange={setWrapping} pressed={wrapping} variant="outline">
            Wrap lines
          </Toggle>
          <Toggle pressed size="lg" variant="outline">
            Pinned
          </Toggle>
        </div>
        <p style={note} role="status">
          {saved ? "Bookmarked." : "Not bookmarked."} Lines {wrapping ? "wrap" : "do not wrap"}. The third key is pressed and
          cannot be released here, so its look can be read.
        </p>
        <div style={rows}>
          <Toggle pressed size="sm">
            Small
          </Toggle>
          <Toggle pressed>Default</Toggle>
          <Toggle pressed size="lg">
            Large, 44 px
          </Toggle>
          <Toggle size="sm" variant="outline">
            Off
          </Toggle>
        </div>
      </div>
      <p style={note}>
        One tab stop, Space or Enter toggles it, and a screen reader hears that it is pressed. Inside a group, use ToggleGroupItem
        instead.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the key of a chart */

function ChartLegendDemo() {
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const series = [
    {
      id: "requests",
      label: "Requests",
      color: "var(--chart-1)",
      pattern: "solid" as const,
    },
    {
      id: "sessions",
      label: "Sessions",
      color: "var(--chart-2)",
      pattern: "dashed" as const,
    },
    {
      id: "keys",
      label: "Keys",
      color: "var(--chart-3)",
      pattern: "dither" as const,
    },
  ];
  return (
    <Frame width="wide">
      <div style={{ ...plate, gap: "var(--fui-space-4)" }}>
        <ChartLegend aria-label="Series">
          {series.map((one) => (
            <LegendItem
              color={one.color}
              hidden={hidden.includes(one.id)}
              key={one.id}
              label={one.label}
              onOnly={() => setHidden(series.filter((other) => other.id !== one.id).map((other) => other.id))}
              onToggle={() => setHidden(hidden.includes(one.id) ? hidden.filter((id) => id !== one.id) : [...hidden, one.id])}
              pattern={one.pattern}
            />
          ))}
        </ChartLegend>
        <ColorRamp
          label="Sessions per day"
          marks={[
            { value: 0, label: "none" },
            { value: 60, label: "busy" },
          ]}
          max={100}
          min={0}
          stops={["var(--muted)", "var(--chart-1)", "var(--brand-ink)"]}
        />
        <div style={rows}>
          <span style={mono}>One key:</span>
          <Swatch color="var(--chart-1)" />
          <Swatch color="var(--chart-2)" pattern="dashed" />
          <Swatch color="var(--chart-3)" pattern="dither" />
        </div>
      </div>
      <p style={note}>
        The three keys and the ramp are the parts a chart&apos;s own legend is made of, so a legend beside a visual of the
        host&apos;s own matches it. The ramp is painted in cells on purpose: a colour that encodes a value is data.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- a field, one piece at a time */

function FieldPartsDemo() {
  return (
    <Frame width="form">
      <Field>
        <FieldLabel required htmlFor="key-name">
          Key name
        </FieldLabel>
        <FieldContent>
          <Input aria-describedby="key-name-note key-name-error" aria-invalid defaultValue="Harbour" id="key-name" />
        </FieldContent>
        <FieldDescription id="key-name-note">Shown in the panel and in every request&apos;s usage.</FieldDescription>
        <FieldError id="key-name-error">A key with this name already exists.</FieldError>
      </Field>
      <FieldSeparator>Or keep it private</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="key-scope" optional>
          Scope
        </FieldLabel>
        <FieldContent>
          <Input defaultValue="chat, models" id="key-scope" />
        </FieldContent>
        <FieldDescription>Optional. Without one the key may call everything the account may.</FieldDescription>
      </Field>
      <p style={note}>
        The same plate the render-prop Field draws, with the ids read from the field they sit in: a control is described by the
        parts that are really there.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the app a sidebar makes */

const CHATS = ["Harbour notes", "Orchard survey", "Quarry ledger"];

function SidebarAccountDemo() {
  const [current, setCurrent] = useState(CHATS[0]);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const mobile = useIsMobile();
  if (mobile)
    return (
      <Frame width="wide">
        <div
          style={{
            blockSize: "13rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--fui-radius-lg)",
            overflow: "clip",
          }}
        >
          <SidebarProvider style={{ blockSize: "100%", minBlockSize: 0 }}>
            <SidebarInset style={{ blockSize: "100%", minBlockSize: 0 }}>
              <SidebarInsetHeader title={current} />
              <SidebarInsetContent style={{ padding: "var(--fui-space-4)" }}>
                <p style={{ margin: 0 }}>{current}</p>
                <p style={{ ...note, marginBlockStart: "var(--fui-space-2)" }}>
                  On a phone the sidebar is the sheet, shut until the key at the start of this bar is pressed; the account row is
                  inside it.
                </p>
              </SidebarInsetContent>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </Frame>
    );
  return (
    <Frame width="wide">
      <div
        style={{
          blockSize: "28rem",
          border: "1px solid var(--border)",
          borderRadius: "var(--fui-radius-lg)",
          overflow: "clip",
          background: "var(--background)",
        }}
      >
        <SidebarProvider style={{ blockSize: "100%", minBlockSize: 0 }}>
          <Sidebar collapsible="none" side="start">
            <SidebarHeader>
              <SidebarSearch aria-label="Search chats" placeholder="Search chats" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>This week</SidebarGroupLabel>
                <SidebarMenu>
                  {CHATS.map((chat) => (
                    <SidebarMenuItem key={chat}>
                      <SidebarMenuButton isActive={chat === current} onClick={() => setCurrent(chat)}>
                        {chat}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarAccount email="ada@example.com" name="Ada Rivera" onThemeChange={setTheme} theme={theme}>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </SidebarAccount>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset style={{ blockSize: "100%", minBlockSize: 0 }}>
            <SidebarInsetHeader title={current} visibility="always">
              <SidebarInsetHeaderActions>
                <Button size="sm" variant="ghost">
                  Share
                </Button>
              </SidebarInsetHeaderActions>
            </SidebarInsetHeader>
            <SidebarInsetContent style={{ padding: "var(--fui-space-4)" }}>
              <p style={{ margin: 0 }}>{current}</p>
              <p style={{ ...note, marginBlockStart: "var(--fui-space-2)" }}>
                Three keys share this session. The theme chosen in the account menu is {theme}.
              </p>
            </SidebarInsetContent>
          </SidebarInset>
        </SidebarProvider>
      </div>
      <p style={note}>
        At a phone width the sidebar becomes the sheet and the bar at the top of the page is this one, with its close key; here it
        is drawn at every width so the preview shows it.
      </p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the map */

export const demos012b: Record<string, () => ReactNode> = {
  "overlay-tokens": () => <OverlayTokensDemo />,
  "zoom-pan": () => <ZoomPanDemo />,
  "drop-overlay": () => <DropOverlayDemo />,
  "editable-text": () => <EditableTextDemo />,
  "on-screen-keyboard": () => <OnScreenKeyboardDemo />,
  toggle: () => <ToggleDemo />,
  "chart-legend": () => <ChartLegendDemo />,
  "field-parts": () => <FieldPartsDemo />,
  "sidebar-account": () => <SidebarAccountDemo />,
};
