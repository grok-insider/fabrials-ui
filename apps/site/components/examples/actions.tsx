"use client";

import { useState } from "react";
import { Copy, Download, Plus, RefreshCw, Search, Settings2, Trash2 } from "lucide-react";
import {
  Button,
  ButtonGroup,
  IconButton,
  Kbd,
  KbdGroup,
  ThemeSwitcher,
  ToggleGroup,
  ToggleGroupItem,
  type ThemePreference,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" } as const;
const column = { display: "grid", gap: "var(--fui-space-4)", justifyItems: "start" } as const;

function SavingButton() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      loading={saving}
      onClick={() => {
        setSaving(true);
        window.setTimeout(() => setSaving(false), 1600);
      }}
    >
      {saving ? "Saving" : "Save changes"}
    </Button>
  );
}

function Range() {
  const [range, setRange] = useState(["7d"]);
  return (
    <ToggleGroup aria-label="Range" onValueChange={setRange} value={range}>
      <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
      <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
      <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
    </ToggleGroup>
  );
}

function Theme() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  return <ThemeSwitcher onValueChange={setTheme} value={theme} />;
}

export const buttonExamples: ExampleSet = {
  examples: [
    {
      id: "variants",
      title: "One primary, quiet alternatives",
      description:
        "`variant` sets the weight of an action. `default` is ink, the one primary action of a task; `accent` (Stormlight) only when one action must stand out on a page; `outline` and `secondary` are the alternatives; `ghost` sits in toolbars; `destructive` removes; `link` reads as a link.",
      code: `<Button>Add account</Button>
<Button variant="accent">Connect to Fabrials</Button>
<Button variant="outline">View details</Button>
<Button variant="secondary">Export</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="destructive">Revoke key</Button>
<Button variant="link">Read the guide</Button>`,
      render: () => (
        <div style={row}>
          <Button>Add account</Button>
          <Button variant="accent">Connect to Fabrials</Button>
          <Button variant="outline">View details</Button>
          <Button variant="secondary">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Revoke key</Button>
          <Button variant="link">Read the guide</Button>
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      description:
        "`size` is `xs` (28 px), `sm` (32 px), `default` (40 px) or `lg` (44 px). Every size grows to 44 px on touch screens, so pick by the density of the surface, not by the importance of the action.",
      code: `<Button size="xs">Extra small</Button>
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>`,
      render: () => (
        <div style={row}>
          <Button size="xs" variant="outline">
            Extra small
          </Button>
          <Button size="sm" variant="outline">
            Small
          </Button>
          <Button variant="outline">Default</Button>
          <Button size="lg" variant="outline">
            Large
          </Button>
        </div>
      ),
    },
    {
      id: "icons",
      title: "With an icon",
      description:
        "Put the icon before the label, as a child. It takes the button's ink and size; mark it `aria-hidden`, since the label already names the action.",
      code: `<Button>
  <Plus aria-hidden /> Add account
</Button>
<Button variant="outline">
  <Download aria-hidden /> Export CSV
</Button>`,
      render: () => (
        <div style={row}>
          <Button>
            <Plus aria-hidden /> Add account
          </Button>
          <Button variant="outline">
            <Download aria-hidden /> Export CSV
          </Button>
          <Button variant="ghost">
            <RefreshCw aria-hidden /> Refresh
          </Button>
        </div>
      ),
    },
    {
      id: "loading",
      title: "Busy and unavailable",
      description:
        "`loading` swaps in the busy mark, sets `aria-busy` and blocks repeated presses while keeping the button in the tab order; change the label too (\"Saving\"). `disabled` is for an action that cannot happen yet: say why next to it.",
      code: `<Button loading={saving} onClick={save}>
  {saving ? "Saving" : "Save changes"}
</Button>
<Button disabled>Publish</Button>`,
      render: () => (
        <div style={row}>
          <SavingButton />
          <Button disabled variant="outline">
            Publish
          </Button>
        </div>
      ),
    },
    {
      id: "render",
      title: "A link that looks like a button",
      description:
        "`render` swaps the element while keeping the look: a navigation to another page is an anchor, so it opens in a new tab and shows its address. `nativeButton={false}` tells Base UI it is not a button.",
      code: `<Button render={<a href="/docs/installation" />} nativeButton={false} variant="outline">
  Install
</Button>`,
      render: () => (
        <Button nativeButton={false} render={<a href="#example-render" />} variant="outline">
          Install
        </Button>
      ),
    },
  ],
};

export const iconButtonExamples: ExampleSet = {
  examples: [
    {
      id: "label",
      title: "Always named",
      description:
        "An icon is not a name: `label` is required. It becomes the button's accessible name and the tooltip that appears on hover and on keyboard focus.",
      code: `<IconButton label="Search">
  <Search aria-hidden />
</IconButton>`,
      render: () => (
        <div style={row}>
          <IconButton label="Search">
            <Search aria-hidden />
          </IconButton>
          <IconButton label="Copy the key" variant="outline">
            <Copy aria-hidden />
          </IconButton>
          <IconButton label="Remove" variant="destructive">
            <Trash2 aria-hidden />
          </IconButton>
        </div>
      ),
    },
    {
      id: "shortcut",
      title: "With its shortcut",
      description:
        "`shortcut` shows the keys in the tooltip and exposes them as `aria-keyshortcuts`. A sequence pressed one key after another is `{ keys, sequence: true }`.",
      code: `<IconButton label="Search" shortcut={["⌘", "K"]}>
  <Search aria-hidden />
</IconButton>
<IconButton label="Settings" shortcut={{ keys: ["g", "s"], sequence: true }}>
  <Settings2 aria-hidden />
</IconButton>`,
      render: () => (
        <div style={row}>
          <IconButton label="Search" shortcut={["⌘", "K"]}>
            <Search aria-hidden />
          </IconButton>
          <IconButton label="Settings" shortcut={{ keys: ["g", "s"], sequence: true }}>
            <Settings2 aria-hidden />
          </IconButton>
        </div>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "`size` is `icon-xs`, `icon-sm`, `icon` or `icon-lg` (44 px, the default). They paint smaller on a fine pointer and keep a 44 px target on touch.",
      code: `<IconButton label="Refresh" size="icon-xs">…</IconButton>
<IconButton label="Refresh" size="icon-sm">…</IconButton>
<IconButton label="Refresh" size="icon">…</IconButton>
<IconButton label="Refresh">…</IconButton>`,
      render: () => (
        <div style={row}>
          {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size) => (
            <IconButton key={size} label={`Refresh, ${size}`} size={size} variant="outline">
              <RefreshCw aria-hidden />
            </IconButton>
          ))}
        </div>
      ),
    },
  ],
};

export const toggleGroupExamples: ExampleSet = {
  examples: [
    {
      id: "single",
      title: "One choice",
      description:
        "A segmented choice: the group sits in a well and the chosen segment is a raised plate; when the choice changes, the plate slides to it, its leading edge first. `value` is an array, also for a single choice.",
      code: `const [range, setRange] = useState(["7d"]);

<ToggleGroup aria-label="Range" value={range} onValueChange={setRange}>
  <ToggleGroupItem value="24h">24 h</ToggleGroupItem>
  <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
  <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
</ToggleGroup>`,
      render: () => <Range />,
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "`size` is `sm` (26 px), `default` (34 px) or `lg` (44 px on every pointer). The group is as wide as its segments.",
      code: `<ToggleGroup size="sm" defaultValue={["list"]}>…</ToggleGroup>
<ToggleGroup size="lg" defaultValue={["list"]}>…</ToggleGroup>`,
      render: () => (
        <div style={column}>
          {(["sm", "default", "lg"] as const).map((size) => (
            <ToggleGroup aria-label={`View, ${size}`} defaultValue={["list"]} key={size} size={size}>
              <ToggleGroupItem value="list">List</ToggleGroupItem>
              <ToggleGroupItem value="board">Board</ToggleGroupItem>
              <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
            </ToggleGroup>
          ))}
        </div>
      ),
    },
    {
      id: "theme",
      title: "The theme choice",
      description: "`ThemeSwitcher` is the same control with the three theme icons. It only reports the choice: the host stores it and sets `.dark` on the root.",
      code: `<ThemeSwitcher value={theme} onValueChange={setTheme} />`,
      render: () => <Theme />,
    },
    {
      id: "group",
      title: "Buttons side by side",
      description: "`ButtonGroup` joins related actions into one shape; unlike a toggle group nothing stays pressed.",
      code: `<ButtonGroup aria-label="Refresh">
  <Button variant="outline"><RefreshCw aria-hidden /> Refresh</Button>
  <Button variant="outline">Every 5 min</Button>
</ButtonGroup>`,
      render: () => (
        <ButtonGroup aria-label="Refresh">
          <Button variant="outline">
            <RefreshCw aria-hidden /> Refresh
          </Button>
          <Button variant="outline">Every 5 min</Button>
        </ButtonGroup>
      ),
    },
  ],
};

export const kbdExamples: ExampleSet = {
  examples: [
    {
      id: "keys",
      title: "Keys and combinations",
      description:
        "`Kbd` is one key as a keycap in mono. `KbdGroup` holds a combination; `<Kbd mod />` is ⌘ on Apple systems and Ctrl elsewhere, so one line serves both.",
      code: `<KbdGroup>
  <Kbd mod />
  <Kbd>K</Kbd>
</KbdGroup>`,
      render: () => (
        <p style={{ margin: 0 }}>
          Open the palette with{" "}
          <KbdGroup>
            <Kbd mod />
            <Kbd>K</Kbd>
          </KbdGroup>
        </p>
      ),
    },
    {
      id: "sequence",
      title: "One after the other",
      description: "`sequence` puts \"then\" between the keys, for shortcuts pressed in turn.",
      code: `<KbdGroup sequence>
  <Kbd>g</Kbd>
  <Kbd>i</Kbd>
</KbdGroup>`,
      render: () => (
        <p style={{ margin: 0 }}>
          Go to the inbox with{" "}
          <KbdGroup sequence>
            <Kbd>g</Kbd>
            <Kbd>i</Kbd>
          </KbdGroup>
        </p>
      ),
    },
  ],
};
