// Internal to IconButton and ToolbarButton (not exported from the package index).
import type { ReactNode } from "react";
import { Kbd, KbdGroup } from "./kbd";
import { TooltipContent } from "./menu";

const KEY_NAMES: Record<string, string> = {
  "⌘": "Meta",
  "⌥": "Alt",
  "⇧": "Shift",
  "⌃": "Control",
  Ctrl: "Control",
  Cmd: "Meta",
  Esc: "Escape",
  "↵": "Enter",
  Del: "Delete",
};

/** The `aria-keyshortcuts` value for keys as they are printed on a Kbd: "⌘" is "Meta", "Esc" is "Escape". */
export function keyShortcutsValue(shortcut: string | readonly string[] | undefined) {
  if (!shortcut) return undefined;
  const keys = typeof shortcut === "string" ? [shortcut] : shortcut;
  return keys.map((key) => KEY_NAMES[key] ?? key).join("+");
}

/** The tooltip body of an icon control: its name and, when it has one, the shortcut as flat keys. */
export function IconTooltipContent({ label, shortcut }: { label: ReactNode; shortcut?: string | readonly string[] }) {
  const keys = typeof shortcut === "string" ? [shortcut] : shortcut;
  return (
    <TooltipContent>
      {label}
      {keys?.length ? (
        <KbdGroup className="fui-icon-button-keys">
          {keys.map((key, index) => (
            <Kbd key={`${key}-${index}`}>{key}</Kbd>
          ))}
        </KbdGroup>
      ) : null}
    </TooltipContent>
  );
}
