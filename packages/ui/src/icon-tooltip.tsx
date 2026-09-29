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

/**
 * The keys of a control's shortcut. A string or an array is pressed together ("⌘", "K"); `{ keys, sequence: true }` is
 * pressed one after the other ("g" then "i"), which `aria-keyshortcuts` cannot express, so none is emitted for it.
 */
export type ControlShortcut =
  | string
  | readonly string[]
  | { keys: readonly string[]; sequence?: boolean; separator?: ReactNode };

function shortcutParts(shortcut: ControlShortcut | undefined) {
  if (!shortcut) return null;
  if (typeof shortcut === "string") return { keys: [shortcut], sequence: false, separator: undefined };
  if (Array.isArray(shortcut)) return { keys: shortcut as readonly string[], sequence: false, separator: undefined };
  const object = shortcut as { keys: readonly string[]; sequence?: boolean; separator?: ReactNode };
  return { keys: object.keys, sequence: Boolean(object.sequence), separator: object.separator };
}

/** The `aria-keyshortcuts` value for keys as they are printed on a Kbd: "⌘" is "Meta", "Esc" is "Escape". Undefined for a sequence. */
export function keyShortcutsValue(shortcut: ControlShortcut | undefined) {
  const parts = shortcutParts(shortcut);
  if (!parts || parts.sequence || parts.keys.length === 0) return undefined;
  return parts.keys.map((key) => KEY_NAMES[key] ?? key).join("+");
}

/** The tooltip body of an icon control: its name and, when it has one, the shortcut as flat keys. */
export function IconTooltipContent({ label, shortcut }: { label: ReactNode; shortcut?: ControlShortcut }) {
  const parts = shortcutParts(shortcut);
  const keys = parts?.keys;
  return (
    <TooltipContent>
      {label}
      {keys?.length ? (
        <KbdGroup className="fui-icon-button-keys" sequence={parts?.sequence} separator={parts?.separator ?? "then"}>
          {keys.map((key, index) => (
            <Kbd key={`${key}-${index}`}>{key}</Kbd>
          ))}
        </KbdGroup>
      ) : null}
    </TooltipContent>
  );
}
