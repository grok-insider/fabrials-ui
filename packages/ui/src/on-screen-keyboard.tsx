"use client";
// Origin: Radiant's Arabic on-screen keyboard and the duty toggle of its text field (the behaviour only). 0.12.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Delete, CornerDownLeft } from "lucide-react";
import { backspaceAtCaret, insertAtCaret, type CaretEdit } from "./caret";
import { neighbourKey, type KeyBox, type KeyDirection } from "./key-nav";
import { classes } from "./shared";

type Editable = HTMLInputElement | HTMLTextAreaElement;

export type OnScreenKeyKind = "char" | "backspace" | "space" | "enter" | "shift" | "custom";

/**
 * One key of the layout. The layout is the host's data: the package ships no language of its own. `shift` and `custom` are
 * the host's own behaviour (`onKey`): they never write into the field.
 */
export type OnScreenKey = {
  /** What pressing it puts in the field. */
  value: string;
  /** What it shows, when that is not its value (a mark on a dotted circle, an icon). */
  label?: ReactNode;
  /** What a screen reader says ("shadda", "Arabic comma"). The value when not given. */
  name?: string;
  /** How many key widths it takes (1 by default; a space bar takes 4 or more). */
  width?: number;
  kind?: OnScreenKeyKind;
  /** The language of the glyph, for a screen reader's voice. */
  lang?: string;
  /** A stable identity, for a layout that changes. */
  id?: string;
};

export type OnScreenKeyboardLabels = {
  /** The words of the keys that are not characters. */
  backspace?: string;
  space?: string;
  enter?: string;
  /** The line a screen reader hears when it arrives on the keyboard. Leave it empty for none. */
  usage?: string;
};

const defaultLabels = {
  backspace: "Backspace",
  space: "Space",
  enter: "Enter",
  usage: "Use the arrow keys to move between the keys, and Enter or Space to type the one you are on.",
};

export type OnScreenKeyboardProps = Omit<ComponentProps<"div">, "children" | "onKeyDown" | "onFocus"> & {
  /** The rows of the layout, in reading order: the first key of a row is at the start of the line. */
  rows: OnScreenKey[][];
  /** The field the keys type into: the caret stays where it was, and the value arrives at React. */
  target?: RefObject<Editable | null>;
  /** Every key pressed, before the field is written to (the host's own shift, its layers). */
  onKey?: (key: OnScreenKey, at: { row: number; column: number }) => void;
  /** The direction of the layout: a script written right to left has its first key at the right. */
  dir?: "ltr" | "rtl";
  /** The keyboard's name ("Arabic keyboard"). */
  label?: string;
  labels?: OnScreenKeyboardLabels;
  disabled?: boolean;
};

const HOLD_DELAY_MS = 450;
const HOLD_REPEAT_MS = 55;

/** Writes a value React did not: the native setter, then the event React listens for. */
function writeValue(node: Editable, value: string) {
  const prototype = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(node, value);
  else node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
}

function editField(node: Editable, change: (value: string, start: number | null, end: number | null) => CaretEdit) {
  const next = change(node.value, node.selectionStart, node.selectionEnd);
  if (next.value !== node.value) writeValue(node, next.value);
  // The controlled value lands on React's next commit: the caret goes back after it.
  requestAnimationFrame(() => {
    try {
      node.setSelectionRange(next.caret, next.caret);
    } catch {
      // The field went away between the key and the frame.
    }
  });
}

function keyText(key: OnScreenKey): string {
  if (key.kind === "space") return key.value || " ";
  if (key.kind === "enter") return key.value || "\n";
  return key.value;
}

/**
 * A keyboard for a script the device's own keyboard lacks, laid out as the host's data. It is one tab stop: the arrow keys
 * move between the keys by where they are on screen, Home and End within a row, and Enter or Space types the key in focus.
 * A press with a finger or the pointer never takes the focus from the field, so the caret stays where the person left it;
 * backspace deletes a whole cluster and repeats while it is held.
 */
export function OnScreenKeyboard({
  rows,
  target,
  onKey,
  dir = "ltr",
  label,
  labels,
  disabled = false,
  className,
  ...props
}: OnScreenKeyboardProps) {
  const words = { ...defaultLabels, ...labels };
  const usageId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  let cursor = 0;
  const keys = rows.map((row, rowIndex) => row.map((key, column) => ({ key, row: rowIndex, column, index: cursor++ })));
  const count = cursor;
  const current = Math.min(active, Math.max(0, count - 1));

  const latest = useRef({ keys, onKey, target });
  useEffect(() => {
    latest.current = { keys, onKey, target };
  });

  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeated = useRef(false);
  const stopHold = useCallback(() => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  }, []);
  useEffect(() => stopHold, [stopHold]);
  useEffect(() => {
    if (disabled) stopHold();
  }, [disabled, stopHold]);

  const press = useCallback(
    (index: number) => {
      const { keys: list, onKey: callback, target: field } = latest.current;
      const entry = list.flat().find((item) => item.index === index);
      if (!entry) return;
      const { key } = entry;
      callback?.(key, { row: entry.row, column: entry.column });
      const kind = key.kind ?? "char";
      if (kind === "shift" || kind === "custom") return;
      const node = field?.current;
      if (!node) return;
      if (kind === "backspace") editField(node, backspaceAtCaret);
      else editField(node, (value, start, end) => insertAtCaret(value, start, end, keyText(key)));
    },
    [],
  );

  const startHold = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
    repeated.current = false;
    stopHold();
    const index = Number(event.currentTarget.dataset.keyIndex);
    const tick = () => {
      repeated.current = true;
      press(index);
      hold.current = setTimeout(tick, HOLD_REPEAT_MS);
    };
    hold.current = setTimeout(tick, HOLD_DELAY_MS);
  };

  const onBackspace = (event: MouseEvent<HTMLButtonElement>) => {
    // A press that already repeated ends with a click that must not delete once more.
    if (repeated.current) {
      repeated.current = false;
      return;
    }
    press(Number(event.currentTarget.dataset.keyIndex));
  };

  const boxes = (): KeyBox[] => {
    const nodes = root.current?.querySelectorAll<HTMLElement>("[data-key-index]") ?? [];
    return [...nodes].map((node) => node.getBoundingClientRect());
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const node = (event.target as HTMLElement).closest<HTMLElement>("[data-key-index]");
    if (!node) return;
    const index = Number(node.dataset.keyIndex);
    let direction: KeyDirection | null = null;
    if (event.key === "ArrowLeft") direction = dir === "rtl" ? "next" : "previous";
    else if (event.key === "ArrowRight") direction = dir === "rtl" ? "previous" : "next";
    else if (event.key === "ArrowUp") direction = "up";
    else if (event.key === "ArrowDown") direction = "down";
    else if (event.key === "Home") direction = "home";
    else if (event.key === "End") direction = "end";
    if (!direction) return;
    event.preventDefault();
    const next = neighbourKey(boxes(), index, direction);
    if (next < 0) return;
    setActive(next);
    root.current?.querySelectorAll<HTMLElement>("[data-key-index]")[next]?.focus();
  };

  const keepFocus = (event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      ref={root}
      role="toolbar"
      aria-label={label}
      aria-describedby={words.usage ? usageId : undefined}
      data-slot="on-screen-keyboard"
      data-disabled={disabled || undefined}
      dir={dir}
      className={classes("fui-keyboard", className)}
      {...props}
      onContextMenu={(event) => event.preventDefault()}
      onFocus={(event) => {
        const node = (event.target as HTMLElement).closest<HTMLElement>("[data-key-index]");
        if (node) setActive(Number(node.dataset.keyIndex));
      }}
      onKeyDown={onKeyDown}
      onMouseDown={keepFocus}
      onPointerDown={keepFocus}
    >
      {words.usage ? (
        <p className="fui-sr-only" id={usageId}>
          {words.usage}
        </p>
      ) : null}
      {keys.map((row, rowIndex) => (
        <div className="fui-keyboard-row" data-row={rowIndex} key={rowIndex}>
          {row.map(({ key, column, index }) => {
            const kind = key.kind ?? "char";
            const spoken =
              key.name ??
              (kind === "backspace" ? words.backspace : kind === "space" ? words.space : kind === "enter" ? words.enter : undefined) ??
              (typeof key.label === "string" ? key.label : undefined) ??
              key.value;
            const shown =
              key.label ??
              (kind === "backspace" ? <Delete aria-hidden size={18} /> : kind === "enter" ? <CornerDownLeft aria-hidden size={18} /> : key.value);
            return (
              <button
                key={key.id ?? `${rowIndex}:${column}`}
                type="button"
                data-key-index={index}
                data-kind={kind}
                data-slot="on-screen-key"
                aria-label={spoken}
                disabled={disabled}
                tabIndex={index === current ? 0 : -1}
                className="fui-keyboard-key"
                style={{ "--fui-key-width": key.width ?? 1 } as CSSProperties}
                onClick={kind === "backspace" ? onBackspace : () => press(index)}
                onPointerCancel={kind === "backspace" ? stopHold : undefined}
                onPointerDown={kind === "backspace" ? startHold : undefined}
                onPointerLeave={kind === "backspace" ? stopHold : undefined}
                onPointerUp={kind === "backspace" ? stopHold : undefined}
              >
                <span aria-hidden className="fui-keyboard-key-glyph" dir={dir} lang={key.lang}>
                  {shown}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* The duty of the keyboard: whether it is up, remembered on this device, read outside render. */

const CHOSEN = new Map<string, boolean>();
const LISTENERS = new Set<() => void>();

function remembered(storageKey: string): boolean | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "open" ? true : value === "closed" ? false : null;
  } catch {
    return null;
  }
}

function remember(storageKey: string, open: boolean) {
  try {
    window.localStorage.setItem(storageKey, open ? "open" : "closed");
  } catch {
    // Private windows and blocked storage: the choice lasts until the page is left.
  }
}

/** Open when the person chose so; with no choice, open where the pointer is a finger. */
function openFor(storageKey: string, fallback?: boolean): boolean {
  const chosen = CHOSEN.get(storageKey);
  if (chosen !== undefined) return chosen;
  const stored = remembered(storageKey);
  if (stored !== null) return stored;
  if (fallback !== undefined) return fallback;
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

export type OnScreenKeyboardState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Spread on the field: with the keyboard up, the device's own keyboard stays down. */
  inputProps: { inputMode: "none" | undefined };
};

/**
 * The keyboard's duty for one screen: open by itself on a touch screen, held open or shut by the person from then on, and
 * remembered in `localStorage` (read outside render, so the server and the first paint agree). `inputProps` goes on the
 * field, which hides the device's keyboard while this one is up.
 */
export function useOnScreenKeyboard({
  storageKey = "fui-keyboard",
  defaultOpen,
}: { storageKey?: string; defaultOpen?: boolean } = {}): OnScreenKeyboardState {
  const subscribe = useCallback(
    (notify: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== storageKey) return;
        CHOSEN.delete(storageKey);
        notify();
      };
      LISTENERS.add(notify);
      window.addEventListener("storage", onStorage);
      return () => {
        LISTENERS.delete(notify);
        window.removeEventListener("storage", onStorage);
      };
    },
    [storageKey],
  );
  const open = useSyncExternalStore(
    subscribe,
    () => openFor(storageKey, defaultOpen),
    () => defaultOpen ?? false,
  );
  const setOpen = useCallback(
    (next: boolean) => {
      CHOSEN.set(storageKey, next);
      remember(storageKey, next);
      for (const listener of [...LISTENERS]) listener();
    },
    [storageKey],
  );
  const toggle = useCallback(() => setOpen(!openFor(storageKey, defaultOpen)), [setOpen, storageKey, defaultOpen]);
  return { open, setOpen, toggle, inputProps: { inputMode: open ? "none" : undefined } };
}
